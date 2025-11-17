# 🎯 Instructions Complètes pour Cursor : Migrer vers CALITEK

## 📋 OBJECTIF
Migrer votre boutique existante vers la structure CALITEK tout en gardant vos produits et données existantes. Le panel admin CALITEK sera ajouté et votre base de données Upstash Redis sera mise à jour avec la nouvelle structure.

---

## ⚠️ PRÉREQUIS
- Vous avez déjà un projet avec Upstash Redis configuré
- Vous avez déjà Vercel Blob configuré
- Vos produits existent déjà dans Upstash Redis
- Vous avez accès à vos credentials Upstash Redis

---

## 🔄 ÉTAPE 1 : Mettre à Jour le Code Source

### Instructions pour Cursor :

1. **Remplacer tous les fichiers du projet par ceux de CALITEK**

   - Copier TOUS les fichiers depuis `https://github.com/juniorrrrr345/CALITEKV4`
   - Garder SEULEMENT votre fichier `.env.local` avec vos credentials
   - Garder SEULEMENT votre fichier `vercel.json` si vous avez des configurations spéciales
   - Remplacer TOUT le reste (src/, api/, admin/, assets/, etc.)

2. **Vérifier les dépendances dans package.json**

   Assurez-vous que `package.json` contient ces dépendances :
   ```json
   {
     "dependencies": {
       "@upstash/redis": "^1.28.4",
       "@vercel/blob": "^2.0.0",
       "bcryptjs": "^2.4.3",
       "jsonwebtoken": "^9.0.2",
       "react": "^19.2.0",
       "react-dom": "^19.2.0",
       "react-router-dom": "^7.9.6",
       "framer-motion": "^12.23.24"
     }
   }
   ```

3. **Installer les dépendances**
   ```bash
   npm install
   ```

4. **Vérifier que le script de migration existe**
   - Le fichier `scripts/migrate-upstash-structure.js` doit exister
   - Le fichier doit être exécutable

---

## 🗄️ ÉTAPE 2 : Migrer la Structure Upstash Redis (SANS PERDRE LES DONNÉES)

### Instructions pour Cursor :

**CRITIQUE : Cette étape préserve vos données existantes et ajoute seulement la nouvelle structure.**

1. **Créer un fichier .env.local à la racine du projet** (si pas déjà créé)

   ```bash
   # Créer .env.local avec vos credentials Upstash
   UPSTASH_REDIS_REST_URL=https://votre-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=votre_token_upstash
   DEFAULT_ADMIN_PASSWORD=votre_mot_de_passe_admin
   ```

2. **Exécuter le script de migration**

   ```bash
   npm run migrate-upstash
   ```

   **Ce que fait le script :**
   - ✅ Vérifie les clés existantes dans Redis
   - ✅ Crée `settings:general` si n'existe pas (ne touche pas si existe)
   - ✅ Crée `settings:cart` avec valeurs par défaut si n'existe pas
   - ✅ Crée `settings:colors` si n'existe pas
   - ✅ Crée `settings:loading` si n'existe pas
   - ✅ Crée `settings:sections` si n'existe pas
   - ✅ Crée `settings:events` si n'existe pas
   - ✅ Crée les collections vides (`categories`, `farms`, `products`, etc.) SEULEMENT si elles n'existent pas
   - ✅ **PRÉSERVE vos produits existants** dans la clé `products`
   - ✅ **PRÉSERVE vos catégories existantes** dans la clé `categories`
   - ✅ **PRÉSERVE vos farms existantes** dans la clé `farms`
   - ✅ Crée le compte admin si n'existe pas
   - ✅ Crée les objets de configuration (`cart_services`, `banner`, etc.)

3. **Vérifier que vos données sont toujours là**

   Après la migration, vérifiez :
   ```bash
   # Le script affichera automatiquement un résumé
   # Vérifiez que vos produits sont toujours là
   ```

---

## ⚙️ ÉTAPE 3 : Configurer Vercel

### Instructions pour Cursor :

1. **Aller sur Vercel Dashboard**
   - https://vercel.com/dashboard
   - Sélectionner votre projet

2. **Vérifier/Créer les Variables d'Environnement**

   Dans **Settings** → **Environment Variables**, assurez-vous d'avoir :

   ```
   UPSTASH_REDIS_REST_URL=https://votre-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=votre_token_upstash
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_votre_token
   DEFAULT_ADMIN_USERNAME=admin
   DEFAULT_ADMIN_PASSWORD=votre_mot_de_passe_securise
   JWT_SECRET=votre_secret_jwt_aleatoire_32_caracteres
   ```

   **IMPORTANT :** Cochez les 3 cases pour chaque variable :
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

