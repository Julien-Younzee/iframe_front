import { useState, useEffect } from 'react';
import './ResultsSlide.css';
import { generateVirtualTryOn } from '../services/api';
import logger from '../services/logger';

function ResultsSlide({ userData, onRestart }) {
  const [isLoading, setIsLoading] = useState(true);
  const [resultImage, setResultImage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    generateResult();
  }, []);

  const generateResult = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Appel au backend Cloud Run
      const result = await generateVirtualTryOn({
        height: userData.height,
        weight: userData.weight,
        sizeTop: userData.sizeTop,
        sizeBottom: userData.sizeBottom,
        selfieBase64: userData.selfieBase64,
        clothingItem: userData.clothingItem
      });

      // Le résultat est une image en base64
      setResultImage(result.imageBase64);
    } catch (err) {
      logger.error('Erreur lors de la génération:', err);
      setError('Une erreur est survenue lors de la génération de votre essayage virtuel. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="slide results-slide">
      <div className="slide-content">
        <h2>Votre essayage virtuel</h2>
        <p className="slide-description">
          {isLoading ? 'Génération en cours...' : 'Voici le résultat'}
        </p>

        <div className="results-container">
          {isLoading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Génération de votre essayage virtuel...</p>
            </div>
          )}

          {!isLoading && resultImage && !error && (
            <div className="result-image-container">
              <img src={resultImage} alt="Résultat de l'essayage virtuel" />
            </div>
          )}

          {!isLoading && error && (
            <div className="error-message">
              <p>{error}</p>
              <button className="btn btn-secondary" onClick={generateResult}>
                Réessayer
              </button>
            </div>
          )}
        </div>

        <div className="navigation-buttons">
          {!isLoading && (
            <button className="btn btn-primary" onClick={onRestart}>
              Recommencer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsSlide;
