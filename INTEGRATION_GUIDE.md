# 🚀 Guide d'intégration Younzee VTO

Guide complet pour intégrer l'iframe Younzee sur votre site e-commerce.

---

## 📋 Vue d'ensemble

L'iframe Younzee est une solution clé en main qui contient :
- ✅ Animations desktop (popup latérale droite) et mobile (slider du bas)
- ✅ Authentification Firebase par téléphone
- ✅ Capture de selfie et collecte de mensurations
- ✅ Intégration backend VTO
- ✅ Recommandations de taille (3 coupes : Fit, Idéal, Oversize)

**Vous devez simplement :**
1. Héberger l'iframe sur votre domaine (Netlify, Vercel, etc.)
2. Ajouter un bouton "Essayer virtuellement" sur vos pages produit
3. Gérer la communication entre votre page et l'iframe

---

## 🛍️ Intégration Shopify

### Fichiers fournis

- **[shopify-integration.liquid](public/shopify-integration.liquid)** - Code d'intégration complet
- **[shopify-product-page-example.html](public/shopify-product-page-example.html)** - Aperçu visuel

### Installation (5 minutes)

1. **Créer le snippet**
   - Allez dans `Online Store > Themes > Actions > Edit code`
   - Créez un nouveau snippet : `snippets/younzee-vto.liquid`
   - Copiez le contenu de `shopify-integration.liquid`

2. **Configurer l'URL**
   Dans le snippet, modifiez :
   ```liquid
   {% assign younzee_iframe_url = "https://votre-domaine-younzee.netlify.app" %}
   ```

3. **Inclure dans le thème**
   Dans `layout/theme.liquid`, ajoutez avant `</body>` :
   ```liquid
   {% render 'younzee-vto' %}
   ```

4. **Enregistrer et tester**
   - Allez sur une page produit
   - Le bouton "Essayer virtuellement" apparaît sous le bouton "Ajouter au panier"
   - Cliquez pour ouvrir l'iframe

### Personnalisation

**Changer la position du bouton :**
Déplacez le code du bouton dans le snippet vers l'emplacement souhaité dans votre thème.

**Modifier le style du bouton :**
Éditez la section CSS du snippet :
```css
.younzee-cta-button {
  background: #000000;  /* Changez la couleur */
  color: #ffffff;
  /* ... */
}
```

**Personnaliser les propriétés du panier :**
Dans la fonction `addToShopifyCart()`, modifiez :
```javascript
properties: {
  'Taille recommandée': size,
  'Type de coupe': fitType,
  // Ajoutez vos propriétés personnalisées
}
```

---

## 🌐 Intégration Site Classique

### Fichiers fournis

- **[integration-snippet.html](public/integration-snippet.html)** - Code d'intégration complet
- **[parent-integration-example.html](public/parent-integration-example.html)** - Exemple détaillé

### Installation (10 minutes)

Le fichier `integration-snippet.html` contient 3 sections à copier :

#### 1. CSS (dans `<head>`)

```html
<link rel="stylesheet" href="path/to/younzee-styles.css">
<!-- OU copiez directement le CSS -->
```

#### 2. Bouton HTML (sur la page produit)

```html
<div class="younzee-cta-wrapper">
  <button id="younzee-open-button" class="younzee-cta-button">
    <svg>...</svg>
    Essayer virtuellement
  </button>
  <div class="younzee-badge">
    powered by <strong>Younzee</strong>
  </div>
</div>

<div id="younzee-iframe-container" class="younzee-iframe-container">
  <iframe id="younzee-iframe" src="" allow="camera"></iframe>
</div>
```

#### 3. JavaScript (avant `</body>`)

**À adapter selon votre site :**

```javascript
// 1. Configurer l'URL
const YOUNZEE_IFRAME_URL = 'https://votre-domaine-younzee.netlify.app';

// 2. Récupérer les données du produit
function getCurrentProductData() {
  // ADAPTEZ SELON VOTRE STRUCTURE
  return {
    id: 'PRODUCT-123',
    name: document.querySelector('.product-title')?.textContent,
    imageUrl: document.querySelector('.product-image')?.src,
  };
}

// 3. Ajouter au panier
function addToCart(productId, size, fitType) {
  // ADAPTEZ SELON VOTRE SYSTÈME
  fetch('/api/cart/add', {
    method: 'POST',
    body: JSON.stringify({ productId, size, fitType })
  });
}
```

### Détection automatique du produit

Le code fourni inclut 3 méthodes de détection :

**1. Data attributes**
```html
<div data-product-id="123" data-product-image="...">
```

**2. Meta tags OpenGraph**
```html
<meta property="og:title" content="T-shirt">
<meta property="og:image" content="https://...">
```

**3. JSON-LD (schema.org)**
```html
<script type="application/ld+json">
{
  "@type": "Product",
  "name": "T-shirt",
  "image": "https://...",
  "sku": "TSHIRT-001"
}
</script>
```

---

## 📡 API de communication

### Messages envoyés par l'iframe

#### `REQUEST_CLOTHING_ITEM`
L'iframe demande les infos du produit.

```javascript
// Répondre avec les données
iframe.contentWindow.postMessage({
  type: 'CLOTHING_ITEM_DATA',
  item: {
    id: 'PRODUCT-123',
    name: 'T-shirt',
    imageUrl: 'https://example.com/image.jpg', // Sera converti en base64
    category: 'tshirt',
    price: '49.99'
  }
}, '*');
```

