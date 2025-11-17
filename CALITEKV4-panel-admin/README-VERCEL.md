# Déploiement Vercel avec Chiffrement

Ce projet est configuré pour être déployé sur Vercel avec un système de chiffrement des fichiers JavaScript sensibles.

## 🔐 Système de Chiffrement

- **Méthode**: Chiffrement XOR simple (pour la compatibilité navigateur)
- **Fichiers protégés**: Tous les scripts JS de l'admin (20 fichiers)
- **Déchiffrement**: Automatique côté client via `decryptor.js`

## 🚀 Déploiement

### Option 1: Déploiement automatique
```bash
# Vercel détectera automatiquement le build command
vercel --prod
```

### Option 2: Build manuel puis déploiement
```bash
# 1. Chiffrer les fichiers
npm run encrypt

# 2. Build complet (chiffrement + nettoyage)
npm run build

# 3. Déployer
vercel --prod
```

## 📁 Structure après build

```
admin/js/
├── admin.encrypted.js      # Scripts chiffrés
├── auth.encrypted.js
├── backend.encrypted.js
└── ... (20 fichiers chiffrés)

assets/js/
└── decryptor.js            # Déchiffreur côté client

admin/index.html            # Modifié pour utiliser le déchiffreur
```

## 🔧 Configuration

### Fichiers de configuration Vercel
- `vercel.json`: Configuration de déploiement
- `api/[...path].js`: API serverless (lecture seule)
- `.vercelignore`: Fichiers exclus du déploiement

### Scripts disponibles
- `npm run encrypt`: Chiffrer les fichiers JS
- `npm run build`: Build complet pour Vercel
- `npm start`: Serveur local de développement

## 🛡️ Sécurité

1. **Fichiers originaux supprimés**: Les `.js` originaux sont supprimés après chiffrement
2. **Clé de chiffrement**: Stockée dans le code (à changer en production)
3. **Déchiffrement côté client**: Les scripts sont déchiffrés dans le navigateur
4. **API en lecture seule**: Vercel ne permet pas l'écriture des fichiers JSON

## 🔄 Développement local

Pour le développement local, utilisez le serveur Node.js:
```bash
npm start
```

Le serveur local permet l'écriture des fichiers JSON et charge les scripts non-chiffrés.

## ⚠️ Notes importantes

- Les fichiers chiffrés ne sont pas lisibles directement
- Le déchiffrement se fait côté client (visible dans les DevTools)
- Pour une sécurité maximale, changez la clé de chiffrement
- L'API Vercel est en lecture seule (pas de modification des données)

## 🐛 Dépannage

### Erreur de déchiffrement
- Vérifiez que `decryptor.js` est chargé
- Vérifiez que les fichiers `.encrypted.js` existent
- Vérifiez la console pour les erreurs

### Erreur de build
- Vérifiez que Node.js >= 18 est installé
- Vérifiez que tous les fichiers JS existent avant le chiffrement


