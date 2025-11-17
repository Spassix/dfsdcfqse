# 🔐 VÉRIFIER VOS IDENTIFIANTS VERCEL

## 🎯 Étapes pour trouver vos VRAIS identifiants

### 1️⃣ Allez sur Vercel Dashboard
```
https://vercel.com/dashboard
```

### 2️⃣ Ouvrez CALITEKV4
Cliquez sur votre projet **CALITEKV4**

### 3️⃣ Settings → Environment Variables
1. Cliquez sur **Settings** (en haut)
2. Cliquez sur **Environment Variables** (menu gauche)

### 4️⃣ Cherchez ces 2 variables

#### DEFAULT_ADMIN_USERNAME
```
Nom: DEFAULT_ADMIN_USERNAME
Valeur: ??? (notez la valeur exacte)
```

#### DEFAULT_ADMIN_PASSWORD  
```
Nom: DEFAULT_ADMIN_PASSWORD
Valeur: ??? (cliquez sur l'icône œil 👁️ pour voir)
```

---

## ❌ SI LES VARIABLES N'EXISTENT PAS

Si vous ne voyez PAS ces variables, vous devez les créer **MAINTENANT** :

### Créer DEFAULT_ADMIN_USERNAME
1. Cliquez sur **"Add New"** ou **"Add Environment Variable"**
2. Name : `DEFAULT_ADMIN_USERNAME`
3. Value : `admin` (ou le nom que vous voulez)
4. **COCHEZ LES 3 CASES** :
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Cliquez sur **"Save"**

### Créer DEFAULT_ADMIN_PASSWORD
1. Cliquez sur **"Add New"** ou **"Add Environment Variable"**
2. Name : `DEFAULT_ADMIN_PASSWORD`
3. Value : Choisissez un mot de passe simple pour commencer (ex: `Test1234`)
4. **COCHEZ LES 3 CASES** :
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Cliquez sur **"Save"**

### REDÉPLOYER
**IMPORTANT** : Après avoir ajouté les variables, vous DEVEZ redéployer :
1. **Deployments** → Dernier déploiement de `panel-admin`
2. **•••** → **Redeploy**
3. **Attendez 1-2 minutes**

---

## ✅ TESTER LA CONNEXION

Une fois que vous avez :
1. ✅ Créé les 2 variables (`DEFAULT_ADMIN_USERNAME` et `DEFAULT_ADMIN_PASSWORD`)
2. ✅ Redéployé
3. ✅ Attendu que le statut soit "Ready"

**Allez sur** :
```
https://calitekv-4-git-panel-admin-juniors-projects-a34b718b.vercel.app/admin
```

**Et connectez-vous avec** :
- Username : La valeur de `DEFAULT_ADMIN_USERNAME` (ex: `admin`)
- Password : La valeur de `DEFAULT_ADMIN_PASSWORD` (ex: `Test1234`)

---

## 🔍 VÉRIFIER SI LES VARIABLES SONT BIEN CONFIGURÉES

### Méthode 1 : Vérifier sur Vercel
1. Vercel → CALITEKV4 → Settings → Environment Variables
2. Vous devez voir :
   - `DEFAULT_ADMIN_USERNAME` avec une valeur
   - `DEFAULT_ADMIN_PASSWORD` avec une valeur (masquée)
3. **Vérifiez que les cases "Preview" et "Production" sont cochées**

### Méthode 2 : Tester avec un endpoint
Allez sur cette URL dans votre navigateur :
```
https://calitekv-4-git-panel-admin-juniors-projects-a34b718b.vercel.app/api/check-env
```

Si les variables sont configurées, vous verrez :
```json
{
  "UPSTASH_REDIS_REST_URL": true,
  "UPSTASH_REDIS_REST_TOKEN": true,
  "DEFAULT_ADMIN_USERNAME": true,
  "DEFAULT_ADMIN_PASSWORD": true,
  "JWT_SECRET": true
}
```

Si `DEFAULT_ADMIN_USERNAME` ou `DEFAULT_ADMIN_PASSWORD` est `false`, les variables manquent !

---

## 📋 Checklist Complète

- [ ] J'ai vérifié sur Vercel Dashboard
- [ ] J'ai ouvert Settings → Environment Variables
- [ ] Je vois `DEFAULT_ADMIN_USERNAME` (si non, je l'ai créée)
- [ ] Je vois `DEFAULT_ADMIN_PASSWORD` (si non, je l'ai créée)
- [ ] Les cases "Preview" et "Production" sont cochées
- [ ] J'ai redéployé après avoir ajouté les variables
- [ ] J'ai attendu que le déploiement soit "Ready"
- [ ] Je connais mes identifiants exacts
- [ ] J'essaie de me connecter avec ces identifiants

---

## 🆘 Problèmes Courants

### "Invalid credentials"
→ Le mot de passe ne correspond pas  
→ Solution : Vérifiez la valeur EXACTE de `DEFAULT_ADMIN_PASSWORD` sur Vercel

### "Configuration de sécurité invalide"
→ Les variables manquent  
→ Solution : Créez `DEFAULT_ADMIN_USERNAME` et `DEFAULT_ADMIN_PASSWORD`, puis redéployez

### Le site accepte n'importe quel identifiant
→ Les variables ne sont pas activées pour cette branche  
→ Solution : Vérifiez que les cases "Preview" sont cochées

---

## 💡 Conseil

Pour tester facilement :
1. Créez `DEFAULT_ADMIN_USERNAME` = `admin`
2. Créez `DEFAULT_ADMIN_PASSWORD` = `Admin123`
3. Redéployez
4. Connectez-vous avec `admin` / `Admin123`

**Simple et ça fonctionne !** 🎉
