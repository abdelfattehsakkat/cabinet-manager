# Mode Opératoire - Première Installation

## Prérequis

- Node.js 18+ installé
- MongoDB en cours d'exécution (via Docker ou local)
- Les dépendances installées (`npm install` dans backend et front2)

## Étape 1 : Démarrer MongoDB

```bash
# Depuis la racine du projet
./start-mongodb-docker.sh
```

Ou si MongoDB est déjà installé localement, assurez-vous qu'il tourne.

## Étape 2 : Créer le premier administrateur

```bash
cd backend
chmod +x init-first-admin.sh
./init-first-admin.sh
```

Le script vous demandera :
- **Email** (défaut: admin@cabinet.com)
- **Mot de passe** (défaut: admin123)
- **Prénom** (défaut: Admin)
- **Nom** (défaut: Cabinet)

### Alternative : Commande directe

```bash
cd backend
node src/scripts/create-admin.js admin@cabinet.com motdepasse Prénom Nom
```

## Étape 3 : Démarrer l'application

**Terminal 1 - Backend :**
```bash
cd backend
npm run start
```

**Terminal 2 - Frontend :**
```bash
cd front2
npm start
```

## Étape 4 : Connexion

1. Ouvrez http://localhost:8081 (ou l'URL affichée par Expo)
2. Connectez-vous avec les identifiants créés
3. Accédez au menu **Manager** (visible uniquement pour les ADMIN)
4. Créez les autres utilisateurs (médecins, secrétaires)

## Utilisateurs par défaut (si utilisation des valeurs par défaut)

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@cabinet.com | admin123 | ADMIN |

⚠️ **IMPORTANT** : Changez le mot de passe par défaut après la première connexion !

## Rôles disponibles

- **ADMIN** : Accès complet + gestion des utilisateurs
- **DOCTOR** : Accès patients, soins, agenda
- **SECRETARY** : Accès patients, agenda

## En cas de problème

### Réinitialiser tous les utilisateurs
```bash
cd backend
node src/scripts/create-users.js
```
⚠️ Cela supprime TOUS les utilisateurs et en crée 3 de test.

### Vérifier la connexion MongoDB
```bash
mongosh "mongodb://root:password@localhost:27017/cabinetdb?authSource=admin"
db.users.find()
```
