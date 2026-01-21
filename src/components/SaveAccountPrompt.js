import { useState, useEffect } from 'react';
import {
  setupRecaptcha,
  sendVerificationCode,
  verifyCode,
} from '../services/firebaseAuth';
import './SaveAccountPrompt.css';
import logger from '../services/logger';

// Liens des applications mobiles - À remplacer par les vrais liens
const APP_STORE_URL = 'https://apps.apple.com/app/younzee/6755129372';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.anonymous.Younzeeappp';

function SaveAccountPrompt({ userData, onSave }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+33');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('prompt'); // 'prompt', 'phone', 'code', 'success'
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Nettoyer le conteneur reCAPTCHA au montage
    const container = document.getElementById('recaptcha-container-save');
    if (container) {
      container.innerHTML = '';
    }
  }, []);

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      if (cleaned.length <= 2) return cleaned;
      if (cleaned.length <= 4)
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
      if (cleaned.length <= 6)
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`;
      if (cleaned.length <= 8)
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
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
      let cleanedPhone = phoneNumber.replace(/\s/g, '');

      if (cleanedPhone.length !== 10) {
        throw new Error('Veuillez entrer un numéro valide à 10 chiffres');
      }

      // Retirer le 0 initial pour le format international (règle générale)
      if (cleanedPhone.startsWith('0')) {
        cleanedPhone = cleanedPhone.substring(1);
      }

      const fullPhoneNumber = `${countryCode}${cleanedPhone}`;

      logger.log('📞 Numéro formaté pour Firebase (save account):', fullPhoneNumber);

      const recaptchaVerifier = setupRecaptcha('recaptcha-container-save', true);
      const result = await sendVerificationCode(fullPhoneNumber, recaptchaVerifier);

      setConfirmationResult(result);
      setStep('code');
    } catch (err) {
      logger.error('Erreur lors de l\'envoi du code:', err);
      setError(
        err.message || 'Erreur lors de l\'envoi du code. Veuillez réessayer.'
      );
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

      const result = await verifyCode(confirmationResult, verificationCode);

      // Authentification réussie - sauvegarder les données
      onSave({ user: result.user, userData });
      setStep('success');
    } catch (err) {
      logger.error('Erreur lors de la vérification:', err);
      setError(
        err.message === 'Firebase: Error (auth/invalid-verification-code).'
          ? 'Code invalide. Veuillez réessayer.'
          : 'Erreur lors de la vérification. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="save-account-prompt">
        <div className="success-content">
          <div className="success-icon">✓</div>
          <h3>Compte créé avec succès !</h3>
          <p>
            Vos données ont été sauvegardées. Vous pourrez les retrouver lors de votre prochaine visite.
          </p>

          <div className="app-download-section">
            <p className="app-download-title">Téléchargez l'application Younzee</p>
            <div className="store-buttons">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="store-button"
              >
                <svg className="store-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span>App Store</span>
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="store-button"
              >
                <svg className="store-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <span>Play Store</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'phone') {
    return (
      <div className="save-account-prompt">
        <h3>Créer mon compte Younzee</h3>
        <p className="prompt-description">
          Entrez votre numéro de téléphone pour sauvegarder vos préférences et votre jumeau numérique.
        </p>

        <form onSubmit={handleSendCode} className="save-form">
          <div className="form-group">
            <label htmlFor="save-phone" className="form-label">
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
                id="save-phone"
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

          <div className="prompt-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || phoneNumber.replace(/\s/g, '').length !== 10}
            >
              {loading ? 'Envoi...' : 'Créer mon compte'}
            </button>
          </div>
        </form>

        <div id="recaptcha-container-save"></div>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <div className="save-account-prompt">
        <h3>Vérification</h3>
        <p className="prompt-description">
          Un code de vérification a été envoyé au{' '}
          <strong>
            {countryCode} {phoneNumber}
          </strong>
        </p>

        <form onSubmit={handleVerifyCode} className="save-form">
          <div className="form-group">
            <label htmlFor="save-code" className="form-label">
              Code de vérification
            </label>
            <input
              id="save-code"
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
              autoComplete="one-time-code"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="prompt-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Vérification...' : 'Valider'}
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Modifier
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Étape 'prompt' par défaut
  return (
    <div className="save-account-prompt">
      <h3>Sauvegarder mes données ?</h3>
      <p className="prompt-description">
        Créez un compte Younzee pour retrouver votre jumeau numérique et vos préférences lors de votre prochaine visite ainsi que dans l'application mobile.
      </p>

      <div className="benefits-list">
        <div className="benefit-item">
          <span className="benefit-icon">⚡</span>
          <span>Recommandation de taille et Essayage instantané la prochaine fois</span>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">👤</span>
          <span>Sauvegarde de votre jumeau numérique</span>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">👔</span>
          <span>Garde-robe Digitale et Personal Shopper privé</span>
        </div>
      </div>

      <div className="prompt-actions">
        <button onClick={() => setStep('phone')} className="btn btn-primary">
          Créer mon compte
        </button>
      </div>
    </div>
  );
}

export default SaveAccountPrompt;
