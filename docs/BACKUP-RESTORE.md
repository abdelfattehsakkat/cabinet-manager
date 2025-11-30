# 🗄️ Backup & Restauration MongoDB - Cabinet Manager

Ce guide explique comment configurer et utiliser le système de backup automatique pour la base de données MongoDB.

## 📋 Table des matières

1. [Aperçu](#aperçu)
2. [Installation sur le VPS](#installation-sur-le-vps)
3. [Configuration Google Drive](#configuration-google-drive)
4. [Utilisation](#utilisation)
5. [Restauration](#restauration)
6. [Cron Job (Backup automatique)](#cron-job-backup-automatique)
7. [Dépannage](#dépannage)

---

## Aperçu

Le système de backup :
- **Sauvegarde** toute la base `cabinetdb` (patients, treatments, appointments, users)
- **Compresse** en archive `.tar.gz` avec horodatage
- **Upload** automatiquement vers Google Drive
- **Conserve** uniquement les **3 derniers backups** (local + distant)
- **Log** toutes les opérations dans `/home/cabinetapp/backups/backup.log`

### Fichiers

| Script | Description |
|--------|-------------|
| `backend/scripts/backup-mongodb.sh` | Crée un backup et l'upload sur Google Drive |
| `backend/scripts/restore-mongodb.sh` | Restaure un backup (local ou depuis Google Drive) |

---

## Installation sur le VPS

### 1. Se connecter au VPS

```bash
ssh cabinetapp@votre-vps-ip
```

### 2. Créer le dossier de backups

```bash
mkdir -p /home/cabinetapp/backups
```

### 3. Copier les scripts

```bash
# Depuis le projet (si pas déjà présent)
cd /home/cabinetapp/cabinet-manager

# Rendre les scripts exécutables
chmod +x backend/scripts/backup-mongodb.sh
chmod +x backend/scripts/restore-mongodb.sh
```

### 4. Installer rclone (pour Google Drive)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install rclone -y

# OU installation manuelle (dernière version)
curl https://rclone.org/install.sh | sudo bash
```

Vérifier l'installation :
```bash
rclone version
```

---

## Configuration Google Drive

### Méthode rapide (OAuth2)

#### Étape 1 : Lancer la configuration

```bash
rclone config
```

#### Étape 2 : Créer un nouveau remote

```
n) New remote
name> gdrive
```

#### Étape 3 : Choisir Google Drive

```
Storage> drive
```
(ou tapez le numéro correspondant à "Google Drive")

#### Étape 4 : Client ID (laisser vide)

```
client_id> 
client_secret>
```
Appuyez sur Entrée pour utiliser les valeurs par défaut.

#### Étape 5 : Scope

```
scope> 1
```
(Full access)

#### Étape 6 : Autres options

```
service_account_file> 
Edit advanced config? n
Use auto config? n
```

#### Étape 7 : Authentification

Comme vous êtes sur un serveur distant (headless), rclone affichera :
```
Option config_token.
For this to work, you will need rclone available on a machine that has
a web browser available.
...
config_token>
```

**Sur votre machine locale** (avec navigateur), exécutez :
```bash
rclone authorize "drive"
```

Un navigateur s'ouvrira. Connectez-vous à votre compte Google et autorisez l'accès.

Copiez le token affiché et collez-le dans le terminal du VPS.

#### Étape 8 : Terminer

```
Configure this as a Shared Drive (Alias Team Drive)? n
y) Yes this is OK
q) Quit config
> y
```

### Vérification

```bash
# Lister les fichiers à la racine de votre Google Drive
rclone ls gdrive: --max-depth 1

# Créer le dossier de backups
rclone mkdir gdrive:cabinet-backups

# Vérifier
rclone lsd gdrive:
```

---

## Utilisation

### Backup manuel

```bash
cd /home/cabinetapp/cabinet-manager

# Backup avec affichage détaillé
./backend/scripts/backup-mongodb.sh --manual

# Backup silencieux (comme le cron)
./backend/scripts/backup-mongodb.sh
```

### Vérifier les backups

```bash
# Backups locaux
ls -la /home/cabinetapp/backups/

# Backups sur Google Drive
rclone ls gdrive:cabinet-backups/
```

### Consulter les logs

```bash
# Dernières lignes du log
tail -50 /home/cabinetapp/backups/backup.log

# Suivre en temps réel
tail -f /home/cabinetapp/backups/backup.log
```

---

## Restauration

### ⚠️ ATTENTION

La restauration **ÉCRASE** toutes les données actuelles de la base de données. Assurez-vous de :
1. Avoir un backup récent avant de restaurer un ancien backup
2. Informer les utilisateurs si l'application est en production

### Mode interactif (recommandé)

```bash
./backend/scripts/restore-mongodb.sh
```

Affiche :
```
╔══════════════════════════════════════════════╗
║    RESTAURATION MONGODB - Cabinet Manager    ║
╚══════════════════════════════════════════════╝

=== BACKUPS LOCAUX DISPONIBLES ===

   1) cabinetdb_20251130_020000.tar.gz (2.3M) - 2025-11-30 02:00:00
   2) cabinetdb_20251129_020000.tar.gz (2.2M) - 2025-11-29 02:00:00
   3) cabinetdb_20251128_020000.tar.gz (2.1M) - 2025-11-28 02:00:00

Entrez le numéro du backup à restaurer
(ou 'g' pour voir les backups Google Drive, 'q' pour quitter):
> 
```

### Restaurer un fichier spécifique

```bash
# Par nom de fichier
./backend/scripts/restore-mongodb.sh cabinetdb_20251130_020000.tar.gz

# Par chemin complet
./backend/scripts/restore-mongodb.sh /home/cabinetapp/backups/cabinetdb_20251130_020000.tar.gz
```

### Restaurer depuis Google Drive

```bash
./backend/scripts/restore-mongodb.sh --from-gdrive
```

Le script va :
1. Lister les backups disponibles sur Google Drive
2. Télécharger le backup sélectionné
3. Le restaurer dans MongoDB

### Procédure de restauration détaillée

1. **Arrêter l'application** (optionnel mais recommandé) :
   ```bash
   cd /home/cabinetapp/cabinet-manager
   docker-compose -f docker-compose.prod.yml stop backend front2
   ```

2. **Lancer la restauration** :
   ```bash
   ./backend/scripts/restore-mongodb.sh
   ```

3. **Confirmer** en tapant `OUI` quand demandé

4. **Vérifier** les statistiques après restauration :
   ```
   📊 Statistiques après restauration:
      - patients: 150 documents
      - treatments: 450 documents
      - appointments: 200 documents
      - users: 5 documents
   ```

5. **Redémarrer l'application** :
   ```bash
   docker-compose -f docker-compose.prod.yml start backend front2
   ```

6. **Tester** l'application pour vérifier que tout fonctionne

---

## Cron Job (Backup automatique)

### Configurer le backup quotidien à 2h du matin

```bash
# Éditer le crontab
crontab -e
```

Ajouter cette ligne :
```cron
0 2 * * * /home/cabinetapp/cabinet-manager/backend/scripts/backup-mongodb.sh >> /home/cabinetapp/backups/cron.log 2>&1
```

### Vérifier le cron

```bash
# Lister les crons
crontab -l

# Voir les logs du cron
tail -f /home/cabinetapp/backups/cron.log
```

### Tester le cron manuellement

```bash
# Simuler l'exécution du cron
/home/cabinetapp/cabinet-manager/backend/scripts/backup-mongodb.sh --manual
```

---

## Dépannage

### Le backup échoue avec "container not found"

```bash
# Vérifier que MongoDB tourne
docker ps | grep mongodb

# Si arrêté, démarrer
docker-compose -f docker-compose.prod.yml up -d mongodb
```

### rclone "remote not found"

```bash
# Vérifier les remotes configurés
rclone listremotes

# Si "gdrive:" n'apparaît pas, reconfigurer
rclone config
```

### Token Google Drive expiré

```bash
# Reconnecter le remote
rclone config reconnect gdrive:
```

### Espace disque insuffisant

```bash
# Vérifier l'espace
df -h /home/cabinetapp/backups

# Supprimer manuellement d'anciens backups si nécessaire
rm /home/cabinetapp/backups/cabinetdb_ANCIEN_*.tar.gz
```

### Voir les erreurs détaillées

```bash
# Logs de backup
cat /home/cabinetapp/backups/backup.log

# Logs de restore
cat /home/cabinetapp/backups/restore.log
```

---

## Résumé des commandes

| Action | Commande |
|--------|----------|
| Backup manuel | `./backend/scripts/backup-mongodb.sh --manual` |
| Restauration interactive | `./backend/scripts/restore-mongodb.sh` |
| Restauration depuis GDrive | `./backend/scripts/restore-mongodb.sh --from-gdrive` |
| Voir backups locaux | `ls -la /home/cabinetapp/backups/*.tar.gz` |
| Voir backups GDrive | `rclone ls gdrive:cabinet-backups/` |
| Voir logs | `tail -50 /home/cabinetapp/backups/backup.log` |
| Éditer cron | `crontab -e` |

---

## Configuration avancée

Pour modifier les paramètres par défaut, éditez le début des scripts :

```bash
# Dans backup-mongodb.sh et restore-mongodb.sh

# Chemins
BACKUP_DIR="/home/cabinetapp/backups"    # Dossier des backups locaux

# MongoDB
MONGO_CONTAINER="cabinet-mongodb"         # Nom du container Docker
MONGO_DATABASE="cabinetdb"                # Nom de la base
MONGO_USER="root"                         # Utilisateur MongoDB
MONGO_PASSWORD="password"                 # Mot de passe MongoDB

# Google Drive
RCLONE_REMOTE="gdrive"                    # Nom du remote rclone
GDRIVE_FOLDER="cabinet-backups"           # Dossier sur Google Drive

# Rétention
MAX_BACKUPS=3                             # Nombre de backups à conserver
```
