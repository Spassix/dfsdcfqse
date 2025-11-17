# Correction affichage vidéo Loading Screen

## Problème résolu

La vidéo uploadée dans l'écran de chargement ne s'affichait pas sur le site.

## Cause

Le code `loading-screen.js` minifié n'utilisait que `background-image` pour afficher le background, sans détecter les vidéos.

## Solution

Modification de `assets/js/loading-screen.js` pour :

1. **Détecter les fichiers vidéo** selon l'extension : `.mp4`, `.mov`, `.webm`, `.ogg`, `.m4v`, `.avi`
2. **Créer un élément `<video>`** avec les attributs :
   - `autoplay` : lecture automatique
   - `muted` : muet (requis pour autoplay sur mobile)
   - `loop` : lecture en boucle
   - `playsinline` : lecture inline sur mobile
3. **Détecter le type MIME** selon l'extension pour le `<source>`

## Code ajouté

```javascript
function getVideoType(url) {
  const ext = url.split('.').pop().toLowerCase();
  const types = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mov': 'video/quicktime',
    'm4v': 'video/mp4',
    'avi': 'video/x-msvideo'
  };
  return types[ext] || 'video/mp4';
}

// Dans renderLoadingScreen()
const isVideo = config.background && /\.(mp4|mov|webm|ogg|m4v|avi)$/i.test(config.background);

if (isVideo) {
  html = `
    <video class="video-bg" autoplay muted loop playsinline>
      <source src="${config.background}" type="${getVideoType(config.background)}">
    </video>
    <div class="loading-content">...</div>
  `;
}
```

## Formats supportés

- ✅ MP4 (`.mp4`, `.m4v`)
- ✅ WebM (`.webm`)
- ✅ Ogg (`.ogg`)
- ✅ QuickTime (`.mov`)
- ✅ AVI (`.avi`)

## CSS déjà présent

Le CSS `.video-bg` était déjà configuré dans `loading.css` :

```css
.loading-screen .video-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}
```

## Déploiement

✅ Fichier minifié  
✅ Déployé sur **https://mexicain59.vercel.app**

## Résultat

Maintenant, quand vous uploadez une vidéo dans l'écran de chargement :
- ✅ La vidéo se détecte automatiquement
- ✅ Elle s'affiche en plein écran en fond
- ✅ Elle joue automatiquement en boucle
- ✅ Elle est muette (compatible mobile)

🎉 C'est prêt !

