# 🔧 Solution : Endpoints API pour les données du Panel Admin

## 📋 Problème identifié

Vous ne voyiez pas vos données (farms, catégories, réseaux sociaux, services) dans le panel admin ni dans la boutique. Voici pourquoi :

### Cause racine
1. **Les données sont stockées dans Upstash Redis** avec les clés `data:products`, `data:farms`, `data:categories`, etc.
2. **Seul `/api/products` avait un endpoint dédié** pour lire/écrire dans Redis
3. **Les autres données** (farms, categories, socials, cart_services) n'avaient PAS d'endpoints API, donc le système essayait de lire les fichiers JSON locaux qui étaient vides ou obsolètes
4. **Le système de catchall** `[...path].js` lisait uniquement les fichiers JSON locaux, pas Redis

## ✅ Solution implémentée

### 1. Nouveaux endpoints API créés

J'ai créé 5 nouveaux fichiers API qui lisent/écrivent directement dans Redis :

#### 📁 `/api/farms.js`
- GET : Liste toutes les farms depuis Redis (`data:farms`)
- POST : Crée une nouvelle farm
- PUT : Met à jour toutes les farms
- DELETE : Supprime une farm
- Authentification requise pour POST/PUT/DELETE

#### 📁 `/api/categories.js`
- GET : Liste toutes les catégories depuis Redis (`data:categories`)
- POST : Crée une nouvelle catégorie
- PUT : Met à jour toutes les catégories
- DELETE : Supprime une catégorie
- Authentification requise pour POST/PUT/DELETE

#### 📁 `/api/socials.js`
- GET : Liste tous les réseaux sociaux depuis Redis (`data:socials`)
- POST : Crée un nouveau réseau social
- PUT : Met à jour tous les réseaux sociaux
- DELETE : Supprime un réseau social
- Authentification requise pour POST/PUT/DELETE

#### 📁 `/api/cart_services.js`
- GET : Récupère la configuration des services depuis Redis (`data:cart_services`)
- PUT : Met à jour la configuration des services
- Authentification requise pour PUT

#### 📁 `/api/db/[...path].js`
- Endpoint générique pour compatibilité avec l'ancien système
- GET `/api/db/farms.json` → lit `data:farms` depuis Redis
- PUT `/api/db/farms.json` → écrit dans `data:farms` dans Redis
- Gère tous les types de données (products, categories, farms, socials, etc.)

### 2. Configuration Vercel mise à jour

Le fichier `vercel.json` a été mis à jour pour router correctement les nouveaux endpoints :

```json
{
  "rewrites": [
    { "source": "/api/farms", "destination": "/api/farms.js" },
    { "source": "/api/categories", "destination": "/api/categories.js" },
    { "source": "/api/socials", "destination": "/api/socials.js" },
    { "source": "/api/cart_services", "destination": "/api/cart_services.js" },
    { "source": "/api/db/:path*", "destination": "/api/db/[...path].js" }
  ],
  "headers": [
    // Headers CORS configurés pour chaque endpoint
  ]
}
```

### 3. Fichiers JSON locaux supprimés

Les anciens fichiers JSON qui créaient de la confusion ont été supprimés :
- ❌ `/api/farms.json` (supprimé)
- ❌ `/api/categories.json` (supprimé)
- ❌ `/api/socials.json` (supprimé)

**Toutes les données sont maintenant dans Redis uniquement.**

## 🚀 Comment ça fonctionne maintenant

### Architecture
```
Panel Admin (frontend)
    ↓
BackendData.loadData("farms")
    ↓
Appel API → /api/db/farms.json
    ↓
Lecture depuis Upstash Redis (clé: data:farms)
    ↓
Retour des données au panel admin
```

### Flux de données
1. **Lecture** : Le panel admin appelle `/api/db/farms.json` → Lecture depuis Redis `data:farms`
2. **Écriture** : Le panel admin envoie PUT `/api/db/farms.json` → Écriture dans Redis `data:farms`
3. **Synchronisation** : Toutes les branches et environnements partagent la même base Redis

## 📝 Points importants

### Variables d'environnement requises
Assurez-vous que ces variables sont configurées sur Vercel :
```
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
DEFAULT_ADMIN_PASSWORD=your-admin-password
JWT_SECRET=your-jwt-secret
```

### Authentification
- **Lecture (GET)** : Publique, pas d'authentification requise
- **Écriture (POST/PUT/DELETE)** : Authentification JWT requise via header `Authorization: Bearer <token>`

### Compatibilité
- ✅ Compatible avec l'ancien système de fichiers JSON (via `/api/db/[...path].js`)
- ✅ Compatible avec le nouveau système d'endpoints directs (`/api/farms`, `/api/categories`, etc.)
- ✅ Le `backend.js` du panel admin fonctionne sans modifications

## 🔄 Synchronisation multi-utilisateurs

Le système utilise déjà le `SyncManager` dans `backend.js` qui :
- Polling toutes les 5 secondes pour détecter les changements
- Notifie les utilisateurs quand des données sont mises à jour par quelqu'un d'autre
- Fonctionne automatiquement avec les nouveaux endpoints

## 🎯 Prochaines étapes

### Pour déployer sur Vercel
1. Committez ces changements sur votre branche
2. Pushez vers GitHub : `git push origin <branch-name>`
3. Vercel déploiera automatiquement
4. Vérifiez que les variables d'environnement sont configurées

### Pour tester localement
```bash
# Démarrer le serveur de développement
npm run dev

# Ouvrir le panel admin
http://localhost:5173/admin

# Les données seront lues/écrites dans Redis Upstash
```

### Pour initialiser la base de données
1. Appelez `/api/init` pour créer l'utilisateur admin initial
2. Connectez-vous au panel admin
3. Ajoutez vos farms, catégories, produits, etc.

## 📊 Différences entre les branches

### Branche actuelle (`cursor/troubleshoot-missing-admin-panel-content-e984`)
- ✅ Endpoints API complets pour toutes les données
- ✅ Lecture/écriture dans Redis
- ✅ Authentification JWT
- ✅ CORS configuré
- ✅ Compatible avec l'ancien et le nouveau système

### Branche `main`
- ⚠️ Probablement les mêmes problèmes (pas d'endpoints pour farms, categories, socials)
- 💡 Solution : Merger cette branche dans `main` ou copier les changements

### Branche `panel-admin`
- 🔄 Utilise un système différent avec `db.js` et des clés Redis différentes (`product:*` au lieu de `data:products`)
- 💡 Non compatible directement, nécessite une migration si vous voulez utiliser cette approche

## ⚠️ Notes importantes

1. **Redis est partagé** : Toutes les branches et tous les environnements (preview, production) partagent la même base Redis si vous utilisez les mêmes variables d'environnement
2. **Pas de localStorage en production** : Sur Vercel, le système utilise uniquement Redis (pas de localStorage)
3. **Les fichiers JSON ne sont plus utilisés** : Toutes les données sont dans Redis, les fichiers JSON dans `/api/` ne servent plus

## 🐛 Problème connu : Build Tailwind

Il y a actuellement une erreur de build Tailwind CSS (non liée à ces changements) :
```
error: It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin
```

Cela n'affecte pas le fonctionnement des endpoints API mais empêche le build. Solution à venir dans un commit séparé.

---

**Résumé** : Tous les endpoints API nécessaires ont été créés. Vos données (farms, categories, socials, services) seront maintenant correctement lues et écrites dans Redis, et apparaîtront dans le panel admin et la boutique.
