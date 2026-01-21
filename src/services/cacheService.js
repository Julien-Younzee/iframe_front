/**
 * Service de gestion du cache local (localStorage)
 * Pour stocker temporairement les données utilisateur non authentifié
 */

import logger from './logger';

const CACHE_KEYS = {
  USER_DATA: 'younzee_user_data',
  SESSION_ID: 'younzee_session_id',
};

/**
 * Génère un ID de session unique
 */
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sauvegarde les données utilisateur dans le cache local
 * @param {Object} userData - Données utilisateur
 */
export const saveUserDataToCache = (userData) => {
  try {
    const sessionId = localStorage.getItem(CACHE_KEYS.SESSION_ID) || generateSessionId();
    localStorage.setItem(CACHE_KEYS.SESSION_ID, sessionId);

    const dataToSave = {
      ...userData,
      sessionId,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(CACHE_KEYS.USER_DATA, JSON.stringify(dataToSave));
    logger.log('Données sauvegardées dans le cache');
    return true;
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde dans le cache:', error);
    return false;
  }
};

/**
 * Récupère les données utilisateur depuis le cache local
 * @returns {Object|null} Données utilisateur ou null
 */
export const getUserDataFromCache = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEYS.USER_DATA);
    if (!cachedData) {
      return null;
    }

    const userData = JSON.parse(cachedData);
    return userData;
  } catch (error) {
    logger.error('Erreur lors de la récupération du cache:', error);
    return null;
  }
};

/**
 * Vérifie si des données en cache existent
 * @returns {boolean}
 */
export const hasCachedData = () => {
  return !!localStorage.getItem(CACHE_KEYS.USER_DATA);
};

/**
 * Supprime les données utilisateur du cache
 */
export const clearUserCache = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.USER_DATA);
    logger.log('Cache supprimé');
    return true;
  } catch (error) {
    logger.error('Erreur lors de la suppression du cache:', error);
    return false;
  }
};

/**
 * Supprime tout le cache Younzee
 */
export const clearAllCache = () => {
  try {
    Object.values(CACHE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    logger.log('Tout le cache a été supprimé');
    return true;
  } catch (error) {
    logger.error('Erreur lors de la suppression complète du cache:', error);
    return false;
  }
};

/**
 * Met à jour partiellement les données en cache
 * @param {Object} updates - Données à mettre à jour
 */
export const updateCachedUserData = (updates) => {
  try {
    const existingData = getUserDataFromCache() || {};
    const updatedData = {
      ...existingData,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(CACHE_KEYS.USER_DATA, JSON.stringify(updatedData));
    return true;
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du cache:', error);
    return false;
  }
};

/**
 * Récupère l'ID de session
 * @returns {string|null}
 */
export const getSessionId = () => {
  return localStorage.getItem(CACHE_KEYS.SESSION_ID);
};
