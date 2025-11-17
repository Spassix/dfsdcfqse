# Analyse des logs API et corrections appliquées

Date: 15 novembre 2025  
Branche: `cursor/analyze-api-request-logs-3cd0`

**Mise à jour**: Correction complète des endpoints manquants

## 📊 Problèmes identifiés dans les logs

### 1. Erreurs 404 répétées (Endpoints manquants)

Les logs montrent des erreurs 404 constantes sur plusieurs endpoints de settings :

- `/api/settings/colors` - 404 (appelé toutes les ~5 secondes)
- `/api/settings/events` - 404 (appelé toutes les ~5 secondes)
- `/api/settings/loading` - 404 avec erreur ENOENT

**Fréquence**: Environ 60+ erreurs 404 par minute pour ces endpoints

### 2. Erreur ENOENT critique

```
Error initializing default setting loading: 
Error: ENOENT: no such file or directory, 
open '/var/task/api/loadingscreen.json'
```

Cette erreur indiquait que le code tentait d'accéder à un fichier qui n'était pas accessible dans l'environnement de déploiement Vercel.

### 3. Erreurs 400 sur l'authentification

Plusieurs tentatives de connexion échouées sur `/api/auth/login` avec des erreurs 400 (Bad Request).

### 4. Polling excessif

Le frontend fait du polling intensif toutes les 5 secondes sur des endpoints inexistants, générant :
- Charge serveur inutile
- Consommation de bande passante
- Logs d'erreurs encombrants

## ✅ Solutions implémentées

### 1. Création de l'infrastructure Settings API

**Dossier créé**: `/workspace/api/settings/`

**Endpoint dynamique**: `/workspace/api/settings/[key].js`

Cet endpoint gère tous les types de settings de manière unifiée :
- `GET /api/settings/{key}` - Récupération publique
- `POST /api/settings/{key}` - Création (authentifié)
- `PUT /api/settings/{key}` - Mise à jour (authentifié)

**Fonctionnalités**:
- Utilise Redis (@upstash/redis) pour le stockage persistant
- Fallback automatique vers les fichiers JSON locaux
- Gestion CORS appropriée
- Authentification JWT pour les modifications
- Gestion d'erreurs robuste

### 2. Fichiers JSON de configuration créés

**Fichiers créés dans `/workspace/api/`**:

#### `colors.json`
```json
{
  "primary": "#6366f1",
  "secondary": "#8b5cf6",
  "accent": "#ec4899",
  "background": "#0a0e1b",
  "text": "#f1f5f9",
  "textSecondary": "#94a3b8"
}
```

#### `events.json`
```json
[]
```

#### `general.json`
```json
{
  "siteName": "Boutique",
  "siteDescription": "Votre meilleur café à Paris",
  "maintenanceMode": false,
  "allowRegistration": true
}
```

**Note**: Le fichier `loadingscreen.json` existait déjà et est maintenant correctement géré.

### 3. Configuration Vercel mise à jour

**Modifications dans `vercel.json`**:

#### Routes ajoutées
```json
{ "source": "/api/settings/:key", "destination": "/api/settings/[key].js" }
```

#### Headers CORS ajoutés
```json
{
  "source": "/api/settings/(.*)",
  "headers": [
    { "key": "Access-Control-Allow-Origin", "value": "*" },
    { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,OPTIONS" },
    { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
  ]
}
```

## 📈 Résultats attendus après déploiement

### Avant
- ❌ 60+ erreurs 404/minute sur `/api/settings/*`
- ❌ Erreurs ENOENT dans les logs
- ❌ Polling sur endpoints inexistants
- ❌ Mauvaise expérience utilisateur
- ❌ **Aucun produit, farm, ou catégorie visible**
- ❌ **Panel admin vide**
- ❌ **Erreurs fetch côté client**

### Après
- ✅ Tous les endpoints `/api/settings/*` retournent 200 ou 304
- ✅ Plus d'erreurs ENOENT
- ✅ Données de configuration disponibles
- ✅ Cache approprié avec status 304
- ✅ Possibilité de modifier les settings via l'admin
- ✅ **Produits, farms et catégories visibles côté client**
- ✅ **Panel admin fonctionnel avec données**
- ✅ **Chargement automatique des données par défaut**

## 🔧 Endpoints API disponibles

### Endpoints Settings

| Endpoint | Description | Méthodes |
|----------|-------------|----------|
| `/api/settings/colors` | Palette de couleurs du site | GET, POST, PUT |
| `/api/settings/events` | Configuration des événements | GET, POST, PUT |
| `/api/settings/loading` | Configuration de l'écran de chargement | GET, POST, PUT |
| `/api/settings/general` | Paramètres généraux | GET, POST, PUT |
| `/api/settings/typography` | Configuration typographique | GET, POST, PUT |
| `/api/settings/banner` | Configuration de la bannière | GET, POST, PUT |
| `/api/settings/config` | Configuration du shop | GET, POST, PUT |

