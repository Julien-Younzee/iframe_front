import { useState, useEffect } from 'react';
import './ResultsSlideNew.css';
import { generateVirtualTryOn, generateMockSizeRecommendations } from '../services/vtoService';
import { saveUserDataToCache } from '../services/cacheService';
import logger from '../services/logger';
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
      // Si le produit est en taille unique, pas de calcul nécessaire
      if (userData.isOneSize) {
        logger.log('📏 Produit en taille unique - pas de calcul de recommandation');
        setSizeRecommendation({
          isOneSize: true,
          oneSize: {
            size: 'Taille unique',
            type: 'onesize',
            label: 'Taille unique',
            description: 'Ce produit est disponible en taille unique, adaptée à toutes les morphologies.',
          },
        });
        setIsLoadingSizeReco(false);
        return;
      }

      // TODO: Appel au backend de recommandation de taille
      // Pour l'instant, utilisation de l'algorithme mock amélioré
      logger.log('🚀 Génération de la recommandation de taille intelligente...', {
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

      logger.log('✅ Recommandation de taille générée:', mockRecommendations);

      // Log des métadonnées pour debug
      if (mockRecommendations.metadata) {
        logger.log('📊 Métadonnées de recommandation:', mockRecommendations.metadata);
      }
    } catch (err) {
      logger.error('❌ Erreur lors de la recommandation de taille:', err);
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
        logger.warn('⚠️ Image du vêtement manquante');
        setErrorVTO('Image du vêtement manquante');
        return;
      }

      // Déterminer si c'est un avatar existant ou un nouveau selfie
      const isExistingAvatar = Boolean(userData.avatarBase64);

      // Appel réel au backend VTO
      logger.log('🚀 Appel du backend VTO...', isExistingAvatar ? '(avec avatar)' : '(avec selfie)');
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

      logger.log('✅ Résultat VTO reçu');

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
      logger.error('❌ Erreur lors de la génération VTO:', err);
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

  // Vérifier si une taille est disponible
  const isSizeAvailable = (size) => {
    // Si pas de variants fournis, considérer comme disponible par défaut
    if (!userData.variants || userData.variants.length === 0) {
      logger.log('⚠️ Pas de variants disponibles, taille considérée comme disponible');
      return true;
    }

    const targetSize = (size || '').toLowerCase().trim();

    // Chercher la variante correspondant à la taille
    // Les variantes Shopify peuvent avoir des formats comme:
    // - "S", "M", "L" (simple)
    // - "Blanc écru / S", "Blanc écru / M" (couleur / taille)
    // - "S / Rouge", "M / Rouge" (taille / couleur)
    const variant = userData.variants.find(v => {
      const variantTitle = (v.size || '').toLowerCase().trim();

      // 1. Correspondance exacte
      if (variantTitle === targetSize) {
        return true;
      }

      // 2. Vérifier si le titre contient la taille après un séparateur "/ " ou " /"
      // Ex: "Blanc écru / S" contient "/ s" ou "Blanc écru /S"
      const separatorPatterns = [
        `/ ${targetSize}`,      // "/ S" à la fin
        `/${targetSize}`,       // "/S" sans espace
        `${targetSize} /`,      // "S /" au début
        `${targetSize}/`,       // "S/" sans espace
      ];

      for (const pattern of separatorPatterns) {
        // Vérifier que le pattern est suivi d'une fin de chaîne ou d'un espace/séparateur
        // pour éviter que "L" ne corresponde à "XL"
        const patternIndex = variantTitle.indexOf(pattern);
        if (patternIndex !== -1) {
          const afterPattern = patternIndex + pattern.length;
          // Vérifier que c'est bien la fin ou suivi d'un séparateur
          if (afterPattern >= variantTitle.length ||
              variantTitle[afterPattern] === ' ' ||
              variantTitle[afterPattern] === '/') {
            return true;
          }
        }
      }

      // 3. Vérifier si la taille est un mot complet dans le titre
      // Utiliser une regex pour trouver la taille comme mot isolé
      // \b ne fonctionne pas bien avec les accents, donc on vérifie manuellement
      const words = variantTitle.split(/[\s/\-,]+/);
      return words.includes(targetSize);
    });

    logger.log(`🔍 Vérification taille "${size}":`, {
      variants: userData.variants.map(v => v.size),
      variantTrouvée: variant ? variant.size : null,
      disponible: variant ? variant.available : 'non trouvée = indisponible'
    });

    // Si variante trouvée, retourner sa disponibilité
    // Si variante NON trouvée, la taille n'existe pas donc indisponible
    return variant ? variant.available : false;
  };

  // Obtenir la taille sélectionnée actuelle
  const getSelectedSize = () => {
    if (sizeRecommendation?.isOneSize) {
      return 'Taille unique';
    }
    return sizeRecommendation?.[selectedFitType]?.size || null;
  };

  // Vérifier si la taille sélectionnée est disponible
  const isSelectedSizeAvailable = () => {
    const size = getSelectedSize();
    if (!size) return false;
    return isSizeAvailable(size);
  };

  const handleAddToCart = () => {
    // Gestion du cas taille unique
    if (sizeRecommendation?.isOneSize) {
      window.parent.postMessage({
        type: 'ADD_TO_CART',
        size: 'Taille unique',
        fitType: 'onesize'
      }, '*');
      return;
    }

    const selectedSize = sizeRecommendation[selectedFitType].size;
    // Envoyer un message à la page parente avec la taille sélectionnée
    window.parent.postMessage({
      type: 'ADD_TO_CART',
      size: selectedSize,
      fitType: selectedFitType
    }, '*');
  };

  // Pour taille unique, utiliser oneSize, sinon utiliser le type sélectionné
  const currentRecommendation = sizeRecommendation
    ? (sizeRecommendation.isOneSize ? sizeRecommendation.oneSize : sizeRecommendation[selectedFitType])
    : null;

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
              {/* Affichage différent selon taille unique ou tailles multiples */}
              {sizeRecommendation.isOneSize ? (
                /* Cas Taille Unique */
                <div className="size-options one-size">
                  <div className="size-option active one-size-option" data-type="onesize">
                    <span className="size-label">{sizeRecommendation.oneSize.label}</span>
                    <span className="size-value">TU</span>
                  </div>
                </div>
              ) : (
                /* Cas Tailles Multiples */
                <div className="size-options">
                  <button
                    className={`size-option ${selectedFitType === 'fit' ? 'active' : ''} ${!isSizeAvailable(sizeRecommendation.fit.size) ? 'unavailable' : ''}`}
                    onClick={() => setSelectedFitType('fit')}
                    data-type="fit"
                  >
                    <span className="size-label">{sizeRecommendation.fit.label}</span>
                    <span className="size-value">{sizeRecommendation.fit.size}</span>
                    {!isSizeAvailable(sizeRecommendation.fit.size) && (
                      <span className="unavailable-badge">Épuisé</span>
                    )}
                  </button>
                  <button
                    className={`size-option ${selectedFitType === 'ideal' ? 'active' : ''} ${!isSizeAvailable(sizeRecommendation.ideal.size) ? 'unavailable' : ''}`}
                    onClick={() => setSelectedFitType('ideal')}
                    data-type="ideal"
                  >
                    <span className="size-label">{sizeRecommendation.ideal.label}</span>
                    <span className="size-value">{sizeRecommendation.ideal.size}</span>
                    {!isSizeAvailable(sizeRecommendation.ideal.size) && (
                      <span className="unavailable-badge">Épuisé</span>
                    )}
                  </button>
                  <button
                    className={`size-option ${selectedFitType === 'oversize' ? 'active' : ''} ${!isSizeAvailable(sizeRecommendation.oversize.size) ? 'unavailable' : ''}`}
                    onClick={() => setSelectedFitType('oversize')}
                    data-type="oversize"
                  >
                    <span className="size-label">{sizeRecommendation.oversize.label}</span>
                    <span className="size-value">{sizeRecommendation.oversize.size}</span>
                    {!isSizeAvailable(sizeRecommendation.oversize.size) && (
                      <span className="unavailable-badge">Épuisé</span>
                    )}
                  </button>
                </div>
              )}

              <div className="recommendation-card">
                <p className="recommendation-text">
                  {currentRecommendation?.description}
                </p>
              </div>

              {/* Bouton Ajouter au panier */}
              <div className="add-to-cart-section">
                <button
                  className="btn btn-add-to-cart"
                  onClick={handleAddToCart}
                  disabled={!isSelectedSizeAvailable()}
                >
                  {isSelectedSizeAvailable() ? 'Ajouter au panier' : 'Taille indisponible'}
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
              <p className="ai-disclaimer">Image générée par IA - Des imperfections peuvent apparaître</p>
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
