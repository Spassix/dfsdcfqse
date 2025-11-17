# 🔒 Guide SÉCURISÉ - Récupération des Données

## ⚠️ SÉCURITÉ IMPORTANTE

**JAMAIS** créer de fichier `.env` qui serait commité dans Git !
✅ Le fichier `.env` est déjà dans `.gitignore`
✅ Vos credentials Upstash restent UNIQUEMENT sur Vercel

---

## ✅ État Actuel

Le panel admin est correctement configuré :
- ✅ Serveur local sur **http://localhost:8080**
- ✅ Panel admin sur **http://localhost:8080/admin**
- ✅ Identifiants : `admin` / `admin@123@123`

---

## 🔒 MÉTHODE SÉCURISÉE : Télécharger depuis la Production

### Étape 1 : Identifier votre URL Vercel

Votre site est déployé sur Vercel. L'URL ressemble à :
- `https://calitekv4.vercel.app` OU
- `https://votre-nom-de-domaine.com`

### Étape 2 : Modifier le script de téléchargement

Ouvrez le fichier :
```bash
nano scripts/download-from-production.js
```

À la ligne 14, remplacez :
```javascript
const PRODUCTION_URL = 'https://votre-site.vercel.app';
```

Par votre vraie URL, par exemple :
```javascript
const PRODUCTION_URL = 'https://calitekv4.vercel.app';
```

Sauvegardez (Ctrl+O, Entrée, Ctrl+X).

### Étape 3 : Exécuter le téléchargement

```bash
node scripts/download-from-production.js
```

Le script va télécharger TOUTES vos données :
- ✅ products.json (vos produits)
- ✅ categories.json (vos catégories)
- ✅ farms.json (vos farms/marques)
- ✅ socials.json (vos réseaux sociaux)
- ✅ Et tous les autres fichiers de configuration

### Étape 4 : Vérifier les données

```bash
# Voir combien de produits vous avez
cat api/products.json | grep -o '"id"' | wc -l

# Lister vos catégories
cat api/categories.json | grep '"name"'

# Lister vos farms
cat api/farms.json | grep '"name"'
```

### Étape 5 : Accéder au panel admin local

1. Ouvrez **http://localhost:8080/admin**
2. Connectez-vous : `admin` / `admin@123@123`
3. 🎉 Vous verrez toutes vos données !

---

## 🌐 ALTERNATIVE : Utiliser le Panel Admin en Production

Vous pouvez aussi gérer vos données directement en production :

1. Allez sur `https://votre-site.vercel.app/admin`
2. Connectez-vous avec vos identifiants
3. Gérez vos produits, catégories, farms, etc.
4. Les modifications sont automatiquement sauvegardées dans Upstash

**Avantages** :
- ✅ Aucun fichier à télécharger
- ✅ Modifications en temps réel
- ✅ Sécurité maximale

**Inconvénients** :
- ⚠️ Nécessite une connexion internet
- ⚠️ Modifications directement en production

---

## 🔧 Développement Local vs Production

### Développement Local (ce que vous faites maintenant)
- 📂 Données dans `/workspace/api/*.json`
- 🏠 Serveur sur `http://localhost:8080`
- ⚡ Rapide pour tester des modifications
- 🔒 Pas besoin de credentials Upstash

### Production (sur Vercel)
- ☁️ Données dans Upstash Redis
- 🌐 Site sur `https://votre-site.vercel.app`
- 🔒 Sécurisé avec JWT
- 🌍 Accessible depuis partout

---

## 📊 Structure des Données

Tous vos fichiers seront dans `/workspace/api/` :

```
api/
├── products.json          # 🛍️ Vos produits
├── categories.json        # 📁 Vos catégories
├── farms.json            # 🏪 Vos farms (marques)
├── socials.json          # 📱 Vos réseaux sociaux
├── admin_users.json      # 👥 Utilisateurs admin
├── banner.json           # 🎨 Banderole défilante
├── config.json           # ⚙️ Configuration générale
├── promos.json           # 🎫 Codes promo
├── reviews.json          # ⭐ Avis clients
├── messages.json         # 💬 Messages de contact
├── loadingscreen.json    # ⏳ Écran de chargement
├── productModal.json     # 🖼️ Configuration modal produit
├── typography.json       # 📝 Configuration typographie
├── payments.json         # 💳 Modes de paiement
├── cart_services.json    # 🛒 Services panier
└── farmsEnabled.json     # ✅ État activation farms
```

---

## 🆘 Dépannage

### Le script ne trouve pas l'URL

**Erreur** : `fetch failed` ou `ENOTFOUND`

**Solution** :
1. Vérifiez que votre URL Vercel est correcte
2. Testez l'URL dans votre navigateur : `https://votre-site.vercel.app/api/products.json`
3. Si ça marche dans le navigateur, ça marchera avec le script

### Les données sont vides

**Possible causes** :
1. Votre site Vercel n'a pas encore de données
2. Les APIs ne sont pas configurées
3. Upstash n'est pas connecté

**Solution** :
- Connectez-vous au panel admin en production
- Créez quelques produits de test
- Relancez le script de téléchargement

### Le serveur local ne démarre pas

```bash
# Arrêter tous les processus
pkill -f "node server.js"

# Redémarrer
cd /workspace
node server.js
```

---

## 🚀 Workflow Recommandé

1. **Développement Local** :
   - Téléchargez les données depuis la production (1 fois)
   - Testez vos modifications en local
   - Vérifiez que tout fonctionne

2. **Déploiement** :
   - Faites vos modifications dans le panel admin en production
   - OU uploadez vos modifications (script à créer si besoin)

3. **Synchronisation** :
   - Re-téléchargez les données si besoin
   - Gardez une sauvegarde de vos fichiers JSON

---

## ✅ Checklist de Sécurité

- ✅ Le fichier `.env` est dans `.gitignore`
- ✅ Aucun credential Upstash dans le code
- ✅ Les scripts utilisent l'API publique
- ✅ Les mots de passe admin sont hashés
- ✅ Les tokens JWT ne sont jamais exposés

---

## 💡 Important

- 🔒 **JAMAIS** créer de fichier `.env` pour Upstash en local
- 🔒 Les credentials Upstash restent UNIQUEMENT sur Vercel
- 🔒 Utilisez le script de téléchargement depuis la production
- 🔒 Ne commitez JAMAIS de données sensibles dans Git

---

## 📞 Besoin d'Aide ?

Si vous avez des questions sur la sécurité ou la récupération des données, consultez la documentation Vercel ou Upstash.
