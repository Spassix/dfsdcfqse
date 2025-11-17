# 🔄 Script de Synchronisation des Branches

Ce script permet de synchroniser automatiquement vos changements sur les branches `main` et `panel-admin`.

## 📋 Fonctionnalités

- ✅ Merge automatique de votre branche dans `main`
- ✅ Merge automatique de votre branche dans `panel-admin`
- ✅ Synchronisation mutuelle entre `main` et `panel-admin`
- ✅ Messages colorés pour suivre le processus
- ✅ Gestion des erreurs avec messages clairs

## 🚀 Utilisation

### Méthode 1 : Via npm (recommandé)

```bash
npm run sync-branches
```

Cette commande synchronise automatiquement la branche actuelle sur `main` et `panel-admin`.

### Méthode 2 : Via le script directement

```bash
./scripts/sync-branches.sh
```

### Méthode 3 : Spécifier une branche source

```bash
./scripts/sync-branches.sh nom-de-votre-branche
```

ou

```bash
npm run sync-branches -- nom-de-votre-branche
```

## 📝 Exemples

### Exemple 1 : Synchroniser la branche actuelle

Vous êtes sur la branche `cursor/update-product-styling` :

```bash
npm run sync-branches
```

Le script va :
1. Merger `cursor/update-product-styling` → `main`
2. Merger `cursor/update-product-styling` → `panel-admin`
3. Synchroniser `main` ↔ `panel-admin`

### Exemple 2 : Synchroniser une branche spécifique

```bash
npm run sync-branches -- cursor/feature-new-product
```

## ⚙️ Comment ça fonctionne ?

1. **Récupération** : Le script récupère les dernières modifications depuis `origin`
2. **Merge dans main** : Fusionne votre branche dans `main`
3. **Merge dans panel-admin** : Fusionne votre branche dans `panel-admin`
4. **Synchronisation mutuelle** : S'assure que `main` et `panel-admin` sont identiques
5. **Retour** : Retourne sur votre branche originale

## ⚠️ Important

- Le script utilise `--no-edit` pour les merges, donc pas de message de commit interactif
- Si un conflit survient, le script s'arrêtera et vous devrez le résoudre manuellement
- Après le script, n'oubliez pas de pusher :
  ```bash
  git push origin main
  git push origin panel-admin
  ```

## 🐛 Résolution de problèmes

### Erreur : "La branche n'existe pas"

Le script essaiera de créer la branche depuis `origin`. Si elle n'existe pas non plus sur `origin`, vous devrez la créer manuellement.

### Conflits de merge

Si un conflit survient :
1. Résolvez les conflits manuellement
2. Faites `git add .`
3. Faites `git commit`
4. Relancez le script

### La branche est déjà à jour

C'est normal ! Le script affichera un message indiquant que la branche est déjà synchronisée.

## 📊 Résumé après exécution

À la fin, le script affiche :
- ✅ Le commit actuel de `main`
- ✅ Le commit actuel de `panel-admin`
- 💡 Les commandes pour pusher les changements

## 🔒 Sécurité

Le script :
- ✅ Vérifie que vous êtes dans un dépôt Git
- ✅ Vérifie que les branches existent avant de merger
- ✅ Utilise `set -e` pour s'arrêter en cas d'erreur
- ✅ Retourne sur votre branche originale à la fin

## 💡 Astuce

Pour automatiser complètement, vous pouvez créer un alias Git :

```bash
git config --global alias.sync '!npm run sync-branches'
```

Ensuite, utilisez simplement :
```bash
git sync
```
