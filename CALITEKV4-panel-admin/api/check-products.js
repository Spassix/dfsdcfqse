/**
 * Endpoint de diagnostic pour vérifier l'état des produits dans Redis
 * GET /api/check-products pour voir combien de produits sont dans chaque format
 */

import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

function safeJSONParse(str, defaultValue = []) {
  if (!str) return defaultValue
  try {
    return JSON.parse(str)
  } catch (e) {
    return defaultValue
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const results = {
      timestamp: new Date().toISOString(),
      redis: {
        connected: false,
        url: process.env.UPSTASH_REDIS_REST_URL ? '✅ Configuré' : '❌ Non configuré',
        token: process.env.UPSTASH_REDIS_REST_TOKEN ? '✅ Configuré' : '❌ Non configuré'
      },
      products: {
        legacy: {
          count: 0,
          key: 'data:products.json',
          products: []
        },
        individual: {
          count: 0,
          keys: [],
          products: []
        },
        total: 0
      }
    }

    // Test de connexion Redis
    try {
      await redis.ping()
      results.redis.connected = true
    } catch (error) {
      results.redis.connected = false
      results.redis.error = error.message
    }

    if (!results.redis.connected) {
      return res.status(500).json({
        ...results,
        error: 'Impossible de se connecter à Redis'
      })
    }

    // 1. Vérifier data:products.json
    try {
      const legacyData = await redis.get('data:products.json')
      if (legacyData) {
        const parsed = typeof legacyData === 'string' ? JSON.parse(legacyData) : legacyData
        if (Array.isArray(parsed)) {
          results.products.legacy.count = parsed.length
          results.products.legacy.products = parsed.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category
          }))
        }
      }
    } catch (error) {
      results.products.legacy.error = error.message
    }

    // 2. Vérifier product:*
    try {
      const keys = await redis.keys('product:*')
      if (keys && keys.length > 0) {
        results.products.individual.keys = keys
        results.products.individual.count = keys.length
        
        const productsData = await redis.mget(...keys)
        results.products.individual.products = productsData
          .filter(p => p !== null)
          .map(p => {
            try {
              const product = typeof p === 'string' ? JSON.parse(p) : p
              return {
                id: product.id,
                name: product.name,
                category: product.category
              }
            } catch (e) {
              return null
            }
          })
          .filter(p => p !== null)
      }
    } catch (error) {
      results.products.individual.error = error.message
    }

    // 3. Calculer le total unique
    const allIds = new Set()
    results.products.legacy.products.forEach(p => {
      if (p && p.id) allIds.add(String(p.id))
    })
    results.products.individual.products.forEach(p => {
      if (p && p.id) allIds.add(String(p.id))
    })
    results.products.total = allIds.size

    return res.status(200).json(results)
  } catch (error) {
    console.error('❌ Erreur check products:', error)
    return res.status(500).json({
      error: error.message || 'Erreur lors de la vérification',
      details: String(error)
    })
  }
}
