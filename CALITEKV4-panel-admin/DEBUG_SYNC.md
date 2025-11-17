# 🔍 Guide de débogage - Synchronisation Mexicain59

## Problème identifié
Les modifications dans le panel admin ne s'affichent pas sur l'URL `https://mexicain59.vercel.app`

## ✅ Configuration actuelle

### Variables d'environnement
- ✅ `UPSTASH_REDIS_REST_URL` : Configuré
- ✅ `UPSTASH_REDIS_REST_TOKEN` : Configuré
- ✅ `KV_REST_API_URL` : Configuré
- ✅ `KV_REST_API_TOKEN` : Configuré
- ✅ `KV_REST_API_READ_ONLY_TOKEN` : Configuré

### URL de production
- ✅ `https://mexicain59.vercel.app` → Pointe vers la dernière version

## 🔍 Étapes de débogage

### 1. Vérifier que les variables d'environnement sont bien présentes

Ouvrez dans votre navigateur :
```
https://mexicain59.vercel.app/api/db/config.json?debug=1
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

Si vous voyez `false`, les variables d'environnement ne sont pas configurées correctement.

### 2. Vérifier que le panel admin utilise la bonne URL backend

Ouvrez le panel admin :
```
https://mexicain59.vercel.app/admin
```

Dans la console du navigateur (F12), vérifiez l'URL du backend configurée.

Le panel devrait utiliser : `https://mexicain59.vercel.app` (pas localhost)

### 3. Vider le cache du navigateur

Le site utilise `localStorage` pour le cache. Sur l'URL du site :
1. Ouvrez les DevTools (F12)
2. Aller dans "Application" (Chrome) ou "Stockage" (Firefox)
3. Cliquez sur "localStorage" → Votre URL
4. Supprimez toutes les entrées `site_*`

**OU** utilisez cette commande dans la console :
```javascript
Object.keys(localStorage).filter(k => k.startsWith('site_')).forEach(k => localStorage.removeItem(k));
location.reload();
```

### 4. Vérifier que les données sont bien sauvegardées dans Upstash

Dans le panel admin, après avoir fait une modification :
1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet "Network" / "Réseau"
3. Filtrez sur "XHR" ou "Fetch"
4. Cherchez une requête vers `/api/db/[quelque-chose].json` avec la méthode `PUT`
5. Vérifiez que la réponse est : `{"success":true}`

### 5. Vérifier que les données sont récupérées depuis Upstash

Sur l'URL du site principal :
1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet "Network" / "Réseau"
3. Rechargez la page
4. Cherchez les requêtes vers `/api/db/`
5. Vérifiez qu'il y a des requêtes GET vers :
   - `/api/db/products.json`
   - `/api/db/config.json`
   - `/api/db/categories.json`
   - etc.

### 6. Vérifier la console du navigateur

Ouvrez la console (F12) et cherchez des erreurs en rouge.

Erreurs possibles :
- `Network request failed` → Problème de connexion
- `Erreur serveur` → Problème avec l'API Vercel
- `QuotaExceededError` → localStorage plein (normalement pas possible avec Upstash)

### 7. Tester la connexion à Upstash directement

Dans la console du site principal :
```javascript
fetch('/api/db/config.json?debug=1')
  .then(r => r.json())
  .then(d => console.log('Debug Upstash:', d));
```

Résultat attendu :
```json
{
  "ok": true,
  "env": {
    "UPSTASH_REDIS_REST_URL": true,
    "UPSTASH_REDIS_REST_TOKEN": true
  }
}
```

## 🔧 Solutions possibles

### Si les variables d'environnement ne sont pas présentes :
```bash
# Redéployer pour que les variables soient prises en compte
vercel --token sfHk87qTmRIyU4xYOnf2145p --prod
```

### Si le cache localStorage pose problème :
Videz le localStorage comme indiqué dans l'étape 3.

### Si le panel admin utilise localhost au lieu de vercel.app :
1. Ouvrez le panel admin
2. Allez dans "Configuration Générale"
3. Vérifiez que l'URL backend est bien `https://mexicain59.vercel.app`
4. Cliquez sur "Enregistrer tout"

### Si aucune données n'est sauvegardée :
Vérifiez dans la console du panel admin que les requêtes PUT réussissent.

## 📞 Vérifications rapides

```bash
# Vérifier les variables d'environnement configurées
vercel env ls --token sfHk87qTmRIyU4xYOnf2145p

# Redéployer
vercel --token sfHk87qTmRIyU4xYOnf2145p --prod --yes
```

## 🎯 Tests de synchronisation

1. **Dans le panel admin** :
   - Ajoutez un produit de test
   - Sauvegardez
   - Vérifiez dans la console qu'il y a : `✅ Données sauvegardées`

2. **Sur le site principal** :
   - Videz le localStorage (étape 3)
   - Rechargez la page
   - Le produit devrait apparaître

3. **Sur un autre appareil** :
   - Ouvrez `https://mexicain59.vercel.app`
   - Le produit devrait apparaître immédiatement

## ⚠️ Points importants

1. **localStorage** : Le site utilise localStorage comme cache. Si vous voyez d'anciennes données, videz le localStorage.

2. **Polling** : Le site fait un rechargement des données toutes les secondes depuis Upstash.

3. **Backend URL** : Le panel admin doit pointer vers `https://mexicain59.vercel.app` et non `localhost`.

4. **Variables d'environnement** : Après ajout/modification, il faut redéployer.

