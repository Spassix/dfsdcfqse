# 🔐 Configuration des Administrateurs via Vercel

## 📋 Vue d'ensemble

Les administrateurs sont maintenant créés **uniquement via les variables d'environnement Vercel**. La création d'utilisateurs depuis le panel admin a été **désactivée** pour plus de sécurité.

## 🚀 Configuration dans Vercel

### Étape 1 : Accéder aux Variables d'Environnement

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **CALITEKV4**
3. Allez dans **Settings** → Environment Variables**

### Étape 2 : Ajouter les Variables

#### Pour le premier admin (obligatoire) :
- **Nom** : `DEFAULT_ADMIN_USERNAME`
- **Valeur** : Votre nom d'utilisateur (ex: `admin`)
- **Environnement** : Production, Preview, Development

- **Nom** : `DEFAULT_ADMIN_PASSWORD`
- **Valeur** : Votre mot de passe (ex: `MonMotDePasse123!`)
- **Environnement** : Production, Preview, Development

#### Pour le deuxième admin (optionnel) :
- **Nom** : `DEFAULT_ADMIN_USERNAME_2`
- **Valeur** : Votre deuxième nom d'utilisateur (ex: `admin2`)
- **Environnement** : Production, Preview, Development

- **Nom** : `DEFAULT_ADMIN_PASSWORD_2`
- **Valeur** : Votre deuxième mot de passe (ex: `MonAutreMotDePasse456!`)
- **Environnement** : Production, Preview, Development

#### Pour un troisième admin (optionnel) :
- **Nom** : `DEFAULT_ADMIN_USERNAME_3`
- **Valeur** : Votre troisième nom d'utilisateur
- **Environnement** : Production, Preview, Development

- **Nom** : `DEFAULT_ADMIN_PASSWORD_3`
- **Valeur** : Votre troisième mot de passe
- **Environnement** : Production, Preview, Development

### Étape 3 : Initialiser les Admins

Après avoir ajouté les variables d'environnement, appelez l'endpoint d'initialisation :

```
POST https://votre-site.vercel.app/api/admin-init
```

Ou depuis la console du navigateur :
```javascript
fetch('/api/admin-init', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

## 📝 Format des Variables

Le système supporte un nombre illimité d'admins en suivant ce pattern :

- **Admin 1** : `DEFAULT_ADMIN_USERNAME` + `DEFAULT_ADMIN_PASSWORD`
- **Admin 2** : `DEFAULT_ADMIN_USERNAME_2` + `DEFAULT_ADMIN_PASSWORD_2`
- **Admin 3** : `DEFAULT_ADMIN_USERNAME_3` + `DEFAULT_ADMIN_PASSWORD_3`
- **Admin N** : `DEFAULT_ADMIN_USERNAME_N` + `DEFAULT_ADMIN_PASSWORD_N`

## ✅ Vérification

Après l'initialisation, vous pouvez vous connecter avec n'importe quel compte admin configuré :

1. Allez sur `/admin/login`
2. Utilisez le nom d'utilisateur et mot de passe configurés dans Vercel
3. Vous devriez pouvoir vous connecter

## 🔒 Sécurité

- Les mots de passe sont hashés avec bcrypt avant stockage
- Les admins créés via variables d'environnement ne peuvent pas être supprimés depuis le panel
- La création d'utilisateurs depuis le panel est désactivée
- Seuls les admins configurés dans Vercel peuvent se connecter

## 🛠️ Mise à jour des Admins

Pour ajouter un nouvel admin :
1. Ajoutez les variables `DEFAULT_ADMIN_USERNAME_N` et `DEFAULT_ADMIN_PASSWORD_N` dans Vercel
2. Redéployez ou appelez `/api/admin-init`
3. Le nouvel admin sera créé automatiquement

Pour modifier un admin existant :
- Modifiez les variables d'environnement dans Vercel
- Redéployez
- L'admin sera mis à jour au prochain redéploiement

## ❌ Suppression d'un Admin

Pour supprimer un admin :
1. Supprimez les variables `DEFAULT_ADMIN_USERNAME_N` et `DEFAULT_ADMIN_PASSWORD_N` dans Vercel
2. Utilisez l'endpoint `/api/delete-admin-user` avec `{ "username": "nom_utilisateur" }`
3. Ou supprimez-le depuis le panel admin (si ce n'est pas un admin principal)
