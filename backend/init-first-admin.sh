#!/bin/bash
# =============================================================================
# Script d'initialisation - Cabinet AI
# =============================================================================
# Ce script crée le premier utilisateur administrateur.
# À exécuter UNE SEULE FOIS lors de la première installation.
# =============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          CABINET AI - INITIALISATION                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier si on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Exécutez ce script depuis le dossier 'backend'${NC}"
    echo "   cd backend && ./init-first-admin.sh"
    exit 1
fi

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Erreur: Node.js n'est pas installé${NC}"
    exit 1
fi

# Demander les informations
echo -e "${YELLOW}Création du premier administrateur${NC}"
echo ""

read -p "📧 Email [admin@cabinet.com]: " EMAIL
EMAIL=${EMAIL:-admin@cabinet.com}

read -s -p "🔒 Mot de passe [admin123]: " PASSWORD
echo ""
PASSWORD=${PASSWORD:-admin123}

read -p "👤 Prénom [Admin]: " FIRSTNAME
FIRSTNAME=${FIRSTNAME:-Admin}

read -p "👤 Nom [Cabinet]: " LASTNAME
LASTNAME=${LASTNAME:-Cabinet}

echo ""
echo -e "${YELLOW}Création de l'administrateur...${NC}"
echo ""

# Exécuter le script Node.js
node src/scripts/create-admin.js "$EMAIL" "$PASSWORD" "$FIRSTNAME" "$LASTNAME"

echo ""
echo -e "${GREEN}✅ Initialisation terminée !${NC}"
echo ""
echo -e "${YELLOW}Prochaines étapes :${NC}"
echo "  1. Démarrez le backend:  npm run start"
echo "  2. Démarrez le frontend: cd ../front2 && npm start"
echo "  3. Connectez-vous avec les identifiants créés"
echo "  4. Changez votre mot de passe depuis le menu Manager"
echo ""
