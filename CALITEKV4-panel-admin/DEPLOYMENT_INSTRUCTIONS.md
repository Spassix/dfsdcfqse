# 🚀 Instructions de déploiement - plug-certifie

## ✅ Modifications effectuées

1. ✅ **Nouveau fichier CSS moderne** créé : `assets/css/modern-theme.css`
2. ✅ **Package.json** mis à jour avec le nouveau nom : `plug-certifie-website`
3. ✅ **Documentation** créée pour les nouvelles variables Upstash

## 📋 Étapes de configuration

### 1. Configurer les variables d'environnement dans Vercel

Allez sur https://vercel.com/dashboard et configurez ces variables dans **Settings → Environment Variables** :

#### Variables principales (OBLIGATOIRES - Partagées)
```
UPSTASH_REDIS_REST_URL = https://pumped-flamingo-35383.upstash.io
UPSTASH_REDIS_REST_TOKEN = AYo3AAIncDJiMDJkNjRjZDBmYTI0OTVjODI2NGZhZjFiNDg3OTQ5OHAyMzUzODM
BLOB_READ_WRITE_TOKEN = (Copier depuis l'ancienne boutique)
```

#### Variables de sécurité (OBLIGATOIRES - Uniques par boutique)
```
JWT_SECRET = ton-secret-unique-123
DEFAULT_ADMIN_USERNAME = admin
DEFAULT_ADMIN_PASSWORD = MotDePasseSecure2025!
NODE_ENV = production
```

**⚠️ IMPORTANT** : Cochez **Production**, **Preview**, et **Development** pour chaque variable !

### 2. Supprimer les anciennes variables (optionnel)

Si vous avez des variables liées à l'ancienne instance `choice-sunbeam-5206`, vous pouvez les supprimer.

### 3. Redéployer le projet

#### Option A : Via Vercel Dashboard
1. Allez sur votre projet dans Vercel
2. Cliquez sur **Deployments**
3. Cliquez sur les 3 points (⋯) du dernier déploiement
4. Sélectionnez **Redeploy**

#### Option B : Via Vercel CLI
```bash
# Installer Vercel CLI si ce n'est pas déjà fait
npm install -g vercel

# Se connecter à Vercel
vercel login

# Déployer en production
vercel --prod
```

#### Option C : Via PowerShell (script fourni)
```powershell
.\deploy.ps1
```

### 4. Vérifier le déploiement

Une fois déployé, vérifiez que tout fonctionne :

```bash
# Vérifier les variables d'environnement
curl "https://plug-certifie.vercel.app/api/db/config.json?debug=1"
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

## 🌐 URLs

- **Production** : https://plug-certifie.vercel.app
- **Preview** : https://plug-certifie-cgijqx6nu-juniors-projects-a34b718b.vercel.app

## 📝 Notes importantes

1. **Les variables d'environnement doivent être configurées AVANT le redéploiement**
2. Si vous redéployez sans configurer les variables, l'application ne pourra pas se connecter à Upstash
3. Après le redéploiement, attendez quelques secondes avant de tester

## 🔍 Dépannage

Si vous rencontrez des erreurs :

1. **Vérifiez que toutes les variables sont bien configurées** dans Vercel Dashboard
2. **Vérifiez que les variables sont cochées** pour Production, Preview et Development
3. **Attendez 1-2 minutes** après le déploiement pour que les variables soient propagées
4. **Videz le cache** de votre navigateur si nécessaire

## 📚 Fichiers de référence

- `UPSTASH_CONFIG.md` - Configuration détaillée des variables Upstash
- `vercel-env-setup.md` - Guide pas à pas pour configurer Vercel
- `deploy.ps1` - Script PowerShell pour automatiser le déploiement

