# 📋 Guide Complet : Dupliquer CALITEK et Migrer Upstash Redis

## 🎯 Objectif
Dupliquer le projet CALITEK et migrer votre base de données Upstash Redis existante vers la nouvelle structure, en préservant vos données.

---

## 📦 ÉTAPE 1 : Dupliquer le Projet CALITEK

### 1.1 Forker/Cloner le Repository

```bash
# Option 1 : Forker sur GitHub
# Allez sur https://github.com/juniorrrrr345/CALITEKV4
# Cliquez sur "Fork" pour créer votre propre copie

# Option 2 : Cloner directement
git clone https://github.com/juniorrrrr345/CALITEKV4.git votre-nouveau-projet
cd votre-nouveau-projet
```

### 1.2 Créer un Nouveau Repository GitHub

```bash
# Créer un nouveau repo sur GitHub (ex: VOTRE-BOUTIQUE-V4)
# Puis changer l'origin
git remote remove origin
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-BOUTIQUE-V4.git
git push -u origin main
```

### 1.3 Installer les Dépendances

```bash
npm install
```

---

## 🔧 ÉTAPE 2 : Configuration Vercel

### 2.1 Créer un Nouveau Projet Vercel

1. Allez sur https://vercel.com/dashboard
2. Cliquez sur **"Add New"** → **"Project"**
3. Importez votre nouveau repository GitHub
4. Configurez :
   - **Framework Preset** : Vite
   - **Root Directory** : `./`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`

### 2.2 Configurer les Variables d'Environnement

Dans **Settings** → **Environment Variables**, ajoutez :

```
# Upstash Redis (VOS CREDENTIALS EXISTANTS)
UPSTASH_REDIS_REST_URL=https://votre-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=votre_token_upstash

# Vercel Blob (VOS CREDENTIALS EXISTANTS)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_votre_token

# Admin Panel
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=votre_mot_de_passe_securise
JWT_SECRET=votre_secret_jwt_aleatoire_32_caracteres

# API (optionnel)
VITE_API_URL=/api
```

**⚠️ IMPORTANT** : Cochez les 3 cases pour chaque variable :
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 🗄️ ÉTAPE 3 : Migration Upstash Redis

### 3.1 Structure des Données CALITEK

CALITEK utilise cette structure dans Upstash Redis :

```
settings:general          → Configuration générale (shopName, heroTitle, etc.)
settings:cart             → Configuration du panier (services, paiements)
settings:colors           → Couleurs du thème
settings:loading          → Configuration écran de chargement
settings:sections         → Sections de la page d'accueil
settings:events           → Événements (Noël, Halloween, etc.)

categories                 → Liste des catégories (array)
farms                      → Liste des farms/marques (array)
products                  → Liste des produits (array)
socials                   → Réseaux sociaux (array)
promos                    → Codes promo (array)
reviews                   → Avis clients (array)
admin_users               → Utilisateurs admin (array)

cart_services             → Services de livraison (object)
banner                    → Banderole défilante (object)
loadingscreen             → Écran de chargement (object)
payments                  → Modes de paiement (object)
productModal              → Configuration modal produit (object)
typography                → Typographie (object)
```

### 3.2 Script de Migration

Créez un fichier `migrate-upstash.js` à la racine :

```javascript
import { Redis } from '@upstash/redis'

// Vos credentials Upstash (les mêmes que dans Vercel)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