3. **Redéployer le projet**

   - Allez dans **Deployments**
   - Cliquez sur **•••** du dernier déploiement
   - Cliquez sur **Redeploy**

---

## ✅ ÉTAPE 4 : Vérification et Test

### Instructions pour Cursor :

1. **Tester le Panel Admin**

   - Aller sur `https://votre-projet.vercel.app/admin/login`
   - Se connecter avec :
     - Username : `admin`
     - Password : Le mot de passe que vous avez configuré dans `DEFAULT_ADMIN_PASSWORD`

2. **Vérifier que vos produits sont toujours là**

   - Aller dans **Panel Admin** → **Produits**
   - Vos produits existants doivent s'afficher
   - Si format différent, ils seront automatiquement adaptés

3. **Vérifier la Configuration**

   - Aller dans **Panel Admin** → **Panier**
   - Vérifier que les services de livraison sont configurés
   - Aller dans **Panel Admin** → **Configuration**
   - Vérifier que les paramètres généraux sont là

---

## 🔍 VÉRIFICATIONS FINALES

### Checklist pour Cursor :

- [ ] Tous les fichiers CALITEK sont copiés
- [ ] Le fichier `.env.local` contient vos credentials Upstash
- [ ] Le script `npm run migrate-upstash` s'est exécuté sans erreur
- [ ] Vos produits existent toujours dans Redis (vérifier avec `redis.get('products')`)
- [ ] Les variables d'environnement sont configurées sur Vercel
- [ ] Le projet est redéployé sur Vercel
- [ ] Le panel admin est accessible sur `/admin/login`
- [ ] La connexion admin fonctionne
- [ ] Les produits s'affichent dans le panel admin
- [ ] La page boutique affiche vos produits

---

## 🆘 EN CAS DE PROBLÈME

### Si vos produits ne s'affichent pas :

1. **Vérifier le format dans Redis**
   ```bash
   # Dans votre console ou via Upstash Dashboard
   # Vérifier que la clé 'products' existe et contient un array
   ```

2. **Adapter le format si nécessaire**
   - Si vos produits sont dans un format différent, créer un script de conversion
   - Le format CALITEK attendu :
     ```json
     {
       "id": "string",
       "name": "string",
       "description": "string",
       "category": "string ou number (ID)",
       "farm": "string ou number (ID)",
       "photo": "string (URL)",
       "video": "string (URL)",
       "variants": [{"price": "string", "quantity": "string"}],
       "featured": boolean
     }
     ```

### Si le panel admin ne se charge pas :

1. Vérifier les logs Vercel
2. Vérifier que toutes les variables d'environnement sont bien configurées
3. Vérifier que le build passe sans erreur

### Si la migration échoue :

1. Vérifier vos credentials Upstash dans `.env.local`
2. Vérifier que vous avez les permissions d'écriture sur Redis
3. Relancer la migration : `npm run migrate-upstash`

---

## 📝 RÉSUMÉ POUR CURSOR

**En 2-3 étapes simples :**

1. **Copier le code CALITEK** → Remplacer tous les fichiers sauf `.env.local`
2. **Exécuter la migration** → `npm run migrate-upstash` (préserve vos données)
3. **Configurer Vercel** → Ajouter les variables d'environnement et redéployer

**Résultat :**
- ✅ Vous gardez tous vos produits existants
- ✅ Vous avez le nouveau panel admin CALITEK
- ✅ Votre base de données est mise à jour avec la nouvelle structure
- ✅ Tout fonctionne en 15 minutes

---

## 🎯 COMMANDES À EXÉCUTER

```bash
# 1. Installer les dépendances
npm install

# 2. Créer .env.local (si pas déjà fait)
cat > .env.local << EOF
UPSTASH_REDIS_REST_URL=https://votre-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=votre_token_upstash
DEFAULT_ADMIN_PASSWORD=votre_mot_de_passe
EOF

# 3. Exécuter la migration
npm run migrate-upstash

# 4. Vérifier que tout fonctionne
npm run dev
# Puis aller sur http://localhost:5173/admin/login
```

---

**✅ C'est tout ! Votre boutique est maintenant migrée vers CALITEK avec tous vos produits préservés.**
