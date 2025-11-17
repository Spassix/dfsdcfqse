# 🌐 Comment Trouver Votre URL Vercel

## 🎯 Étape 1 : Aller sur Vercel Dashboard

1. **Ouvrez** : https://vercel.com/dashboard
2. **Connectez-vous** si nécessaire
3. **Cliquez sur** : CALITEKV4

---

## 📍 Étape 2 : Trouver l'URL du Déploiement

Une fois dans votre projet CALITEKV4 :

### Option A : Dans l'onglet "Deployments"
1. **Cliquez sur** : **Deployments** (en haut)
2. **Trouvez** : Le déploiement de la branche `panel-admin` (le plus récent)
3. **Vérifiez** : Le statut doit être **"Ready"** ✅ (pas "Building" ou "Error")
4. **Cliquez** : Sur le déploiement pour l'ouvrir
5. **Copiez l'URL** : Vous verrez l'URL en haut (ex: `calitekv4-git-panel-admin-xxx.vercel.app`)

### Option B : Depuis l'aperçu du projet
1. Sur la page principale du projet
2. **Cherchez** : "Production Deployment" ou "Latest Deployment"
3. **Cliquez sur** : Le bouton **"Visit"** ou l'URL affichée
4. **Copiez l'URL** : De votre navigateur

---

## 🔓 Étape 3 : Accéder à la Page de Déverrouillage

Une fois que vous avez votre URL (exemple: `https://calitekv4-abc123.vercel.app`), ajoutez `/unlock-admin.html` :

```
https://VOTRE-URL-VERCEL.vercel.app/unlock-admin.html
```

**Exemple complet** :
```
https://calitekv4-git-panel-admin-juniors-projects-a34b718b.vercel.app/unlock-admin.html
```

---

## ⏱️ Le Déploiement n'est Pas Encore Prêt ?

Si vous voyez :
- ⏳ **"Building"** → Attendez 1-2 minutes
- ❌ **"Error"** → Le build a échoué, vérifiez les logs
- 🔄 **"Queued"** → Le déploiement est en attente

**Attendez** que le statut soit **✅ "Ready"** avant d'essayer d'accéder.

---

## 🚀 URLs Utiles à Connaître

Une fois que vous avez votre URL Vercel de base :

| Page | URL |
|------|-----|
| **Panel Admin** | `https://votre-url.vercel.app/admin` |
| **Débloquer Compte** | `https://votre-url.vercel.app/unlock-admin.html` |
| **Site Principal** | `https://votre-url.vercel.app/` |

---

## 🆘 Problèmes Courants

### "Accès non autorisé aux outils de développement"
→ Vous utilisez une URL de preview ou de développement qui n'est pas publique  
→ Solution : Utilisez l'URL de **production** ou l'URL de la branche `panel-admin`

### "404 - Not Found"
→ La page n'existe pas encore ou le déploiement n'est pas terminé  
→ Solution : Vérifiez que le statut est "Ready" et réessayez

### Page blanche ou erreur
→ Le déploiement peut avoir échoué  
→ Solution : Vérifiez les logs de build sur Vercel

---

## ✅ Checklist Rapide

- [ ] Je suis allé sur https://vercel.com/dashboard
- [ ] J'ai ouvert mon projet CALITEKV4
- [ ] J'ai vérifié l'onglet "Deployments"
- [ ] Le statut est "Ready" ✅
- [ ] J'ai copié l'URL du déploiement
- [ ] J'ai ajouté `/unlock-admin.html` à la fin
- [ ] J'ai ouvert cette URL dans mon navigateur

---

## 🎯 Exemple Concret

**Si votre URL Vercel est** :
```
https://calitekv4-abc123.vercel.app
```

**Alors vos URLs seront** :
- Panel admin : `https://calitekv4-abc123.vercel.app/admin`
- Débloquer : `https://calitekv4-abc123.vercel.app/unlock-admin.html`

---

## 📞 Besoin d'Aide ?

1. **Vérifiez** que le déploiement est terminé (statut "Ready")
2. **Copiez** l'URL exacte depuis Vercel
3. **Testez** d'abord `/admin` pour voir si le site fonctionne
4. **Ensuite** testez `/unlock-admin.html`

**La clé** : Utilisez l'URL **exacte** que Vercel vous donne ! 🔑