async function migrateDatabase() {
  console.log('🔄 Début de la migration...\n')

  try {
    // 1. Vérifier les données existantes
    console.log('📊 Vérification des données existantes...')
    const existingKeys = await redis.keys('*')
    console.log(`✅ ${existingKeys.length} clés trouvées\n`)

    // 2. Créer la structure settings si elle n'existe pas
    console.log('⚙️  Création de la structure settings...')
    
    // settings:general
    const generalExists = await redis.exists('settings:general')
    if (!generalExists) {
      await redis.set('settings:general', JSON.stringify({
        key: 'general',
        value: {
          shopName: '',
          heroTitle: '',
          heroSubtitle: '',
          backgroundImage: '',
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }))
      console.log('✅ settings:general créé')
    } else {
      console.log('ℹ️  settings:general existe déjà')
    }

    // settings:cart
    const cartExists = await redis.exists('settings:cart')
    if (!cartExists) {
      await redis.set('settings:cart', JSON.stringify({
        key: 'cart',
        value: {
          services: [
            { 
              name: 'Livraison', 
              label: '🚚 Livraison', 
              description: 'Livraison à domicile', 
              fee: 0, 
              enabled: true,
              slots: ['9h-12h', '12h-15h', '15h-18h', '18h-21h']
            },
            { 
              name: 'Meetup', 
              label: '🤝 Meetup', 
              description: 'Rendez-vous en personne', 
              fee: 0, 
              enabled: true,
              slots: ['10h', '14h', '16h', '20h']
            },
            { 
              name: 'Envoi', 
              label: '📦 Envoi postal', 
              description: 'Envoi par la poste', 
              fee: 0, 
              enabled: true,
              slots: ['Envoi sous 24h', 'Envoi sous 48h', 'Envoi express']
            }
          ],
          payments: [
            { label: '💵 Espèces', enabled: true },
            { label: '💳 Carte bancaire', enabled: true },
            { label: '🏦 Virement', enabled: true },
            { label: '₿ Crypto', enabled: false }
          ],
          alertEnabled: false,
          alertMessage: '',
          promosEnabled: true,
          contactLinks: [
            { name: 'WhatsApp', url: '', services: [] },
            { name: 'Telegram', url: '', services: [] }
          ],
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }))
      console.log('✅ settings:cart créé')
    } else {
      console.log('ℹ️  settings:cart existe déjà')
    }

    // settings:colors
    const colorsExists = await redis.exists('settings:colors')
    if (!colorsExists) {
      await redis.set('settings:colors', JSON.stringify({
        key: 'colors',
        value: {
          primary: '#6366f1',
          secondary: '#ec4899',
          accent: '#8b5cf6',
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }))
      console.log('✅ settings:colors créé')
    }

    // settings:loading
    const loadingExists = await redis.exists('settings:loading')
    if (!loadingExists) {
      await redis.set('settings:loading', JSON.stringify({
        key: 'loading',
        value: {
          enabled: false,
          title: 'LA NATION DU LAIT',
          text: 'Chargement Du Menu..',
          brand: 'LANATIONDULAIT',
          duration: 3000,
          bgColor: '#0a0e1b',
          textColor: '#f1f5f9',
          accentColor: '#6366f1',
          animation: 'spinner',
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }))
      console.log('✅ settings:loading créé')
    }

    // settings:sections
    const sectionsExists = await redis.exists('settings:sections')
    if (!sectionsExists) {
      await redis.set('settings:sections', JSON.stringify({
        key: 'sections',
        value: {
          sections: [],
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }))
      console.log('✅ settings:sections créé')
    }

    // settings:events
    const eventsExists = await redis.exists('settings:events')
    if (!eventsExists) {
      await redis.set('settings:events', JSON.stringify({
        key: 'events',
        value: {
          active: null,
          effectsEnabled: false,
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }))
      console.log('✅ settings:events créé')
    }

    // 3. Créer les collections vides si elles n'existent pas
    console.log('\n📦 Création des collections...')
    
    const collections = ['categories', 'farms', 'products', 'socials', 'promos', 'reviews', 'admin_users']
    
    for (const collection of collections) {
      const exists = await redis.exists(collection)
      if (!exists) {
        await redis.set(collection, JSON.stringify([]))
        console.log(`✅ ${collection} créé (vide)`)
      } else {
        const data = await redis.get(collection)
        const parsed = JSON.parse(data || '[]')
        console.log(`ℹ️  ${collection} existe déjà (${parsed.length} éléments)`)
      }
    }

    // 4. Créer les objets de configuration
    console.log('\n🔧 Création des objets de configuration...')
    
    const configObjects = {
      'cart_services': {
        home: true,
        postal: true,
        meet: true
      },
      'banner': {
        enabled: false,
        text: '',
        updatedAt: new Date().toISOString()
      },
      'loadingscreen': {
        enabled: false,
        updatedAt: new Date().toISOString()
      },
      'payments': {
        methods: [],
        updatedAt: new Date().toISOString()
      },
      'productModal': {
        bgColor: '#1a1a2e',
        borderColor: '#6366f1',
        borderRadius: 24,
        updatedAt: new Date().toISOString()
      },
      'typography': {
        fontFamily: 'Inter',
        fontSize: 16,
        updatedAt: new Date().toISOString()
      }
    }

    for (const [key, value] of Object.entries(configObjects)) {
      const exists = await redis.exists(key)
      if (!exists) {
        await redis.set(key, JSON.stringify(value))
        console.log(`✅ ${key} créé`)
      } else {
        console.log(`ℹ️  ${key} existe déjà`)
      }
    }

    // 5. Créer le compte admin par défaut
    console.log('\n👤 Création du compte admin...')
    const adminUsers = await redis.get('admin_users')
    const parsedAdmins = JSON.parse(adminUsers || '[]')
    
    const adminExists = parsedAdmins.find(u => u.username === 'admin')
    if (!adminExists) {
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin@123@123', 10)
      
      parsedAdmins.push({
        id: Date.now().toString(),
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      await redis.set('admin_users', JSON.stringify(parsedAdmins))
      console.log('✅ Compte admin créé')
    } else {
      console.log('ℹ️  Compte admin existe déjà')
    }

    console.log('\n✅ Migration terminée avec succès !')
    console.log('\n📊 Résumé :')
    const allKeys = await redis.keys('*')
    console.log(`   - ${allKeys.length} clés au total`)
    console.log(`   - Collections : categories, farms, products, socials, promos, reviews, admin_users`)
    console.log(`   - Settings : general, cart, colors, loading, sections, events`)
    console.log(`   - Config : cart_services, banner, loadingscreen, payments, productModal, typography`)

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  }
}

// Exécuter la migration
migrateDatabase()
  .then(() => {
    console.log('\n🎉 Migration réussie !')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erreur:', error)
    process.exit(1)
  })
```

### 3.3 Exécuter la Migration

```bash
# Installer bcryptjs si nécessaire
npm install bcryptjs

# Créer un fichier .env.local avec vos credentials
echo "UPSTASH_REDIS_REST_URL=https://votre-url.upstash.io" > .env.local
echo "UPSTASH_REDIS_REST_TOKEN=votre_token" >> .env.local
echo "DEFAULT_ADMIN_PASSWORD=votre_mot_de_passe" >> .env.local

# Exécuter la migration
node migrate-upstash.js
```

---

## 🔄 ÉTAPE 4 : Migrer vos Données Existantes

### 4.1 Script de Migration des Données

Si vous avez des données dans votre ancienne structure, créez `migrate-old-data.js` :

```javascript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

async function migrateOldData() {
  console.log('🔄 Migration des données existantes...\n')

  try {
    // Exemple : Migrer vos anciens produits
    const oldProducts = await redis.get('old_products') // Remplacez par votre clé
    if (oldProducts) {
      const products = JSON.parse(oldProducts)
      
      // Transformer vers le nouveau format CALITEK
      const newProducts = products.map(product => ({
        id: product.id || Date.now().toString(),
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        farm: product.farm || '',
        photo: product.photo || product.image || '',
        video: product.video || '',
        variants: product.variants || product.quantities || [],
        featured: product.featured || false,
        createdAt: product.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      // Sauvegarder dans la nouvelle structure
      await redis.set('products', JSON.stringify(newProducts))
      console.log(`✅ ${newProducts.length} produits migrés`)
    }

    // Répétez pour categories, farms, etc.
    // ...

    console.log('\n✅ Migration des données terminée !')
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

migrateOldData()
```

---

## ✅ ÉTAPE 5 : Vérification

### 5.1 Vérifier la Structure

```bash
# Créer un script de vérification
node -e "
import('@upstash/redis').then(async ({ Redis }) => {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  
  const keys = await redis.keys('*')
  console.log('Clés dans Redis:', keys)
  
  for (const key of ['settings:general', 'settings:cart', 'products', 'categories']) {
    const data = await redis.get(key)
    console.log(\`\n\${key}:\`, JSON.parse(data || '{}'))
  }
})
"
```

### 5.2 Tester le Panel Admin

1. Allez sur `https://votre-projet.vercel.app/admin/login`
2. Connectez-vous avec :
   - Username : `admin`
   - Password : Votre mot de passe configuré
3. Vérifiez que toutes les pages fonctionnent

---

## 📝 Checklist Finale

- [ ] Projet CALITEK cloné/forké
- [ ] Nouveau repository GitHub créé
- [ ] Projet Vercel créé et configuré
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Script de migration exécuté
- [ ] Structure Redis créée
- [ ] Données existantes migrées (si applicable)
- [ ] Panel admin accessible et fonctionnel
- [ ] Test de connexion admin réussi
- [ ] Vérification des pages admin

---

## 🆘 Problèmes Courants

### Erreur : "Cannot find module '@upstash/redis'"
```bash
npm install @upstash/redis
```

### Erreur : "Invalid credentials"
- Vérifiez vos variables d'environnement Upstash
- Assurez-vous qu'elles sont bien configurées sur Vercel

### Les données ne s'affichent pas
- Vérifiez que la migration a bien créé les clés
- Vérifiez le format JSON des données
- Consultez les logs Vercel pour les erreurs API

---

## 🎯 Résumé Rapide (15 minutes)

1. **Forker CALITEK** (2 min)
2. **Créer projet Vercel** (3 min)
3. **Configurer variables d'environnement** (2 min)
4. **Exécuter script de migration** (5 min)
5. **Tester panel admin** (3 min)

**Total : ~15 minutes** ⏱️

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs Vercel
2. Vérifiez les clés Redis avec `redis.keys('*')`
3. Testez les endpoints API directement

---

**✅ Votre base de données est maintenant prête avec la structure CALITEK !**
