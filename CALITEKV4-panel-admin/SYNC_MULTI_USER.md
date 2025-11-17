# Synchronisation Multi-Utilisateurs

## 🎉 Fonctionnalité implémentée

Le panel admin synchronise automatiquement toutes les modifications entre tous les utilisateurs connectés en temps réel !

## 🔄 Comment ça fonctionne

### Polling automatique
- **Fréquence** : Vérification toutes les **5 secondes**
- **Clés surveillées** : Toutes les données admin (produits, catégories, farms, etc.)
- **Comparaison intelligente** : Détecte seulement les vraies modifications

### Notifications utilisateur
Quand un autre utilisateur modifie des données :
1. ✅ **Notification toast** : Message "📢 Données mises à jour: {clé}"
2. ✅ **Réactualisation automatique** : Les données s'affichent à jour immédiatement
3. ✅ **Console logs** : Messages détaillés dans la console

## 📋 Données synchronisées

Toutes les données sont synchronisées :
- ✅ **Produits** (`products.json`)
- ✅ **Catégories** (`categories.json`)
- ✅ **Farms/Marques** (`farms.json`)
- ✅ **Codes promo** (`promos.json`)
- ✅ **Réseaux sociaux** (`socials.json`)
- ✅ **Banderole** (`banner.json`)
- ✅ **Écran de chargement** (`loadingscreen.json`)
- ✅ **Configuration** (`config.json`)
- ✅ **Modes de paiement** (`payments.json`)
- ✅ **Services panier** (`cart_services.json`)
- ✅ **Options panier** (`cart_options.json`)
- ✅ **Créneaux horaires** (`cart_slots.json`)
- ✅ **Typographie** (`typography.json`)
- ✅ **Modal produit** (`productModal.json`)
- ✅ **Maintenance** (`maintenance.json`)

## 🚀 Utilisation

### Automatique
La synchronisation démarre automatiquement quand :
1. Un utilisateur se connecte au panel admin
2. Le backend est configuré dans les paramètres

### Manuel (pour développeurs)

```javascript
// Créer un listener pour une clé spécifique
syncManager.onSync('products', (data) => {
  console.log('Nouveaux produits:', data);
  renderProducts(data);
});

// Retirer un listener
syncManager.offSync('products', callback);

// Démarrer/Arrêter manuellement
syncManager.startPolling(); // Démarrer
syncManager.stopPolling(); // Arrêter
```

## 🔍 Détection des changements

Le système compare les données avec `JSON.stringify()` pour détecter toute modification, même mineure.

### Exemple
```javascript
// User A modifie un produit
await saveProduct({ id: 1, name: 'Nouveau nom', price: 29.99 });

// User B (sur un autre appareil) reçoit automatiquement :
// 🔔 "📢 Données mises à jour: products"
// Les produits se rafraîchissent automatiquement
```

## ⚡ Performance

### Optimisations
- **Timeout court** : 2 secondes max par requête
- **Erreurs silencieuses** : Pas de spam dans la console
- **Comparaison efficace** : Seules les vraies modifications déclenchent une notification

### Impact réseau
- **Requêtes** : ~15 requêtes toutes les 5 secondes
- **Taille** : Dépend du volume de données
- **Backend** : Upstash Redis (rapide et optimisé)

## 🛡️ Sécurité

- ✅ **Données chiffrées** : Connexion HTTPS uniquement
- ✅ **CORS** : Configuré correctement
- ✅ **Authentification** : Seuls les users connectés voient les notifications
- ✅ **Pas de perte** : LocalStorage comme backup

## 📊 Logs

### Console du navigateur
```
🔄 Démarrage synchronisation multi-utilisateurs (polling toutes les 5s)
✅ Synchronisation multi-utilisateurs initialisée
🔔 Données mises à jour par un autre utilisateur: products
📢 Données mises à jour: products
```

## 🐛 Dépannage

### La sync ne fonctionne pas ?
1. **Vérifier le backend** : Les paramètres doivent avoir une URL backend configurée
2. **Console** : Regarder les logs de démarrage
3. **Network** : Vérifier que les requêtes `/api/db/{key}` fonctionnent

### Trop de notifications ?
- C'est normal si plusieurs utilisateurs modifient en même temps
- Les notifications sont informatifs et non bloquantes

## 🎯 Exemples d'utilisation

### Scénario 1 : Équipe de 3 admins
- **Admin A** ajoute un produit
- **Admin B** et **Admin C** voient le nouveau produit en < 5 secondes

### Scénario 2 : Modification simultanée
- **Admin A** modifie un prix
- **Admin B** modifie le nom du même produit
- Les deux changements sont synchronisés et visibles par tous

### Scénario 3 : Site mobile + Desktop
- Modifier depuis un smartphone
- Les changements apparaissent instantanément sur desktop

## 🔄 Événements émis

Le système émet automatiquement des événements :

```javascript
// Événement global
window.addEventListener('dataUpdated', (e) => {
  console.log('Données mises à jour:', e.detail.key, e.detail.data);
});
```

## ✅ Avantages

1. **Collaboration** : Plusieurs admins peuvent travailler simultanément
2. **Transparence** : Tout le monde voit les mêmes données
3. **Efficacité** : Pas besoin de rafraîchir manuellement
4. **Temps réel** : Maximum 5 secondes de latence
5. **Automatique** : Aucune configuration nécessaire

---

🎉 **La synchronisation multi-utilisateurs est maintenant active !**

