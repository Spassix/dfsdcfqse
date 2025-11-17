# 🚨 CONFIGURATION URGENTE - Connecter le Panel Admin à Upstash

## ❌ Problème Actuel

Votre panel admin n'est **PAS connecté à Upstash Redis** où sont stockées vos données :
- ❌ Produits invisibles
- ❌ Catégories invisibles  
- ❌ Farms invisibles
- ❌ Tout est vide

## ✅ Solution : Configurer les Variables d'Environnement

### Étape 1 : Aller sur Vercel

1. Allez sur https://vercel.com/dashboard
2. Cliquez sur votre projet **CALITEKV4**
3. Allez dans **Settings** (en haut)
4. Cliquez sur **Environment Variables** (dans le menu de gauche)

### Étape 2 : Vérifier les Variables Existantes

Vous devez avoir ces variables (si elles existent déjà, passez à l'Étape 3) :

```
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxx
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

### Étape 3 : Appliquer aux Branches

**CRITIQUE** : Vérifiez que ces variables sont appliquées à :
- ✅ Production
- ✅ Preview (toutes les branches)
- ✅ Development

**Comment vérifier :**
1. Cliquez sur chaque variable
2. Vérifiez que **"Preview"** est coché
3. Si ce n'est pas le cas, éditez et cochez **"Preview"**
4. Cliquez sur **Save**

### Étape 4 : Redéployer

Une fois les variables configurées :
1. Allez dans l'onglet **Deployments**
2. Trouvez le dernier déploiement de la branche `panel-admin`
3. Cliquez sur les 3 points (•••)
4. Cliquez sur **Redeploy**

---

## 🔍 Comment Savoir si Vos Données Sont dans Upstash ?

### Option 1 : Vérifier depuis Upstash Dashboard

1. Allez sur https://console.upstash.com/
2. Connectez-vous avec votre compte
3. Cliquez sur votre base Redis
4. Allez dans **Data Browser**
5. Cherchez les clés qui commencent par `data:`
   - `data:products` → Vos produits
   - `data:categories` → Vos catégories
   - `data:farms` → Vos farms
   - `data:socials` → Vos réseaux sociaux

**Si vous voyez ces clés avec des données** ✅ → Vos données sont bien dans Upstash !
**Si vous ne voyez rien** ❌ → Il faut migrer vos données

### Option 2 : Tester l'API Directement

Ouvrez votre navigateur et allez sur :

```
https://votre-site.vercel.app/api/db/products
```

**Si vous voyez vos produits en JSON** ✅ → Les APIs fonctionnent !
**Si vous voyez `[]` ou une erreur** ❌ → Problème de configuration

---

## 🆘 Cas 1 : Les Variables Sont Déjà Configurées

Si les variables Upstash sont déjà configurées sur Vercel mais le panel admin ne voit rien :

**Solution :** Redéployez la branche `panel-admin`

---

## 🆘 Cas 2 : Vous N'Avez Pas les Variables Upstash

Si vous n'avez jamais configuré Upstash, suivez ce guide :

### Créer une Base de Données Upstash (si vous n'en avez pas)

1. Allez sur https://console.upstash.com/
2. Créez un compte (gratuit)
3. Cliquez sur **Create Database**
4. Donnez un nom (ex: `calitekv4-db`)
5. Choisissez une région proche de vous
6. Cliquez sur **Create**

### Récupérer les Credentials

Une fois la base créée :
1. Cliquez sur votre base de données
2. Vous verrez :
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**
3. Copiez ces valeurs

### Ajouter les Variables sur Vercel

1. Retournez sur Vercel → Votre projet → Settings → Environment Variables
2. Cliquez sur **Add New**
3. Ajoutez :
   - Name: `UPSTASH_REDIS_REST_URL`
   - Value: (collez l'URL copiée)
   - Environments: **✅ Production, ✅ Preview, ✅ Development**
4. Cliquez sur **Save**
5. Répétez pour `UPSTASH_REDIS_REST_TOKEN`

### Pour Vercel Blob (Upload d'Images)

1. Allez dans **Storage** (menu de gauche sur Vercel)
2. Créez un **Blob Store** si vous n'en avez pas
3. Le token `BLOB_READ_WRITE_TOKEN` sera automatiquement créé

---

## 🔄 Cas 3 : Migrer Vos Anciennes Données vers Upstash

Si vos données sont ailleurs (localStorage, autres fichiers JSON, ancienne base) :

### Option A : Via l'API Init

Allez sur cette URL dans votre navigateur :

```
https://votre-site.vercel.app/api/init
```

Cela créera le compte admin par défaut dans Upstash.

### Option B : Importer Manuellement

Si vous avez vos données dans des fichiers JSON :

1. Ouvrez le panel admin
2. Créez manuellement vos :
   - Catégories
   - Farms  
   - Produits
3. Les données seront automatiquement sauvegardées dans Upstash

---

## ✅ Vérification Finale

Une fois tout configuré :

1. Allez sur : `https://votre-site-panel-admin.vercel.app/admin`
2. Connectez-vous : `admin` / `admin@123@123`
3. Allez dans **Produits**

**✅ Vous devriez voir vos produits !**

Si ce n'est toujours pas le cas :
1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet **Console**
3. Rechargez la page
4. Cherchez les erreurs en rouge
5. Envoyez-moi une capture d'écran des erreurs

---

## 📞 Checklist de Dépannage

- [ ] Variables Upstash configurées sur Vercel ?
- [ ] Variables appliquées à "Preview" et "Production" ?
- [ ] Branche `panel-admin` redéployée après configuration ?
- [ ] L'URL `/api/db/products` retourne des données ?
- [ ] Données visibles dans Upstash Dashboard ?
- [ ] Token Blob configuré pour les images ?
- [ ] Console du navigateur montre des erreurs ?

---

## 🎯 Récapitulatif Rapide

```bash
# 1. Configurer Upstash sur Vercel
UPSTASH_REDIS_REST_URL → Settings → Environment Variables
UPSTASH_REDIS_REST_TOKEN → Settings → Environment Variables

# 2. Vérifier que "Preview" est coché pour chaque variable

# 3. Redéployer la branche panel-admin

# 4. Tester : https://votre-site.vercel.app/api/db/products

# 5. Panel admin : https://votre-site-panel-admin.vercel.app/admin
```

---

## 🔗 Liens Utiles

- Upstash Console : https://console.upstash.com/
- Vercel Dashboard : https://vercel.com/dashboard
- Documentation Upstash : https://docs.upstash.com/redis

---

**Une fois que vous avez configuré les variables Upstash sur Vercel et redéployé, TOUT devrait fonctionner !** 🎉