### Endpoints Data (NOUVEAUX)

| Endpoint | Description | Méthodes | Auth requise |
|----------|-------------|----------|--------------|
| `/api/products` | Liste des produits | GET, POST, PUT, DELETE | POST/PUT/DELETE |
| `/api/farms` | Liste des farms | GET, POST, PUT, DELETE | POST/PUT/DELETE |
| `/api/categories` | Liste des catégories | GET, POST, PUT, DELETE | POST/PUT/DELETE |
| `/api/events` | Liste des événements | GET, POST, PUT, DELETE | POST/PUT/DELETE |

## 🚀 Prochaines étapes recommandées

1. **Déployer sur Vercel** pour appliquer les corrections
2. **Vérifier les logs** après déploiement pour confirmer la résolution
3. **Configurer le polling côté frontend** :
   - Augmenter l'intervalle de polling (actuellement ~5s)
   - Utiliser des WebSockets pour les mises à jour en temps réel
   - Implémenter un cache côté client
4. **Analyser les erreurs 400 sur /api/auth/login** :
   - Vérifier le format des requêtes côté frontend
   - Ajouter une validation des données plus explicite
5. **Documentation API** :
   - Documenter les schémas JSON attendus pour chaque setting
   - Créer des exemples d'utilisation pour l'équipe

## 📝 Notes techniques

### Architecture complète

```
Frontend 
    ↓
┌─────────────────────┬────────────────────────┐
│  Settings Endpoints │   Data Endpoints       │
│  /api/settings/*    │   /api/products        │
│                     │   /api/farms           │
│                     │   /api/categories      │
│                     │   /api/events          │
└─────────────────────┴────────────────────────┘
              ↓
    Redis (cache distribué)
              ↓ (si absent/vide)
    Fichiers JSON locaux (données par défaut)
              ↓
    Sauvegarde dans Redis pour futures requêtes
```

### Gestion du cache
- Redis sert de cache distribué entre les instances serverless
- Les fichiers JSON servent d'initialisation par défaut
- Status 304 utilisé pour optimiser la bande passante

### Sécurité
- Lecture publique (GET) pour tous les settings
- Modification protégée par authentification JWT
- Validation des tokens via `auth-utils.js`

## 🆕 Problème supplémentaire identifié: Endpoints de données manquants

### Symptômes
- Aucun produit visible côté client
- Panel admin n'affiche aucune farm, catégorie, etc.
- Erreurs de fetch dans la console

### Cause
Les fichiers JSON pour les données (farms.json, categories.json, events.json) existaient mais **aucun endpoint API** ne les servait. Le frontend tentait d'accéder à `/api/farms`, `/api/categories`, `/api/events` mais ces routes n'existaient pas.

### Correction appliquée
Création des endpoints API manquants :
- **`/api/farms.js`** - CRUD complet pour les farms
- **`/api/categories.js`** - CRUD complet pour les catégories  
- **`/api/events.js`** - CRUD complet pour les événements
- **Amélioration de `/api/products.js`** - Ajout du fallback vers le fichier JSON

Chaque endpoint :
- ✅ Lit depuis Redis en priorité
- ✅ Fallback automatique vers le fichier JSON si Redis est vide
- ✅ Sauvegarde les données par défaut dans Redis au premier chargement
- ✅ Supporte GET (public) et POST/PUT/DELETE (authentifié)
- ✅ Validation des données et gestion d'erreurs

## 🔍 Commandes de vérification

Après déploiement, vérifier avec :

```bash
# Endpoints Settings
curl https://votre-domaine.vercel.app/api/settings/colors
curl https://votre-domaine.vercel.app/api/settings/events
curl https://votre-domaine.vercel.app/api/settings/loading

# Endpoints Data (NOUVEAUX)
curl https://votre-domaine.vercel.app/api/farms
curl https://votre-domaine.vercel.app/api/categories
curl https://votre-domaine.vercel.app/api/events
curl https://votre-domaine.vercel.app/api/products
```

Réponse attendue : Status 200 avec données JSON valides

### Données par défaut attendues

**Farms** (`farms.json`):
```json
[{"id":1761739478792,"name":"Farm Test","createdAt":"2025-10-29T12:04:38.789Z"}]
```

**Categories** (`categories.json`):
```json
[{"id":1761739478785,"name":"Catégorie Test","createdAt":"2025-10-29T12:04:38.783Z"}]
```

**Events** (`events.json`):
```json
[]
```
