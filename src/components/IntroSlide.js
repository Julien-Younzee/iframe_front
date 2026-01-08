import './IntroSlide.css';

function IntroSlide({ onNext }) {
  return (
    <div className="slide intro-slide">
      <div className="slide-content">
        <h1>Bienvenue chez Younzee</h1>
        <p className="intro-text">
          Découvrez comment vos vêtements vous iront grâce à notre technologie d'essayage virtuel.
        </p>

        <div className="intro-steps">
          <div className="step">
            <span className="step-number">1</span>
            <p>Renseignez vos mensurations</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <p>Indiquez vos tailles</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <p>Prenez un selfie</p>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <p>Visualisez le résultat</p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={onNext}>
          Commencer
        </button>
      </div>
    </div>
  );
}

export default IntroSlide;
