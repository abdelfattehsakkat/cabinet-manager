# 🔐 Système d'Authentification et Gestion des Rôles - Cabinet AI

## 📋 Vue d'ensemble

Ce document détaille l'implémentation du système d'authentification et de gestion des rôles pour l'application Cabinet AI, ainsi que les prochaines étapes pour finaliser la sécurité et les permissions.

## ✅ Ce qui a été implémenté (Étape 1 complétée)

### 🔧 Backend - Authentification JWT

#### Modèles et Schémas
- **✅ Modèle User** (`backend/src/models/user.model.ts`)
  - Schéma MongoDB avec hash automatique des mots de passe
  - Rôles définis : `ADMIN`, `DOCTOR`, `SECRETARY`
  - Champs : firstName, lastName, email, password, role, phoneNumber, specialization

#### Contrôleurs d'authentification
- **✅ AuthController** (`backend/src/controllers/auth.controller.ts`)
  - `POST /api/auth/login` - Connexion avec email/password
  - `POST /api/auth/register` - Création de compte
  - `GET /api/auth/profile` - Récupération du profil utilisateur
  - Génération et validation des tokens JWT

#### Middleware de sécurité
- **✅ Middleware d'authentification** (`backend/src/middleware/auth.middleware.ts`)
  - Validation des tokens JWT
  - Protection des routes sensibles

### 🎨 Frontend - Interface d'authentification

#### Services d'authentification
- **✅ AuthService** (`frontend/src/app/auth/services/auth.service.ts`)
  - Connexion/déconnexion avec API backend
  - Gestion du token JWT en localStorage
  - Observable pour l'état de connexion
  - Méthodes de vérification des rôles

#### Composants d'interface
- **✅ LoginComponent** (`frontend/src/app/auth/login/`)
  - Interface moderne avec Material Design
  - Validation des formulaires (email, mot de passe)
  - Gestion des erreurs et états de chargement
  - Redirection basée sur le rôle utilisateur

#### Guards de sécurité
- **✅ AuthGuard** (`frontend/src/app/auth/guards/auth.guard.ts`)
  - Protection des routes nécessitant une authentification
  - Redirection vers login si non connecté
- **✅ RoleGuard** (`frontend/src/app/auth/guards/role.guard.ts`)
  - Protection basée sur les rôles utilisateur
  - Redirection intelligente selon les permissions

#### Intercepteur HTTP
- **✅ AuthInterceptor** (`frontend/src/app/auth/interceptors/auth.interceptor.ts`)
  - Ajout automatique du token JWT aux requêtes
  - Gestion des erreurs 401 (déconnexion automatique)

### 🗃️ Base de données et utilisateurs de test

#### Script de création d'utilisateurs
- **✅ Script de génération** (`backend/src/scripts/create-users.js`)
  - Création automatique d'utilisateurs de test
  - Hash sécurisé des mots de passe

#### Comptes de test créés
```
┌─────────────────────────────────────┬──────────────┬──────────────┐
│ Email                               │ Role         │ Password     │
├─────────────────────────────────────┼──────────────┼──────────────┤
│ admin@cabinet.com                   │ ADMIN        │ admin123     │
│ marie.dubois@cabinet.com            │ DOCTOR       │ doctor123    │
│ sophie.martin@cabinet.com           │ SECRETARY    │ secretary123 │
└─────────────────────────────────────┴──────────────┴──────────────┘
```

### 🛡️ Configuration de sécurité

#### Routes protégées
```typescript
// app.routes.ts
{ 
  path: 'patients', 
  canActivate: [AuthGuard],
  data: { roles: ['ADMIN', 'DOCTOR', 'SECRETARY'] }
},
{ 
  path: 'treatments', 
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['ADMIN', 'DOCTOR'] }
},
{ 
  path: 'dashboard',
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['ADMIN'] }
}
```

## 🔄 Étapes suivantes identifiées

### 📋 Étape 2 : Interface adaptative selon les rôles

#### 🎯 Objectifs
- [ ] **Menu adaptatif** : Affichage conditionnel selon le rôle
  - SECRETARY : Accès uniquement à "Patients"
  - DOCTOR : Accès à "Patients" + "Soins" + "Calendrier"
  - ADMIN : Accès complet + gestion utilisateurs

#### 🛠️ Implémentation prévue
- [ ] Modifier le composant de navigation principale
- [ ] Créer des directives de permission (`*hasRole="'ADMIN'"`)
- [ ] Adapter les menus contextuels
- [ ] Masquer/afficher les boutons d'action selon les droits

### 📋 Étape 3 : Gestion avancée des utilisateurs

#### 🎯 Objectifs
- [ ] **Interface de gestion des comptes** (ADMIN uniquement)
  - Création/modification/suppression d'utilisateurs
  - Gestion des rôles et permissions
  - Réinitialisation des mots de passe

#### 🛠️ Composants à créer
- [ ] `UserManagementComponent` - Liste des utilisateurs
- [ ] `UserFormComponent` - Création/édition d'utilisateur
- [ ] `UserService` - API calls pour gestion utilisateurs

