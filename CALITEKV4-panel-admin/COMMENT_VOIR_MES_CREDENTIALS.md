# 🔐 Comment Voir Mes Identifiants Panel Admin ?

## 🎯 Vos identifiants sont dans les VARIABLES D'ENVIRONNEMENT Vercel

### ✅ Étape 1 : Aller sur Vercel Dashboard

1. **Ouvrez** : https://vercel.com/dashboard
2. **Cliquez sur votre projet** : `CALITEKV4`
3. **Allez dans** : **Settings** (en haut)
4. **Cliquez sur** : **Environment Variables** (menu gauche)

---

## 🔍 Étape 2 : Chercher vos credentials

Cherchez ces 2 variables :

### 1️⃣ DEFAULT_ADMIN_USERNAME
```
Variable: DEFAULT_ADMIN_USERNAME
Valeur: _______ ← C'EST VOTRE NOM D'UTILISATEUR
```

### 2️⃣ DEFAULT_ADMIN_PASSWORD  
```
Variable: DEFAULT_ADMIN_PASSWORD
Valeur: _______ ← C'EST VOTRE MOT DE PASSE
```

---

## ❓ Si les variables EXISTENT

**Vous verrez quelque chose comme** :
```
DEFAULT_ADMIN_USERNAME = admin
DEFAULT_ADMIN_PASSWORD = ••••••••••••••••
```

**Le mot de passe est masqué !** Pour le voir :
1. **Cliquez sur l'icône "œil" 👁️** à côté de `DEFAULT_ADMIN_PASSWORD`
2. **OU** Cliquez sur **"Edit"** pour modifier

---

## ❌ Si les variables N'EXISTENT PAS

Si vous ne voyez **PAS** ces 2 variables, vous devez les créer !

### 🔧 Créer DEFAULT_ADMIN_USERNAME :

1. **Cliquez sur** : **Add New**
2. **Name** : `DEFAULT_ADMIN_USERNAME`
3. **Value** : `admin` (ou le nom que vous voulez)
4. **Cochez les 3 cases** :
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. **Cliquez sur** : **Save**

### 🔧 Créer DEFAULT_ADMIN_PASSWORD :

1. **Cliquez sur** : **Add New**
2. **Name** : `DEFAULT_ADMIN_PASSWORD`
3. **Value** : Choisissez un MOT DE PASSE FORT
   - Exemple : `Admin2025!Secure#Paris`
   - Minimum 12 caractères
   - Mélange de majuscules, minuscules, chiffres, symboles
4. **Cochez les 3 cases** :
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Cliquez sur** : **Save**

### ⚠️ IMPORTANT : Redéployer après avoir ajouté les variables

Après avoir ajouté les variables :
1. **Allez dans** : **Deployments**
2. **Trouvez le dernier déploiement** de la branche `panel-admin`
3. **Cliquez sur •••** (3 points)
4. **Cliquez sur** : **Redeploy**
5. **Attendez 1-2 minutes**

---

## 🎯 Connexion au Panel Admin

### URL du Panel Admin :
```
https://VOTRE-URL.vercel.app/admin
```

### Identifiants à utiliser :
- **Username** : La valeur de `DEFAULT_ADMIN_USERNAME` (ex: `admin`)
- **Password** : La valeur de `DEFAULT_ADMIN_PASSWORD` (votre mot de passe fort)

---

## 🔥 RÉSUMÉ RAPIDE

### Si vous avez déjà les variables :
1. ✅ Vérifiez `DEFAULT_ADMIN_USERNAME` et `DEFAULT_ADMIN_PASSWORD` sur Vercel
2. ✅ Utilisez CES valeurs pour vous connecter au panel admin
3. ✅ Si le mot de passe est masqué, cliquez sur l'icône "œil" pour le voir

### Si vous N'AVEZ PAS les variables :
1. ⚠️ Créez `DEFAULT_ADMIN_USERNAME` (ex: `admin`)
2. ⚠️ Créez `DEFAULT_ADMIN_PASSWORD` (MOT DE PASSE FORT !)
3. ⚠️ Cochez les 3 cases pour chaque variable
4. ⚠️ REDÉPLOYEZ la branche `panel-admin`
5. ⚠️ Attendez 1-2 minutes
6. ✅ Connectez-vous avec vos nouveaux identifiants

---

## 🆘 Problèmes Courants

### "Configuration de sécurité invalide"
→ La variable `JWT_SECRET` manque aussi. Ajoutez-la !

### "Invalid credentials"  
→ Vous utilisez le mauvais username ou password. Vérifiez sur Vercel !

### Le panel accepte n'importe quel identifiant
→ Les variables ne sont pas configurées. Ajoutez-les et REDÉPLOYEZ !

---

## 📞 Besoin d'Aide ?

1. **Vercel Dashboard** : https://vercel.com/dashboard
2. **Settings** → **Environment Variables**
3. **Cherchez** : `DEFAULT_ADMIN_USERNAME` et `DEFAULT_ADMIN_PASSWORD`
4. **Notez les valeurs** quelque part de sécurisé
5. **Utilisez ces valeurs** pour vous connecter au panel admin

---

## ✅ Checklist Finale

- [ ] J'ai vérifié mes variables d'environnement sur Vercel
- [ ] J'ai noté mon `DEFAULT_ADMIN_USERNAME`
- [ ] J'ai noté mon `DEFAULT_ADMIN_PASSWORD` (ou je l'ai créé)
- [ ] J'ai redéployé si j'ai ajouté/modifié des variables
- [ ] J'ai attendu 1-2 minutes après le redéploiement
- [ ] Je me connecte avec les BONS identifiants de Vercel

**Vos identifiants sont sur Vercel, pas dans le code !** 🔐
