import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface FirebaseRecaptchaVerifierWebProps {
  firebaseConfig: any;
  attemptInvisibleVerification?: boolean;
  languageCode?: string;
}

export interface FirebaseRecaptchaVerifierRef {
  type: string;
  verify: () => Promise<string>;
  _reset?: () => void;
}

// Composant spécifique pour le Web
const FirebaseRecaptchaVerifierWeb = forwardRef<
  FirebaseRecaptchaVerifierRef,
  FirebaseRecaptchaVerifierWebProps
>((props, ref) => {
  const { firebaseConfig, attemptInvisibleVerification = true, languageCode = 'fr' } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const resolveRef = useRef<((token: string) => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    console.log('🌐 Initialisation du reCAPTCHA Web');

    // Charger le script Firebase si ce n'est pas déjà fait
    if (!(window as any).firebase) {
      const script1 = document.createElement('script');
      script1.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
      script1.async = false; // Charger de manière synchrone pour garantir l'ordre
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js';
      script2.async = false; // Charger de manière synchrone
      document.head.appendChild(script2);

      script2.onload = () => {
        console.log('✅ Firebase scripts chargés');
        // Attendre un peu pour s'assurer que tout est initialisé
        setTimeout(() => {
          if ((window as any).firebase && typeof (window as any).firebase.auth === 'function') {
            console.log('✅ firebase.auth est disponible');
            initializeRecaptcha();
          } else {
            console.error('❌ firebase.auth n\'est toujours pas disponible');
          }
        }, 100);
      };
    } else if (typeof (window as any).firebase.auth === 'function') {
      console.log('✅ Firebase déjà chargé');
      initializeRecaptcha();
    }

    return () => {
      // Cleanup
      if (widgetIdRef.current !== null && (window as any).grecaptcha) {
        try {
          (window as any).grecaptcha.reset(widgetIdRef.current);
        } catch (e) {
          console.log('Cleanup grecaptcha error:', e);
        }
      }
    };
  }, []);

  const initializeRecaptcha = () => {
    if (!containerRef.current) {
      console.error('❌ Container ref non disponible');
      return;
    }

    console.log('🔧 Configuration Firebase:', {
      apiKey: firebaseConfig.apiKey ? '✅' : '❌',
      authDomain: firebaseConfig.authDomain ? '✅' : '❌',
      projectId: firebaseConfig.projectId ? '✅' : '❌',
    });

    try {
      // Initialiser Firebase si ce n'est pas déjà fait
      if (!(window as any).firebase.apps.length) {
        (window as any).firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialisé');
      }

      // Configurer la langue
      (window as any).firebase.auth().languageCode = languageCode;

      console.log('🎯 RecaptchaVerifier prêt à être créé');
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    type: 'recaptcha',
    verify: async () => {
      console.log('🔍 Verification demandée');

      return new Promise<string>((resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current = reject;

        // Attendre que Firebase soit prêt
        const waitForFirebase = () => {
          if (!(window as any).firebase || typeof (window as any).firebase.auth !== 'function') {
            console.log('⏳ Attente de Firebase...');
            setTimeout(waitForFirebase, 500);
            return;
          }

          try {
            if (!containerRef.current) {
              throw new Error('Container non disponible');
            }

            console.log('✅ Firebase prêt, création du RecaptchaVerifier');

            // Créer un nouveau verifier pour chaque vérification
            const recaptchaVerifier = new (window as any).firebase.auth.RecaptchaVerifier(
              containerRef.current,
              {
                size: attemptInvisibleVerification ? 'invisible' : 'normal',
                callback: (token: string) => {
                  console.log('✅ reCAPTCHA résolu');
                  if (resolveRef.current) {
                    resolveRef.current(token);
                    resolveRef.current = null;
                    rejectRef.current = null;
                  }
                },
                'error-callback': (error: any) => {
                  console.error('❌ reCAPTCHA error:', error);
                  if (rejectRef.current) {
                    rejectRef.current(new Error(error.message || 'reCAPTCHA verification failed'));
                    rejectRef.current = null;
                    resolveRef.current = null;
                  }
                },
              }
            );

            // Render le reCAPTCHA
            recaptchaVerifier.render().then((widgetId: number) => {
              widgetIdRef.current = widgetId;
              console.log('✅ reCAPTCHA rendu, widgetId:', widgetId);

              // Pour le mode invisible, déclencher automatiquement la vérification
              if (attemptInvisibleVerification) {
                console.log('🚀 Déclenchement automatique du reCAPTCHA invisible');
                recaptchaVerifier.verify().catch((error: any) => {
                  console.error('❌ Erreur verify:', error);
                  if (rejectRef.current) {
                    rejectRef.current(error);
                    rejectRef.current = null;
                    resolveRef.current = null;
                  }
                });
              }
            }).catch((error: any) => {
              console.error('❌ Erreur render:', error);
              reject(error);
            });

            // Timeout de sécurité
            setTimeout(() => {
              if (rejectRef.current) {
                console.error('⏱️ Timeout du reCAPTCHA');
                rejectRef.current(new Error('Le reCAPTCHA a pris trop de temps'));
                rejectRef.current = null;
                resolveRef.current = null;
              }
            }, 120000);

          } catch (error: any) {
            console.error('❌ Erreur verify:', error);
            reject(error);
          }
        };

        // Démarrer l'attente de Firebase
        waitForFirebase();
      });
    },
    _reset: () => {
      console.log('🔄 Reset du reCAPTCHA');
      if (widgetIdRef.current !== null && (window as any).grecaptcha) {
        try {
          (window as any).grecaptcha.reset(widgetIdRef.current);
        } catch (e) {
          console.log('Reset error:', e);
        }
      }
      resolveRef.current = null;
      rejectRef.current = null;
    },
  }));

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <div
        ref={containerRef as any}
        id="recaptcha-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: attemptInvisibleVerification ? 0 : 78,
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FirebaseRecaptchaVerifierWeb;
