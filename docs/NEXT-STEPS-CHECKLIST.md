# 📋 Checklist des prochaines étapes - Cabinet AI

## 🎯 Étape 2 : Interface adaptative selon les rôles (Priorité Haute)

### Menu principal adaptatif
- [ ] **Modifier le composant de navigation**
  - [ ] Injecter `AuthService` pour récupérer le rôle utilisateur
  - [ ] Masquer/afficher les éléments de menu selon le rôle
  - [ ] Créer des conditions d'affichage :
    ```typescript
    // SECRETARY: Seulement "Patients"
    // DOCTOR: "Patients" + "Soins" + "Calendrier" 
    // ADMIN: Tout + "Administration"
    ```

### Directives de permission
- [ ] **Créer directive `*hasRole`**
  ```typescript
  // Usage: <button *hasRole="'ADMIN'">Supprimer</button>
  @Directive({ selector: '[hasRole]' })
  export class HasRoleDirective { }
  ```

- [ ] **Créer directive `*hasAnyRole`**
  ```typescript
  // Usage: <div *hasAnyRole="['ADMIN', 'DOCTOR']">...</div>
  ```

### Adaptation des composants existants
- [ ] **PatientListComponent**
  - [ ] Masquer bouton "Nouveau Patient" pour SECRETARY (lecture seule)
  - [ ] Adapter les actions disponibles selon le rôle
  
- [ ] **TreatmentListComponent**
  - [ ] Vérifier l'accès pour DOCTOR/ADMIN uniquement
  - [ ] Adapter les permissions de création/modification

## 🔐 Étape 3 : Gestion des utilisateurs (Priorité Moyenne)

### Interface de gestion
- [ ] **Créer module UserManagement**
  ```bash
  ng generate module user-management
  ng generate component user-management/user-list
  ng generate component user-management/user-form
  ng generate service user-management/user-management
  ```

### Fonctionnalités à implémenter
- [ ] **Liste des utilisateurs** (ADMIN uniquement)
  - [ ] Affichage tabulaire avec tri/filtre
  - [ ] Actions : Voir, Modifier, Désactiver, Supprimer
  
- [ ] **Formulaire utilisateur**
  - [ ] Création de nouveau compte
  - [ ] Modification des informations
  - [ ] Changement de rôle
  - [ ] Réinitialisation mot de passe

- [ ] **API Backend**
  - [ ] `GET /api/users` - Liste des utilisateurs
  - [ ] `POST /api/users` - Création utilisateur
  - [ ] `PUT /api/users/:id` - Modification
  - [ ] `DELETE /api/users/:id` - Suppression

## 🛡️ Étape 4 : Sécurité avancée (Priorité Moyenne)

### Gestion des sessions
- [ ] **Timeout automatique**
  ```typescript
  // Service de timeout de session
  @Injectable()
  export class SessionTimeoutService {
    private readonly TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  }
  ```

- [ ] **Détection d'inactivité**
  - [ ] Écouter les événements mouse/keyboard
  - [ ] Afficher warning avant déconnexion
  - [ ] Déconnexion automatique

### Politique de mots de passe
- [ ] **Validation côté frontend**
  ```typescript
  const passwordValidators = [
    Validators.minLength(8),
    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  ];
  ```

- [ ] **Validation côté backend**
  - [ ] Middleware de validation
  - [ ] Vérification de la complexité
  - [ ] Historique des mots de passe

### Audit et logs
- [ ] **Modèle AuditLog**
  ```typescript
  interface AuditLog {
    userId: string;
    action: string;
    resource: string;
    timestamp: Date;
    ipAddress: string;
    details: any;
  }
  ```

- [ ] **Middleware d'audit**
  - [ ] Logger automatiquement les actions sensibles
  - [ ] Enregistrer les tentatives de connexion
  - [ ] Tracer les modifications de données

## 📊 Étape 5 : Permissions granulaires (Priorité Faible)

