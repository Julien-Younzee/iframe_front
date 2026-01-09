import { useState, useEffect, useRef } from 'react';
import {
  createCompatRecaptchaVerifier,
  sendVerificationCodeCompat,
  verifyCodeCompat,
} from '../services/firebaseAuthCompat';
import './PhoneAuthSlide.css';

function PhoneAuthSlide({ onNext, onSkip }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+33');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' ou 'code'
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  // Utiliser useRef pour que le container ne soit jamais recréé par React
  const recaptchaContainerRef = useRef(null);

  useEffect(() => {
    let verifier = null;

    // Nettoyer le conteneur reCAPTCHA au montage
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }

    // Initialiser le RecaptchaVerifier avec Firebase Compat en mode INVISIBLE
    // pour éviter le test visuel qui cause l'erreur "Cannot read properties of null"
    const initRecaptcha = async () => {
      try {
        verifier = await createCompatRecaptchaVerifier('recaptcha-container', true);
        setRecaptchaVerifier(verifier);
        console.log('✅ RecaptchaVerifier Compat initialisé (mode invisible)');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du reCAPTCHA:', error);
        setError('Erreur lors de l\'initialisation. Veuillez recharger la page.');
      }
    };

    initRecaptcha();

    // Nettoyer le verifier au démontage
    return () => {
      if (verifier) {
        try {
          verifier.clear();
        } catch (error) {
          console.error('Erreur lors du nettoyage du reCAPTCHA:', error);
        }
      }
    };
  }, []);

  const formatPhoneNumber = (value) => {
    // Supprimer tous les caractères non numériques
    const cleaned = value.replace(/\D/g, '');

    // Limiter à 10 chiffres pour la France
    if (cleaned.length <= 10) {
      // Formater en 06 12 34 56 78
      if (cleaned.length <= 2) return cleaned;
      if (cleaned.length <= 4) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
      if (cleaned.length <= 6) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`;
      if (cleaned.length <= 8) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    }
    return value;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError('');
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Vérifier que le recaptchaVerifier est initialisé
      if (!recaptchaVerifier) {
        throw new Error('Le reCAPTCHA n\'est pas encore initialisé. Veuillez patienter.');
      }

      // Nettoyer le numéro
      let cleanedPhone = phoneNumber.replace(/\s/g, '');

      // Validation basique
      if (cleanedPhone.length !== 10) {
        throw new Error('Veuillez entrer un numéro valide à 10 chiffres');
      }

      // Retirer le 0 initial pour le format international (règle générale)
      // Quand on ajoute un indicatif pays, le 0 du début (préfixe national) doit être retiré
      if (cleanedPhone.startsWith('0')) {
        cleanedPhone = cleanedPhone.substring(1);
      }

      const fullPhoneNumber = `${countryCode}${cleanedPhone}`;

      console.log('📞 Numéro formaté pour Firebase:', fullPhoneNumber);

      // Envoyer le code de vérification avec le verifier existant
      const result = await sendVerificationCodeCompat(
        fullPhoneNumber,
        recaptchaVerifier
      );

      setConfirmationResult(result);

      // Cacher le reCAPTCHA avec une classe CSS (ne touche pas au DOM)
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        recaptchaContainer.classList.add('hidden');
      }

      // Passer à l'étape du code
      setStep('code');
    } catch (err) {
      console.error('Erreur lors de l\'envoi du code:', err);

      // Nettoyer et réinitialiser le reCAPTCHA en cas d'erreur
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (clearError) {
          console.log('Erreur nettoyage reCAPTCHA:', clearError);
        }
      }

      // Messages d'erreur personnalisés
      let errorMessage = 'Erreur lors de l\'envoi du code. Veuillez réessayer.';

      if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques minutes ou utiliser un autre numéro.';
      } else if (err.code === 'auth/invalid-phone-number') {
        errorMessage = 'Numéro de téléphone invalide.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!confirmationResult) {
        throw new Error('Aucune confirmation en attente');
      }

      if (verificationCode.length !== 6) {
        throw new Error('Le code doit contenir 6 chiffres');
      }

      // Vérifier le code
      const result = await verifyCodeCompat(confirmationResult, verificationCode);

      // Authentification réussie
      onNext({ user: result.user });
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      setError(
        err.message === 'Firebase: Error (auth/invalid-verification-code).'
          ? 'Code invalide. Veuillez réessayer.'
          : 'Erreur lors de la vérification. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = async () => {
    setStep('phone');
    setVerificationCode('');
    setError('');
    setConfirmationResult(null);

    // Attendre la fin de l'animation de slide (300ms) avant de toucher au reCAPTCHA
    await new Promise(resolve => setTimeout(resolve, 400));

    // Réafficher le reCAPTCHA en retirant la classe hidden
    // NE PAS toucher au innerHTML pour éviter que reCAPTCHA perde ses références DOM
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (recaptchaContainer) {
      recaptchaContainer.classList.remove('hidden');
      // Ne pas nettoyer le DOM, juste repositionner le container
    }

    // Le RecaptchaVerifier existant devrait toujours fonctionner
    // On ne le recrée pas pour éviter les conflits
    console.log('✅ RecaptchaVerifier réaffiché');
  };

  return (
    <div className="slide">
      <div className="slide-content">
        {step === 'phone' ? (
          <>
            <div className="info-box">
              <p className="info-text">
                <strong>Avez-vous déjà un compte Younzee ?</strong>
              </p>
              <p className="info-text">
                Si vous avez déjà utilisé Younzee, connectez-vous pour récupérer votre jumeau numérique et vos préférences.
              </p>
            </div>

            <form onSubmit={handleSendCode} className="auth-form">
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Numéro de téléphone
                </label>
                <div className="phone-input-group">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="country-select"
                  >
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+32">🇧🇪 +32</option>
                    <option value="+41">🇨🇭 +41</option>
                    <option value="+1">🇺🇸 +1</option>
                  </select>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="06 12 34 56 78"
                    className="form-input phone-input"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {error && <p className="error-message">{error}</p>}

              <div className="navigation-buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || phoneNumber.replace(/\s/g, '').length !== 10}
                >
                  {loading ? 'Envoi...' : 'Se connecter'}
                </button>
              </div>

              <div className="skip-section">
                <button
                  type="button"
                  className="btn btn-text"
                  onClick={onSkip}
                  disabled={loading}
                >
                  Continuer sans compte
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className="info-text">
              Un code de vérification a été envoyé au{' '}
              <strong>
                {countryCode} {phoneNumber}
              </strong>
            </p>

            <form onSubmit={handleVerifyCode} className="auth-form">
              <div className="form-group">
                <label htmlFor="code" className="form-label">
                  Code de vérification
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="123456"
                  className="form-input code-input"
                  required
                  autoComplete="one-time-code"
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <div className="navigation-buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? 'Vérification...' : 'Valider'}
                </button>
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Modifier le numéro
                </button>
              </div>
            </form>
          </>
        )}

        {/* Conteneur pour reCAPTCHA invisible */}
        <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
      </div>
    </div>
  );
}

export default PhoneAuthSlide;
