# 📱 Architecture de Navigation - Cabinet Manager

## Vue d'ensemble

L'application utilise une architecture de navigation **responsive** et **extensible** qui s'adapte automatiquement selon la plateforme :

- **Web (desktop)** : Menu horizontal en haut avec icônes + recherche globale
- **Mobile/Tablet** : Tab Bar en bas avec support menu "Plus" pour items supplémentaires

## 🎯 Composants principaux

### 1. **menuConfig.ts** - Configuration centralisée
Fichier unique qui définit TOUS les menus de l'application.

```typescript
export type MenuItemConfig = {
  key: string;              // Identifiant unique
  label: string;            // Libellé affiché
  icon: string;             // Emoji ou icône
  requiredPermission?: string;  // Permission requise (optionnel)
  showInTabBar: boolean;    // Afficher dans le tab bar principal
  showInHamburger?: boolean;    // Afficher dans le menu "Plus"
  order: number;            // Ordre d'affichage
};
```

### 2. **TabBar.tsx** - Navigation mobile
Composant Tab Bar intelligent qui :
- Affiche jusqu'à 4-5 menus principaux
- Ajoute automatiquement un bouton "Plus" si nécessaire
- Gère le menu modal pour items supplémentaires

### 3. **Menu.tsx** - Navigation web
Menu horizontal moderne avec :
- Icônes pour chaque section
- Barre de recherche intégrée
- Effet hover et underline pour l'item actif

### 4. **Dashboard.tsx** - Page d'accueil
Dashboard complet avec :
- Statistiques en temps réel (RDV, patients, etc.)
- Rendez-vous du jour
- Patients récents
- Actions rapides

## 🚀 Comment ajouter un nouveau menu ?

### Étape 1 : Configurer dans menuConfig.ts

```typescript
// Dans MENU_CONFIG, ajouter :
{
  key: 'statistics',
  label: 'Statistiques',
  icon: '📊',
  showInTabBar: false,      // false si déjà 5+ menus
  showInHamburger: true,    // true pour menu "Plus"
  order: 6,
},
```

### Étape 2 : Créer le composant de page

```typescript
// src/screens/Statistics.tsx
import React from 'react';
import { View, Text } from 'react-native';

export default function Statistics() {
  return (
    <View>
      <Text>Statistiques</Text>
    </View>
  );
}
```

### Étape 3 : Ajouter la route dans Home.tsx et HomeMobile.tsx

```typescript
// Dans Home.tsx
import Statistics from './Statistics';

// Dans le switch :
case 'statistics': Content = <Statistics />; break;
```

**C'est tout !** Le menu apparaîtra automatiquement :
- ✅ Dans le tab bar mobile (si `showInTabBar: true` et moins de 5 items)
- ✅ Dans le menu "Plus" mobile (si `showInHamburger: true`)
- ✅ Dans le menu horizontal web

## 📊 Gestion des permissions (Future)

L'architecture est prête pour gérer les permissions :

```typescript
{
  key: 'users',
  label: 'Utilisateurs',
  icon: '👤',
  requiredPermission: 'admin',  // Seuls les admins verront ce menu
  showInTabBar: false,
  showInHamburger: true,
  order: 8,
}
```

Pour activer :
```typescript
// Dans Home.tsx ou HomeMobile.tsx
const userPermissions = ['admin', 'edit_patients'];
<TabBar active={route} onChange={setRoute} userPermissions={userPermissions} />
```

## 🎨 Recommandations UX

### Tab Bar mobile
- **Optimal** : 4-5 items maximum dans le tab bar
- **Au-delà** : Utiliser le menu "Plus" automatique
- **Icônes** : Préférer des emojis ou icônes Material Design

### Menu web
- **Optimal** : 5-7 items maximum dans le menu horizontal
- **Recherche** : Toujours visible pour accès rapide
- **Responsive** : Menu hamburger automatique sur petits écrans web

## 📱 Breakpoints responsive

- **Mobile** : `< 768px` → TabBar en bas
- **Web/Desktop** : `>= 768px` → Menu horizontal en haut

## 🔄 Évolutivité

### Scénario 1 : Ajouter 1-2 menus supplémentaires
```typescript
// Garder showInTabBar: true si total <= 5
showInTabBar: true,
```

### Scénario 2 : Ajouter 3+ menus supplémentaires
```typescript
// Nouveaux menus → showInTabBar: false
showInTabBar: false,
showInHamburger: true,  // Ils iront dans "Plus"
```

### Scénario 3 : Menus conditionnels par rôle
```typescript
{
  key: 'admin_panel',
  requiredPermission: 'super_admin',
  showInTabBar: false,
  showInHamburger: true,
}
```

## 🎯 Avantages de cette architecture

1. **Centralisée** : Un seul fichier pour gérer tous les menus
2. **Flexible** : Support facile de nouveaux menus
3. **Responsive** : Adaptation automatique mobile/web
4. **Scalable** : Prêt pour permissions et menus conditionnels
5. **UX optimale** : Pas de surcharge visuelle (max 5 items visibles)

## 📝 Exemples de menus futurs

Voici des suggestions de menus à ajouter :

```typescript
// Statistiques avancées
{ key: 'statistics', label: 'Stats', icon: '📊', order: 6 },

// Gestion documents/facturation
{ key: 'documents', label: 'Documents', icon: '📄', order: 7 },

// Messages/notifications
{ key: 'messages', label: 'Messages', icon: '💬', order: 8 },

// Paramètres
{ key: 'settings', label: 'Paramètres', icon: '⚙️', order: 9 },

// Admin (si permissions)
{ 
  key: 'admin', 
  label: 'Administration', 
  icon: '🔐', 
  requiredPermission: 'admin',
  order: 10 
},
```

## 🚦 Mise en route rapide

```bash
# Démarrer l'app
cd front2
npm start

# Web
npm run web

# Mobile
npm run android
npm run ios
```

## 🎨 Personnalisation des styles

Les styles sont dans chaque composant :
- `TabBar.tsx` : styles du tab bar mobile
- `Menu.tsx` : styles du menu web
- `Dashboard.tsx` : styles du dashboard

Couleurs principales :
- Primary: `#1976d2` (bleu)
- Success: `#2e7d32` (vert)
- Danger: `#d32f2f` (rouge)
- Gradient: `#20c997` → `#0dcaf0` (turquoise)
