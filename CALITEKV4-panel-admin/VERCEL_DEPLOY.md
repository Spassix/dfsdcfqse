# 🚀 Déploiement Vercel - Plug Certifié

## ✅ Configuration terminée

Le projet **plug-certifie** est maintenant configuré et déployé sur Vercel.

### 📋 Informations du projet

- **Projet Vercel** : `plug-certifie`
- **Organisation** : `juniors-projects-a34b718b`
- **URL Production** : https://plug-certifie.vercel.app
- **Token Vercel** : Configuré et sauvegardé

## 🔧 Déploiement

### Méthode 1 : Script PowerShell (Recommandé)

```powershell
.\deploy.ps1
```

### Méthode 2 : Ligne de commande directe

```powershell
# Avec le token dans la variable d'environnement
$env:VERCEL_TOKEN="FKHFki1lJCkmAlJPGERAKtel"
vercel --token $env:VERCEL_TOKEN --prod --yes

# Ou simplement (si le projet est déjà lié)
vercel --prod --yes
```

### Méthode 3 : Via Vercel CLI

```bash
vercel --prod
```

## 🔐 Token Vercel

Le token Vercel est configuré dans le système. Pour les déploiements futurs :

1. **Option 1** : Le token est déjà sauvegardé dans Vercel CLI (recommandé)
2. **Option 2** : Utiliser la variable d'environnement `VERCEL_TOKEN`
3. **Option 3** : Utiliser le flag `--token` avec la commande vercel

## 📝 Variables d'environnement Vercel

Assurez-vous que les variables suivantes sont configurées dans le dashboard Vercel :

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `UPSTASH_KV_REST_API_URL`
- `UPSTASH_KV_REST_API_TOKEN`
- `UPSTASH_KV_REST_API_READ_ONLY_TOKEN`

Voir `vercel-env-setup.md` pour plus de détails.

## 🌐 URLs du projet

- **Production** : https://plug-certifie.vercel.app
- **Dashboard** : https://vercel.com/juniors-projects-a34b718b/plug-certifie

## 🔄 Commandes utiles

```bash
# Voir les logs d'un déploiement
vercel inspect <deployment-url> --logs

# Redéployer un déploiement spécifique
vercel redeploy <deployment-url>

# Lister les déploiements
vercel ls

# Voir les informations du projet
vercel project ls
```

## ⚠️ Notes importantes

- Le dossier `.vercel` contient la configuration du projet (ne pas commiter)
- Le token Vercel est sensible, ne le partagez jamais publiquement
- Les variables d'environnement doivent être configurées dans le dashboard Vercel

