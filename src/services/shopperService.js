import { MIRROR_API_CONFIG } from '../config/config';
import { getCurrentUser } from './firebaseAuth';

/**
 * Service pour interagir avec le backend mirror-api pour la gestion des shoppers
 */

/**
 * Récupère les détails d'un shopper connecté via Firebase
 * Utilise le backend mirror-api avec authentification Firebase
 * @returns {Promise<Object|null>} - Les données du shopper ou null si non trouvé
 */
export const getShopperDetails = async () => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    // Récupérer le token Firebase
    const token = await user.getIdToken();

    const url = `${MIRROR_API_CONFIG.BASE_URL}/api/shopper/details/`;

    console.log('🔍 Requête GET shopper details:', {
      url,
      uid: user.uid,
      hasToken: !!token,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📥 Réponse shopper details:', {
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Shopper n'existe pas encore
      }
      const errorText = await response.text();
      throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération du shopper:', error);
    throw error;
  }
};

/**
 * Crée un nouveau shopper dans la base de données
 * Format PostgREST : POST /shoppers avec Prefer: return=representation
 * @param {Object} shopperData - Les données du shopper à créer
 * @param {string} shopperData.firebase_id - UID Firebase (requis)
 * @param {string} shopperData.nickname - Pseudo (requis)
 * @param {string} shopperData.first_name - Prénom (requis)
 * @param {string} shopperData.number_phone - Numéro de téléphone (requis)
 * @param {string} shopperData.email - Email (requis)
 * @param {number} shopperData.gender_id - ID du genre (optionnel)
 * @param {number} shopperData.size_cm - Taille en cm (optionnel)
 * @param {number} shopperData.weight_kg - Poids en kg (optionnel)
 * @param {string} shopperData.selfie_path - Chemin du selfie (optionnel)
 * @returns {Promise<Object>} - Les données du shopper créé
 */
export const createShopper = async (shopperData) => {
  try {
    const url = `${MIRROR_API_CONFIG.BASE_URL}/shoppers`;

    // Ajouter les timestamps
    const payload = {
      ...shopperData,
      inserted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation', // PostgREST header pour retourner le shopper créé
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // PostgREST retourne un tableau
    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('Erreur lors de la création du shopper:', error);
    throw error;
  }
};

/**
 * Convertit une image URL en base64
 * @param {string} imageUrl - L'URL de l'image
 * @returns {Promise<string>} - L'image en base64
 */
export const convertImageUrlToBase64 = async (imageUrl) => {
  try {
    if (!imageUrl) {
      throw new Error('URL de l\'image est requise');
    }

    // Fetch l'image
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Erreur lors du chargement de l'image: ${response.status}`);
    }

    // Convertir en blob puis en base64
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erreur lors de la conversion de l\'image en base64:', error);
    throw error;
  }
};
