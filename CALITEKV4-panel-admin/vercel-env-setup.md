# 🔧 Configuration des variables d'environnement Vercel

## 🎯 Base de données partagée

Cette configuration permet de **partager la même base de données Upstash** entre plusieurs boutiques.

## 📋 Instructions pour configurer les variables dans Vercel Dashboard

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez/modifiez les variables suivantes :

### Variables principales (OBLIGATOIRES - Partagées)

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `UPSTASH_REDIS_REST_URL` | `https://pumped-flamingo-35383.upstash.io` | ✅ Production, ✅ Preview, ✅ Development |
| `UPSTASH_REDIS_REST_TOKEN` | `AYo3AAIncDJiMDJkNjRjZDBmYTI0OTVjODI2NGZhZjFiNDg3OTQ5OHAyMzUzODM` | ✅ Production, ✅ Preview, ✅ Development |
| `BLOB_READ_WRITE_TOKEN` | (Copier depuis l'ancienne boutique) | ✅ Production, ✅ Preview, ✅ Development |

### Variables de sécurité (NOUVELLES - Uniques par boutique)

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `JWT_SECRET` | (Générer un secret unique, ex: `ton-secret-unique-123`) | ✅ Production, ✅ Preview, ✅ Development |
| `DEFAULT_ADMIN_USERNAME` | `admin` | ✅ Production, ✅ Preview, ✅ Development |
| `DEFAULT_ADMIN_PASSWORD` | (Mot de passe sécurisé, ex: `MotDePasseSecure2025!`) | ✅ Production, ✅ Preview, ✅ Development |
| `NODE_ENV` | `production` | ✅ Production, ✅ Preview, ✅ Development |

## ⚠️ Important

- **Les 3 premières variables** (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `BLOB_READ_WRITE_TOKEN`) doivent être **IDENTIQUES** à l'ancienne boutique pour partager la base
- **Les variables JWT** doivent être **UNIQUES** pour chaque boutique (sécurité)
- **Cochez TOUTES les cases** (Production, Preview, Development) pour chaque variable
- Après avoir ajouté les variables, **redéployez** le projet

## 🚀 Après configuration

1. Redéployez le projet via le dashboard Vercel ou utilisez :
   ```bash
   vercel --prod
   ```

2. Initialisez l'admin (une seule fois) :
   ```
   https://votre-boutique.vercel.app/api/init
   ```

3. Vérifiez que tout fonctionne :
   ```bash
   curl "https://votre-boutique.vercel.app/api/db/config.json?debug=1"
   ```

## 📝 Notes

- **Instance partagée** : `pumped-flamingo-35383.upstash.io`
- Toutes les boutiques avec ces credentials partagent la même base de données
- Les produits, catégories, farms sont synchronisés entre toutes les boutiques

