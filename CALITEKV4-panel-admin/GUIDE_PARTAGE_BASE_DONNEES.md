# 🔄 Guide : Partager la base de données Upstash entre boutiques

## 🎯 Objectif

Utiliser **LA MÊME base de données Upstash** pour partager tous les produits, catégories, farms, etc. entre plusieurs boutiques.

## ✅ Solution ultra-simple

### 📍 ÉTAPE 1 : Récupérer les credentials de l'ancienne boutique

1. Allez sur le **Dashboard Vercel** de votre **ANCIENNE boutique**
   - https://vercel.com/dashboard
2. Cliquez sur votre ancienne boutique
3. Allez dans **Settings** → **Environment Variables**
4. Copiez ces 3 variables (cliquez sur l'œil 👁️ pour voir les valeurs) :
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `BLOB_READ_WRITE_TOKEN`

⚠️ **NOTEZ-LES** quelque part (dans un fichier texte temporaire)

### 📍 ÉTAPE 2 : Mettre ces credentials dans la nouvelle boutique

1. Allez sur le **Dashboard Vercel** de votre **NOUVELLE boutique**
2. Cliquez sur votre nouveau projet (boutique dupliquée)
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez/modifiez ces variables :

#### Variables partagées (IDENTIQUES à l'ancienne boutique)

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `UPSTASH_REDIS_REST_URL` | Copie depuis ancienne boutique | ✅ Production, ✅ Preview, ✅ Development |
| `UPSTASH_REDIS_REST_TOKEN` | Copie depuis ancienne boutique | ✅ Production, ✅ Preview, ✅ Development |
| `BLOB_READ_WRITE_TOKEN` | Copie depuis ancienne boutique | ✅ Production, ✅ Preview, ✅ Development |

#### Variables de sécurité (NOUVELLES - Uniques par boutique)

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `JWT_SECRET` | `ton-secret-unique-123` (générer un secret unique) | ✅ Production, ✅ Preview, ✅ Development |
| `DEFAULT_ADMIN_USERNAME` | `admin` | ✅ Production, ✅ Preview, ✅ Development |
| `DEFAULT_ADMIN_PASSWORD` | `MotDePasseSecure2025!` (choisir un mot de passe sécurisé) | ✅ Production, ✅ Preview, ✅ Development |
| `NODE_ENV` | `production` | ✅ Production, ✅ Preview, ✅ Development |

➡️ **Les 3 premières variables** sont **IDENTIQUES** à l'ancienne boutique  
➡️ **Les 4 suivantes** sont **NOUVELLES** (pour la sécurité JWT)

### 📍 ÉTAPE 3 : Redéployer

#### Option A : Via Vercel CLI
```bash
vercel --prod
```

#### Option B : Via Vercel Dashboard
1. Allez dans **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Cliquez sur **Redeploy**

### 📍 ÉTAPE 4 : Initialiser l'admin (JUSTE UNE FOIS)

Visitez cette URL une seule fois :
```
https://ta-nouvelle-boutique.vercel.app/api/init
```

Vous devriez voir :
```json
{
  "success": true,
  "message": "Database initialized"
}
```

✅ L'utilisateur admin est créé dans la base partagée

### 📍 ÉTAPE 5 : Tester

#### 5.1 - Tester la boutique (frontend)
```
https://ta-nouvelle-boutique.vercel.app
```

✅ Vous devez voir **TOUS vos produits** de l'ancienne boutique !

#### 5.2 - Tester le panel admin
```
https://ta-nouvelle-boutique.vercel.app/admin/
```

Connectez-vous avec :
- **Username** : `admin`
- **Password** : Celui que vous avez mis dans `DEFAULT_ADMIN_PASSWORD`

✅ Vous devez voir **TOUS vos produits**, catégories, farms, etc. !

## ⚠️ Important à savoir

Les 2 boutiques partagent **LA MÊME base de données**

Ça veut dire :
- ✅ Si vous modifiez un produit sur boutique 1 → Il est modifié sur boutique 2
- ✅ Si vous supprimez un produit sur boutique 1 → Il est supprimé sur boutique 2
- ✅ Les 2 boutiques affichent exactement les mêmes produits

**C'est comme avoir 2 URL différentes pour la même boutique !**

## 🔄 Si vous voulez 2 boutiques indépendantes

Si vous voulez que chaque boutique ait **SA PROPRE base de données** :

### 1. Créer une nouvelle base Upstash
1. Allez sur https://console.upstash.com/
2. Cliquez sur **"Create Database"**
3. Nom : `nouvelle-boutique`
4. Cliquez sur **"Create"**
5. Copiez les nouveaux credentials

### 2. Copier les données de l'ancienne vers la nouvelle

#### Dans la console de votre ancienne boutique (F12) :

```javascript
// 1. Exporter TOUTES les données
const exportAll = async () => {
  const [products, categories, farms, socials] = await Promise.all([
    fetch('/api/products').then(r => r.json()),
    fetch('/api/categories').then(r => r.json()),
    fetch('/api/farms').then(r => r.json()),
    fetch('/api/socials').then(r => r.json())
  ]);
  
  const data = { products, categories, farms, socials };
  
  // Télécharger
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'backup-complet.json';
  a.click();
  
  console.log('✅ Backup téléchargé !');
  console.log(`📦 ${products.length} produits`);
  console.log(`📁 ${categories.length} catégories`);
  console.log(`🏪 ${farms.length} farms`);
  console.log(`📱 ${socials.length} réseaux sociaux`);
};

exportAll();
```

#### Dans la console de votre NOUVELLE boutique (F12) :

```javascript
// 2. Importer TOUTES les données
const importAll = async (data) => {
  const jwt = localStorage.getItem('adminJWT');
  
  // Importer catégories
  for (const cat of data.categories) {
    await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(cat)
    });
    console.log('✅ Catégorie:', cat.name);
  }
  
  // Importer farms
  for (const farm of data.farms) {
    await fetch('/api/farms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(farm)
    });
    console.log('✅ Farm:', farm.name);
  }
  
  // Importer produits
  for (const prod of data.products) {
    await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(prod)
    });
    console.log('✅ Produit:', prod.name);
    await new Promise(r => setTimeout(r, 100)); // Pause 100ms
  }
  
  // Importer réseaux sociaux
  for (const social of data.socials) {
    await fetch('/api/socials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(social)
    });
    console.log('✅ Réseau social:', social.name);
  }
  
  console.log('🎉 Import terminé !');
};

// COLLE ICI le contenu de backup-complet.json
const data = {
  // COLLE LE JSON ICI
};

importAll(data);
```

## 📋 Résumé pour partager la base

```bash
# 1. Récupérer les credentials Upstash de l'ancienne boutique
#    (sur Vercel Dashboard → Settings → Environment Variables)

# 2. Copier ces 3 variables dans la nouvelle boutique :
#    - UPSTASH_REDIS_REST_URL
#    - UPSTASH_REDIS_REST_TOKEN  
#    - BLOB_READ_WRITE_TOKEN

# 3. Ajouter les variables JWT (nouvelles) :
#    - JWT_SECRET
#    - DEFAULT_ADMIN_USERNAME
#    - DEFAULT_ADMIN_PASSWORD
#    - NODE_ENV

# 4. Redéployer
vercel --prod

# 5. Initialiser l'admin
# Aller sur : https://ta-boutique.vercel.app/api/init

# 6. Tester !
# DONE ! 🎉
```

## 🎯 Credentials fournis

Pour cette configuration, utilisez :

```
UPSTASH_REDIS_REST_URL="https://pumped-flamingo-35383.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AYo3AAIncDJiMDJkNjRjZDBmYTI0OTVjODI2NGZhZjFiNDg3OTQ5OHAyMzUzODM"
```

⚠️ **N'oubliez pas** de récupérer le `BLOB_READ_WRITE_TOKEN` depuis l'ancienne boutique !

## ✅ Vérification finale

Pour vérifier que tout fonctionne :

```bash
# Vérifier les variables d'environnement
curl "https://ta-boutique.vercel.app/api/db/config.json?debug=1"
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

---

🎉 **VOILÀ !** Avec les mêmes credentials Upstash, vous partagez la même base !
