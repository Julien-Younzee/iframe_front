/**
 * Fichier de mapping des IDs de la base de données vers les valeurs utilisables
 * Ces mappings correspondent aux tables de référence PostgreSQL
 */

/**
 * Mapping des IDs de genre vers les valeurs textuelles
 * Table PostgreSQL: genders
 * @type {Object.<number, string>}
 */
export const GENDER_MAPPING = {
  1: 'homme',
  2: 'femme',
};

/**
 * Mapping des IDs de taille de pantalon vers les valeurs textuelles
 * Table PostgreSQL: regular_pants_sizes
 * Note: La DB contient des tailles jusqu'à 6XL (ID 11), mais l'app utilise actuellement jusqu'à 3XL
 * @type {Object.<number, string>}
 */
export const PANTS_SIZE_MAPPING = {
  1: 'XXS',   // 2XS dans la DB → XXS dans l'app
  2: 'XS',
  3: 'S',
  4: 'M',
  5: 'L',
  6: 'XL',
  7: 'XXL',   // 2XL dans la DB → XXL dans l'app
  8: '3XL',
  9: '4XL',   // Tailles supplémentaires disponibles dans la DB
  10: '5XL',
  11: '6XL',
};

/**
 * Mapping des IDs de taille de haut vers les valeurs textuelles
 * Table PostgreSQL: regular_top_sizes
 * Note: Même mapping que PANTS_SIZE_MAPPING (tables identiques dans la DB)
 * @type {Object.<number, string>}
 */
export const TOP_SIZE_MAPPING = {
  1: 'XXS',   // 2XS dans la DB → XXS dans l'app
  2: 'XS',
  3: 'S',
  4: 'M',
  5: 'L',
  6: 'XL',
  7: 'XXL',   // 2XL dans la DB → XXL dans l'app
  8: '3XL',
  9: '4XL',   // Tailles supplémentaires disponibles dans la DB
  10: '5XL',
  11: '6XL',
};

/**
 * Mapping inverse: des valeurs textuelles vers les IDs de genre
 * Utilisé pour créer/mettre à jour des shoppers
 * @type {Object.<string, number>}
 */
export const REVERSE_GENDER_MAPPING = {
  'homme': 1,
  'femme': 2,
};

/**
 * Mapping inverse: des valeurs textuelles vers les IDs de taille de pantalon
 * @type {Object.<string, number>}
 */
export const REVERSE_PANTS_SIZE_MAPPING = {
  'XXS': 1,
  'XS': 2,
  'S': 3,
  'M': 4,
  'L': 5,
  'XL': 6,
  'XXL': 7,
  '3XL': 8,
  '4XL': 9,
  '5XL': 10,
  '6XL': 11,
};

/**
 * Mapping inverse: des valeurs textuelles vers les IDs de taille de haut
 * @type {Object.<string, number>}
 */
export const REVERSE_TOP_SIZE_MAPPING = {
  'XXS': 1,
  'XS': 2,
  'S': 3,
  'M': 4,
  'L': 5,
  'XL': 6,
  'XXL': 7,
  '3XL': 8,
  '4XL': 9,
  '5XL': 10,
  '6XL': 11,
};

/**
 * Convertit les données brutes de la DB vers le format utilisé dans l'application
 * @param {Object} shopperData - Données brutes du shopper depuis la DB
 * @param {number} shopperData.gender_id - ID du genre
 * @param {number} shopperData.size_cm - Taille en cm
 * @param {number} shopperData.weight_kg - Poids en kg
 * @param {number} shopperData.regular_pants_size_id - ID de la taille de pantalon
 * @param {number} shopperData.regular_top_size_id - ID de la taille de haut
 * @returns {Object} - Données formatées pour l'application
 */
