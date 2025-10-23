# 🚀 Cabinet AI - Guide de démarrage rapide

## 📋 Prérequis
- Node.js (v18+)
- Docker & Docker Compose
- Angular CLI (`npm install -g @angular/cli`)

## ⚡ Démarrage en 3 étapes

### 1. Démarrer MongoDB
```bash
cd /Users/abdelfatteh/Documents/workspace/cabinetAI
docker-compose -f docker-compose.mongodb.yml up -d
```

### 2. Démarrer le Backend
```bash
cd backend
npm install
npm start
```
Le serveur backend sera disponible sur `http://localhost:3000`

### 3. Démarrer le Frontend
```bash
cd frontend
npm install
ng serve
```
L'application sera disponible sur `http://localhost:4200`

## 🔐 Comptes de test

| Email | Mot de passe | Rôle | Accès |
|-------|-------------|------|-------|
| `admin@cabinet.com` | `admin123` | ADMIN | Accès complet + gestion utilisateurs |
| `marie.dubois@cabinet.com` | `doctor123` | DOCTOR | Patients + Soins + Calendrier |
| `sophie.martin@cabinet.com` | `secretary123` | SECRETARY | Patients uniquement |

## 📂 Structure du projet

```
cabinetAI/
├── backend/           # API Node.js + Express
│   ├── src/
│   │   ├── models/    # Modèles MongoDB
│   │   ├── controllers/ # Logique métier
│   │   ├── middleware/ # Auth, validation
│   │   └── routes/    # Définition des routes
│   └── scripts/       # Scripts utilitaires
├── frontend/          # Application Angular
│   └── src/app/
│       ├── auth/      # Module d'authentification
│       ├── patients/  # Gestion des patients
│       ├── treatments/ # Gestion des soins
│       └── shared/    # Composants partagés
└── docs/             # Documentation
```

## 🛠️ Scripts utiles

### Backend
```bash
# Créer des utilisateurs de test
node src/scripts/create-users.js

# Build production
npm run build

# Tests
npm test
```

### Frontend
```bash
# Build production
ng build --prod

# Tests
ng test

# Linting
ng lint
```

## 🔧 Développement

### Créer un nouveau composant
```bash
cd frontend
ng generate component nom-du-composant
```

### Créer un nouveau service
```bash
ng generate service services/nom-du-service
```

## 📊 Statut des fonctionnalités

| Fonctionnalité | Statut | Description |
|---------------|--------|-------------|
| ✅ Authentification | Complété | Login/logout avec JWT |
| ✅ Gestion patients | Complété | CRUD patients avec recherche |
| ✅ Gestion soins | Complété | CRUD traitements |
| ✅ Calendrier | Complété | Rendez-vous |
| 🔄 Rôles/Permissions | En cours | Interface adaptative |
| 📋 Gestion utilisateurs | À faire | Interface admin |
| 🔐 Sécurité avancée | À faire | Audit, sessions |

## 🆘 Dépannage

### MongoDB ne démarre pas
```bash
# Vérifier les conteneurs
docker ps

# Redémarrer MongoDB
docker-compose -f docker-compose.mongodb.yml restart
```

### Erreur de compilation Frontend
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Erreur 401 Unauthorized
- Vérifier que le backend est démarré
- Vérifier les credentials de connexion
- Effacer le localStorage du navigateur

## 📚 Documentation complète

- [🔐 Authentification et Rôles](./docs/AUTHENTICATION-README.md)
- [👥 Gestion des Patients](./docs/PATIENTS-README.md)
- [💉 Gestion des Soins](./docs/TREATMENTS-README.md)
- [📅 Calendrier](./docs/CALENDAR-README.md)

---

**🔗 URLs importantes :**
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- MongoDB: localhost:27017