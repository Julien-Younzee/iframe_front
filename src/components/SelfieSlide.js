import { useState, useRef, useEffect } from 'react';
import './SelfieSlide.css';
import logger from '../services/logger';

function SelfieSlide({ onNext, onBack, initialSelfie }) {
  const [hasPhoto, setHasPhoto] = useState(!!initialSelfie);
  const [photoBase64, setPhotoBase64] = useState(initialSelfie || '');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Démarrer la caméra au montage du composant
    if (!hasPhoto) {
      startCamera();
    }

    // Nettoyer le stream à la destruction du composant
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPhoto]);

  // Attacher le stream à la vidéo quand elle est montée
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      logger.log('📺 Attachement du stream à l\'élément vidéo');
      videoRef.current.srcObject = streamRef.current;

      videoRef.current.onloadedmetadata = async () => {
        logger.log('✅ Métadonnées chargées');
        logger.log('📐 Dimensions vidéo:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);

        try {
          await videoRef.current.play();
          logger.log('✅ Lecture démarrée');
        } catch (err) {
          logger.error('❌ Erreur lors du démarrage de la vidéo:', err);
        }
      };
    }
  }, [isCameraActive]);

  const startCamera = async () => {
    try {
      setCameraError('');
      logger.log('🎥 Demande d\'accès à la caméra...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      logger.log('✅ Stream obtenu:', stream);
      logger.log('📹 Video tracks:', stream.getVideoTracks());

      // Sauvegarder le stream immédiatement
      streamRef.current = stream;

      // Activer la caméra pour que l'élément vidéo soit rendu dans le DOM
      setIsCameraActive(true);

    } catch (error) {
      logger.error('❌ Erreur d\'accès à la caméra:', error);
      setCameraError('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès à la caméra.');
    }
  };

  const stopCamera = () => {
    logger.log('🛑 Arrêt de la caméra...');

    // Arrêter tous les tracks du stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        logger.log('🔴 Arrêt du track:', track.kind, track.label, 'État:', track.readyState);
        track.stop();
        logger.log('   → Nouvel état:', track.readyState);
      });
      streamRef.current = null;
    }

    // Nettoyer l'élément vidéo
    if (videoRef.current) {
      logger.log('🧹 Nettoyage de l\'élément vidéo');
      const oldStream = videoRef.current.srcObject;
      if (oldStream) {
        oldStream.getTracks().forEach(track => {
          logger.log('🔴 Arrêt du track depuis vidéo:', track.kind, track.readyState);
          track.stop();
        });
      }
      videoRef.current.srcObject = null;
      videoRef.current.pause();
      videoRef.current.load(); // Force le nettoyage complet
    }

    setIsCameraActive(false);

    // Vérification finale de tous les streams actifs
    navigator.mediaDevices.enumerateDevices().then(() => {
      logger.log('✅ Caméra arrêtée et nettoyée');
      logger.log('🔍 Vérification : Y a-t-il encore des streams actifs ?');

      // Cette ligne devrait retourner un tableau vide ou des tracks tous "ended"
      if (streamRef.current) {
        logger.warn('⚠️ streamRef.current existe encore !');
      } else {
        logger.log('✓ streamRef.current est null');
      }
    });
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      // Définir les dimensions du canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dessiner l'image de la vidéo sur le canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir en base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      setPhotoBase64(base64Image);
      setHasPhoto(true);

      // Arrêter la caméra
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setHasPhoto(false);
    setPhotoBase64('');
    startCamera();
  };

  const handleNext = () => {
    if (hasPhoto && photoBase64) {
      onNext({ selfieBase64: photoBase64 });
    }
  };

  return (
    <div className="slide selfie-slide">
      <div className="slide-content">
        <h2>Prenez un selfie</h2>
        <p className="slide-description">
          {hasPhoto ? 'Votre photo est prête' : 'Positionnez-vous face à la caméra'}
        </p>

        {cameraError && (
          <div className="camera-error">
            <p>{cameraError}</p>
            <button className="btn btn-secondary" onClick={startCamera}>
              Réessayer
            </button>
          </div>
        )}

        <div className="camera-container">
          {!hasPhoto && isCameraActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="camera-video"
            />
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {hasPhoto && photoBase64 && (
            <div className="photo-preview">
              <img src={photoBase64} alt="Votre selfie" />
            </div>
          )}

          {!hasPhoto && !isCameraActive && !cameraError && (
            <div className="camera-loading">
              <p>Chargement de la caméra...</p>
            </div>
          )}
        </div>

        <div className="camera-controls">
          {!hasPhoto && isCameraActive && (
            <button className="btn btn-camera" onClick={capturePhoto}>
              Prendre la photo
            </button>
          )}

          {hasPhoto && (
            <button className="btn btn-secondary" onClick={retakePhoto}>
              Reprendre
            </button>
          )}
        </div>

        <div className="navigation-buttons">
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!hasPhoto}
          >
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

export default SelfieSlide;
