# Younzee - Application d'Essayage Virtuel

Application React pour l'essayage virtuel de vêtements avec authentification Firebase et jumeau numérique, conçue pour être intégrée dans des sites e-commerce.

## Fonctionnalités

### Interface adaptative
- **Desktop** : Popup latérale droite (450px de large)
- **Mobile** : Slider qui monte du bas (85% de la hauteur)
- Design noir et blanc sobre et minimaliste

### Flux utilisateur intelligent

#### Authentification optionnelle
L'utilisateur choisit dès le début :
- **Se connecter** : Si compte Younzee existant → Accès direct aux résultats
- **Continuer sans compte** : Flux complet avec données en cache local

#### Parcours complet (sans compte - 5 étapes) :
1. **Authentification (optionnelle)** - Se connecter OU Continuer sans compte
2. **Mensurations** - Sexe, taille (cm) et poids (kg)
3. **Tailles portées** - Tailles habituelles en regular fit (haut et bas)
4. **Photo du visage** - Capture via caméra pour créer le jumeau numérique
5. **Résultats** - Recommandation de taille + **Proposition de création de compte**

#### Utilisateurs authentifiés existants :
1. **Authentification téléphone** - Reconnaissance automatique
2. **Résultats** - Accès direct avec profil sauvegardé

### Sauvegarde des données

- **Sans compte** : Données stockées en **localStorage** (cache local du navigateur)
- **Avec compte** : Données sauvegardées dans **Firebase** (persistence permanente)
- **Proposition intelligente** : Création de compte proposée uniquement après l'essayage

## Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos informations Firebase et backend
```

## Configuration

### État actuel du projet

L'application est prête à fonctionner avec :
- ✅ Authentification Firebase par téléphone
- ✅ Collecte des données utilisateur (mensurations, selfie)
- ✅ Conversion automatique des images en base64
- ✅ Intégration backend VTO (prête, en attente du backend)
- ✅ PostgreSQL/PostgREST pour avatars existants (optionnel)
- ✅ Mode dégradé avec recommandations factices si backend indisponible
- ⏳ Backend VTO (à connecter)
- ⏳ Base de données PostgreSQL (à connecter)

### 1. Configuration Firebase (REQUIS)

Firebase est nécessaire pour l'authentification par téléphone.

1. Allez sur https://console.firebase.google.com
2. Créez un nouveau projet
3. Activez l'authentification par téléphone + reCAPTCHA
4. Copiez les informations de configuration dans `.env` :

```env
REACT_APP_FIREBASE_API_KEY=votre_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=votre-projet-id
REACT_APP_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 2. Configuration Backend VTO (REQUIS)

Le backend VTO est déjà déployé et opérationnel. Il expose les endpoints suivants :

**Backend URL:** `https://iframe-vto-dev-965958056387.europe-west1.run.app`

#### GET `/health` 🔍 Health Check

Vérification de l'état du service et de la configuration Gemini.

**Réponse:**
```json
{
  "status": "healthy",
  "gemini_configured": true
}
```

#### POST `/vto/with-avatar` ⭐ VTO avec avatar existant

Génère l'essayage virtuel pour un utilisateur avec avatar existant.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "avatar_base64": "data:image/jpeg;base64,...",     // Avatar existant (depuis PostgreSQL)
  "vetement_base64": "data:image/jpeg;base64,..."    // Image du vêtement
}
```

**Réponse:**
```json
{
  "success": true,
  "image_base64": "data:image/jpeg;base64,...",      // Image VTO générée
  "message": "VTO généré avec succès"
}
```

#### POST `/vto/with-selfie` ⭐ VTO avec nouveau selfie

Génère l'essayage virtuel pour un nouvel utilisateur (génère d'abord l'avatar).

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "selfie_base64": "data:image/jpeg;base64,...",     // Selfie de l'utilisateur
  "vetement_base64": "data:image/jpeg;base64,...",   // Image du vêtement
  "sexe": "homme",                                   // ou "femme"
  "taille_cm": 175,                                  // Taille en cm (integer)
  "poids_kg": 70,                                    // Poids en kg (integer)
  "taille_haut": "M",                                // Taille haut habituelle
  "taille_bas": "32"                                 // Taille bas habituelle
}
```

**Réponse:**
```json
{
  "success": true,
  "image_base64": "data:image/jpeg;base64,...",      // Image VTO générée
  "avatar_base64": "data:image/jpeg;base64,...",     // Avatar généré (optionnel)
  "message": "Avatar et VTO générés avec succès"
}
```

**Configuration dans .env:**
```env
REACT_APP_BACKEND_URL=https://iframe-vto-dev-965958056387.europe-west1.run.app
# Pas de /api à la fin, les endpoints sont à la racine
```

