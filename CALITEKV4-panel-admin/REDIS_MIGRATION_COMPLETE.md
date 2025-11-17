# ✅ Migration Redis Upstash - TERMINÉE

## 🎯 Problème résolu

Vos catégories et produits n'apparaissaient pas côté client car les données étaient stockées dans les **anciennes clés Redis** (`data:*.json`) alors que l'API utilisait les **nouvelles clés** (`data:*`).

## 📊 Données migrées

✅ **13 catégories** migrées (anciennes → nouvelles clés)
✅ **57 produits** migrés (Blue Magic, New Yorker, Orange Magic, etc.)
✅ **11 farms** migrées
✅ **Reviews, promos, banner** migrés

### Détails de la migration

| Ancienne clé | Nouvelle clé | Éléments |
|--------------|--------------|----------|
| `data:categories.json` | `data:categories` | 13 catégories |
| `data:products.json` | `data:products` | 57 produits |
| `data:farms.json` | `data:farms` | 11 farms |
| `data:reviews.json` | `data:reviews` | 1 review |
| `data:promos.json` | `data:promos` | 1 promo |
| `data:banner.json` | `data:banner` | ✓ |
| `data:loadingscreen.json` | `data:loadingscreen` | ✓ |
| `data:cart_services.json` | `data:cart_services` | ✓ |
| `data:payments.json` | `data:payments` | 2 modes |

## 🛠️ Scripts créés

### 1. `scripts/init-redis-data.js`
Script de vérification et d'initialisation des clés Redis.

**Usage :**
```bash
node scripts/init-redis-data.js
```

**Fonctionnalités :**
- ✅ Vérifie la connexion Redis
- ✅ Liste toutes les clés existantes
- ✅ Vérifie le contenu de chaque clé importante
- ✅ Initialise les clés vides avec des données par défaut

### 2. `scripts/migrate-redis-keys.js`
Script de migration des anciennes clés vers les nouvelles.

**Usage :**
```bash
node scripts/migrate-redis-keys.js
```

**Fonctionnalités :**
- ✅ Migre automatiquement `data:*.json` → `data:*`
- ✅ Préserve les données existantes si elles sont plus complètes
- ✅ Affiche un aperçu des données migrées
- ✅ Rapport détaillé de la migration

## 📝 Structure des clés Redis

### Clés principales utilisées par l'API

```
data:categories      ← Catégories (13 éléments)
data:products        ← Produits (57 éléments)
data:farms           ← Farms (11 éléments)
data:admin_users     ← Utilisateurs admin
data:reviews         ← Avis clients
data:promos          ← Promotions
data:banner          ← Bannière du site
data:loadingscreen   ← Écran de chargement
data:config          ← Configuration générale
data:cart_services   ← Services du panier
data:payments        ← Modes de paiement
```

### API Endpoints

Les données sont maintenant accessibles via :

| Endpoint | Méthode | Clé Redis | Authentification |
|----------|---------|-----------|------------------|
| `/api/categories` | GET | `data:categories` | ❌ Public |
| `/api/categories` | POST | `data:categories` | ✅ Admin |
| `/api/products` | GET | `data:products` | ❌ Public |
| `/api/products` | POST | `data:products` | ✅ Admin |
| `/api/farms` | GET | `data:farms` | ❌ Public |

## 🔍 Vérification

Pour vérifier que tout fonctionne :

### 1. Côté client (dans le navigateur)

Ouvrez la console (F12) et tapez :

```javascript
// Tester les catégories
fetch('/api/categories')
  .then(r => r.json())
  .then(d => console.log('Catégories:', d))

// Tester les produits
fetch('/api/products')
  .then(r => r.json())
  .then(d => console.log('Produits:', d))

// Tester les farms
fetch('/api/farms')
  .then(r => r.json())
  .then(d => console.log('Farms:', d))
```

### 2. Via curl (en ligne de commande)

```bash
# Catégories
curl https://votre-site.vercel.app/api/categories

# Produits
curl https://votre-site.vercel.app/api/products

# Farms
curl https://votre-site.vercel.app/api/farms
```

## 🎨 Résultat attendu

Vous devriez maintenant voir :

✅ **13 catégories** dans la page d'accueil et boutique
✅ **57 produits** affichés par catégorie
✅ **11 farms** dans les filtres
✅ Toutes les données correctement chargées côté client

## 📦 Commit effectué

```
commit 3d6888e
Ajouter scripts de migration Redis pour corriger les clés de données

- init-redis-data.js : Script pour vérifier et initialiser les clés Redis
- migrate-redis-keys.js : Script pour migrer data:*.json vers data:*
- Résout le problème des catégories et produits non visibles côté client
- Migre 13 catégories, 57 produits et 11 farms depuis les anciennes clés
```

## 🚀 Prochaines étapes

### Pour merger sur `main` et `panel-admin`

```bash
# Push la branche actuelle
git push origin cursor/merge-changes-to-main-and-admin-panel-e334

# Merger sur main
git checkout main
git merge cursor/merge-changes-to-main-and-admin-panel-e334
git push origin main

# Merger sur panel-admin
git checkout panel-admin
git merge cursor/merge-changes-to-main-and-admin-panel-e334
git push origin panel-admin
```

### Ou via GitHub/GitLab

1. Créez une Pull Request de `cursor/merge-changes-to-main-and-admin-panel-e334` vers `main`
2. Créez une Pull Request de `cursor/merge-changes-to-main-and-admin-panel-e334` vers `panel-admin`
3. Mergez les deux PR

## ⚙️ Configuration Upstash

Les clés Redis utilisent l'instance partagée :

- **URL** : `https://pumped-flamingo-35383.upstash.io`
- **Instance** : `pumped-flamingo-35383`
- **Base partagée** : Oui (toutes les boutiques utilisent la même base)

## 🆘 En cas de problème

Si les données n'apparaissent toujours pas :

1. **Vérifiez les variables d'environnement** sur Vercel :
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

2. **Réexécutez le script de vérification** :
   ```bash
   node scripts/init-redis-data.js
   ```

3. **Vérifiez les logs du serveur** sur Vercel

4. **Videz le cache du navigateur** (Ctrl+Shift+R)

5. **Réexécutez la migration** si nécessaire :
   ```bash
   node scripts/migrate-redis-keys.js
   ```

## 📞 Support

Si vous avez des questions ou des problèmes, les scripts affichent des messages d'erreur détaillés pour faciliter le débogage.

---

**Date de migration** : 2025-11-15
**Statut** : ✅ Terminé avec succès
**Données migrées** : 13 catégories, 57 produits, 11 farms