### Système de permissions
- [ ] **Définir les permissions**
  ```typescript
  enum Permission {
    // Patients
    PATIENT_VIEW = 'patient:view',
    PATIENT_CREATE = 'patient:create',
    PATIENT_EDIT = 'patient:edit',
    PATIENT_DELETE = 'patient:delete',
    
    // Soins
    TREATMENT_VIEW = 'treatment:view',
    TREATMENT_CREATE = 'treatment:create',
    TREATMENT_EDIT = 'treatment:edit',
    TREATMENT_DELETE = 'treatment:delete',
    
    // Administration
    USER_MANAGE = 'user:manage',
    SYSTEM_CONFIG = 'system:config'
  }
  ```

### Implémentation
- [ ] **Service de permissions**
  ```typescript
  @Injectable()
  export class PermissionService {
    hasPermission(permission: Permission): boolean { }
    hasAnyPermission(permissions: Permission[]): boolean { }
  }
  ```

- [ ] **Guards basés sur les permissions**
  ```typescript
  @Injectable()
  export class PermissionGuard implements CanActivate {
    canActivate(route: ActivatedRouteSnapshot): boolean {
      const requiredPermissions = route.data['permissions'];
      return this.permissionService.hasAnyPermission(requiredPermissions);
    }
  }
  ```

## 🗄️ Base de données - Collections à créer

### Collection sessions
- [ ] **Modèle Session**
  ```typescript
  interface Session {
    _id: ObjectId;
    userId: ObjectId;
    token: string;
    expiresAt: Date;
    ipAddress: string;
    userAgent: string;
    isActive: boolean;
  }
  ```

### Collection audit_logs
- [ ] **Modèle AuditLog** (voir ci-dessus)
- [ ] **Index sur userId et timestamp** pour les performances
- [ ] **Rotation automatique** des logs anciens

### Collection user_permissions
- [ ] **Permissions personnalisées par utilisateur**
  ```typescript
  interface UserPermission {
    userId: ObjectId;
    permissions: string[];
    grantedBy: ObjectId;
    grantedAt: Date;
  }
  ```

## 🚀 Améliorations UX/UI

### Interface utilisateur
- [ ] **Indicateur de rôle** dans la barre de navigation
- [ ] **Tooltip explicatif** sur les restrictions d'accès
- [ ] **Messages d'erreur contextuels** pour les permissions

### Notifications
- [ ] **Toast notifications** pour les actions importantes
- [ ] **Confirmation dialogs** pour les actions destructives
- [ ] **Loading states** pendant les opérations longues

## 🧪 Tests à implémenter

### Tests unitaires
- [ ] **AuthService** - Login/logout/permissions
- [ ] **Guards** - Vérification des accès
- [ ] **Components** - Affichage conditionnel selon rôles

### Tests d'intégration
- [ ] **Workflow complet** de connexion
- [ ] **Navigation** selon les rôles
- [ ] **API** - Endpoints protégés

## 📈 Monitoring et métriques

### Métriques à suivre
- [ ] **Temps de connexion** moyen
- [ ] **Erreurs d'authentification** par période
- [ ] **Utilisation par rôle** (pages visitées)
- [ ] **Sessions actives** simultanées

### Dashboards
- [ ] **Dashboard admin** avec métriques d'usage
- [ ] **Logs d'audit** consultables
- [ ] **Alertes** pour activités suspectes

---

## 🎯 Roadmap par sprint

### Sprint 1 (1-2 semaines)
✅ Authentification de base  
🔄 Interface adaptative selon rôles

### Sprint 2 (1-2 semaines)
📋 Gestion des utilisateurs  
🔐 Sécurité avancée (sessions, timeouts)

### Sprint 3 (1-2 semaines)
📊 Permissions granulaires  
🧪 Tests complets

### Sprint 4 (1 semaine)
📈 Monitoring et métriques  
🚀 Optimisations et polish

---

**💡 Note pour GitHub Copilot :** Ce checklist peut être utilisé pour générer des composants, services et tests en suivant les patterns établis dans le projet.