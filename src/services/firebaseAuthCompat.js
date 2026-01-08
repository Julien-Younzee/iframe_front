/**
 * Service d'authentification Firebase utilisant la version Compat
 * Cette version contourne les problèmes de reCAPTCHA Enterprise
 */

import { FIREBASE_CONFIG } from '../config/config';

// Variables globales pour stocker les instances
let firebaseApp = null;
let firebaseAuth = null;

// Variable pour éviter les initialisations multiples
let initPromise = null;

/**
 * Initialise Firebase avec la version Compat
 */
const initializeFirebaseCompat = () => {
  // Si une initialisation est déjà en cours, retourner la même promesse
  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise((resolve, reject) => {
    // Si déjà initialisé, retourner l'instance existante
    if (window.firebase && firebaseApp && firebaseAuth) {
      resolve({ app: firebaseApp, auth: firebaseAuth });
      return;
    }

    // Charger les scripts Firebase Compat
    if (!window.firebase) {
      // Vérifier si les scripts ne sont pas déjà en train de se charger
      const existingScripts = document.querySelectorAll('script[src*="firebase"]');
      if (existingScripts.length > 0) {
        // Scripts déjà présents, attendre qu'ils se chargent
        const checkFirebase = setInterval(() => {
          if (window.firebase && typeof window.firebase.auth === 'function') {
            clearInterval(checkFirebase);
            initializeFirebaseApp(resolve, reject);
          }
        }, 100);

        // Timeout après 5 secondes
        setTimeout(() => {
          clearInterval(checkFirebase);
          reject(new Error('Timeout lors du chargement de Firebase'));
        }, 5000);
        return;
      }

      const script1 = document.createElement('script');
      script1.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
      script1.async = false;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js';
      script2.async = false;
      document.head.appendChild(script2);

      script2.onload = () => {
        setTimeout(() => {
          if (window.firebase && typeof window.firebase.auth === 'function') {
            initializeFirebaseApp(resolve, reject);
          } else {
            reject(new Error('Firebase Auth non disponible'));
          }
        }, 100);
      };

      script2.onerror = () => {
        initPromise = null; // Réinitialiser pour permettre une nouvelle tentative
        reject(new Error('Échec du chargement des scripts Firebase'));
      };
    } else {
      // Firebase déjà chargé
      initializeFirebaseApp(resolve, reject);
    }
  });

  return initPromise;
};

/**
 * Initialise l'application Firebase
 */
const initializeFirebaseApp = (resolve, reject) => {
  try {
    // Initialiser l'app Firebase
    if (!window.firebase.apps.length) {
      firebaseApp = window.firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      firebaseApp = window.firebase.app();
    }

    firebaseAuth = window.firebase.auth();
    firebaseAuth.languageCode = 'fr';

    // Configurer la persistance
    firebaseAuth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        console.log('✅ Firebase Compat initialisé');
        resolve({ app: firebaseApp, auth: firebaseAuth });
      })
      .catch((error) => {
        console.error('Erreur setPersistence:', error);
        initPromise = null; // Réinitialiser pour permettre une nouvelle tentative
        reject(error);
      });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Firebase:', error);
    initPromise = null;
    reject(error);
  }
};

// Variable pour stocker le verifier actuel
let currentRecaptchaVerifier = null;

/**
 * Crée un RecaptchaVerifier avec Firebase Compat
 * @param {string} containerId - ID du conteneur pour le reCAPTCHA
 * @param {boolean} invisible - Si true, utilise le mode invisible
 * @returns {Promise<Object>} Le RecaptchaVerifier
 */
