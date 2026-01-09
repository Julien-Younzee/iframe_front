import { useState, useEffect } from 'react';
import './App.css';
import PhoneAuthSlide from './components/PhoneAuthSlide';
import MeasurementsSlide from './components/MeasurementsSlide';
import ClothingSizesSlide from './components/ClothingSizesSlide';
import SelfieSlide from './components/SelfieSlide';
import ResultsSlideNew from './components/ResultsSlideNew';
import { clearUserCache } from './services/cacheService';
import { getShopperDetails, convertImageUrlToBase64 as convertAvatarToBase64, createShopper } from './services/shopperService';
import { convertImageUrlToBase64 as convertClothingImageToBase64 } from './services/imageService';
import logo from './assets/logo.png';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState({
    gender: '',
    height: '',
    weight: '',
    sizeTop: '',
    sizeBottom: '',
    selfieBase64: '',
    clothingItem: null,
    clothingImageBase64: '', // Image du vêtement en base64 pour VTO
    avatarUrl: '', // URL de l'avatar depuis PostgreSQL
    avatarBase64: '', // Avatar en base64 pour l'API VTO
  });

  // Détection du vêtement depuis la page parente
  useEffect(() => {
    const handleMessage = async (event) => {
      try {
        if (event.data.type === 'CLOTHING_ITEM_DATA') {
          const clothingItem = event.data.item;
          setUserData((prev) => ({ ...prev, clothingItem }));

          // Convertir l'image du vêtement en base64 si une URL est fournie
          if (clothingItem?.imageUrl) {
            console.log('🖼️ Conversion de l\'image du vêtement en base64...');
            try {
              const clothingImageBase64 = await convertClothingImageToBase64(clothingItem.imageUrl);
              setUserData((prev) => ({ ...prev, clothingImageBase64 }));
              console.log('✅ Image du vêtement convertie en base64');
            } catch (conversionError) {
              console.error('❌ Erreur conversion image vêtement:', conversionError);
            }
          }
        }

        // Message pour ouvrir la popup
        if (event.data.type === 'OPEN_YOUNZEE') {
          setIsOpen(true);
        }

        // Message pour fermer la popup
        if (event.data.type === 'CLOSE_YOUNZEE') {
          setIsOpen(false);
        }
      } catch (error) {
        console.error('Erreur lors du traitement du message:', error);
      }
    };

    // Demander les infos du vêtement à la page parente
    window.parent.postMessage({ type: 'REQUEST_CLOTHING_ITEM' }, '*');

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Ouvrir automatiquement au démarrage (pour le développement)
  useEffect(() => {
    setIsOpen(true);
  }, []);

  // Gérer la connexion - utilisateur existant
  const handlePhoneAuthComplete = async ({ user: authUser }) => {
    setIsAuthenticated(true);

    try {
      // Récupérer les données du shopper depuis PostgreSQL (avec mapping automatique)
      let avatarUrl = '';
      let avatarBase64 = '';
      let shopperData = null;

      try {
        // Passer explicitement l'utilisateur Firebase pour éviter les problèmes de timing
        // mapData=true par défaut pour obtenir les données au format application
        shopperData = await getShopperDetails(authUser, true);

        if (shopperData) {
          console.log('✅ Shopper récupéré avec données mappées:', {
            gender: shopperData.gender,
            height: shopperData.height,
            weight: shopperData.weight,
            sizeTop: shopperData.sizeTop,
            sizeBottom: shopperData.sizeBottom,
            hasAvatar: !!shopperData.avatar_path,
          });

          // Récupérer l'avatar si disponible
          if (shopperData.avatar_path) {
            avatarUrl = shopperData.avatar_path;
            console.log('Avatar récupéré depuis mirror-api:', avatarUrl);

            // Convertir l'image en base64 pour l'API VTO
            try {
              avatarBase64 = await convertAvatarToBase64(avatarUrl);
              console.log('Avatar converti en base64');
            } catch (conversionError) {
              console.warn('Impossible de convertir l\'avatar en base64:', conversionError);
            }
          }
        }
      } catch (apiError) {
        console.warn('Impossible de récupérer le shopper depuis mirror-api:', apiError);
      }

      // Si un shopper existe avec avatar et données complètes, aller directement aux résultats
      if (avatarUrl && shopperData) {
        // Utilisateur existant avec avatar et données - aller directement aux résultats
        setUserData((prev) => ({
          ...prev,
          // Données d'avatar
          avatarUrl: avatarUrl,
          avatarBase64: avatarBase64,
          // Données mappées du shopper (pour la recommandation de taille)
          gender: shopperData.gender || prev.gender,
          height: shopperData.height || prev.height,
          weight: shopperData.weight || prev.weight,
          sizeTop: shopperData.sizeTop || prev.sizeTop,
          sizeBottom: shopperData.sizeBottom || prev.sizeBottom,
        }));
        setCurrentSlide(4);
      } else if (shopperData && !avatarUrl) {
        // Shopper existe mais sans avatar - pré-remplir les données et continuer le flux
        setUserData((prev) => ({
          ...prev,
          gender: shopperData.gender || prev.gender,
          height: shopperData.height || prev.height,
          weight: shopperData.weight || prev.weight,
          sizeTop: shopperData.sizeTop || prev.sizeTop,
          sizeBottom: shopperData.sizeBottom || prev.sizeBottom,
        }));
        setCurrentSlide(1);
      } else {
        // Nouveau shopper ou erreur - continuer le flux normal
        setCurrentSlide(1);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      // En cas d'erreur, continuer le flux normal
      setCurrentSlide(1);
    }
  };

  // Gérer le "skip" - continuer sans compte
  const handleSkipAuth = () => {
    setIsAuthenticated(false);
    setCurrentSlide(1);
  };

  // Gérer la sauvegarde du compte depuis ResultsSlide
  const handleSaveAccount = async ({ user: authUser, userData: savedData }) => {
    try {
      setIsAuthenticated(true);

      // Mapper gender vers gender_id (1 = homme, 2 = femme)
      // Préparer les données pour createShopper
      // Pour l'instant, on n'envoie que les champs obligatoires
      const shopperData = {
        firebase_id: authUser.uid,
        nickname: 'Younzee User', // Temporaire - à modifier plus tard
        first_name: 'Younzee', // Temporaire - à modifier plus tard
        number_phone: authUser.phoneNumber || '',
        email: `${authUser.uid}@younzee.temp`, // Temporaire - à modifier plus tard
      };

      // Créer le shopper dans mirror-api (PostgREST)
      await createShopper(shopperData);

      // Nettoyer le cache local
      clearUserCache();

      console.log('✅ Compte créé avec succès dans mirror-api');
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
    }
  };

  const renderCurrentSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <PhoneAuthSlide
            key="auth"
            onNext={handlePhoneAuthComplete}
            onSkip={handleSkipAuth}
          />
        );
      case 1:
        return (
          <MeasurementsSlide
            key="measurements"
            onNext={(data) => {
              setUserData((prev) => ({ ...prev, ...data }));
              setCurrentSlide(2);
            }}
            onBack={() => setCurrentSlide(0)}
            initialData={{
              gender: userData.gender,
              height: userData.height,
              weight: userData.weight,
            }}
          />
        );
      case 2:
        return (
          <ClothingSizesSlide
            key="sizes"
            onNext={(data) => {
              setUserData((prev) => ({ ...prev, ...data }));
              setCurrentSlide(3);
            }}
            onBack={() => setCurrentSlide(1)}
            initialData={{ sizeTop: userData.sizeTop, sizeBottom: userData.sizeBottom }}
          />
        );
      case 3:
        return (
          <SelfieSlide
            key="selfie"
            onNext={(data) => {
              setUserData((prev) => ({ ...prev, ...data }));
              setCurrentSlide(4);
            }}
            onBack={() => setCurrentSlide(2)}
            initialSelfie={userData.selfieBase64}
          />
        );
      case 4:
        return (
          <ResultsSlideNew
            key="results"
            userData={userData}
            isAuthenticated={isAuthenticated}
            onSaveAccount={handleSaveAccount}
            onRestart={() => {
              setCurrentSlide(0);
              setIsAuthenticated(false);
              clearUserCache();
              // Préserver les données du vêtement qui viennent de la page parente
              setUserData((prev) => ({
                gender: '',
                height: '',
                weight: '',
                sizeTop: '',
                sizeBottom: '',
                selfieBase64: '',
                clothingItem: prev.clothingItem, // Conserver le vêtement
                clothingImageBase64: prev.clothingImageBase64, // Conserver l'image base64
                avatarUrl: '',
                avatarBase64: '',
              }));
            }}
          />
        );
      default:
        return null;
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Notifier la page parente de la fermeture
    window.parent.postMessage({ type: 'YOUNZEE_CLOSED' }, '*');
  };

  // Calculer les étapes de progression à afficher
  const progressSteps = [0, 1, 2, 3, 4];

  return (
    <>
      {/* Overlay */}
      <div
        className={`younzee-overlay ${isOpen ? 'open' : ''}`}
        onClick={handleClose}
      />

      {/* Popup/Slider */}
      <div className={`younzee-popup ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="popup-header">
          {/* Indicateur de progression dans le header */}
          <div className="progress-indicator">
            {progressSteps.map((step) => (
              <div
                key={step}
                className={`progress-dot ${
                  step === currentSlide ? 'active' : ''
                } ${step < currentSlide ? 'completed' : ''}`}
              />
            ))}
          </div>
          <button className="close-button" onClick={handleClose} aria-label="Fermer">
            ×
          </button>
        </div>

        {/* Contenu des slides */}
        <div className="slide-container">{renderCurrentSlide()}</div>

        {/* Footer */}
        <div className="popup-footer">
          <div className="footer-content">
            <div className="footer-branding">
              <span className="footer-powered">powered by</span>
              <a href="https://younzee.com" target="_blank" rel="noopener noreferrer" className="footer-logo-link">
                <img src={logo} alt="Younzee" className="footer-logo" />
              </a>
            </div>
            <p className="footer-privacy">
              En continuant, vous acceptez notre{' '}
              <a href="https://www.younzee.com/privacy" target="_blank" rel="noopener noreferrer" className="footer-link">politique de confidentialité</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
