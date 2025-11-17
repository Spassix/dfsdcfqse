import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'

// Configuration depuis les variables d'environnement
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

async function migrateDatabase() {
  console.log('🔄 Début de la migration de la structure CALITEK...\n')

  try {
    // 1. Vérifier les données existantes
    console.log('📊 Vérification des données existantes...')
    const existingKeys = await redis.keys('*')
    console.log(`✅ ${existingKeys.length} clés trouvées\n`)

    // 2. Créer la structure settings
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
      const existing = await redis.get('settings:general')
      const parsed = JSON.parse(existing || '{}')
      console.log(`ℹ️  settings:general existe déjà (shopName: ${parsed.value?.shopName || 'vide'})`)
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
    } else {
      console.log('ℹ️  settings:colors existe déjà')
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
    } else {
      console.log('ℹ️  settings:loading existe déjà')
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
    } else {
      console.log('ℹ️  settings:sections existe déjà')
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
    } else {
      console.log('ℹ️  settings:events existe déjà')
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
        const count = Array.isArray(parsed) ? parsed.length : 0
        console.log(`ℹ️  ${collection} existe déjà (${count} éléments)`)
      }
    }

    // 4. Créer les objets de configuration
    console.log('\n🔧 Création des objets de configuration...')
    
    const configObjects = {
      'cart_services': {
        home: true,
        postal: true,
        meet: true,
        updatedAt: new Date().toISOString()
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
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin@123@123'
      const hashedPassword = await bcrypt.hash(defaultPassword, 10)
      
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
      console.log(`   Username: admin`)
      console.log(`   Password: ${defaultPassword}`)
    } else {
      console.log('ℹ️  Compte admin existe déjà')
    }

    // 6. Résumé final
    console.log('\n✅ Migration terminée avec succès !')
    console.log('\n📊 Résumé :')
    const allKeys = await redis.keys('*')
    console.log(`   - ${allKeys.length} clés au total`)
    
    const settingsKeys = allKeys.filter(k => k.startsWith('settings:'))
    const collections = allKeys.filter(k => ['categories', 'farms', 'products', 'socials', 'promos', 'reviews', 'admin_users'].includes(k))
    const configs = allKeys.filter(k => ['cart_services', 'banner', 'loadingscreen', 'payments', 'productModal', 'typography'].includes(k))
    
    console.log(`   - Settings (${settingsKeys.length}) : ${settingsKeys.join(', ')}`)
    console.log(`   - Collections (${collections.length}) : ${collections.join(', ')}`)
    console.log(`   - Configs (${configs.length}) : ${configs.join(', ')}`)

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  }
}

// Exécuter la migration
migrateDatabase()
  .then(() => {
    console.log('\n🎉 Migration réussie !')
    console.log('\n💡 Prochaines étapes :')
    console.log('   1. Vérifiez vos données dans Upstash Dashboard')
    console.log('   2. Testez le panel admin : https://votre-site.vercel.app/admin/login')
    console.log('   3. Configurez vos paramètres dans le panel admin')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erreur:', error)
    process.exit(1)
  })
