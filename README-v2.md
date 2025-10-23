# Cabinet AI - Application de Gestion Médicale v2

## 📋 Vue d'ensemble du Projet

**Cabinet AI** est une application moderne de gestion de cabinet médical développée avec Angular 18 et Node.js. L'application permet la gestion complète des patients, des soins dentaires, et offre une interface utilisateur moderne avec navigation par sidebar.

### 🏗️ Architecture Technique

**Frontend:**
- **Framework:** Angular 18 (Standalone Components)
- **UI Library:** Angular Material Design
- **Styling:** SCSS avec gradients modernes
- **Navigation:** Router avec sidebar persistante
- **Responsive:** Design adaptatif mobile/desktop

**Backend:**
- **Runtime:** Node.js avec Express.js
- **Language:** TypeScript
- **Database:** MongoDB avec Mongoose
- **API:** RESTful endpoints
- **Authentication:** JWT middleware

### 🎨 Design System & Interface

#### Palette de Couleurs
- **Couleur principale:** Teal/Vert nature `#20c997` → `#0dcaf0`
- **Couleur active:** Vert doux `#17a085`
- **Backgrounds:** Gradients subtils `#f8f9fa` → `#ffffff`
- **Text:** Nuances de gris `#495057`, `#6c757d`

#### Navigation Sidebar
- **Position:** Gauche, ouverte par défaut
- **Largeur:** 280px (240px sur mobile)
- **Menu actif:** 
  - Fond gradient `rgba(32, 201, 151, 0.12)`
  - Bordure gauche 3px teal
  - Glissement 4px vers la droite
  - Font-weight 600, couleur `#17a085`
  - Ombre douce `0 3px 12px rgba(32, 201, 151, 0.2)`

#### Composants UI
- **Cards:** Arrondi 12px, ombres subtiles
- **Headers:** Gradients teal avec effet de profondeur
- **Buttons:** Arrondi 10px, effets hover animés
- **Search:** Champs harmonisés entre composants

---

## 🏥 Modules Fonctionnels

### 1. Module Patients (`/patients`)

#### Fonctionnalités
- **Liste des patients** avec recherche avancée
- **Ajout/Édition** de patients via dialog modal
- **Affichage des détails** avec informations complètes
- **Calcul automatique de l'âge** depuis la date de naissance
- **Actions:** Voir, Éditer, Supprimer

#### Modèle Patient
```typescript
interface Patient {
  _id?: string;
  patientNumber: string;    // Numéro unique auto-généré
  lastName: string;         // Nom (CamelCase)
  firstName: string;        // Prénom (CamelCase)
  dateOfBirth: Date;       // Date de naissance
  phone: string;           // Téléphone
  email?: string;          // Email optionnel
  address?: string;        // Adresse optionnelle
  createdAt?: Date;
  updatedAt?: Date;
}
```

#### Composants
- `patient-list.component` - Liste principale avec tableau
- `patient-form.component` - Formulaire d'ajout/édition
- `patient-details.component` - Affichage détaillé

### 2. Module Soins/Traitements (`/treatments`)

#### Fonctionnalités
- **Gestion des soins dentaires** par patient
- **Suivi financier** avec honoraires et reçus
- **Calcul automatique du solde** (reçu - honoraire)
- **Historique complet** des traitements
- **Statistiques** par patient

#### Modèle Treatment (Mis à jour)
```typescript
interface Treatment {
  _id?: string;
  patientId: string;        // Référence patient
  date: Date;              // Date du soin
  dent: number;            // Numéro de dent (1-48)
  description: string;     // Description du traitement
  honoraire: number;       // Montant des honoraires
  reçu: number;           // Montant reçu
  createdAt?: Date;
  updatedAt?: Date;
}
```

#### Logique Métier
- **Solde = reçu - honoraire**
- **Solde positif:** Patient en crédit (orange)
- **Solde zéro:** Soldé (vert)
- **Solde négatif:** Reste à payer (rouge)

#### Composants
- `patient-treatments.component` - Vue principale des soins
- `treatment-dialog.component` - Ajout/édition de traitement
- Intégration avec le module patients

### 3. Module Calendrier (`/calendar`)

#### Fonctionnalités (Prévu)
- **Gestion des rendez-vous**
- **Planification** des consultations
- **Vue calendrier** mensuelle/hebdomadaire
- **Notifications** de rappel

---

## 🎯 Fonctionnalités Techniques Avancées

### Formatage et Calculs
```typescript
// Formatage des noms en CamelCase
formatPatientName(name: string): string {
  return name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Calcul d'âge automatique
calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Affichage avec âge intégré
getPatientDisplayNameHtml(patient: Patient): string {
  const formattedName = `${this.formatPatientName(patient.firstName)} ${this.formatPatientName(patient.lastName)}`;
  const age = this.calculateAge(patient.dateOfBirth);
  return `${formattedName} <span class="age">(${age} ans)</span>`;
}
```

### Recherche Avancée
- **Multi-critères:** nom, prénom, numéro patient
- **Recherche en temps réel** avec debounce
- **Filtrage côté client** pour performance
- **Placeholders harmonisés** entre composants

