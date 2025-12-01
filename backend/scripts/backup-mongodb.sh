#!/bin/bash
#
# MongoDB Backup Script pour Cabinet Manager
# Sauvegarde la base cabinetdb, compresse, upload sur Google Drive
# Garde uniquement les 3 derniers backups (local + distant)
#
# Usage:
#   ./backup-mongodb.sh          # Backup normal
#   ./backup-mongodb.sh --manual # Backup manuel avec output détaillé
#

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

# Chemins
BACKUP_DIR="/home/cabinetapp/backups"
LOG_FILE="${BACKUP_DIR}/backup.log"
TEMP_DIR="${BACKUP_DIR}/temp"

# MongoDB
MONGO_CONTAINER="cabinet-mongodb"
MONGO_DATABASE="cabinetdb"
MONGO_USER="root"
MONGO_PASSWORD="password"
MONGO_AUTH_SOURCE="admin"

# Google Drive (rclone)
RCLONE_REMOTE="drive-abdelfatteh"
GDRIVE_FOLDER="cabinet-backups"

# Rétention
MAX_BACKUPS=3

# Mode
MANUAL_MODE=false
if [[ "$1" == "--manual" ]]; then
    MANUAL_MODE=true
fi

# =============================================================================
# FONCTIONS
# =============================================================================

log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$message" >> "$LOG_FILE"
    if $MANUAL_MODE; then
        echo "$message"
    fi
}

log_error() {
    log "ERROR: $1"
}

log_success() {
    log "SUCCESS: $1"
}

cleanup() {
    # Nettoyer le dossier temporaire
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi
}

check_dependencies() {
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi

    # Vérifier que le container MongoDB tourne
    if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
        log_error "Le container MongoDB '${MONGO_CONTAINER}' n'est pas en cours d'exécution"
        exit 1
    fi

    # Vérifier rclone (optionnel pour upload Google Drive)
    if ! command -v rclone &> /dev/null; then
        log "WARN: rclone n'est pas installé - backup local uniquement"
        RCLONE_AVAILABLE=false
    else
        RCLONE_AVAILABLE=true
    fi
}

create_backup() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_name="cabinetdb_${timestamp}"
    local dump_path="${TEMP_DIR}/${backup_name}"
    local archive_name="${backup_name}.tar.gz"
    local archive_path="${BACKUP_DIR}/${archive_name}"

    log "Démarrage du backup: ${backup_name}"

    # Créer les dossiers nécessaires
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$TEMP_DIR"

    # Exécuter mongodump dans le container
    log "Exécution de mongodump..."
    docker exec "$MONGO_CONTAINER" mongodump \
        --uri="mongodb://${MONGO_USER}:${MONGO_PASSWORD}@localhost:27017/${MONGO_DATABASE}?authSource=${MONGO_AUTH_SOURCE}" \
        --out="/tmp/${backup_name}" \
        --quiet

    # Copier le dump depuis le container
    log "Copie du dump depuis le container..."
    docker cp "${MONGO_CONTAINER}:/tmp/${backup_name}" "$dump_path"

    # Supprimer le dump du container
    docker exec "$MONGO_CONTAINER" rm -rf "/tmp/${backup_name}"

    # Compresser
    log "Compression du backup..."
    cd "$TEMP_DIR"
    tar -czf "$archive_path" "$backup_name"
    
    # Calculer la taille
    local size=$(du -h "$archive_path" | cut -f1)
    log "Backup créé: ${archive_name} (${size})"

    # Nettoyer le dossier temporaire
    rm -rf "$dump_path"

    # Diagnostic: lister le dossier de backup et afficher le chemin retourné
    log "Diagnostic: archive_path='${archive_path}'"
    if [[ -f "$archive_path" ]]; then
        log "Diagnostic: archive exists (confirmed by -f)"
    else
        log "Diagnostic: archive NOT found by -f"
    fi
    log "Diagnostic: listing ${BACKUP_DIR}" 
    ls -la "$BACKUP_DIR" >> "$LOG_FILE" 2>&1 || true

    echo "$archive_path"
}

upload_to_gdrive() {
    local archive_path="$1"
    local archive_name=$(basename "$archive_path")

    if ! $RCLONE_AVAILABLE; then
        log "Upload Google Drive ignoré (rclone non disponible)"
        return 0
    fi

    # Vérifier si le remote est configuré
    if ! rclone listremotes | grep -q "^${RCLONE_REMOTE}:"; then
        log "WARN: Remote rclone '${RCLONE_REMOTE}' non configuré - backup local uniquement"
        return 0
    fi

    log "Upload vers Google Drive..."
    
    # Créer le dossier distant si nécessaire
    rclone mkdir "${RCLONE_REMOTE}:${GDRIVE_FOLDER}" 2>/dev/null || true

    # Upload
    if rclone copy "$archive_path" "${RCLONE_REMOTE}:${GDRIVE_FOLDER}/" --progress=$MANUAL_MODE; then
        log "Upload terminé: ${RCLONE_REMOTE}:${GDRIVE_FOLDER}/${archive_name}"
        return 0
    else
        log_error "Échec de l'upload vers Google Drive"
        return 1
    fi
}

