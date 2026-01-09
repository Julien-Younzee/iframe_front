import { API_CONFIG } from '../config/config';

/**
 * Service dédié à l'intégration avec le backend VTO
 * Backend: https://iframe-vto-dev-965958056387.europe-west1.run.app
 */

/**
 * Génère l'essayage virtuel avec avatar existant (utilisateur avec compte)
 * @param {string} avatarBase64 - Avatar existant en base64
 * @param {string} vetementBase64 - Vêtement en base64
 * @returns {Promise<Object>} - Résultat avec image base64
 */
export const generateVTOWithAvatar = async (avatarBase64, vetementBase64) => {
  try {
    if (!avatarBase64 || !vetementBase64) {
      throw new Error('Avatar et vêtement requis');
    }

    console.log('📤 Envoi requête VTO (avec avatar)...');

    const response = await fetch(
      `${API_CONFIG.BACKEND_URL}/vto/with-avatar`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_base64: avatarBase64,
          vetement_base64: vetementBase64,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ VTO généré (avec avatar)');

    return {
      success: data.success,
      imageBase64: data.image_base64,
      message: data.message,
    };
  } catch (error) {
    console.error('❌ Erreur VTO (avec avatar):', error);
    throw error;
  }
};

/**
 * Génère l'avatar et le VTO pour un nouvel utilisateur (sans compte)
 * @param {Object} params - Paramètres
 * @param {string} params.selfieBase64 - Selfie en base64
 * @param {string} params.vetementBase64 - Vêtement en base64
 * @param {string} params.gender - Sexe (homme/femme)
 * @param {number} params.height - Taille en cm
 * @param {number} params.weight - Poids en kg
 * @param {string} params.sizeTop - Taille haut
 * @param {string} params.sizeBottom - Taille bas
 * @returns {Promise<Object>} - Résultat avec image base64
 */
export const generateVTOWithSelfie = async ({
  selfieBase64,
  vetementBase64,
  gender,
  height,
  weight,
  sizeTop,
  sizeBottom,
}) => {
  try {
    if (!selfieBase64 || !vetementBase64) {
      throw new Error('Selfie et vêtement requis');
    }

    console.log('📤 Envoi requête VTO (avec selfie)...');

    const response = await fetch(
      `${API_CONFIG.BACKEND_URL}/vto/with-selfie`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selfie_base64: selfieBase64,
          vetement_base64: vetementBase64,
          sexe: gender,
          taille_cm: parseInt(height),
          poids_kg: parseInt(weight),
          taille_haut: sizeTop,
          taille_bas: sizeBottom,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ VTO généré (avec selfie)');

    return {
      success: data.success,
      imageBase64: data.image_base64,
      message: data.message,
    };
  } catch (error) {
    console.error('❌ Erreur VTO (avec selfie):', error);
    throw error;
  }
};

/**
 * Fonction unifiée pour générer le VTO (choisit automatiquement le bon endpoint)
 * @param {Object} params - Paramètres de l'essayage
 * @param {string} params.selfieBase64 - Image du selfie/avatar en base64
 * @param {string} params.clothingBase64 - Image du vêtement en base64
 * @param {string} params.gender - Sexe (homme/femme)
 * @param {number} params.height - Taille en cm
 * @param {number} params.weight - Poids en kg
 * @param {string} params.sizeTop - Taille haut
 * @param {string} params.sizeBottom - Taille bas
 * @param {boolean} params.isExistingAvatar - True si c'est un avatar existant
 * @returns {Promise<Object>} - Résultat avec image base64 et recommandations
 */
export const generateVirtualTryOn = async ({
  selfieBase64,
  clothingBase64,
  gender,
  height,
  weight,
  sizeTop,
  sizeBottom,
  isExistingAvatar = false,
}) => {
  try {
    let result;

    // Choisir le bon endpoint selon le contexte
    if (isExistingAvatar) {
      // Utilisateur avec avatar existant
      result = await generateVTOWithAvatar(selfieBase64, clothingBase64);
    } else {
      // Nouvel utilisateur avec selfie
      result = await generateVTOWithSelfie({
        selfieBase64,
        vetementBase64: clothingBase64,
        gender,
        height,
        weight,
        sizeTop,
        sizeBottom,
      });
    }

    // Le backend ne retourne pas de recommandations de taille pour l'instant
    // On génère des recommandations factices basées sur la taille fournie
    const sizeRecommendations = generateMockSizeRecommendations(sizeTop);

    return {
      imageBase64: result.imageBase64,
      sizeRecommendations,
      message: result.message,
    };
  } catch (error) {
    console.error('❌ Erreur lors de la génération VTO:', error);
    throw error;
  }
};

/**
 * Vérifie si le service VTO est disponible (health check)
 * @returns {Promise<boolean>}
 */
export const checkVTOServiceHealth = async () => {
  try {
    const response = await fetch(
      `${API_CONFIG.BACKEND_URL}/health`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Service VTO non disponible:', error);
    return false;
  }
};

/**
 * Génère des recommandations de taille factices (pour développement/fallback)
 * @param {string} sizeTop - Taille de base
 * @returns {Object} - Recommandations factices
 */
export const generateMockSizeRecommendations = (sizeTop = 'M') => {
  const sizeMap = {
    XS: { fit: 'XS', ideal: 'S', oversize: 'M' },
    S: { fit: 'S', ideal: 'M', oversize: 'L' },
    M: { fit: 'M', ideal: 'L', oversize: 'XL' },
    L: { fit: 'L', ideal: 'XL', oversize: 'XXL' },
    XL: { fit: 'XL', ideal: 'XXL', oversize: 'XXXL' },
  };

  const sizes = sizeMap[sizeTop] || sizeMap.M;

  return {
    fit: {
      size: sizes.fit,
      type: 'fit',
      label: 'Ajustée',
      description:
        'Coupe ajustée qui épouse les formes du corps pour un style près du corps et mais risque d\'être trop petit.',
    },
    ideal: {
      size: sizes.ideal,
      type: 'ideal',
      label: 'Idéale',
      description:
        'Taille idéale offrant un équilibre parfait entre confort et style. Recommandée pour la plupart des situations.',
    },
    oversize: {
      size: sizes.oversize,
      type: 'oversize',
      label: 'Ample',
      description:
        'Coupe ample et décontractée pour un style streetwear et un maximum de confort.',
    },
  };
};
