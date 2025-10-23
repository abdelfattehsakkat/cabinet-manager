# ⏰ Configuration des Sessions - Cabinet AI

## 📊 Durée de session actuelle

### 🔐 Configuration JWT Backend
```bash
# Variables d'environnement (.env)
JWT_EXPIRE=1d  # 24 heures par défaut
```

### ⚙️ Paramètres de session

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| **Durée du token JWT** | `24 heures` | Token expire après 1 jour |
| **Vérification automatique** | `1 minute` | Check de l'expiration toutes les minutes |
| **Alerte jaune** | `15 minutes` | Warning affiché dans l'interface |
| **Alerte rouge** | `5 minutes` | Alerte critique avec animation |
| **Déconnexion automatique** | `À expiration` | Logout automatique quand token expiré |

## 🎛️ Réglage des durées

### Options de configuration JWT_EXPIRE

```bash
# Formats supportés
JWT_EXPIRE=1h     # 1 heure
JWT_EXPIRE=30m    # 30 minutes  
JWT_EXPIRE=24h    # 24 heures
JWT_EXPIRE=1d     # 1 jour
JWT_EXPIRE=7d     # 7 jours
JWT_EXPIRE=30d    # 30 jours
```

### Recommandations par environnement

| Environnement | Durée recommandée | Justification |
|---------------|-------------------|---------------|
| **Développement** | `24h` | Confort pour les développeurs |
| **Test** | `8h` | Journée de travail |
| **Production** | `4h` | Sécurité renforcée |
| **Mobile** | `7d` | Éviter les reconnexions fréquentes |

## 🔧 Modification de la durée

### 1. Changer la durée backend

```bash
# Dans le fichier .env du backend
JWT_EXPIRE=4h  # Exemple: 4 heures
```

### 2. Redémarrer le backend

```bash
cd backend
npm start
```

### 3. Vérifier la nouvelle configuration

Les nouveaux tokens générés auront la nouvelle durée d'expiration.

⚠️ **Note**: Les tokens déjà générés gardent leur durée d'expiration originale.

## 🚨 Gestion de l'expiration

### Côté Frontend

#### Surveillance automatique
- ✅ **Vérification périodique** : Toutes les minutes
- ✅ **Alerte utilisateur** : 15 min avant expiration
- ✅ **Alerte critique** : 5 min avant expiration
- ✅ **Déconnexion auto** : À l'expiration

#### Interface utilisateur
- 🟢 **Statut normal** : Temps restant affiché discrètement
- 🟡 **Avertissement** : Couleur jaune, 15 min restantes
- 🔴 **Critique** : Couleur rouge clignotante, 5 min restantes

### Côté Backend

#### Validation du token
- ✅ **Vérification automatique** : À chaque requête protégée
- ✅ **Réponse 401** : Si token expiré
- ✅ **Headers de sécurité** : Issuer et audience

## 📈 Métriques de session

### Informations disponibles

```typescript
// Dans l'AuthService
const timeRemaining = authService.getTimeUntilExpiration(); // En secondes
const isExpiringSoon = timeRemaining < 900; // < 15 minutes
```

### Logs automatiques

```javascript
// Backend - Logs d'expiration
console.warn('Token expiré pour utilisateur:', userId);

// Frontend - Surveillance
console.log('Temps restant:', timeRemaining, 'secondes');
```

## 🛡️ Sécurité

### Avantages de l'expiration automatique

1. **Réduction des risques** : Token volé devient inutile après expiration
2. **Sessions fantômes** : Évite les connexions oubliées
3. **Audit de sécurité** : Traçabilité des connexions actives

### Bonnes pratiques

- ✅ **Durées courtes** en production (2-8h)
- ✅ **HTTPS obligatoire** pour les tokens
- ✅ **Refresh tokens** pour UX améliorée (futur)
- ✅ **Déconnexion sur fermeture** du navigateur

## 🔄 Évolutions prévues

### Refresh Tokens (Étape future)

```typescript
interface TokenPair {
  accessToken: string;  // Courte durée (15-30 min)
  refreshToken: string; // Longue durée (7-30 jours)
}
```

### Multi-sessions

- Gestion de plusieurs appareils connectés
- Déconnexion sélective par appareil
- Notification de nouvelles connexions

### Timeouts d'inactivité

- Détection de l'activité utilisateur
- Suspension automatique après inactivité
- Réveil sur interaction

---

## 🧪 Test de la configuration

### 1. Test avec courte durée

```bash
# Temporairement, pour tester
JWT_EXPIRE=5m
```

### 2. Se connecter et observer

- Le timer dans l'interface
- Les alertes à 4 min et 2 min
- La déconnexion automatique à 5 min

### 3. Remettre la configuration normale

```bash
JWT_EXPIRE=24h
```

---

**⚡ Configuration actuelle :** `24 heures` avec surveillance automatique  
**📅 Dernière mise à jour :** 23 octobre 2025