export const createCompatRecaptchaVerifier = async (containerId, invisible = false) => {
  await initializeFirebaseCompat();

  if (!window.firebase || !window.firebase.auth) {
    throw new Error('Firebase Auth non initialisé');
  }

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container ${containerId} non trouvé`);
  }

  // Nettoyer le verifier précédent s'il existe
  if (currentRecaptchaVerifier) {
    try {
      currentRecaptchaVerifier.clear();
      console.log('🧹 Ancien RecaptchaVerifier nettoyé');
    } catch (error) {
      console.log('Erreur lors du nettoyage de l\'ancien verifier:', error);
    }
    currentRecaptchaVerifier = null;
  }

  // Nettoyer complètement le container et les scripts reCAPTCHA résiduels
  container.innerHTML = '';

  // Supprimer les anciens badges reCAPTCHA qui peuvent traîner
  const oldBadges = document.querySelectorAll('.grecaptcha-badge');
  oldBadges.forEach(badge => badge.remove());

  // S'assurer que le container est visible et interactif
  container.style.display = 'block';
  container.style.pointerEvents = 'auto';
  container.style.touchAction = 'auto';
  container.style.position = 'relative';
  container.style.zIndex = '10000';

  console.log('🔧 Création du RecaptchaVerifier Compat');

  // Toujours utiliser le mode normal pour éviter les problèmes de design
  const size = invisible ? 'invisible' : 'normal';
  console.log(`📱 Mode reCAPTCHA: ${size}`);

  try {
    const recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier(
      container,
      {
        size: size,
        callback: () => {
          console.log('✅ reCAPTCHA résolu');
        },
        'expired-callback': () => {
          console.log('⚠️ reCAPTCHA expiré');
        },
        'error-callback': (error) => {
          console.error('❌ Erreur reCAPTCHA:', error);
        },
      }
    );

    // Stocker le verifier actuel
    currentRecaptchaVerifier = recaptchaVerifier;

    // Forcer les styles sur l'iframe reCAPTCHA après un court délai
    setTimeout(() => {
      const iframes = container.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        iframe.style.pointerEvents = 'auto';
        iframe.style.touchAction = 'auto';

        // Essayer d'accéder au parent div aussi
        if (iframe.parentElement) {
          iframe.parentElement.style.pointerEvents = 'auto';
          iframe.parentElement.style.touchAction = 'auto';
        }
      });
      console.log('🔧 Styles d\'interactivité appliqués aux iframes reCAPTCHA');
    }, 1000);

    return recaptchaVerifier;
  } catch (error) {
    console.error('Erreur lors de la création du RecaptchaVerifier:', error);
    currentRecaptchaVerifier = null;
    throw error;
  }
};

/**
 * Envoie un code de vérification SMS
 * @param {string} phoneNumber - Numéro de téléphone au format international
 * @param {Object} recaptchaVerifier - Le RecaptchaVerifier
 * @returns {Promise<Object>} ConfirmationResult
 */
export const sendVerificationCodeCompat = async (phoneNumber, recaptchaVerifier) => {
  await initializeFirebaseCompat();

  if (!firebaseAuth) {
    throw new Error('Firebase Auth non initialisé');
  }

  console.log('📱 Envoi du code de vérification à:', phoneNumber);

  try {
    const confirmationResult = await firebaseAuth.signInWithPhoneNumber(
      phoneNumber,
      recaptchaVerifier
    );

    console.log('✅ Code de vérification envoyé');
    return confirmationResult;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du code:', error);
    throw error;
  }
};

/**
 * Vérifie le code de vérification
 * @param {Object} confirmationResult - Résultat de la confirmation
 * @param {string} code - Code de vérification à 6 chiffres
 * @returns {Promise<Object>} UserCredential
 */
export const verifyCodeCompat = async (confirmationResult, code) => {
  try {
    const result = await confirmationResult.confirm(code);
    console.log('✅ Code vérifié avec succès');
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du code:', error);
    throw error;
  }
};

/**
 * Récupère l'utilisateur actuellement connecté
 * @returns {Object|null}
 */
export const getCurrentUserCompat = () => {
  return firebaseAuth?.currentUser || null;
};

/**
 * Déconnecte l'utilisateur
 * @returns {Promise<void>}
 */
export const signOutCompat = async () => {
  if (!firebaseAuth) {
    throw new Error('Firebase Auth non initialisé');
  }

  await firebaseAuth.signOut();
  console.log('✅ Déconnexion réussie');
};

/**
 * Écoute les changements d'état de l'authentification
 * @param {Function} callback - Fonction appelée lors des changements
 * @returns {Function} Fonction pour se désabonner
 */
export const onAuthStateChangedCompat = (callback) => {
  if (!firebaseAuth) {
    initializeFirebaseCompat().then(() => {
      return firebaseAuth.onAuthStateChanged(callback);
    });
  } else {
    return firebaseAuth.onAuthStateChanged(callback);
  }
};
