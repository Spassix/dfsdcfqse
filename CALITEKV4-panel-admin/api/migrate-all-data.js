import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const results = {
      products: { migrated: 0, errors: [] },
      categories: { migrated: 0, errors: [] },
      farms: { migrated: 0, errors: [] },
      socials: { migrated: 0, errors: [] },
      reviews: { migrated: 0, errors: [] },
      config: { migrated: 0, errors: [] }
    }

    // GET = Voir ce qu'il y a à migrer
    if (req.method === 'GET') {
      const data = {}
      
      // Vérifier produits
      const productsData = await redis.get('data:products.json')
      if (productsData) {
        const products = typeof productsData === 'string' ? JSON.parse(productsData) : productsData
        data.products = { count: Array.isArray(products) ? products.length : 0, sample: Array.isArray(products) ? products[0] : null }
      }
      
      // Vérifier catégories
      const categoriesData = await redis.get('data:categories.json')
      if (categoriesData) {
        const categories = typeof categoriesData === 'string' ? JSON.parse(categoriesData) : categoriesData
        data.categories = { count: Array.isArray(categories) ? categories.length : 0, sample: Array.isArray(categories) ? categories[0] : null }
      }
      
      // Vérifier farms
      const farmsData = await redis.get('data:farms.json')
      if (farmsData) {
        const farms = typeof farmsData === 'string' ? JSON.parse(farmsData) : farmsData
        data.farms = { count: Array.isArray(farms) ? farms.length : 0, sample: Array.isArray(farms) ? farms[0] : null }
      }
      
      // Vérifier socials
      const socialsData = await redis.get('data:socials.json')
      if (socialsData) {
        const socials = typeof socialsData === 'string' ? JSON.parse(socialsData) : socialsData
        data.socials = { count: Array.isArray(socials) ? socials.length : 0, sample: Array.isArray(socials) ? socials[0] : null }
      }
      
      // Vérifier reviews
      const reviewsData = await redis.get('data:reviews.json')
      if (reviewsData) {
        const reviews = typeof reviewsData === 'string' ? JSON.parse(reviewsData) : reviewsData
        data.reviews = { count: Array.isArray(reviews) ? reviews.length : 0, sample: Array.isArray(reviews) ? reviews[0] : null }
      }
      
      // Vérifier config
      const configKeys = ['cart_services', 'settings:general', 'settings:colors', 'settings:events', 'config']
      for (const key of configKeys) {
        const val = await redis.get(`data:${key}`)
        if (val) {
          data[key] = { exists: true, preview: typeof val === 'string' ? val.substring(0, 100) : JSON.stringify(val).substring(0, 100) }
        }
      }
      
      return res.json({
        success: true,
        message: 'Données disponibles pour migration',
        data,
        instruction: 'Utilisez POST pour lancer la migration'
      })
    }

    // POST = Migrer tout
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method POST required for migration' })
    }

    // ========== MIGRER PRODUITS ==========
    try {
      const productsData = await redis.get('data:products.json')
      if (productsData) {
        const products = typeof productsData === 'string' ? JSON.parse(productsData) : productsData
        if (Array.isArray(products)) {
          for (const product of products) {
            try {
              if (!product.id) continue
              const productKey = `product:${product.id}`
              await redis.set(productKey, JSON.stringify({
                ...product,
                variants: product.quantities || product.variants || [],
                medias: [product.photo, product.video].filter(Boolean),
                createdAt: product.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }))
              results.products.migrated++
            } catch (e) {
              results.products.errors.push({ id: product.id, error: e.message })
            }
          }
        }
      }
    } catch (e) {
      results.products.errors.push({ general: e.message })
    }

    // ========== MIGRER CATEGORIES ==========
    try {
      const categoriesData = await redis.get('data:categories.json')
      if (categoriesData) {
        const categories = typeof categoriesData === 'string' ? JSON.parse(categoriesData) : categoriesData
        if (Array.isArray(categories)) {
          for (const category of categories) {
            try {
              const catId = category.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
              await redis.set(`category:${catId}`, JSON.stringify({
                ...category,
                id: catId,
                enabled: category.enabled !== false,
                createdAt: category.createdAt || new Date().toISOString()
              }))
              results.categories.migrated++
            } catch (e) {
              results.categories.errors.push({ name: category.name, error: e.message })
            }
          }
        }
      }
    } catch (e) {
      results.categories.errors.push({ general: e.message })
    }

    // ========== MIGRER FARMS ==========
    try {
      const farmsData = await redis.get('data:farms.json')
      if (farmsData) {
        const farms = typeof farmsData === 'string' ? JSON.parse(farmsData) : farmsData
        if (Array.isArray(farms)) {
          for (const farm of farms) {
            try {
              const farmId = farm.id || `farm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
              await redis.set(`farm:${farmId}`, JSON.stringify({
                ...farm,
                id: farmId,
                enabled: farm.enabled !== false,
                createdAt: farm.createdAt || new Date().toISOString()
              }))
              results.farms.migrated++
            } catch (e) {
              results.farms.errors.push({ name: farm.name, error: e.message })
            }
          }
        }
      }
    } catch (e) {
      results.farms.errors.push({ general: e.message })
    }

    // ========== MIGRER SOCIALS ==========
    try {
      const socialsData = await redis.get('data:socials.json')
      if (socialsData) {
        const socials = typeof socialsData === 'string' ? JSON.parse(socialsData) : socialsData
        if (Array.isArray(socials)) {
          for (const social of socials) {
            try {
              const socialId = social.id || `social_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
              await redis.set(`social:${socialId}`, JSON.stringify({
                ...social,
                id: socialId,
                createdAt: social.createdAt || new Date().toISOString()
              }))
              results.socials.migrated++
            } catch (e) {
              results.socials.errors.push({ platform: social.platform, error: e.message })
            }
          }
        }
      }
    } catch (e) {
      results.socials.errors.push({ general: e.message })
    }

    // ========== MIGRER REVIEWS ==========
    try {
      const reviewsData = await redis.get('data:reviews.json')
      if (reviewsData) {
        const reviews = typeof reviewsData === 'string' ? JSON.parse(reviewsData) : reviewsData
        if (Array.isArray(reviews)) {
          for (const review of reviews) {
            try {
              const reviewId = review.id || `review_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
              await redis.set(`review:${reviewId}`, JSON.stringify({
                ...review,
                id: reviewId,
                createdAt: review.createdAt || new Date().toISOString()
              }))
              results.reviews.migrated++
            } catch (e) {
              results.reviews.errors.push({ id: review.id, error: e.message })
            }
          }
        }
      }
    } catch (e) {
      results.reviews.errors.push({ general: e.message })
    }

    // ========== MIGRER CONFIG ==========
    try {
      // Cart services
      const cartServices = await redis.get('data:cart_services.json')
      if (cartServices) {
        await redis.set('cart_services', cartServices)
        results.config.migrated++
      }
      
      // Config général
      const config = await redis.get('data:config.json')
      if (config) {
        await redis.set('settings:general', config)
        results.config.migrated++
      }
    } catch (e) {
      results.config.errors.push({ general: e.message })
    }

    return res.json({
      success: true,
      message: '🎉 Migration complète terminée !',
      results,
      summary: {
        products: `${results.products.migrated} produits migrés`,
        categories: `${results.categories.migrated} catégories migrées`,
        farms: `${results.farms.migrated} farms migrées`,
        socials: `${results.socials.migrated} réseaux sociaux migrés`,
        reviews: `${results.reviews.migrated} avis migrés`,
        config: `${results.config.migrated} configs migrées`
      },
      nextSteps: [
        'Rafraîchissez le panel admin',
        'Toutes vos données devraient apparaître !',
        'Vérifiez chaque section (Produits, Catégories, Farms, Socials)'
      ]
    })
  } catch (error) {
    console.error('Migration error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
