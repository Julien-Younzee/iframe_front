import { API_CONFIG, FIREBASE_CONFIG, MIRROR_API_CONFIG } from '../config/config';
import logger from './logger';

/**
 * Service de validation de la configuration
 */

/**
 * Valide la configuration Firebase
 * @returns {Object} - { isValid: boolean, missingKeys: string[], warnings: string[] }
 */
export const validateFirebaseConfig = () => {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingKeys = [];
  const warnings = [];

  requiredKeys.forEach((key) => {
    if (!FIREBASE_CONFIG[key]) {
      missingKeys.push(`REACT_APP_FIREBASE_${key.toUpperCase()}`);
    }
  });

  if (!FIREBASE_CONFIG.measurementId) {
    warnings.push('REACT_APP_FIREBASE_MEASUREMENT_ID est recommandé pour Analytics');
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
    warnings,
  };
};

/**
 * Valide la configuration de l'API VTO backend
 * @returns {Object} - { isValid: boolean, missingKeys: string[], warnings: string[] }
 */
export const validateAPIConfig = () => {
  const warnings = [];
  const missingKeys = [];

  if (!API_CONFIG.BACKEND_URL || API_CONFIG.BACKEND_URL === 'http://localhost:8000') {
    warnings.push('REACT_APP_BACKEND_URL n\'est pas configuré (utilise localhost par défaut)');
  }

  if (!API_CONFIG.API_KEY) {
    warnings.push('REACT_APP_API_KEY n\'est pas configuré (optionnel selon votre backend)');
  }

  return {
    isValid: true, // L'API peut fonctionner sans clé selon la configuration
    missingKeys,
    warnings,
  };
};

/**
 * Valide la configuration Mirror API
 * @returns {Object} - { isValid: boolean, missingKeys: string[], warnings: string[] }
 */
export const validateMirrorAPIConfig = () => {
  const warnings = [];
  const missingKeys = [];

  if (!MIRROR_API_CONFIG.BASE_URL || MIRROR_API_CONFIG.BASE_URL === 'http://localhost:8000') {
    warnings.push('REACT_APP_MIRROR_API_URL n\'est pas configuré (utilise localhost par défaut)');
  }

  return {
    isValid: true, // Mirror API est requis mais peut fonctionner avec l'URL par défaut
    missingKeys,
    warnings,
  };
};

/**
 * Valide toute la configuration de l'application
 * @returns {Object} - Rapport de validation complet
 */
export const validateAllConfig = () => {
  const firebase = validateFirebaseConfig();
  const api = validateAPIConfig();
  const mirrorApi = validateMirrorAPIConfig();

  const allMissingKeys = [
    ...firebase.missingKeys,
    ...api.missingKeys,
    ...mirrorApi.missingKeys,
  ];

  const allWarnings = [
    ...firebase.warnings,
    ...api.warnings,
    ...mirrorApi.warnings,
  ];

  return {
    isValid: firebase.isValid && api.isValid && mirrorApi.isValid,
    firebase,
    api,
    mirrorApi,
    allMissingKeys,
    allWarnings,
    summary: {
      totalMissing: allMissingKeys.length,
      totalWarnings: allWarnings.length,
      criticalIssues: !firebase.isValid,
    },
  };
};

/**
 * Affiche le rapport de validation dans la console
 * @param {boolean} showWarnings - Afficher aussi les warnings
 */
export const logConfigValidation = (showWarnings = true) => {
  const validation = validateAllConfig();

  logger.group('🔧 Validation de la configuration Younzee');

  // Firebase
  if (!validation.firebase.isValid) {
    logger.error('❌ Firebase: Configuration invalide');
    logger.error('   Variables manquantes:', validation.firebase.missingKeys);
  } else {
    logger.log('✅ Firebase: Configuration valide');
  }

  if (showWarnings && validation.firebase.warnings.length > 0) {
    logger.warn('⚠️ Firebase warnings:', validation.firebase.warnings);
  }

  // API VTO Backend
  if (!validation.api.isValid) {
    logger.error('❌ API VTO Backend: Configuration invalide');
    logger.error('   Variables manquantes:', validation.api.missingKeys);
  } else {
    logger.log('✅ API VTO Backend: Configuration valide');
  }

  if (showWarnings && validation.api.warnings.length > 0) {
    logger.warn('⚠️ API VTO Backend warnings:', validation.api.warnings);
  }

  // Mirror API Backend
  if (!validation.mirrorApi.isValid) {
    logger.error('❌ Mirror API Backend: Configuration invalide');
    logger.error('   Variables manquantes:', validation.mirrorApi.missingKeys);
  } else {
    logger.log('✅ Mirror API Backend: Configuration valide');
  }

  if (showWarnings && validation.mirrorApi.warnings.length > 0) {
    logger.warn('⚠️ Mirror API Backend warnings:', validation.mirrorApi.warnings);
  }

  // Résumé
  logger.groupEnd();

  if (validation.summary.criticalIssues) {
    logger.error('🚨 PROBLÈMES CRITIQUES DÉTECTÉS - L\'application peut ne pas fonctionner correctement');
  } else if (validation.summary.totalWarnings > 0 && showWarnings) {
    logger.warn(`⚠️ ${validation.summary.totalWarnings} avertissement(s) détecté(s)`);
  } else {
    logger.log('✅ Configuration OK');
  }

  return validation;
};

/**
 * Vérifie si l'environnement est en mode développement
 * @returns {boolean}
 */
export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Vérifie si l'environnement est en mode production
 * @returns {boolean}
 */
export const isProductionMode = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Obtient les informations sur l'environnement actuel
 * @returns {Object}
 */
export const getEnvironmentInfo = () => {
  return {
    nodeEnv: process.env.NODE_ENV,
    isDevelopment: isDevelopmentMode(),
    isProduction: isProductionMode(),
    vtoBackendUrl: API_CONFIG.BACKEND_URL,
    mirrorApiUrl: MIRROR_API_CONFIG.BASE_URL,
  };
};
