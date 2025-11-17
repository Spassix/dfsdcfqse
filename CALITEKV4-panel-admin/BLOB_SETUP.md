# Guide d'installation - Vercel Blob Storage

Ce guide explique comment configurer Vercel Blob Storage pour l'upload de fichiers.

## 📋 Étapes de configuration

### 1. Installer les dépendances

```bash
npm install
```

Cela installera le package `@vercel/blob` ajouté dans `package.json`.

### 2. Configurer la variable d'environnement dans Vercel

1. Allez sur le dashboard Vercel de votre projet
2. Ouvrez **Settings** → **Environment Variables**
3. Ajoutez la variable suivante :
   - **Nom** : `BLOB_READ_WRITE_TOKEN`
   - **Valeur** : `vercel_blob_rw_HsEkoB7euo5UKQrN_PI7BdOQztpTsDGtVvxeYDAkMKlD7JP`
   - **Environnements** : Cochez **Production**, **Preview**, et **Development** (si vous testez en local)

### 3. Déployer sur Vercel

Une fois la variable d'environnement ajoutée, déployez votre projet :

```bash
vercel --prod
```

Ou via le dashboard Vercel en poussant vers votre repository Git.

## 🔧 Configuration locale (optionnel)

Pour tester en local, créez un fichier `.env.local` à la racine du projet :

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_HsEkoB7euo5UKQrN_PI7BdOQztpTsDGtVvxeYDAkMKlD7JP
```

**⚠️ Important** : Ajoutez `.env.local` au `.gitignore` pour ne pas commit le token !

## 📝 Comment ça fonctionne

### Côté client (admin panel)

L'interface d'administration utilise la méthode `backendAPI.uploadFile()` qui :
1. Convertit le fichier en base64 (DataURL)
2. Envoie une requête POST à `/api/upload` avec le fichier en JSON
3. Reçoit l'URL publique du fichier depuis Vercel Blob
4. Utilise cette URL pour remplacer les DataURL trop volumineux

### Côté serveur (`api/upload.js`)

La route API :
1. Reçoit le fichier en base64 via JSON
2. Convertit en Buffer
3. Upload vers Vercel Blob avec un nom de fichier unique
4. Retourne l'URL publique du fichier

## 🎯 Utilisation dans le code

L'upload se fait automatiquement quand vous utilisez les boutons "Upload" dans le panel admin :

- **Configuration** → Image de fond du site
- **Produits** → Média (photo/vidéo)
- **Panier** → Image d'en-tête
- **Écran de chargement** → Fond d'écran / Logo

## ⚠️ Sécurité

**Important** : Le token fourni a été exposé publiquement. Vous devriez :
1. Le révoquer dans le dashboard Vercel Blob Store
2. En générer un nouveau
3. Mettre à jour la variable d'environnement avec le nouveau token

Pour révoquer/générer un nouveau token :
- Allez sur votre projet Vercel
- **Storage** → **Blob Stores** → Votre store (`la-fabrique92-blob`)
- **Settings** → Gérer les tokens

## 🐛 Dépannage

### Erreur : "token Blob manquant"
- Vérifiez que la variable `BLOB_READ_WRITE_TOKEN` est bien configurée dans Vercel
- Redéployez le projet après avoir ajouté la variable

### Erreur : "Erreur upload"
- Vérifiez les logs Vercel Functions pour plus de détails
- Assurez-vous que le token n'a pas expiré ou été révoqué

### Les fichiers sont toujours stockés en DataURL
- Vérifiez que `backendUrl` est bien configuré dans la page Configuration du panel admin
- Vérifiez la console du navigateur pour les erreurs réseau

## 📚 Documentation

- [Vercel Blob Storage Docs](https://vercel.com/docs/storage/vercel-blob)
- [@vercel/blob Package](https://www.npmjs.com/package/@vercel/blob)



