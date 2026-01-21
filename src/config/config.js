/**
 * Configuration Firebase
 */
export const FIREBASE_CONFIG = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

/**
 * Configuration de l'API VTO (FastAPI)
 */
export const API_CONFIG = {
  // URL de votre backend VTO
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'https://iframe-vto-dev-965958056387.europe-west1.run.app',

  // Clé API si nécessaire pour l'authentification
  API_KEY: process.env.REACT_APP_API_KEY || '',

  // Timeout pour les requêtes API (en millisecondes)
  TIMEOUT: 120000, // 120 secondes (génération VTO peut prendre du temps)

  // Endpoints VTO
  ENDPOINTS: {
    VTO_WITH_AVATAR: '/vto/with-avatar',
    VTO_WITH_SELFIE: '/vto/with-selfie',
    HEALTH: '/health',
    // Anciens endpoints (à supprimer si non utilisés)
    USER_PROFILE: '/user/profile',
    SIZE_RECOMMENDATION: '/size-recommendation',
  },
};

/**
 * Configuration de la caméra
 */
export const CAMERA_CONFIG = {
  // Qualité de l'image JPEG (0-1)
  JPEG_QUALITY: 0.8,

  // Résolution idéale de la caméra
  VIDEO_WIDTH: 1280,
  VIDEO_HEIGHT: 720,
};

/**
 * Configuration Mirror API (Backend Django pour la gestion des shoppers)
 * @deprecated Utiliser API_MOBILE_CONFIG à la place
 */
export const MIRROR_API_CONFIG = {
  // URL de base du backend mirror-api
  BASE_URL: process.env.REACT_APP_MIRROR_API_URL || 'https://dev-api-backend-884993723796.europe-west9.run.app',
};

/**
 * Configuration API Mobile (Backend Django centralisé pour les shoppers)
 */
export const API_MOBILE_CONFIG = {
  // URL de base du backend api-appMobile
  BASE_URL: process.env.REACT_APP_API_MOBILE_URL || '',
};

/**
 * Configuration Signed URL Service (Cloud Run pour génération d'URLs signées GCS)
 */
export const SIGNED_URL_SERVICE_CONFIG = {
  // URL de base du service de génération d'URLs signées
  BASE_URL: process.env.REACT_APP_SIGNED_URL_SERVICE_URL || '',
};

/**
 * Messages et textes de l'application
 */
export const TEXTS = {
  APP_NAME: 'Younzee',
  INTRO_TITLE: 'Bienvenue chez Younzee',
  INTRO_DESCRIPTION: 'Découvrez comment vos vêtements vous iront grâce à notre technologie d\'essayage virtuel.',
};
