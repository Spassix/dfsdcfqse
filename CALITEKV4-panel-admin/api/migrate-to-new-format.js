import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method POST required' })
  }

  try {
    // Récupérer les données de data:products.json
    const legacyData = await redis.get('data:products.json')
    
    if (!legacyData) {
      return res.status(200).json({
        success: false,
        message: 'Aucune donnée dans data:products.json'
      })
    }

    let products = []
    try {
      products = typeof legacyData === 'string' ? JSON.parse(legacyData) : legacyData
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Erreur parsing data:products.json',
        details: e.message
      })
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'Aucun produit à migrer'
      })
    }

    // Migrer chaque produit
    let migrated = 0
    let errors = []

    for (const product of products) {
      try {
        if (!product.id) {
          errors.push({ product: product.name, error: 'Pas d\'ID' })
          continue
        }

        const productKey = `product:${product.id}`
        
        // Créer le produit au format product:*
        await redis.set(productKey, JSON.stringify({
          ...product,
          variants: product.quantities || product.variants || [],
          medias: [product.photo, product.video].filter(Boolean),
          createdAt: product.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))

        migrated++
      } catch (error) {
        errors.push({
          product: product.name || product.id,
          error: error.message
        })
      }
    }

    // Extraire les catégories uniques
    const categoriesSet = new Set()
    products.forEach(p => {
      if (p.category && p.category.trim()) {
        categoriesSet.add(p.category.trim())
      }
    })

    // Créer les catégories
    let categoriesCreated = 0
    for (const catName of categoriesSet) {
      try {
        const catId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        await redis.set(`category:${catId}`, JSON.stringify({
          id: catId,
          name: catName,
          enabled: true,
          createdAt: new Date().toISOString()
        }))
        categoriesCreated++
      } catch (e) {
        // Ignorer
      }
    }

    // Extraire les farms uniques
    const farmsSet = new Set()
    products.forEach(p => {
      if (p.farm && p.farm.trim()) {
        farmsSet.add(p.farm.trim())
      }
    })

    // Créer les farms
    let farmsCreated = 0
    for (const farmName of farmsSet) {
      try {
        const farmId = `farm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        await redis.set(`farm:${farmId}`, JSON.stringify({
          id: farmId,
          name: farmName,
          enabled: true,
          createdAt: new Date().toISOString()
        }))
        farmsCreated++
      } catch (e) {
        // Ignorer
      }
    }

    return res.status(200).json({
      success: true,
      message: '✅ Migration terminée !',
      results: {
        products: {
          total: products.length,
          migrated,
          errors: errors.length
        },
        categories: {
          found: categoriesSet.size,
          created: categoriesCreated
        },
        farms: {
          found: farmsSet.size,
          created: farmsCreated
        }
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      nextSteps: [
        'Rafraîchissez le panel admin',
        'Vos 57 produits devraient maintenant apparaître !',
        'Les catégories et farms sont créées automatiquement'
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