export const mapShopperDataFromDB = (shopperData) => {
  if (!shopperData) {
    return null;
  }

  const {
    gender_id,
    size_cm,
    weight_kg,
    regular_pants_size_id,
    regular_top_size_id,
    ...otherFields
  } = shopperData;

  // Mapping des IDs vers les valeurs
  const gender = GENDER_MAPPING[gender_id] || '';
  const sizeBottom = PANTS_SIZE_MAPPING[regular_pants_size_id] || '';
  const sizeTop = TOP_SIZE_MAPPING[regular_top_size_id] || '';

  // Validation: log un warning si des mappings sont manquants
  if (gender_id && !gender) {
    console.warn(`⚠️ Gender ID ${gender_id} non trouvé dans GENDER_MAPPING`);
  }
  if (regular_pants_size_id && !sizeBottom) {
    console.warn(`⚠️ Pants size ID ${regular_pants_size_id} non trouvé dans PANTS_SIZE_MAPPING`);
  }
  if (regular_top_size_id && !sizeTop) {
    console.warn(`⚠️ Top size ID ${regular_top_size_id} non trouvé dans TOP_SIZE_MAPPING`);
  }

  return {
    ...otherFields,
    // Champs utilisés par l'application
    gender: gender,
    height: size_cm || null,
    weight: weight_kg || null,
    sizeBottom: sizeBottom,
    sizeTop: sizeTop,
    // Garder aussi les IDs originaux pour référence
    _ids: {
      gender_id,
      regular_pants_size_id,
      regular_top_size_id,
    },
  };
};

/**
 * Convertit les données de l'application vers le format de la DB
 * Utilisé lors de la création/mise à jour d'un shopper
 * @param {Object} userData - Données formatées de l'application
 * @param {string} userData.gender - Genre ('homme', 'femme', etc.)
 * @param {number} userData.height - Taille en cm
 * @param {number} userData.weight - Poids en kg
 * @param {string} userData.sizeBottom - Taille pantalon ('S', 'M', 'L', etc.)
 * @param {string} userData.sizeTop - Taille haut ('S', 'M', 'L', etc.)
 * @returns {Object} - Données formatées pour la DB
 */
export const mapUserDataToDB = (userData) => {
  if (!userData) {
    return null;
  }

  const {
    gender,
    height,
    weight,
    sizeBottom,
    sizeTop,
    ...otherFields
  } = userData;

  // Mapping des valeurs vers les IDs
  const gender_id = REVERSE_GENDER_MAPPING[gender] || null;
  const regular_pants_size_id = REVERSE_PANTS_SIZE_MAPPING[sizeBottom] || null;
  const regular_top_size_id = REVERSE_TOP_SIZE_MAPPING[sizeTop] || null;

  // Validation: log un warning si des mappings sont manquants
  if (gender && !gender_id) {
    console.warn(`⚠️ Genre "${gender}" non trouvé dans REVERSE_GENDER_MAPPING`);
  }
  if (sizeBottom && !regular_pants_size_id) {
    console.warn(`⚠️ Taille pantalon "${sizeBottom}" non trouvée dans REVERSE_PANTS_SIZE_MAPPING`);
  }
  if (sizeTop && !regular_top_size_id) {
    console.warn(`⚠️ Taille haut "${sizeTop}" non trouvée dans REVERSE_TOP_SIZE_MAPPING`);
  }

  return {
    ...otherFields,
    // Champs pour la DB
    gender_id: gender_id,
    size_cm: height || null,
    weight_kg: weight || null,
    regular_pants_size_id: regular_pants_size_id,
    regular_top_size_id: regular_top_size_id,
  };
};

/**
 * Vérifie si tous les mappings nécessaires sont définis
 * Utile pour debug et validation au démarrage de l'app
 * @returns {Object} - Rapport de validation
 */
export const validateMappings = () => {
  const report = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Vérifier que les mappings ne sont pas vides
  if (Object.keys(GENDER_MAPPING).length === 0) {
    report.errors.push('GENDER_MAPPING est vide - à remplir avec les valeurs de la DB');
    report.valid = false;
  }

  if (Object.keys(PANTS_SIZE_MAPPING).length === 0) {
    report.errors.push('PANTS_SIZE_MAPPING est vide - à remplir avec les valeurs de la DB');
    report.valid = false;
  }

  if (Object.keys(TOP_SIZE_MAPPING).length === 0) {
    report.errors.push('TOP_SIZE_MAPPING est vide - à remplir avec les valeurs de la DB');
    report.valid = false;
  }

  // Vérifier que les mappings inverses sont cohérents
  if (Object.keys(REVERSE_GENDER_MAPPING).length === 0) {
    report.warnings.push('REVERSE_GENDER_MAPPING est vide');
  }

  if (Object.keys(REVERSE_PANTS_SIZE_MAPPING).length === 0) {
    report.warnings.push('REVERSE_PANTS_SIZE_MAPPING est vide');
  }

  if (Object.keys(REVERSE_TOP_SIZE_MAPPING).length === 0) {
    report.warnings.push('REVERSE_TOP_SIZE_MAPPING est vide');
  }

  return report;
};