cleanup_old_backups() {
    log "Nettoyage des anciens backups (rétention: ${MAX_BACKUPS})..."

    # Nettoyage local
    local backup_count=$(ls -1 "${BACKUP_DIR}"/cabinetdb_*.tar.gz 2>/dev/null | wc -l)
    if [[ $backup_count -gt $MAX_BACKUPS ]]; then
        local to_delete=$((backup_count - MAX_BACKUPS))
        log "Suppression de ${to_delete} backup(s) local(aux)..."
        ls -1t "${BACKUP_DIR}"/cabinetdb_*.tar.gz | tail -n "$to_delete" | xargs rm -f
    fi

    # Nettoyage distant (Google Drive)
    if $RCLONE_AVAILABLE && rclone listremotes | grep -q "^${RCLONE_REMOTE}:"; then
        local remote_files=$(rclone ls "${RCLONE_REMOTE}:${GDRIVE_FOLDER}/" 2>/dev/null | grep "cabinetdb_.*\.tar\.gz" | wc -l)
        if [[ $remote_files -gt $MAX_BACKUPS ]]; then
            local remote_to_delete=$((remote_files - MAX_BACKUPS))
            log "Suppression de ${remote_to_delete} backup(s) distant(s)..."
            rclone ls "${RCLONE_REMOTE}:${GDRIVE_FOLDER}/" 2>/dev/null | \
                grep "cabinetdb_.*\.tar\.gz" | \
                sort -k2 | \
                head -n "$remote_to_delete" | \
                awk '{print $2}' | \
                while read file; do
                    rclone delete "${RCLONE_REMOTE}:${GDRIVE_FOLDER}/${file}"
                    log "Supprimé distant: ${file}"
                done
        fi
    fi

    log "Nettoyage terminé"
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    local start_time=$(date +%s)

    log "=========================================="
    log "BACKUP MONGODB - Cabinet Manager"
    log "=========================================="

    # Trap pour cleanup en cas d'erreur
    trap cleanup EXIT

    # Vérifications
    check_dependencies

    # Créer le backup
    local archive_path
    # utiliser un fichier temporaire pour capturer uniquement le chemin retourné
    local out_file
    out_file=$(mktemp)
    # Permettre aux fonctions internes d'écrire sans faire échouer tout le script
    set +e
    create_backup > "$out_file" 2>&1
    local ret=$?
    set -e
    # lire la dernière ligne non vide (chemin) retournée par create_backup
    archive_path=$(awk 'NF{line=$0} END{print line}' "$out_file" || true)
    rm -f "$out_file"

    if [[ $ret -ne 0 ]]; then
        log_error "create_backup a échoué (code: $ret)"
        # afficher les dernières lignes du log pour diagnostic
        tail -n 80 "$LOG_FILE" >> "$LOG_FILE" 2>&1 || true
    fi

    # Diagnostic main: afficher la valeur reçue et vérifier l'existence
    log "Diagnostic-main: archive_path='${archive_path}'"
    if [[ -z "$archive_path" ]]; then
        log_error "Diagnostic-main: archive_path vide"
    else
        if [[ -f "$archive_path" ]]; then
            log "Diagnostic-main: -f check PASSED for '$archive_path'"
        else
            log "Diagnostic-main: -f check FAILED for '$archive_path'"
        fi
    fi

    if [[ -z "$archive_path" ]] || [[ ! -f "$archive_path" ]]; then
        log_error "Échec de la création du backup"
        exit 1
    fi

    # Upload vers Google Drive
    upload_to_gdrive "$archive_path"

    # Nettoyer les anciens backups
    cleanup_old_backups

    # Résumé
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "=========================================="
    log_success "Backup terminé en ${duration}s"
    log "Fichier: $(basename "$archive_path")"
    log "Taille: $(du -h "$archive_path" | cut -f1)"
    log "=========================================="

    # Lister les backups disponibles
    log "Backups locaux disponibles:"
    ls -1t "${BACKUP_DIR}"/cabinetdb_*.tar.gz 2>/dev/null | head -n $MAX_BACKUPS | while read f; do
        log "  - $(basename "$f") ($(du -h "$f" | cut -f1))"
    done
}

main "$@"