**Notes importantes:**
- Le backend détecte automatiquement quel endpoint utiliser selon les données fournies
- Le frontend route automatiquement vers le bon endpoint selon la présence d'un avatar
- Les recommandations de taille sont générées côté frontend (fallback mock)
- Timeout configuré à 120 secondes pour les générations VTO

## Développement

```bash
# Démarrer le serveur de développement
npm start

# L'application sera accessible sur http://localhost:3000
```

## Intégration

> 📖 **Guide complet:** Consultez [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) pour des instructions détaillées

### Vue d'ensemble

L'iframe Younzee contient **déjà les animations** :
- **Desktop** : Apparaît à droite de l'écran (popup latérale 450px)
- **Mobile** : Monte du bas de l'écran (slider 85% hauteur)

Vous devez simplement :
1. Intégrer l'iframe dans votre page
2. Ajouter un bouton "Essayer virtuellement"
3. Gérer la communication avec l'iframe

### Fichiers d'intégration fournis

- 📄 [shopify-integration.liquid](public/shopify-integration.liquid) - Code Shopify clé en main
- 📄 [integration-snippet.html](public/integration-snippet.html) - Code pour sites classiques
- 📄 [shopify-product-page-example.html](public/shopify-product-page-example.html) - Aperçu visuel
- 📄 [parent-integration-example.html](public/parent-integration-example.html) - Exemple détaillé

### Intégration Shopify

**Fichier prêt à l'emploi:** [shopify-integration.liquid](public/shopify-integration.liquid)

1. Créez un snippet : `snippets/younzee-vto.liquid`
2. Copiez le contenu de `shopify-integration.liquid`
3. Incluez dans `theme.liquid` avant `</body>` :
   ```liquid
   {% render 'younzee-vto' %}
   ```
4. Configurez l'URL de votre iframe dans le snippet

**Fonctionnalités incluses:**
- ✅ Bouton "Essayer virtuellement" stylisé
- ✅ Détection automatique du produit Shopify
- ✅ Ajout au panier avec taille recommandée
- ✅ Propriétés personnalisées (taille, coupe Younzee)
- ✅ Responsive mobile/desktop
- ✅ Préchargement au survol

### Intégration Site Classique

**Fichier prêt à l'emploi:** [integration-snippet.html](public/integration-snippet.html)

Copiez-collez les 3 sections dans votre page produit :

1. **CSS** dans votre `<head>`
2. **Bouton HTML** où vous voulez qu'il apparaisse
3. **JavaScript** avant `</body>`

**À adapter dans le code:**
```javascript
// 1. URL de votre iframe
const YOUNZEE_IFRAME_URL = 'https://votre-domaine-younzee.netlify.app';

// 2. Fonction pour récupérer les données produit
function getCurrentProductData() {
  // Adaptez selon votre structure HTML
}

// 3. Fonction pour ajouter au panier
function addToCart(productId, size, fitType) {
  // Adaptez selon votre système de panier
}
```

### Exemple d'intégration manuelle

```html
<!-- Bouton pour ouvrir -->
<button id="younzee-button">Essayer virtuellement</button>

<!-- Container iframe -->
<div id="younzee-container" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; display: none;">
  <iframe
    id="younzee-iframe"
    src="https://votre-domaine-younzee.netlify.app"
    allow="camera"
    style="width: 100%; height: 100%; border: none;"
  ></iframe>
</div>

<script>
const container = document.getElementById('younzee-container');
const iframe = document.getElementById('younzee-iframe');
const button = document.getElementById('younzee-button');

// Ouvrir
button.addEventListener('click', () => {
  container.style.display = 'block';
  iframe.contentWindow.postMessage({ type: 'OPEN_YOUNZEE' }, '*');
});

// Communication avec l'iframe
window.addEventListener('message', (event) => {
  // Envoyer les données du produit
  if (event.data.type === 'REQUEST_CLOTHING_ITEM') {
    iframe.contentWindow.postMessage({
      type: 'CLOTHING_ITEM_DATA',
      item: {
        id: 'PRODUCT-123',
        name: 'T-shirt',
        imageUrl: 'https://example.com/product.jpg'
      }
    }, '*');
  }

  // Ajouter au panier
  if (event.data.type === 'ADD_TO_CART') {
    const { size, fitType } = event.data;
    // Votre logique d'ajout au panier
  }

  // Fermer
  if (event.data.type === 'YOUNZEE_CLOSED') {
    container.style.display = 'none';
  }
});
</script>
```

### Communication avec l'iframe

L'application communique avec la page parente via postMessage.

**Voir l'exemple complet:** [parent-integration-example.html](public/parent-integration-example.html)

