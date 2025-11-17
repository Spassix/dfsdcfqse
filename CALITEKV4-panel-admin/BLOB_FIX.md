# Correction des uploads Blob

## Problème 1 résolu (ancien)

Les uploads de fichiers volumineux (>2MB) dans les sections **Config**, **Loading**, et **Cart Config** n'utilisaient pas Vercel Blob. Ils étaient limités à 2MB car ils utilisaient uniquement `readFileAsDataURL` qui convertit les fichiers en DataURL pour localStorage.

## Problème 2 résolu (03/11/2025)

Les boutons upload ne fonctionnaient pas sur Vercel car la méthode `backendAPI.uploadFile()` utilisait l'API REST obsolète de Vercel Blob. La correction utilise maintenant l'API serverless `blob-upload.js` existante.

## Fichiers modifiés

### 1. `admin/js/backend.js` ⭐ CORRECTION PRINCIPALE
- **Upload method** : Remplacement de l'appel API REST obsolète par l'appel à `/api/blob-upload`
- **Headers** : Utilisation de `x-vercel-blob-file-name` et `x-vercel-blob-pathname` pour passer les métadonnées

### 2. `vercel.json`
- **CORS** : Ajout des headers pour `/api/blob-upload` et `/api/blob-token`
- **Support** : Configuration correcte pour les uploads multi-part

### 3. `admin/js/config.js`
- **Upload fond d'écran site** : Maintenant utilise `backendAPI.uploadFile()` pour les fichiers volumineux
- **Uploads sections d'accueil** : Maintenant utilisent `backendAPI.uploadFile()` pour les fichiers volumineux

### 4. `admin/js/loading.js`
- **Upload background loading** : Maintenant utilise `backendAPI.uploadFile()` pour les fichiers volumineux
- **Upload logo loading** : Maintenant utilise `backendAPI.uploadFile()` pour les fichiers volumineux

### 5. `admin/js/cart-config.js`
- **Upload bannière panier** : Maintenant utilise `backendAPI.uploadFile()` pour les fichiers volumineux

## Logique implémentée

Tous les uploads suivent maintenant la même logique que `products.js` :

1. **Si backend configuré** → Upload direct vers Vercel Blob (sans limite de taille)
2. **Si pas de backend** → Fallback localStorage avec limite 2MB (pour éviter QuotaExceeded)

```javascript
const hasBackend = backendAPI.baseUrl && backendAPI.baseUrl.trim() !== '';

if (hasBackend) {
  // Upload vers Vercel Blob
  const uploadResult = await backendAPI.uploadFile(file, 'config');
  // ...
} else {
  // Fallback localStorage (max 2MB)
  if (fileSize > 2 * 1024 * 1024) {
    // Afficher erreur
    return;
  }
  // Convertir en DataURL
  mediaUrl = await AdminUtils.readFileAsDataURL(file);
}
```

## Déploiement

### 03/11/2025
✅ Correction de `backend.js` - Utilisation de l'API `/api/blob-upload` au lieu de l'API REST obsolète  
✅ Ajout des headers CORS dans `vercel.json` pour les routes blob  
✅ Chiffrement des fichiers avec `encrypt.js`  
✅ Déployé sur Vercel : **https://theplug-website.vercel.app**

### Ancien déploiement
✅ Tous les fichiers ont été chiffrés avec `encrypt.js`  
✅ Déployé sur Vercel : **https://mexicain59.vercel.app**

## Résultat

Maintenant, tous les uploads de fichiers volumineux (vidéos, images HD, etc.) dans :
- ✅ Config (fond d'écran, sections d'accueil)
- ✅ Loading Screen (background, logo)
- ✅ Cart Config (bannière)
- ✅ Products (déjà fonctionnel)

...utilisent automatiquement Vercel Blob pour des uploads sans limite de taille ! 🎉


