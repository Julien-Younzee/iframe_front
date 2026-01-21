import { API_CONFIG } from '../config/config';
import logger from './logger';

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

    logger.log('📤 Envoi requête VTO (avec avatar)...');

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
    logger.log('✅ VTO généré (avec avatar)');

    return {
      success: data.success,
      imageBase64: data.image_base64,
      message: data.message,
    };
  } catch (error) {
    logger.error('❌ Erreur VTO (avec avatar):', error);
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

    logger.log('📤 Envoi requête VTO (avec selfie)...');

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
    logger.log('✅ VTO généré (avec selfie)');

    return {
      success: data.success,
      imageBase64: data.image_base64,
      message: data.message,
    };
  } catch (error) {
    logger.error('❌ Erreur VTO (avec selfie):', error);
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
    logger.error('❌ Erreur lors de la génération VTO:', error);
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
    logger.error('Service VTO non disponible:', error);
    return false;
  }
};

/**
 * Génère des recommandations de taille intelligentes basées sur le profil complet
 * @param {Object} userData - Données utilisateur complètes
 * @param {string} userData.gender - Genre ('homme' ou 'femme')
 * @param {number} userData.height - Taille en cm
 * @param {number} userData.weight - Poids en kg
 * @param {string} userData.sizeTop - Taille actuelle haut
 * @param {string} userData.sizeBottom - Taille actuelle bas
 * @returns {Object} - Recommandations personnalisées
 */
export const generateSmartMockRecommendations = (userData) => {
  // Tailles disponibles dans la DB (aligné avec dataMapping.js)
  const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'];

  // Extraction et validation des données
  const {
    gender = 'homme',
    height = 175,
    weight = 70,
    sizeTop = 'M',
    sizeBottom = 'M',
  } = userData || {};

  // 1. Calculer l'IMC (Indice de Masse Corporelle)
  const heightM = height / 100;
  const imc = weight / (heightM * heightM);

  // 2. Déterminer la morphologie selon l'IMC
  let morphology = 'standard';
  let morphologyLabel = 'Standard';

  // Vérifier si l'IMC est valide (pas NaN, Infinity, ou valeur invalide)
  if (!isNaN(imc) && isFinite(imc) && imc > 0) {
    if (imc < 18.5) {
      morphology = 'slim';
      morphologyLabel = 'Mince';
    } else if (imc >= 18.5 && imc < 25) {
      morphology = 'standard';
      morphologyLabel = 'Standard';
    } else if (imc >= 25 && imc < 30) {
      morphology = 'athletic';
      morphologyLabel = 'Athlétique';
    } else {
      morphology = 'plus';
      morphologyLabel = 'Corpulent';
    }
  } else {
    // Si IMC invalide (données manquantes), utiliser morphologie standard par défaut
    logger.warn('⚠️ IMC invalide (données de taille/poids manquantes), utilisation de morphologie standard');
    morphology = 'standard';
    morphologyLabel = 'Standard (données manquantes)';
  }

  // 3. Index de la taille actuelle
  const sizeIndex = SIZES.indexOf(sizeTop);
  const validSizeIndex = sizeIndex >= 0 ? sizeIndex : SIZES.indexOf('M');

  // 4. Calcul des offsets selon la morphologie
  let fitOffset = 0;
  let idealOffset = 1;
  let oversizeOffset = 2;

  switch (morphology) {
    case 'slim':
      // Personnes minces : ajusté peut être plus petit
      fitOffset = -1;
      idealOffset = 0;
      oversizeOffset = 1;
      break;
    case 'standard':
      // Morphologie standard : logique classique
      fitOffset = 0;
      idealOffset = 1;
      oversizeOffset = 2;
      break;
    case 'athletic':
      // Personnes athlétiques : besoin de plus d'espace
      fitOffset = 0;
      idealOffset = 1;
      oversizeOffset = 3;
      break;
    case 'plus':
      // Personnes corpulentes : recommandations plus larges
      fitOffset = 1;
      idealOffset = 2;
      oversizeOffset = 3;
      break;
    default:
      fitOffset = 0;
      idealOffset = 1;
      oversizeOffset = 2;
  }

  // 5. Ajustement selon les différences haut/bas
  const sizeBottomIndex = SIZES.indexOf(sizeBottom);
  if (sizeBottomIndex >= 0 && sizeTop !== sizeBottom) {
    const diff = Math.abs(sizeBottomIndex - validSizeIndex);
    if (diff > 1) {
      // Silhouette non proportionnée : recommandation plus conservative
      idealOffset = Math.min(idealOffset + 1, SIZES.length - validSizeIndex - 1);
    }
  }

  // 6. Ajustement selon le genre (légère différence)
  const genderAdjustment = gender === 'femme' ? 0 : 0; // Pour l'instant neutre, peut être ajusté

  // 7. Calcul des tailles recommandées avec bornes
  const calculateSize = (offset) => {
    const index = validSizeIndex + offset + genderAdjustment;
    return SIZES[Math.max(0, Math.min(index, SIZES.length - 1))];
  };

  const fitSize = calculateSize(fitOffset);
  const idealSize = calculateSize(idealOffset);
  const oversizeSize = calculateSize(oversizeOffset);

  // 8. Génération des descriptions personnalisées
  const fitDescription = morphology === 'slim'
    ? 'Coupe près du corps qui valorise votre silhouette élancée'
    : morphology === 'plus'
    ? 'Coupe confortable qui épouse vos formes avec style'
    : 'Coupe ajustée pour un style près du corps';

  const idealDescription = `Notre recommandation pour votre profil. Équilibre parfait entre confort et style.`;

  const oversizeDescription = morphology === 'athletic'
    ? 'Style ample et décontracté, parfait pour un look streetwear sportif'
    : 'Coupe oversize tendance pour un maximum de confort';

  // 9. Retour de l'objet de recommandations
  return {
    fit: {
      size: fitSize,
      type: 'fit',
      label: 'Ajustée',
      description: fitDescription,
    },
    ideal: {
      size: idealSize,
      type: 'ideal',
      label: 'Idéale',
      description: idealDescription,
    },
    oversize: {
      size: oversizeSize,
      type: 'oversize',
      label: 'Ample',
      description: oversizeDescription,
    },
    // Métadonnées pour debug/analytics
    metadata: {
      imc: parseFloat(imc.toFixed(1)),
      morphology: morphology,
      morphologyLabel: morphologyLabel,
      originalSize: sizeTop,
      hasProportionDifference: sizeTop !== sizeBottom,
    },
  };
};

/**
 * Génère des recommandations de taille factices (pour développement/fallback)
 * Version simplifiée - utilise désormais generateSmartMockRecommendations
 * @param {string|Object} sizeTopOrUserData - Soit la taille de base (string), soit userData complet (object)
 * @returns {Object} - Recommandations factices
 */
export const generateMockSizeRecommendations = (sizeTopOrUserData = 'M') => {
  // Rétrocompatibilité : accepte soit une string, soit un objet userData
  let userData;

  if (typeof sizeTopOrUserData === 'string') {
    // Ancien format : juste la taille
    userData = {
      sizeTop: sizeTopOrUserData,
      gender: 'homme',
      height: 175,
      weight: 70,
      sizeBottom: sizeTopOrUserData,
    };
  } else {
    // Nouveau format : objet userData complet
    userData = sizeTopOrUserData;
  }

  return generateSmartMockRecommendations(userData);
};
