#!/bin/bash
#
# MongoDB Restore Script pour Cabinet Manager
# Restaure la base cabinetdb depuis un backup local ou Google Drive
#
# Usage:
#   ./restore-mongodb.sh                    # Mode interactif - liste les backups
#   ./restore-mongodb.sh <backup_file>      # Restaurer un fichier spécifique
#   ./restore-mongodb.sh --from-gdrive      # Télécharger et lister depuis Google Drive
#

set -e

# =============================================================================
# CONFIGURATION
# =============================================================================

# Chemins
BACKUP_DIR="/home/cabinetapp/backups"
LOG_FILE="${BACKUP_DIR}/restore.log"
TEMP_DIR="${BACKUP_DIR}/temp_restore"

# MongoDB
MONGO_CONTAINER="cabinet-mongodb"
MONGO_DATABASE="cabinetdb"
MONGO_USER="root"
MONGO_PASSWORD="password"
MONGO_AUTH_SOURCE="admin"

# Google Drive (rclone)
RCLONE_REMOTE="gdrive"
GDRIVE_FOLDER="cabinet-backups"

# =============================================================================
# FONCTIONS
# =============================================================================

log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$message" >> "$LOG_FILE"
    echo "$message"
}

log_error() {
    log "ERROR: $1"
}

log_success() {
    log "SUCCESS: $1"
}

cleanup() {
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi
}

check_dependencies() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi

    if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
        log_error "Le container MongoDB '${MONGO_CONTAINER}' n'est pas en cours d'exécution"
        exit 1
    fi
}

