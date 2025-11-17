# 🔧 Configuration Upstash - Base de données partagée

## 🎯 Base de données partagée entre boutiques

Cette configuration utilise **LA MÊME base de données Upstash** pour partager les produits, catégories, farms, etc. entre plusieurs boutiques.

### Instance Upstash partagée - pumped-flamingo-35383

Configurez ces variables dans **Settings → Environment Variables** sur Vercel :

#### Variables principales (OBLIGATOIRES)
- **UPSTASH_REDIS_REST_URL** : `https://pumped-flamingo-35383.upstash.io`
- **UPSTASH_REDIS_REST_TOKEN** : `AYo3AAIncDJiMDJkNjRjZDBmYTI0OTVjODI2NGZhZjFiNDg3OTQ5OHAyMzUzODM`

#### Variables supplémentaires (RECOMMANDÉES)
- **BLOB_READ_WRITE_TOKEN** : (À copier depuis l'ancienne boutique)
- **JWT_SECRET** : (Générer un secret unique pour cette boutique)
- **DEFAULT_ADMIN_USERNAME** : `admin`
- **DEFAULT_ADMIN_PASSWORD** : (Mot de passe sécurisé pour l'admin)

**⚠️ Important** : Cochez toutes les cases pour **Production**, **Preview**, et **Development**

## 🔄 Partage de la base de données

### ✅ Avantages
- Les produits sont synchronisés entre toutes les boutiques
- Une modification sur une boutique est visible sur toutes les autres
- Gestion centralisée des données

### ⚠️ Points d'attention
- Les 2 boutiques partagent **EXACTEMENT** les mêmes données
- Si vous supprimez un produit sur une boutique, il est supprimé partout
- Les utilisateurs admin sont partagés (utilisez des JWT_SECRET différents)

## 🚀 Déploiement

Après avoir configuré les variables d'environnement dans Vercel :

```bash
# Redéployer en production
vercel --prod
```

Ou via le dashboard Vercel en poussant vers votre repository Git.

## 📍 Initialisation de l'admin (première fois)

Après le déploiement, initialisez l'utilisateur admin :

```bash
# Visitez cette URL une seule fois
https://votre-boutique.vercel.app/api/init
```

Vous devriez voir :
```json
{
  "success": true,
  "message": "Database initialized"
}
```

## ✅ Vérification

Pour vérifier que les variables sont bien configurées :

```bash
# Vérifier les variables d'environnement
curl "https://votre-boutique.vercel.app/api/db/config.json?debug=1"
```

Vous devriez voir :
```json
{
  "ok": true,
  "env": {
    "UPSTASH_REDIS_REST_URL": true,
    "UPSTASH_REDIS_REST_TOKEN": true
  }
}
```

## 📝 Notes

- **Instance partagée** : `pumped-flamingo-35383.upstash.io`
- Toutes les boutiques utilisant ces credentials partagent la même base
- Pour des boutiques indépendantes, créez une nouvelle base Upstash

