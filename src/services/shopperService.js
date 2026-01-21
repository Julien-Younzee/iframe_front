import { API_MOBILE_CONFIG, SIGNED_URL_SERVICE_CONFIG } from '../config/config';
import { getCurrentUser } from './firebaseAuth';
import { mapShopperDataFromDB, mapUserDataToDB } from '../config/dataMapping';
import logger from './logger';

/**
 * Service pour interagir avec le backend api-appMobile pour la gestion des shoppers
 */

/**
 * Récupère les détails d'un shopper connecté via Firebase
 * Utilise le backend api-appMobile avec authentification Firebase
 * @param {Object} user - Utilisateur Firebase (optionnel, utilise getCurrentUser si non fourni)
 * @param {boolean} mapData - Si true, mappe les données de la DB vers le format app (défaut: true)
 * @returns {Promise<Object|null>} - Les données du shopper (mappées ou brutes) ou null si non trouvé
 */
export const getShopperDetails = async (user = null, mapData = true) => {
  try {
    const firebaseUser = user || getCurrentUser();
    if (!firebaseUser) {
      throw new Error('Utilisateur non connecté');
    }

    // Récupérer le token Firebase
    const token = await firebaseUser.getIdToken();

    // Utiliser le filtre firebase_id pour récupérer le shopper
    const url = `${API_MOBILE_CONFIG.BASE_URL}/api/shoppers?firebase_id=${firebaseUser.uid}`;

    logger.log('🔍 Requête GET shopper details:', {
      url,
      uid: firebaseUser.uid,
      hasToken: !!token,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    logger.log('📥 Réponse shopper details:', {
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

    const responseData = await response.json();

    // L'API retourne un objet avec results (pagination DRF) ou un tableau
    const results = responseData.results || responseData;

    // Si le tableau est vide, le shopper n'existe pas
    if (Array.isArray(results) && results.length === 0) {
      logger.log('📭 Aucun shopper trouvé pour ce firebase_id');
      return null;
    }

    // Prendre le premier résultat
    const rawData = Array.isArray(results) ? results[0] : results;

    // Log de TOUTES les données pour voir la structure exacte
    logger.log('🔍 Réponse complète de l\'API:', rawData);

    logger.log('📊 Données brutes du shopper:', {
      gender_id: rawData.gender_id,
      size_cm: rawData.size_cm,
      weight_kg: rawData.weight_kg,
      regular_pants_size_id: rawData.regular_pants_size_id,
      regular_top_size_id: rawData.regular_top_size_id,
      avatar_path: rawData.avatar_path,
    });

    // Mapper les données si demandé
    if (mapData) {
      const mappedData = mapShopperDataFromDB(rawData);
      logger.log('✅ Données mappées du shopper:', {
        gender: mappedData.gender,
        height: mappedData.height,
        weight: mappedData.weight,
        sizeBottom: mappedData.sizeBottom,
        sizeTop: mappedData.sizeTop,
        avatar_path: mappedData.avatar_path,
      });
      return mappedData;
    }

    return rawData;
  } catch (error) {
    logger.error('Erreur lors de la récupération du shopper:', error);
    throw error;
  }
};

/**
 * Crée un nouveau shopper dans la base de données
 * Accepte les données au format application ou au format DB
 * @param {Object} shopperData - Les données du shopper à créer
 * @param {string} shopperData.firebase_id - UID Firebase (requis)
 * @param {string} shopperData.nickname - Pseudo (requis)
 * @param {string} shopperData.first_name - Prénom (requis)
 * @param {string} shopperData.number_phone - Numéro de téléphone (requis)
 * @param {string} shopperData.email - Email (requis)
 *
 * Format application (sera mappé automatiquement):
 * @param {string} shopperData.gender - Genre ('homme', 'femme', etc.)
 * @param {number} shopperData.height - Taille en cm
 * @param {number} shopperData.weight - Poids en kg
 * @param {string} shopperData.sizeTop - Taille haut ('S', 'M', 'L', etc.)
 * @param {string} shopperData.sizeBottom - Taille pantalon ('S', 'M', 'L', etc.)
 *
 * OU format DB (envoyé directement):
 * @param {number} shopperData.gender_id - ID du genre
 * @param {number} shopperData.size_cm - Taille en cm
 * @param {number} shopperData.weight_kg - Poids en kg
 * @param {number} shopperData.regular_top_size_id - ID taille haut
 * @param {number} shopperData.regular_pants_size_id - ID taille pantalon
 *
 * @param {string} shopperData.selfie_path - Chemin du selfie (optionnel)
 * @param {boolean} autoMap - Si true, mappe les données app vers DB (défaut: true)
 * @returns {Promise<Object>} - Les données du shopper créé
 */
export const createShopper = async (shopperData, autoMap = true) => {
  try {
    let dataToSend = shopperData;

    // Si autoMap est activé et les données sont au format application
    if (autoMap && shopperData.gender && !shopperData.gender_id) {
      logger.log('🔄 Mapping des données app vers DB...');
      const mappedData = mapUserDataToDB(shopperData);
      dataToSend = {
        ...shopperData, // Garder les champs non mappés (firebase_id, nickname, etc.)
        ...mappedData,  // Remplacer par les champs mappés
      };
      logger.log('✅ Données mappées pour création:', {
        gender_id: dataToSend.gender_id,
        size_cm: dataToSend.size_cm,
        weight_kg: dataToSend.weight_kg,
        regular_top_size_id: dataToSend.regular_top_size_id,
        regular_pants_size_id: dataToSend.regular_pants_size_id,
      });
    }

    const url = `${API_MOBILE_CONFIG.BASE_URL}/api/shoppers`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // DRF retourne directement l'objet créé
    return data;
  } catch (error) {
    logger.error('Erreur lors de la création du shopper:', error);
    throw error;
  }
};

/**
 * Génère une URL signée pour accéder à un fichier dans GCS
 * @param {string} gcsUrl - URL complète GCS (ex: https://storage.googleapis.com/bucket/wardrobe/user_xxx/styles/xxx/file.png)
 * @returns {Promise<string>} - URL signée avec headers CORS appropriés
 */
export const generateSignedUrl = async (gcsUrl) => {
  try {
    if (!gcsUrl) {
      throw new Error('URL GCS requise');
    }

    if (!SIGNED_URL_SERVICE_CONFIG.BASE_URL) {
      logger.warn('⚠️ Service d\'URL signée non configuré, utilisation de l\'URL directe');
      return gcsUrl;
    }

    // Parser l'URL GCS pour extraire bucket, blob et user_id
    // Format: https://storage.googleapis.com/bucket-name/wardrobe/user_xxx/styles/xxx/file.ext
    const urlParts = gcsUrl.replace('https://storage.googleapis.com/', '').split('/');
    const bucket = urlParts[0];
    const blob = urlParts.slice(1).join('/');

    // Extraire le user_id du chemin (format: wardrobe/user_xxx/...)
    let userId = null;
    const userIdMatch = blob.match(/user_([a-f0-9-]+)/);
    if (userIdMatch) {
      userId = userIdMatch[1];
    }

    logger.log('📝 Génération d\'URL signée pour:', { bucket, blob, user_id: userId });

    const requestBody = {
      bucket,
      blob,
      action: 'read',
    };

    // Ajouter le user_id s'il a été trouvé
    if (userId) {
      requestBody.user_id = userId;
    }

    const response = await fetch(`${SIGNED_URL_SERVICE_CONFIG.BASE_URL}/generate-signed-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur lors de la génération de l'URL signée: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logger.log('✅ URL signée générée');

    return data.url;
  } catch (error) {
    logger.error('❌ Erreur lors de la génération de l\'URL signée:', error);
    // Fallback: retourner l'URL originale
    return gcsUrl;
  }
};

/**
 * Convertit une image URL en base64 en utilisant une URL signée si nécessaire
 * @param {string} imageUrl - L'URL de l'image (peut être une URL GCS)
 * @returns {Promise<string>} - L'image en base64
 */
export const convertImageUrlToBase64 = async (imageUrl) => {
  try {
    if (!imageUrl) {
      throw new Error('URL de l\'image est requise');
    }

    // Si c'est une URL GCS, générer une URL signée d'abord
    let finalUrl = imageUrl;
    if (imageUrl.includes('storage.googleapis.com')) {
      finalUrl = await generateSignedUrl(imageUrl);
    }

    // Fetch l'image
    const response = await fetch(finalUrl);

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
    logger.error('Erreur lors de la conversion de l\'image en base64:', error);
    throw error;
  }
};
