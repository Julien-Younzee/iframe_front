import { API_CONFIG } from '../config/config';
import { getCurrentUser } from './firebaseAuth';
import logger from './logger';

/**
 * Récupère le profil utilisateur depuis le backend Django
 * @param {string} uid - Firebase User ID
 * @returns {Promise<Object>} - Profil utilisateur
 */
export const getUserProfile = async (uid) => {
  try {
    const user = getCurrentUser();
    const token = user ? await user.getIdToken() : null;

    const response = await fetch(
      `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.USER_PROFILE}/${uid}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Utilisateur n'existe pas encore
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Erreur lors de la récupération du profil:', error);
    throw error;
  }
};

/**
 * Crée ou met à jour le profil utilisateur
 * @param {Object} userData - Données du profil
 * @returns {Promise<Object>}
 */
export const saveUserProfile = async (userData) => {
  try {
    const user = getCurrentUser();
    const token = user ? await user.getIdToken() : null;

    const response = await fetch(
      `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.USER_PROFILE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          uid: user?.uid,
          phone: user?.phoneNumber,
          ...userData,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde du profil:', error);
    throw error;
  }
};

/**
 * Obtient une recommandation de taille
 * @param {Object} userData - Données utilisateur
 * @returns {Promise<Object>} - Recommandation de taille
 */
export const getSizeRecommendation = async (userData) => {
  try {
    const user = getCurrentUser();
    const token = user ? await user.getIdToken() : null;

    const response = await fetch(
      `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.SIZE_RECOMMENDATION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(userData),
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Erreur lors de la recommandation de taille:', error);
    throw error;
  }
};

/**
 * Génère l'essayage virtuel avec l'avatar
 * @param {Object} userData - Les données collectées de l'utilisateur
 * @returns {Promise<Object>} - L'image générée en base64 et les métadonnées
 */
export const generateVirtualTryOn = async (userData) => {
  try {
    const user = getCurrentUser();
    const token = user ? await user.getIdToken() : null;

    // Utiliser l'avatar depuis PostgreSQL si disponible, sinon utiliser le selfie
    const avatarToUse = userData.avatarBase64 || userData.selfieBase64;

    const payload = {
      uid: user?.uid,
      sexe: userData.gender,
      taille: userData.height.toString(),
      poids: userData.weight.toString(),
      haut: userData.sizeTop,
      bas: userData.sizeBottom,
      selfie_base64: avatarToUse,
      vetements_base64: userData.clothingItem?.imagesBase64 || [],
    };

    const response = await fetch(
      `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.VIRTUAL_TRYON}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    return {
      imageBase64: data.image_base64 || data.imageBase64 || data.image,
      sizeRecommendation: data.size_recommendation,
      recommendation: data.recommendation,
    };
  } catch (error) {
    logger.error('Erreur API:', error);
    throw error;
  }
};

/**
 * Convertit une image en base64
 * @param {File} file - Le fichier image
 * @returns {Promise<string>} - L'image en base64
 */
export const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};
