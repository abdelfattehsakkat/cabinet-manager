import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Configuration de l'API
 * 
 * Priorité :
 * 1. Variable d'environnement EXPO_PUBLIC_API_URL (définie dans .env)
 * 2. Détection automatique en développement
 * 
 * IMPORTANT: Pour la production, créez un fichier .env avec :
 * EXPO_PUBLIC_API_URL=http://votre-serveur:3000
 */

// Détection de l'environnement
const isDev = __DEV__;

// Récupérer l'URL depuis les variables d'environnement Expo
const envApiUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

// Fonction pour obtenir l'URL par défaut selon la plateforme
function getDefaultApiUrl(): string {
  // Si une URL est définie dans l'environnement, l'utiliser
  if (envApiUrl) {
    return envApiUrl;
  }

  // En production sans variable d'environnement = erreur de configuration
  if (!isDev) {
    console.warn('⚠️ EXPO_PUBLIC_API_URL non définie en production ! Vérifiez votre fichier .env');
    // Retourner localhost pour éviter un crash, mais ça ne fonctionnera pas
    return 'http://localhost:3000';
  }

  // En développement
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  // Sur mobile en dev, utiliser l'IP de la machine de développement
  // Expo fournit l'IP du serveur de développement
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (debuggerHost) {
    return `http://${debuggerHost}:3000`;
  }

  // Fallback
  return 'http://localhost:3000';
}

let API_URL = getDefaultApiUrl();
let API_ROOT = `${API_URL}/api`;

export async function initConfig() {
  try {
    // Sur le web, essayer de charger config.json (utile pour le déploiement web)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const res = await fetch('/assets/config.json', { cache: 'no-store' });
      if (res.ok) {
        const cfg = await res.json();
        if (cfg?.apiUrl) {
          API_URL = cfg.apiUrl;
          API_ROOT = `${API_URL}/api`;
          console.log('[Config] API URL from config.json:', API_URL);
        }
      }
    }
  } catch (err) {
    // Garder les valeurs par défaut
  }
  
  console.log('[Config] Using API URL:', API_URL);
}

export function getApiUrl() {
  return API_URL;
}

export function getApiRoot() {
  return API_ROOT;
}

// Permet de changer l'URL dynamiquement (utile pour les tests)
export function setApiUrl(url: string) {
  API_URL = url;
  API_ROOT = `${url}/api`;
}

export default { initConfig, getApiUrl, getApiRoot, setApiUrl };