### Gestion des États
- **Loading states** avec spinners Material
- **Error handling** avec messages utilisateur
- **Success feedback** pour les actions
- **Confirmation dialogs** pour suppressions

---

## 🔧 Structure de Fichiers

```
frontend/src/app/
├── app.component.* (Layout principal + Sidebar)
├── patients/
│   ├── patient-list/
│   │   ├── patient-list.component.html
│   │   ├── patient-list.component.scss (Style harmonisé)
│   │   └── patient-list.component.ts
│   ├── patient-form/
│   ├── patient-details/
│   └── services/patient.service.ts
├── treatments/
│   ├── patient-treatments/
│   │   ├── patient-treatments.component.html
│   │   ├── patient-treatments.component.scss (Style moderne)
│   │   └── patient-treatments.component.ts
│   ├── treatment-dialog/
│   └── services/treatment.service.ts
├── calendar/ (Module prévu)
└── shared/
    ├── models/ (Patient, Treatment interfaces)
    └── services/
```

```
backend/src/
├── server.ts (Point d'entrée)
├── config/database.ts (MongoDB)
├── models/
│   ├── patient.model.ts
│   ├── treatment.model.ts (Mis à jour)
│   └── user.model.ts
├── controllers/
│   ├── patient.controller.ts
│   ├── treatment.controller.ts (Logique métier)
│   └── auth.controller.ts
├── routes/
│   ├── patient.routes.ts
│   ├── treatment.routes.ts
│   └── auth.routes.ts
└── middleware/auth.middleware.ts
```

---

## 🚀 État d'Avancement

### ✅ Complètement Terminé
- [x] **Architecture de base** (Frontend + Backend)
- [x] **Module Patients** (CRUD complet)
- [x] **Module Soins** avec nouveau modèle de données
- [x] **Navigation sidebar** avec indicateur visuel subtil
- [x] **Design system** harmonisé (couleurs, typographie)
- [x] **Calcul d'âge automatique** et affichage
- [x] **Recherche multi-critères** sur patients
- [x] **Gestion financière** des traitements (honoraire/reçu/solde)
- [x] **Responsive design** adaptatif
- [x] **Formatage CamelCase** des noms
- [x] **Harmonisation visuelle** entre composants

### 🔄 En Cours / À Améliorer
- [ ] **Module Calendrier** (planifié)
- [ ] **Authentification utilisateur** (structure prête)
- [ ] **Rapports et statistiques** avancés
- [ ] **Backup/Export** des données
- [ ] **Notifications** et rappels

### 🎨 Aspects Visuels Finalisés
- **Palette de couleurs** teal/vert cohérente
- **Navigation active** avec style subtil et élégant
- **Cards modernes** avec gradients et ombres
- **Animations fluides** et transitions douces
- **Typographie** hiérarchisée et lisible
- **Icônes Material** cohérentes

---

## 🔌 APIs et Endpoints

### Patients
- `GET /api/patients` - Liste tous les patients
- `POST /api/patients` - Crée un nouveau patient
- `PUT /api/patients/:id` - Met à jour un patient
- `DELETE /api/patients/:id` - Supprime un patient
- `GET /api/patients/:id` - Détails d'un patient

### Traitements
- `GET /api/treatments/patient/:patientId` - Traitements d'un patient
- `POST /api/treatments` - Crée un nouveau traitement
- `PUT /api/treatments/:id` - Met à jour un traitement
- `DELETE /api/treatments/:id` - Supprime un traitement

---

## 💾 Modèle de Données

### Base de Données MongoDB
- **Collection `patients`** - Informations patients
- **Collection `treatments`** - Historique des soins
- **Collection `users`** - Utilisateurs du système (prévu)

### Relations
- `Treatment.patientId` → `Patient._id` (One-to-Many)
- Index sur `patientNumber` pour recherche rapide
- Index sur `Treatment.date` pour tri chronologique

---

## 🛠️ Instructions de Développement

### Installation
```bash
# Backend
cd backend && npm install && npm run build

# Frontend  
cd frontend && npm install

# Démarrage
npm run dev (frontend)
npm start (backend)
```

### Standards de Code
- **TypeScript strict mode** activé
- **SCSS** pour styling avec variables globales
- **Angular Material** pour composants UI
- **Reactive Forms** pour validation
- **Observables RxJS** pour gestion asynchrone

---

## 📝 Notes de Version

### v2.0 - Version Actuelle
- Refonte complète du modèle de traitement
- Navigation sidebar avec état actif subtil
- Harmonisation visuelle entre tous les composants
- Calcul automatique d'âge et formatage CamelCase
- Système de recherche unifié
- Design system finalisé avec palette teal/vert

### Prochaines Évolutions
- Module calendrier avec gestion RDV
- Système de rapports avancés
- Authentification multi-utilisateur
- Export/Import données
- Mode sombre optionnel

---

*Ce document sert de référence complète pour le développement et la maintenance de l'application Cabinet AI. Il sera mis à jour au fur et à mesure des évolutions du projet.*