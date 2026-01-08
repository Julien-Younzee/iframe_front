import { initializeApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { FIREBASE_CONFIG } from '../config/config';

// Initialiser Firebase
let app;
let auth;

try {
  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);

  setPersistence(auth, browserLocalPersistence);
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Firebase:', error);
}

/**
 * Configure le reCAPTCHA invisible pour la vérification du téléphone
 * @param {string} containerId - ID du conteneur pour le reCAPTCHA
 * @returns {RecaptchaVerifier}
 */
export const setupRecaptcha = (containerId = 'recaptcha-container') => {
  if (!auth) {
    throw new Error('Firebase Auth n\'est pas initialisé');
  }

  try {
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'normal',
      callback: (response) => {
        console.log('reCAPTCHA résolu', response);
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expiré, rechargez la page');
      },
    });

    return recaptchaVerifier;
  } catch (error) {
    console.error('Erreur lors de la configuration du reCAPTCHA:', error);
    throw error;
  }
};

/**
 * Envoie un code de vérification au numéro de téléphone
 * @param {string} phoneNumber - Numéro de téléphone au format international (ex: +33612345678)
 * @param {RecaptchaVerifier} recaptchaVerifier - Instance du reCAPTCHA
 * @returns {Promise<ConfirmationResult>}
 */
export const sendVerificationCode = async (phoneNumber, recaptchaVerifier) => {
  if (!auth) {
    throw new Error('Firebase Auth n\'est pas initialisé');
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );
    return confirmationResult;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du code:', error);
    throw error;
  }
};

/**
 * Vérifie le code de vérification entré par l'utilisateur
 * @param {ConfirmationResult} confirmationResult - Résultat de la confirmation
 * @param {string} code - Code de vérification à 6 chiffres
 * @returns {Promise<UserCredential>}
 */
export const verifyCode = async (confirmationResult, code) => {
  try {
    const result = await confirmationResult.confirm(code);
    return result;
  } catch (error) {
    console.error('Erreur lors de la vérification du code:', error);
    throw error;
  }
};

/**
 * Récupère l'utilisateur actuellement connecté
 * @returns {User|null}
 */
export const getCurrentUser = () => {
  return auth?.currentUser || null;
};

/**
 * Déconnecte l'utilisateur
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  if (!auth) {
    throw new Error('Firebase Auth n\'est pas initialisé');
  }

  try {
    await auth.signOut();
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    throw error;
  }
};

/**
 * Écoute les changements d'état de l'authentification
 * @param {function} callback - Fonction appelée lors des changements d'état
 * @returns {function} Fonction pour se désabonner
 */
export const onAuthStateChanged = (callback) => {
  if (!auth) {
    throw new Error('Firebase Auth n\'est pas initialisé');
  }

  return auth.onAuthStateChanged(callback);
};

export { auth };
