/**
 * Service pour la gestion et conversion des images
 */

import logger from './logger';

/**
 * Convertit une URL d'image en base64 via CORS proxy si nécessaire
 * @param {string} imageUrl - URL de l'image
 * @returns {Promise<string>} - Image en base64
 */
export const convertImageUrlToBase64 = async (imageUrl) => {
  try {
    if (!imageUrl) {
      throw new Error('URL de l\'image est requise');
    }

    logger.log('🖼️ Conversion de l\'image en base64:', imageUrl);

    // Tenter de charger l'image directement
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const blob = await response.blob();
      return await blobToBase64(blob);
    } catch (corsError) {
      logger.warn('⚠️ Erreur CORS, tentative avec canvas...', corsError);

      // Fallback: utiliser un canvas pour contourner CORS
      return await convertImageWithCanvas(imageUrl);
    }
  } catch (error) {
    logger.error('❌ Erreur lors de la conversion de l\'image:', error);
    throw error;
  }
};

/**
 * Convertit un Blob en base64
 * @param {Blob} blob - Le blob à convertir
 * @returns {Promise<string>} - L'image en base64
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convertit une image via canvas (contournement CORS)
 * @param {string} imageUrl - URL de l'image
 * @returns {Promise<string>} - Image en base64
 */
const convertImageWithCanvas = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(base64);
      } catch (error) {
        reject(new Error('Impossible de convertir l\'image avec canvas: ' + error.message));
      }
    };

    img.onerror = () => {
      reject(new Error('Impossible de charger l\'image'));
    };

    img.src = imageUrl;
  });
};

/**
 * Convertit un File en base64
 * @param {File} file - Le fichier à convertir
 * @returns {Promise<string>} - L'image en base64
 */
export const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Fichier requis'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Vérifie si une chaîne est une image en base64 valide
 * @param {string} str - La chaîne à vérifier
 * @returns {boolean}
 */
export const isBase64Image = (str) => {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // Vérifier le format data:image
  return /^data:image\/(png|jpg|jpeg|gif|webp);base64,/.test(str);
};

/**
 * Optimise une image base64 en la redimensionnant
 * @param {string} base64Image - Image en base64
 * @param {number} maxWidth - Largeur maximale
 * @param {number} maxHeight - Hauteur maximale
 * @param {number} quality - Qualité JPEG (0-1)
 * @returns {Promise<string>} - Image optimisée en base64
 */
export const optimizeBase64Image = (
  base64Image,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.8
) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculer les nouvelles dimensions en maintenant le ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      // Créer un canvas et redimensionner
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir en base64
      const optimizedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(optimizedBase64);
    };

    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    img.src = base64Image;
  });
};

/**
 * Extrait les métadonnées d'une image base64
 * @param {string} base64Image - Image en base64
 * @returns {Promise<Object>} - Métadonnées (width, height, format, size)
 */
export const getImageMetadata = (base64Image) => {
  return new Promise((resolve, reject) => {
    if (!isBase64Image(base64Image)) {
      reject(new Error('Format base64 invalide'));
      return;
    }

    const img = new Image();

    img.onload = () => {
      const format = base64Image.match(/data:image\/([a-z]+);base64,/)?.[1];
      const sizeInBytes = Math.round((base64Image.length * 3) / 4);

      resolve({
        width: img.width,
        height: img.height,
        format: format || 'unknown',
        sizeInBytes,
        sizeInKB: Math.round(sizeInBytes / 1024),
      });
    };

    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    img.src = base64Image;
  });
};

/**
 * Convertit plusieurs URLs d'images en base64
 * @param {string[]} imageUrls - Tableau d'URLs
 * @returns {Promise<string[]>} - Tableau d'images en base64
 */
export const convertMultipleImagesToBase64 = async (imageUrls) => {
  try {
    const conversions = imageUrls.map((url) =>
      convertImageUrlToBase64(url).catch((error) => {
        logger.error(`Erreur conversion ${url}:`, error);
        return null; // Retourner null en cas d'erreur pour ne pas bloquer les autres
      })
    );

    const results = await Promise.all(conversions);
    return results.filter((base64) => base64 !== null);
  } catch (error) {
    logger.error('Erreur lors de la conversion multiple:', error);
    throw error;
  }
};
