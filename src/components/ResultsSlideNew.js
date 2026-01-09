import { useState, useEffect } from 'react';
import './ResultsSlideNew.css';
import { generateVirtualTryOn, generateMockSizeRecommendations } from '../services/vtoService';
import { saveUserDataToCache } from '../services/cacheService';
// import SaveAccountPrompt from './SaveAccountPrompt'; // Temporairement désactivé

function ResultsSlideNew({ userData, isAuthenticated, onRestart, onSaveAccount }) {
  const [isLoadingSizeReco, setIsLoadingSizeReco] = useState(true);
  const [isLoadingVTO, setIsLoadingVTO] = useState(true);
  const [avatarImage, setAvatarImage] = useState('');
  const [sizeRecommendation, setSizeRecommendation] = useState(null);
  const [selectedFitType, setSelectedFitType] = useState('ideal'); // 'fit', 'ideal', 'oversize'
  const [errorSizeReco, setErrorSizeReco] = useState('');
  const [errorVTO, setErrorVTO] = useState('');
  // const [showSavePrompt, setShowSavePrompt] = useState(false); // Temporairement désactivé

  useEffect(() => {
    generateResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateResults = async () => {
    // Sauvegarder les données en cache pour les utilisateurs non authentifiés
    if (!isAuthenticated) {
      saveUserDataToCache(userData);
    }

    // Lancer les deux appels backend en parallèle
    generateSizeRecommendation();
    generateVTOAvatar();
  };

  const generateSizeRecommendation = async () => {
    setIsLoadingSizeReco(true);
    setErrorSizeReco('');

    try {
      // TODO: Appel au backend de recommandation de taille
      // Pour l'instant, utilisation de l'algorithme mock amélioré
      console.log('🚀 Génération de la recommandation de taille intelligente...', {
        gender: userData.gender,
        height: userData.height,
        weight: userData.weight,
        sizeTop: userData.sizeTop,
        sizeBottom: userData.sizeBottom,
      });

      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Passer l'objet userData complet pour utiliser l'algorithme intelligent
      const mockRecommendations = generateMockSizeRecommendations(userData);
      setSizeRecommendation(mockRecommendations);

      console.log('✅ Recommandation de taille générée:', mockRecommendations);

      // Log des métadonnées pour debug
      if (mockRecommendations.metadata) {
        console.log('📊 Métadonnées de recommandation:', mockRecommendations.metadata);
      }
    } catch (err) {
      console.error('❌ Erreur lors de la recommandation de taille:', err);
      setErrorSizeReco(
        err.message || 'Une erreur est survenue lors de la recommandation de taille.'
      );
    } finally {
      setIsLoadingSizeReco(false);
    }
  };

  const generateVTOAvatar = async () => {
    setIsLoadingVTO(true);
    setErrorVTO('');

    try {
      // Vérifier que nous avons les données nécessaires
      const selfieToUse = userData.avatarBase64 || userData.selfieBase64;
      const clothingImageToUse = userData.clothingImageBase64;

      if (!selfieToUse) {
        throw new Error('Image du selfie ou de l\'avatar manquante');
      }

      if (!clothingImageToUse) {
        console.warn('⚠️ Image du vêtement manquante');
        setErrorVTO('Image du vêtement manquante');
        return;
      }

      // Déterminer si c'est un avatar existant ou un nouveau selfie
      const isExistingAvatar = Boolean(userData.avatarBase64);

      // Appel réel au backend VTO
      console.log('🚀 Appel du backend VTO...', isExistingAvatar ? '(avec avatar)' : '(avec selfie)');
      const result = await generateVirtualTryOn({
        selfieBase64: selfieToUse,
        clothingBase64: clothingImageToUse,
        gender: userData.gender,
        height: userData.height,
        weight: userData.weight,
        sizeTop: userData.sizeTop,
        sizeBottom: userData.sizeBottom,
        isExistingAvatar: isExistingAvatar,
      });

      console.log('✅ Résultat VTO reçu');

      // Mettre à jour l'avatar généré
      if (result.imageBase64) {
        setAvatarImage(result.imageBase64);
      }

      // Afficher le prompt de sauvegarde pour les utilisateurs non authentifiés
      // Temporairement désactivé
      // if (!isAuthenticated) {
      //   setShowSavePrompt(true);
      // }
    } catch (err) {
      console.error('❌ Erreur lors de la génération VTO:', err);
      setErrorVTO(
        err.message || 'Une erreur est survenue lors de la génération de l\'avatar.'
      );
    } finally {
      setIsLoadingVTO(false);
    }
  };

  // Temporairement désactivé
  // const handleSaveAccount = (data) => {
  //   // Ne pas cacher le prompt, le composant SaveAccountPrompt gérera l'affichage du succès
  //   // setShowSavePrompt(false);
  //   if (onSaveAccount) {
  //     onSaveAccount(data);
  //   }
  // };

  // const handleSkipSave = () => {
  //   setShowSavePrompt(false);
  // };

  const handleAddToCart = () => {
    const selectedSize = sizeRecommendation[selectedFitType].size;
    // Envoyer un message à la page parente avec la taille sélectionnée
    window.parent.postMessage({
      type: 'ADD_TO_CART',
      size: selectedSize,
      fitType: selectedFitType
    }, '*');
  };

  const currentRecommendation = sizeRecommendation ? sizeRecommendation[selectedFitType] : null;

  return (
    <div className="slide results-slide-new">
      <div className="slide-content">
        {/* Section Recommandation de taille */}
        <div className="recommendation-section">
          <h2 className="recommendation-title">Votre taille</h2>
          {isLoadingSizeReco ? (
            <div className="loading-section">
              <div className="spinner"></div>
              <p className="loading-text">
                Analyse de vos mensurations en cours...
              </p>
            </div>
          ) : errorSizeReco ? (
            <div className="error-section">
              <p className="error-message">{errorSizeReco}</p>
              <button className="btn btn-secondary" onClick={generateSizeRecommendation}>
                Réessayer
              </button>
            </div>
          ) : sizeRecommendation ? (
            <>
              <div className="size-options">
                <button
                  className={`size-option ${selectedFitType === 'fit' ? 'active' : ''}`}
                  onClick={() => setSelectedFitType('fit')}
                  data-type="fit"
                >
                  <span className="size-label">{sizeRecommendation.fit.label}</span>
                  <span className="size-value">{sizeRecommendation.fit.size}</span>
                </button>
                <button
                  className={`size-option ${selectedFitType === 'ideal' ? 'active' : ''}`}
                  onClick={() => setSelectedFitType('ideal')}
                  data-type="ideal"
                >
                  <span className="size-label">{sizeRecommendation.ideal.label}</span>
                  <span className="size-value">{sizeRecommendation.ideal.size}</span>
                </button>
                <button
                  className={`size-option ${selectedFitType === 'oversize' ? 'active' : ''}`}
                  onClick={() => setSelectedFitType('oversize')}
                  data-type="oversize"
                >
                  <span className="size-label">{sizeRecommendation.oversize.label}</span>
                  <span className="size-value">{sizeRecommendation.oversize.size}</span>
                </button>
              </div>

              <div className="recommendation-card">
                <p className="recommendation-text">
                  {currentRecommendation?.description}
                </p>
              </div>

              {/* Bouton Ajouter au panier */}
              <div className="add-to-cart-section">
                <button className="btn btn-add-to-cart" onClick={handleAddToCart}>
                  Ajouter au panier
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Section Avatar VTO */}
        <div className="avatar-section">
          <h2 className="avatar-title">Votre essayage virtuel</h2>
          {isLoadingVTO ? (
            <div className="avatar-placeholder">
              <div className="placeholder-animation">
                <div className="spinner"></div>
                <p>Génération de votre avatar en cours...</p>
              </div>
            </div>
          ) : errorVTO ? (
            <div className="error-section">
              <p className="error-message">{errorVTO}</p>
              <button className="btn btn-secondary" onClick={generateVTOAvatar}>
                Réessayer
              </button>
            </div>
          ) : avatarImage ? (
            <div className="avatar-container">
              <img src={avatarImage} alt="Votre avatar" className="avatar-image" />
            </div>
          ) : null}
        </div>

        {/* Proposition de sauvegarde de compte - Temporairement masqué */}
        {/* {!isLoadingSizeReco && !isLoadingVTO && showSavePrompt && (
          <SaveAccountPrompt
            userData={userData}
            onSave={handleSaveAccount}
            onSkip={handleSkipSave}
          />
        )} */}

        <div className="navigation-buttons">
          <button className="btn btn-primary" onClick={onRestart}>
            Recommencer
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsSlideNew;