```javascript
// La page parente écoute les messages
window.addEventListener('message', function(event) {
  const iframe = document.getElementById('younzee-iframe');

  // Younzee demande les infos du vêtement
  if (event.data.type === 'REQUEST_CLOTHING_ITEM') {
    iframe.contentWindow.postMessage({
      type: 'CLOTHING_ITEM_DATA',
      item: {
        id: 'PRODUCT-123',
        name: 'T-shirt Blanc',
        category: 'top',
        imageUrl: 'https://example.com/product.jpg'  // Sera converti en base64 automatiquement
      }
    }, '*');
  }

  // L'utilisateur ajoute au panier
  if (event.data.type === 'ADD_TO_CART') {
    const { size, fitType } = event.data;
    addToCart('PRODUCT-123', size, fitType);
  }

  // Younzee a été fermé
  if (event.data.type === 'YOUNZEE_CLOSED') {
    console.log('Younzee a été fermé');
  }
});
```

## Structure du projet

```
younzee-iframe/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── PhoneAuthSlide.js         # Étape 1 - Authentification
│   │   ├── MeasurementsSlide.js      # Étape 2 - Mensurations
│   │   ├── ClothingSizesSlide.js     # Étape 3 - Tailles
│   │   ├── SelfieSlide.js            # Étape 4 - Photo
│   │   ├── ResultsSlideNew.js        # Étape 5 - Résultats + VTO
│   │   └── SaveAccountPrompt.js      # Proposition création compte
│   ├── services/
│   │   ├── firebaseAuth.js           # Authentification Firebase
│   │   ├── vtoService.js             # ⭐ Service VTO (nouveau)
│   │   ├── imageService.js           # ⭐ Conversion images en base64
│   │   ├── postgresService.js        # Service PostgreSQL/PostgREST
│   │   ├── configValidator.js        # ⭐ Validation configuration
│   │   ├── cacheService.js           # Cache localStorage
│   │   └── api.js                    # Services API génériques
│   ├── config/
│   │   └── config.js                 # Configuration centralisée
│   ├── App.js                        # Composant principal avec workflows
│   ├── App.css                       # Styles globaux (popup/slider)
│   └── index.js                      # Point d'entrée + validation config
├── .env                               # Variables d'environnement
├── .env.example                       # Template de configuration
└── README.md
```

## Design - Noir et Blanc

Le design suit une charte graphique minimaliste :

- **Couleurs principales** : Noir (#000000) et Blanc (#FFFFFF)
- **Couleurs secondaires** : Gris (#666666, #e0e0e0, #f5f5f5)
- **Accent d'erreur** : Rouge (#dc2626)
- **Typographie** : System fonts (San Francisco, Segoe UI, Roboto)
- **Border radius** : 8px pour les inputs, 12px pour les cards
- **Transitions** : 0.2s - 0.3s pour les interactions

## Build pour production

```bash
# Créer le build de production
npm run build

# Les fichiers seront dans le dossier 'build/'
```

## Sécurité

### Firebase Authentication
- Utilise reCAPTCHA invisible pour la vérification anti-bot
- Authentification par SMS sécurisée
- Token JWT pour les appels API

### Caméra
- L'application nécessite l'accès à la caméra
- Doit être servi en HTTPS en production
- L'utilisateur doit explicitement autoriser l'accès

### CORS
Le backend FastAPI est déjà configuré pour autoriser les requêtes CORS. Si vous déployez votre propre instance, configurez les origines autorisées :

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-domain.com",
        "http://localhost:3000",  # Pour le développement
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### postMessage
En production, validez toujours l'origine des messages :

```javascript
window.addEventListener('message', function(event) {
  // Vérifier l'origine
  if (event.origin !== 'https://your-domain.com') return;

  // Traiter le message...
});
```

## Technologies utilisées

- **React 19** - Framework frontend
- **Firebase Authentication** - Authentification par téléphone
- **Create React App** - Tooling et configuration
- **getUserMedia API** - Accès à la caméra
- **postMessage API** - Communication avec la page parente
- **Fetch API** - Requêtes vers le backend FastAPI
- **FastAPI** - Backend VTO (Python)
- **Google Gemini AI** - Génération d'avatars et VTO

## Support

Pour toute question ou problème :
- Vérifiez que Firebase est correctement configuré dans `.env`
- Vérifiez que le backend VTO est accessible : `curl https://iframe-vto-dev-965958056387.europe-west1.run.app/health`
- Vérifiez les permissions de la caméra (HTTPS requis)
- Consultez la console du navigateur pour les erreurs
- Vérifiez que les images sont correctement converties en base64
- Le backend timeout est de 120 secondes, soyez patient pendant la génération VTO

---

Younzee © 2026 - Essayage virtuel nouvelle génération