list_local_backups() {
    echo ""
    echo "=== BACKUPS LOCAUX DISPONIBLES ==="
    echo ""
    
    if [[ ! -d "$BACKUP_DIR" ]] || [[ -z "$(ls -A ${BACKUP_DIR}/cabinetdb_*.tar.gz 2>/dev/null)" ]]; then
        echo "Aucun backup local trouvé dans ${BACKUP_DIR}"
        return 1
    fi

    local i=1
    declare -g -a LOCAL_BACKUPS=()
    
    while IFS= read -r file; do
        LOCAL_BACKUPS+=("$file")
        local filename=$(basename "$file")
        local size=$(du -h "$file" | cut -f1)
        local date_part=$(echo "$filename" | sed 's/cabinetdb_\([0-9]*\)_\([0-9]*\)\.tar\.gz/\1 \2/')
        local formatted_date=$(echo "$date_part" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\) \([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
        printf "  %2d) %s (%s) - %s\n" "$i" "$filename" "$size" "$formatted_date"
        ((i++))
    done < <(ls -1t "${BACKUP_DIR}"/cabinetdb_*.tar.gz 2>/dev/null)

    echo ""
    return 0
}

list_gdrive_backups() {
    echo ""
    echo "=== BACKUPS GOOGLE DRIVE DISPONIBLES ==="
    echo ""

    if ! command -v rclone &> /dev/null; then
        echo "rclone n'est pas installé - impossible de lister les backups distants"
        return 1
    fi

    if ! rclone listremotes | grep -q "^${RCLONE_REMOTE}:"; then
        echo "Remote rclone '${RCLONE_REMOTE}' non configuré"
        return 1
    fi

    declare -g -a GDRIVE_BACKUPS=()
    local i=1

    while IFS= read -r line; do
        local size=$(echo "$line" | awk '{print $1}')
        local filename=$(echo "$line" | awk '{print $2}')
        if [[ "$filename" == cabinetdb_*.tar.gz ]]; then
            GDRIVE_BACKUPS+=("$filename")
            local size_mb=$((size / 1024 / 1024))
            printf "  %2d) %s (%d MB)\n" "$i" "$filename" "$size_mb"
            ((i++))
        fi
    done < <(rclone ls "${RCLONE_REMOTE}:${GDRIVE_FOLDER}/" 2>/dev/null | sort -k2 -r)

    if [[ ${#GDRIVE_BACKUPS[@]} -eq 0 ]]; then
        echo "Aucun backup trouvé sur Google Drive"
        return 1
    fi

    echo ""
    return 0
}

download_from_gdrive() {
    local filename="$1"
    local dest_path="${BACKUP_DIR}/${filename}"

    log "Téléchargement depuis Google Drive: ${filename}..."
    
    if rclone copy "${RCLONE_REMOTE}:${GDRIVE_FOLDER}/${filename}" "$BACKUP_DIR/" --progress; then
        log "Téléchargement terminé: ${dest_path}"
        echo "$dest_path"
    else
        log_error "Échec du téléchargement"
        return 1
    fi
}

restore_backup() {
    local archive_path="$1"

    if [[ ! -f "$archive_path" ]]; then
        log_error "Fichier non trouvé: ${archive_path}"
        exit 1
    fi

    local archive_name=$(basename "$archive_path")
    local backup_name="${archive_name%.tar.gz}"

    log "=========================================="
    log "RESTAURATION MONGODB - Cabinet Manager"
    log "=========================================="
    log "Fichier: ${archive_name}"

    # Confirmation
    echo ""
    echo "⚠️  ATTENTION: Cette opération va REMPLACER toutes les données actuelles!"
    echo ""
    echo "Collections qui seront écrasées:"
    echo "  - patients"
    echo "  - treatments"  
    echo "  - appointments"
    echo "  - users"
    echo ""
    read -p "Êtes-vous sûr de vouloir continuer? (tapez 'OUI' pour confirmer): " confirm

    if [[ "$confirm" != "OUI" ]]; then
        log "Restauration annulée par l'utilisateur"
        exit 0
    fi

    # Créer le dossier temporaire
    mkdir -p "$TEMP_DIR"
    trap cleanup EXIT

    # Décompresser
    log "Décompression de l'archive..."
    cd "$TEMP_DIR"
    tar -xzf "$archive_path"

    # Trouver le dossier de dump
    local dump_dir=$(find "$TEMP_DIR" -type d -name "cabinetdb_*" | head -1)
    if [[ -z "$dump_dir" ]]; then
        dump_dir="$TEMP_DIR"
    fi

    # Vérifier que le dump contient bien la base
    if [[ ! -d "${dump_dir}/${MONGO_DATABASE}" ]]; then
        # Peut-être que la structure est directement dans le dossier
        if [[ -d "${TEMP_DIR}/${backup_name}/${MONGO_DATABASE}" ]]; then
            dump_dir="${TEMP_DIR}/${backup_name}"
        else
            log_error "Structure de backup invalide - dossier '${MONGO_DATABASE}' non trouvé"
            ls -la "$TEMP_DIR"
            exit 1
        fi
    fi

    # Copier le dump dans le container
    log "Copie du dump vers le container..."
    docker cp "${dump_dir}/${MONGO_DATABASE}" "${MONGO_CONTAINER}:/tmp/restore_${MONGO_DATABASE}"

    # Restaurer avec mongorestore
    log "Exécution de mongorestore..."
    docker exec "$MONGO_CONTAINER" mongorestore \
        --uri="mongodb://${MONGO_USER}:${MONGO_PASSWORD}@localhost:27017/?authSource=${MONGO_AUTH_SOURCE}" \
        --db="$MONGO_DATABASE" \
        --drop \
        "/tmp/restore_${MONGO_DATABASE}" \
        --quiet

    # Nettoyer le container
    docker exec "$MONGO_CONTAINER" rm -rf "/tmp/restore_${MONGO_DATABASE}"

    # Vérifier la restauration
    log "Vérification de la restauration..."
    local collections=$(docker exec "$MONGO_CONTAINER" mongosh \
        "mongodb://${MONGO_USER}:${MONGO_PASSWORD}@localhost:27017/${MONGO_DATABASE}?authSource=${MONGO_AUTH_SOURCE}" \
        --quiet --eval "db.getCollectionNames().join(', ')")

    log "=========================================="
    log_success "Restauration terminée avec succès!"
    log "Collections restaurées: ${collections}"
    log "=========================================="

    # Afficher les statistiques
    echo ""
    echo "📊 Statistiques après restauration:"
    for col in patients treatments appointments users; do
        local count=$(docker exec "$MONGO_CONTAINER" mongosh \
            "mongodb://${MONGO_USER}:${MONGO_PASSWORD}@localhost:27017/${MONGO_DATABASE}?authSource=${MONGO_AUTH_SOURCE}" \
            --quiet --eval "db.${col}.countDocuments({})")
        echo "   - ${col}: ${count} documents"
    done
    echo ""
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    mkdir -p "$BACKUP_DIR"
    check_dependencies

    # Mode avec argument direct
    if [[ -n "$1" ]] && [[ "$1" != "--from-gdrive" ]]; then
        if [[ -f "$1" ]]; then
            restore_backup "$1"
        elif [[ -f "${BACKUP_DIR}/$1" ]]; then
            restore_backup "${BACKUP_DIR}/$1"
        else
            log_error "Fichier non trouvé: $1"
            exit 1
        fi
        exit 0
    fi

    # Mode interactif
    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║    RESTAURATION MONGODB - Cabinet Manager    ║"
    echo "╚══════════════════════════════════════════════╝"

    # Lister les backups locaux
    list_local_backups
    local has_local=$?

    # Option Google Drive
    if [[ "$1" == "--from-gdrive" ]] || [[ $has_local -ne 0 ]]; then
        list_gdrive_backups
        local has_gdrive=$?

        if [[ $has_gdrive -eq 0 ]] && [[ ${#GDRIVE_BACKUPS[@]} -gt 0 ]]; then
            echo "Entrez le numéro du backup Google Drive à télécharger et restaurer"
            echo "(ou 'q' pour quitter):"
            read -p "> " choice

            if [[ "$choice" == "q" ]]; then
                exit 0
            fi

            if [[ "$choice" =~ ^[0-9]+$ ]] && [[ $choice -ge 1 ]] && [[ $choice -le ${#GDRIVE_BACKUPS[@]} ]]; then
                local selected_file="${GDRIVE_BACKUPS[$((choice-1))]}"
                local local_path=$(download_from_gdrive "$selected_file")
                if [[ -n "$local_path" ]]; then
                    restore_backup "$local_path"
                fi
            else
                echo "Choix invalide"
                exit 1
            fi
            exit 0
        fi
    fi

    # Sélection backup local
    if [[ $has_local -eq 0 ]] && [[ ${#LOCAL_BACKUPS[@]} -gt 0 ]]; then
        echo "Entrez le numéro du backup à restaurer"
        echo "(ou 'g' pour voir les backups Google Drive, 'q' pour quitter):"
        read -p "> " choice

        if [[ "$choice" == "q" ]]; then
            exit 0
        fi

        if [[ "$choice" == "g" ]]; then
            list_gdrive_backups
            if [[ ${#GDRIVE_BACKUPS[@]} -gt 0 ]]; then
                echo "Entrez le numéro du backup Google Drive:"
                read -p "> " gdrive_choice
                if [[ "$gdrive_choice" =~ ^[0-9]+$ ]] && [[ $gdrive_choice -ge 1 ]] && [[ $gdrive_choice -le ${#GDRIVE_BACKUPS[@]} ]]; then
                    local selected_file="${GDRIVE_BACKUPS[$((gdrive_choice-1))]}"
                    local local_path=$(download_from_gdrive "$selected_file")
                    if [[ -n "$local_path" ]]; then
                        restore_backup "$local_path"
                    fi
                fi
            fi
            exit 0
        fi

        if [[ "$choice" =~ ^[0-9]+$ ]] && [[ $choice -ge 1 ]] && [[ $choice -le ${#LOCAL_BACKUPS[@]} ]]; then
            restore_backup "${LOCAL_BACKUPS[$((choice-1))]}"
        else
            echo "Choix invalide"
            exit 1
        fi
    else
        echo "Aucun backup disponible."
        echo "Utilisez './restore-mongodb.sh --from-gdrive' pour voir les backups distants."
        exit 1
    fi
}

main "$@"
