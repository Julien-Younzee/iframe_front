import './CacheChoiceModal.css';

/**
 * Modal qui s'affiche quand des données utilisateur sont en cache
 * Permet de choisir entre utiliser les données existantes ou en saisir de nouvelles
 */
function CacheChoiceModal({ cachedData, onUseCachedData, onEnterNewData, onClose }) {
  // Formater les données pour l'affichage
  const formatGender = (gender) => {
    if (gender === 'male' || gender === 'homme') return 'Homme';
    if (gender === 'female' || gender === 'femme') return 'Femme';
    return gender;
  };

  const formatSize = (size) => {
    if (!size) return '-';
    return size.toUpperCase();
  };

  return (
    <div className="cache-modal-overlay" onClick={onClose}>
      <div className="cache-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cache-modal-close" onClick={onClose} aria-label="Fermer">
          ×
        </button>

        <div className="cache-modal-content">
          <p className="cache-modal-title">
            <strong>Bon retour !</strong>
          </p>
          <p className="cache-modal-text">
            Nous avons retrouvé vos informations. Souhaitez-vous les réutiliser ?
          </p>

          {/* Résumé des données en cache */}
          <div className="cached-data-summary">
            <div className="summary-grid">
              {cachedData.gender && (
                <div className="summary-item">
                  <span className="summary-label">Genre</span>
                  <span className="summary-value">{formatGender(cachedData.gender)}</span>
                </div>
              )}
              {cachedData.height && (
                <div className="summary-item">
                  <span className="summary-label">Taille</span>
                  <span className="summary-value">{cachedData.height} cm</span>
                </div>
              )}
              {cachedData.weight && (
                <div className="summary-item">
                  <span className="summary-label">Poids</span>
                  <span className="summary-value">{cachedData.weight} kg</span>
                </div>
              )}
              {cachedData.sizeTop && (
                <div className="summary-item">
                  <span className="summary-label">Taille haut</span>
                  <span className="summary-value">{formatSize(cachedData.sizeTop)}</span>
                </div>
              )}
              {cachedData.sizeBottom && (
                <div className="summary-item">
                  <span className="summary-label">Taille bas</span>
                  <span className="summary-value">{formatSize(cachedData.sizeBottom)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Boutons de choix */}
          <div className="cache-modal-buttons">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onUseCachedData}
            >
              Utiliser ces informations
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onEnterNewData}
            >
              Saisir de nouvelles informations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CacheChoiceModal;
