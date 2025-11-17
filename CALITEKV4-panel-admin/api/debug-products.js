import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Vérifier les clés de produits
    const productKeys = await redis.keys('product:*')
    const legacyData = await redis.get('data:products.json')
    
    let legacyProducts = []
    if (legacyData) {
      try {
        legacyProducts = typeof legacyData === 'string' ? JSON.parse(legacyData) : legacyData
      } catch (e) {
        legacyProducts = []
      }
    }
    
    // Récupérer quelques produits individuels
    let sampleProducts = []
    if (productKeys && productKeys.length > 0) {
      const samples = await redis.mget(...productKeys.slice(0, 3))
      sampleProducts = samples.filter(p => p !== null).map(p => {
        try {
          return typeof p === 'string' ? JSON.parse(p) : p
        } catch (e) {
          return p
        }
      })
    }

    return res.status(200).json({
      success: true,
      storage: {
        'product:* keys': {
          count: productKeys.length,
          keys: productKeys.slice(0, 10),
          sample: sampleProducts.length > 0 ? sampleProducts[0] : null
        },
        'data:products.json': {
          exists: !!legacyData,
          count: Array.isArray(legacyProducts) ? legacyProducts.length : 0,
          sample: Array.isArray(legacyProducts) && legacyProducts.length > 0 ? legacyProducts[0] : null
        }
      },
      totalProducts: productKeys.length + (Array.isArray(legacyProducts) ? legacyProducts.length : 0),
      recommendation: productKeys.length === 0 && (!Array.isArray(legacyProducts) || legacyProducts.length === 0)
        ? '❌ Aucun produit trouvé dans Redis. Ajoutez des produits depuis le panel admin.'
        : `✅ ${productKeys.length} produits dans product:*, ${Array.isArray(legacyProducts) ? legacyProducts.length : 0} dans data:products.json`
    })
  } catch (error) {
    console.error('Debug products error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
