import { useState } from 'react';
import './MeasurementsSlide.css';

function MeasurementsSlide({ onNext, onBack, initialData }) {
  const [gender, setGender] = useState(initialData.gender || '');
  const [height, setHeight] = useState(initialData.height || '');
  const [weight, setWeight] = useState(initialData.weight || '');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!gender) {
      newErrors.gender = 'Veuillez sélectionner votre sexe';
    }

    if (!height || height < 100 || height > 250) {
      newErrors.height = 'Veuillez entrer une taille valide (100-250 cm)';
    }

    if (!weight || weight < 30 || weight > 200) {
      newErrors.weight = 'Veuillez entrer un poids valide (30-200 kg)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onNext({
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight)
      });
    }
  };

  return (
    <div className="slide measurements-slide">
      <div className="slide-content">
        <h2>Vos mensurations</h2>
        <p className="slide-description">Renseignez vos informations</p>

        <form className="measurement-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Sexe</label>
            <div className="gender-buttons">
              <button
                type="button"
                className={`gender-btn ${gender === 'homme' ? 'active' : ''}`}
                onClick={() => setGender('homme')}
              >
                Homme
              </button>
              <button
                type="button"
                className={`gender-btn ${gender === 'femme' ? 'active' : ''}`}
                onClick={() => setGender('femme')}
              >
                Femme
              </button>
            </div>
            {errors.gender && <span className="error-message">{errors.gender}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="height" className="form-label">Taille (cm)</label>
            <div className="input-with-unit">
              <input
                type="number"
                id="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="100"
                max="250"
                placeholder="170"
                className={`form-input ${errors.height ? 'error' : ''}`}
              />
              <span className="unit">cm</span>
            </div>
            {errors.height && <span className="error-message">{errors.height}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="weight" className="form-label">Poids (kg)</label>
            <div className="input-with-unit">
              <input
                type="number"
                id="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min="30"
                max="200"
                placeholder="70"
                className={`form-input ${errors.weight ? 'error' : ''}`}
              />
              <span className="unit">kg</span>
            </div>
            {errors.weight && <span className="error-message">{errors.weight}</span>}
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

export default MeasurementsSlide;