#### `ADD_TO_CART`
L'utilisateur veut ajouter au panier avec la taille recommandée.

```javascript
if (event.data.type === 'ADD_TO_CART') {
  const { size, fitType } = event.data;
  // size: 'M', 'L', etc.
  // fitType: 'fit', 'ideal', 'oversize'

  addToCart(productId, size, fitType);
}
```

#### `YOUNZEE_CLOSED`
L'iframe a été fermée par l'utilisateur.

```javascript
if (event.data.type === 'YOUNZEE_CLOSED') {
  // Fermer le container
  container.style.display = 'none';
}
```

### Messages envoyés à l'iframe

#### `OPEN_YOUNZEE`
Ouvrir la popup Younzee.

```javascript
iframe.contentWindow.postMessage({
  type: 'OPEN_YOUNZEE'
}, '*');
```

#### `CLOSE_YOUNZEE`
Fermer la popup Younzee.

```javascript
iframe.contentWindow.postMessage({
  type: 'CLOSE_YOUNZEE'
}, '*');
```

---

## 🎨 Positionnement du bouton

### Sur la page produit

**Position recommandée :**
- Sous le bouton "Ajouter au panier"
- Au-dessus de la description produit
- Dans la zone d'achat principale

**Mobile :**
- Le bouton prend toute la largeur
- Reste visible au scroll

### Personnalisation

```css
/* Bouton pleine largeur */
.younzee-cta-button {
  width: 100%;
}

/* Bouton compact à côté du "Ajouter au panier" */
.younzee-cta-button {
  width: auto;
  display: inline-flex;
}

/* Changer la couleur */
.younzee-cta-button {
  background: #your-brand-color;
  border-color: #your-brand-color;
}
```

---

## 🔧 Configuration avancée

### Préchargement de l'iframe

Pour améliorer les performances :

```javascript
// Précharger au survol du bouton
openButton.addEventListener('mouseenter', function() {
  if (!iframe.src) {
    iframe.src = YOUNZEE_IFRAME_URL;
  }
}, { once: true });
```

### Validation de l'origine

**Important en production :**

```javascript
window.addEventListener('message', function(event) {
  // Vérifier l'origine
  if (event.origin !== 'https://votre-domaine-younzee.com') {
    console.warn('Message non autorisé:', event.origin);
    return;
  }
  // Traiter le message
});
```

### Analytics

Tracker les ouvertures et conversions :

```javascript
// Ouverture de l'iframe
function openYounzee() {
  // Google Analytics
  gtag('event', 'younzee_opened', {
    product_id: productData.id
  });

  // Facebook Pixel
  fbq('trackCustom', 'YounzeeOpened');
}

// Ajout au panier via Younzee
if (event.data.type === 'ADD_TO_CART') {
  gtag('event', 'add_to_cart_younzee', {
    size: event.data.size,
    fit_type: event.data.fitType
  });
}
```

---

## ✅ Checklist de déploiement

### Avant de déployer

- [ ] Iframe déployée sur votre domaine
- [ ] Variables d'environnement configurées (.env)
- [ ] Firebase Authentication activée
- [ ] Backend VTO connecté et testé
- [ ] URL iframe correcte dans le code d'intégration

### Tests à effectuer

- [ ] Bouton "Essayer virtuellement" visible sur page produit
- [ ] Clic sur le bouton ouvre l'iframe
- [ ] Iframe récupère bien les données du produit
- [ ] Image du vêtement s'affiche correctement
- [ ] Authentification par téléphone fonctionne
- [ ] Capture de selfie fonctionne (autorisation caméra)
- [ ] Recommandations de taille s'affichent
- [ ] Bouton "Ajouter au panier" envoie le message
- [ ] Produit ajouté au panier avec la bonne taille
- [ ] Iframe se ferme correctement (X ou Échap)
- [ ] Responsive mobile fonctionne

### Tests mobile

- [ ] Iframe monte du bas de l'écran
- [ ] Animations fluides
- [ ] Caméra fonctionne sur mobile
- [ ] Bouton "Ajouter au panier" accessible
- [ ] Scroll fonctionne dans l'iframe

---

## 🐛 Débogage

### L'iframe ne s'ouvre pas

1. Vérifier la console : `Ctrl+Shift+J` (Chrome)
2. Vérifier l'URL de l'iframe dans le code
3. Vérifier que l'iframe est bien chargée : `iframe.src`

### Les données du produit ne sont pas envoyées

1. Ouvrir la console
2. Vérifier les logs : `📩 Message reçu`, `✅ Données envoyées`
3. Vérifier `getCurrentProductData()` retourne bien un objet
4. Vérifier l'URL de l'image du produit

### L'ajout au panier ne fonctionne pas

1. Vérifier la fonction `addToCart()`
2. Tester manuellement l'ajout au panier
3. Vérifier les propriétés envoyées

### Problèmes de caméra

1. Vérifier que le site est en HTTPS
2. Vérifier l'attribut `allow="camera"` sur l'iframe
3. Tester sur un autre navigateur

---

## 📞 Support

Pour toute question :
- Documentation : [README.md](README.md)
- Exemples : [public/](public/)
- Issues : https://github.com/younzee/iframe/issues

---

**Younzee © 2026** - Virtual Try-On nouvelle génération
