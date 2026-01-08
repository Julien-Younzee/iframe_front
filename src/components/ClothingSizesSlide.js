import { useState } from 'react';
import './ClothingSizesSlide.css';

function ClothingSizesSlide({ onNext, onBack, initialData }) {
  const [sizeTop, setSizeTop] = useState(initialData.sizeTop || '');
  const [sizeBottom, setSizeBottom] = useState(initialData.sizeBottom || '');
  const [errors, setErrors] = useState({});

  const sizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

  const validateForm = () => {
    const newErrors = {};

    if (!sizeTop) {
      newErrors.sizeTop = 'Veuillez sélectionner une taille';
    }

    if (!sizeBottom) {
      newErrors.sizeBottom = 'Veuillez sélectionner une taille';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onNext({ sizeTop, sizeBottom });
    }
  };

  return (
    <div className="slide sizes-slide">
      <div className="slide-content">
        <h2>Vos tailles de vêtements</h2>
        <p className="slide-description">Sélectionnez vos tailles habituelles</p>

        <form className="sizes-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="size-top">Taille haut</label>
            <select
              id="size-top"
              value={sizeTop}
              onChange={(e) => setSizeTop(e.target.value)}
              className={errors.sizeTop ? 'error' : ''}
            >
              <option value="">Sélectionnez...</option>
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            {errors.sizeTop && <span className="error-message">{errors.sizeTop}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="size-bottom">Taille bas</label>
            <select
              id="size-bottom"
              value={sizeBottom}
              onChange={(e) => setSizeBottom(e.target.value)}
              className={errors.sizeBottom ? 'error' : ''}
            >
              <option value="">Sélectionnez...</option>
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            {errors.sizeBottom && <span className="error-message">{errors.sizeBottom}</span>}
          </div>
        </form>

        <div className="navigation-buttons">
          <button className="btn btn-primary" onClick={handleSubmit}>
            Suivant
          </button>
          <button className="btn btn-secondary" onClick={onBack}>
            Retour
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClothingSizesSlide;