### 📋 Étape 4 : Sécurité avancée

#### 🔐 Amélirations de sécurité
- [ ] **Politique de mots de passe renforcée**
  - Complexité minimale (majuscules, chiffres, caractères spéciaux)
  - Expiration périodique
  - Historique des mots de passe

- [ ] **Gestion des sessions**
  - Timeout de session automatique
  - Déconnexion sur inactivité
  - Gestion multi-onglets

- [ ] **Audit et logs**
  - Traçabilité des connexions
  - Logs des actions sensibles
  - Tentatives de connexion échouées

#### 🛡️ Sécurité backend
- [ ] **Rate limiting** sur les endpoints sensibles
- [ ] **Validation renforcée** des données entrantes
- [ ] **Chiffrement des données sensibles** en base

### 📋 Étape 5 : Permissions granulaires

#### 🎯 Système de permissions avancé
- [ ] **Permissions par fonctionnalité**
  ```typescript
  enum Permission {
    PATIENT_READ = 'patient:read',
    PATIENT_WRITE = 'patient:write',
    PATIENT_DELETE = 'patient:delete',
    TREATMENT_READ = 'treatment:read',
    TREATMENT_WRITE = 'treatment:write',
    USER_MANAGE = 'user:manage'
  }
  ```

- [ ] **Matrice de permissions par rôle**
  ```typescript
  const ROLE_PERMISSIONS = {
    SECRETARY: ['patient:read', 'patient:write'],
    DOCTOR: ['patient:*', 'treatment:*', 'calendar:*'],
    ADMIN: ['*'] // Tous les droits
  };
  ```

## 🗄️ Collections MongoDB à implémenter

### 📊 Structure recommandée

#### Collection `users` (✅ Existante)
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String, // unique
  password: String, // hash bcrypt
  role: String, // ADMIN|DOCTOR|SECRETARY
  phoneNumber: String,
  specialization: String,
  isActive: Boolean,
  lastLogin: Date,
  passwordChangedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Collection `sessions` (🔄 À créer)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  token: String,
  expiresAt: Date,
  ipAddress: String,
  userAgent: String,
  isActive: Boolean,
  createdAt: Date
}
```

#### Collection `audit_logs` (🔄 À créer)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  action: String, // 'login', 'logout', 'create_patient', etc.
  resource: String, // 'user', 'patient', 'treatment'
  resourceId: ObjectId,
  details: Object,
  ipAddress: String,
  timestamp: Date
}
```

#### Collection `permissions` (🔄 À créer)
```javascript
{
  _id: ObjectId,
  name: String, // 'patient:read'
  description: String,
  category: String // 'patient', 'treatment', 'user'
}
```

#### Collection `role_permissions` (🔄 À créer)
```javascript
{
  _id: ObjectId,
  role: String,
  permissions: [String] // Array des permissions
}
```

## 🚀 Guide de démarrage pour les développeurs

### Prérequis
1. MongoDB en cours d'exécution (Docker)
2. Node.js et npm installés
3. Angular CLI installé

### Démarrage rapide
```bash
# 1. Démarrer MongoDB
docker-compose -f docker-compose.mongodb.yml up -d

# 2. Créer les utilisateurs de test
cd backend && node src/scripts/create-users.js

# 3. Démarrer le backend
cd backend && npm start

# 4. Démarrer le frontend
cd frontend && ng serve
```

### Test de l'authentification
1. Accéder à `http://localhost:4200`
2. Utiliser les comptes de test (voir tableau ci-dessus)
3. Vérifier les redirections selon les rôles

## 🔍 Points d'attention pour GitHub Copilot

### Patterns de code à suivre
- **Services** : Utiliser l'injection de dépendance Angular
- **Guards** : Toujours vérifier l'authentification avant les rôles
- **Composants** : Séparer la logique métier des composants UI
- **Sécurité** : Ne jamais exposer de secrets côté client

### Nomenclature
- **Files** : `kebab-case.component.ts`
- **Classes** : `PascalCase`
- **Variables/Methods** : `camelCase`
- **Constants** : `SCREAMING_SNAKE_CASE`

### Structure des tests
```typescript
describe('AuthService', () => {
  it('should login successfully with valid credentials', () => {
    // Test implementation
  });
  
  it('should handle login errors gracefully', () => {
    // Test implementation
  });
});
```

## 📝 Notes importantes

### Variables d'environnement requises
```bash
# Backend (.env)
MONGODB_URI=mongodb://root:password@localhost:27017/cabinetdb?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=1d
NODE_ENV=development
PORT=3000
```

### Sécurité en production
- [ ] Changer les secrets JWT
- [ ] Utiliser HTTPS uniquement
- [ ] Configurer CORS strictement
- [ ] Activer le rate limiting
- [ ] Mettre en place la supervision

---

**📅 Dernière mise à jour** : 23 octobre 2025  
**👥 Équipe** : Cabinet AI Development Team  
**🔖 Version** : 1.0.0 - Authentification de base