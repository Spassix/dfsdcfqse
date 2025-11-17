# 🔍 RÉCUPÉRER VOS DONNÉES EXISTANTES

## 🎯 Problème

Le panel admin fonctionne mais **toutes vos données sont manquantes** :
- ❌ Produits
- ❌ Catégories
- ❌ Farms
- ❌ Réseaux sociaux
- ❌ Avis
- ❌ Services de livraison
- ❌ Tout le reste

**Pourquoi ?** La branche `panel-admin` utilise une base Upstash VIDE ou DIFFÉRENTE de celle de votre boutique en production !

---

## ✅ SOLUTION : 2 Options

### 📊 **Option A : Utiliser LA MÊME Base Upstash Que Production**

Si votre boutique en production a déjà toutes les données, utilisez **les mêmes credentials Upstash** !

#### Étape 1 : Trouver les Credentials Production

1. **Vercel Dashboard** : https://vercel.com/dashboard
2. **CALITEKV4** → **Settings** → **Environment Variables**
3. **Cherchez** `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` qui sont configurés pour **Production**
4. **Notez les valeurs** (vous en aurez besoin)

#### Étape 2 : Copier vers Preview

Si les variables existent pour **Production** mais PAS pour **Preview** :

1. **Cliquez sur chaque variable** (URL et TOKEN)
2. **Edit** (modifier)
3. **Cochez AUSSI la case "Preview"** (en plus de Production)
4. **Save**

**OU** Si les valeurs sont différentes :

Créez de nouvelles variables spécifiquement pour Preview avec les MÊMES valeurs que Production.

#### Étape 3 : Redéployer

1. **Deployments** → Dernier déploiement `panel-admin`
2. **•••** → **Redeploy**
3. Attendez 1-2 minutes

#### Étape 4 : Vérifier

Allez sur le panel admin et vérifiez si vos données apparaissent !

---

### 🔄 **Option B : Migrer les Données Depuis la Production**

Si les données sont sur une **autre base Upstash** et vous ne pouvez pas les mixer, il faut **exporter depuis production et importer dans preview**.

#### Méthode 1 : Export/Import Upstash

1. **Upstash Console** : https://console.upstash.com/
2. **Base de PRODUCTION** :
   - Ouvrez la console CLI
   - Exportez toutes les clés :
     ```bash
     # Exporter produits
     KEYS product:*
     KEYS category:*
     KEYS farm:*
     KEYS social:*
     KEYS data:*
     ```
3. **Base de PREVIEW** :
   - Importez les données manuellement

**⚠️ C'est complexe ! Option A est recommandée !**

#### Méthode 2 : Script de Migration (Plus Facile)

Je peux créer un script qui copie automatiquement les données de Production vers Preview.

**Voulez-vous que je crée ce script ?**

---

### 📝 **Option C : Recréer Manuellement (Si Peu de Données)**

Si vous n'avez que quelques produits/catégories, c'est peut-être plus rapide de les recréer manuellement depuis le panel admin :

1. **Panel Admin** → **Catégories** → Créez vos catégories
2. **Panel Admin** → **Farms** → Créez vos marques
3. **Panel Admin** → **Produits** → Ajoutez vos produits
4. **Panel Admin** → **Socials** → Ajoutez vos réseaux sociaux
5. Etc.

---

## 🔍 DIAGNOSTIC : Vérifier Où Sont Vos Données

### Test 1 : Vérifier Production

Allez sur votre site en **PRODUCTION** (domaine principal, pas panel-admin) :

```
https://votre-domaine-principal.vercel.app/products
```

**Vous voyez vos produits ?**
- ✅ **OUI** → Vos données sont dans la base Upstash de Production → Utilisez **Option A**
- ❌ **NON** → Vos données étaient peut-être en localStorage ou perdues → Utilisez **Option C**

### Test 2 : Vérifier Variables Upstash

**Vercel** → **Settings** → **Environment Variables**

Cherchez `UPSTASH_REDIS_REST_URL` :

**Scenario 1** : Une seule valeur, cochée pour Production ET Preview
→ **C'est bon !** Mais redéployez panel-admin pour que ça prenne effet

**Scenario 2** : Une valeur pour Production, PAS de valeur pour Preview
→ **Ajoutez Preview !** (Option A, Étape 2)

**Scenario 3** : Deux valeurs différentes (Production ≠ Preview)
→ **C'est ça le problème !** Preview utilise une base vide
→ Soit copiez les credentials de Production vers Preview
→ Soit migrez les données (Option B)

**Scenario 4** : Aucune variable
→ **Ajoutez-les !** (voir URGENCE_VARIABLES_AUTH.md)

---

## 🚀 ACTION IMMÉDIATE

### Étape 1 : Diagnostic Rapide

**Répondez à ces questions** :

1. **Votre site principal (production) affiche-t-il vos produits ?**
   - OUI / NON

2. **Dans Vercel → Environment Variables, `UPSTASH_REDIS_REST_URL` est configuré pour :**
   - [ ] Production uniquement
   - [ ] Preview uniquement
   - [ ] Production ET Preview (mêmes valeurs)
   - [ ] Production ET Preview (valeurs différentes)
   - [ ] Aucune configuration

---

## 📋 Checklist Selon Votre Situation

### ✅ Si Production Fonctionne + Variables Différentes

- [ ] Copier credentials Upstash de Production vers Preview
- [ ] Redéployer panel-admin
- [ ] Vérifier que les données apparaissent

### ✅ Si Production Fonctionne + Variables Manquantes Preview

- [ ] Ajouter checkbox "Preview" aux variables Production
- [ ] Redéployer panel-admin
- [ ] Vérifier que les données apparaissent

### ✅ Si Production NE Fonctionne PAS

- [ ] Vos données étaient probablement en localStorage (local uniquement)
- [ ] Recréez vos données manuellement depuis le panel admin
- [ ] Ou fournissez-moi vos anciennes données pour migration

---

## 🔥 Solution la Plus Rapide

**Je recommande Option A si :**
- Votre boutique principale (production) affiche déjà des produits
- Vous voulez juste que le panel admin accède aux mêmes données

**Faites ça** :
1. Vérifiez si `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` sont cochés "Preview"
2. Si NON → Cochez "Preview"
3. Redéployez panel-admin
4. Vos données devraient apparaître !

---

## 🆘 Besoin d'Aide ?

**Dites-moi** :
1. Est-ce que votre boutique en production affiche des produits ?
2. Quelle est l'URL de votre site principal (production) ?
3. Voulez-vous que je crée un script de migration automatique ?

**Une fois que je sais où sont vos données, je peux vous aider à les récupérer !** 🚀
