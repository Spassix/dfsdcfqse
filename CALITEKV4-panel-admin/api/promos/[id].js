import { Redis } from '@upstash/redis'

// Initialiser Redis avec gestion d'erreur
let redis = null
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } else if (process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Si une seule variable est définie, essayer fromEnv
    try {
      redis = Redis.fromEnv()
    } catch (e) {
      console.error('Erreur Redis.fromEnv():', e.message)
    }
  }
} catch (error) {
  console.error('Erreur initialisation Redis:', error?.message || error)
  // Redis reste null si l'initialisation échoue
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Vérifier que Redis est initialisé
    if (!redis) {
      console.error('Redis non initialisé - vérifier les variables d\'environnement')
      return res.status(500).json({ error: 'Service Redis non disponible' })
    }

    const { id } = req.query
    const promoId = Array.isArray(id) ? id[0] : id
    
    if (!promoId) {
      return res.status(400).json({ error: 'ID promo requis' })
    }
    
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' })
    }
    
    const token = authHeader.substring(7)
    // Importer verifyToken seulement quand nécessaire (évite les problèmes de dépendance circulaire)
    const { verifyToken } = await import('../auth-utils-simple.js')
    const user = verifyToken(token)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès admin requis' })
    }

    if (req.method === 'GET') {
      const promo = await redis.get(`promo:${promoId}`)
      if (!promo) {
        return res.status(404).json({ error: 'Promo not found' })
      }
      return res.json(promo)
    }

    if (req.method === 'PUT') {
      const promo = await redis.get(`promo:${promoId}`)
      if (!promo) {
        return res.status(404).json({ error: 'Promo not found' })
      }

      // Parser le body manuellement car bodyParser est désactivé
      let body = ''
      await new Promise(resolve => {
        req.on('data', chunk => (body += chunk))
        req.on('end', resolve)
      })

      const bodyData = JSON.parse(body || '{}')

      // Support des deux formats : ancien (discount) et nouveau (type + value)
      let updated = {
        ...promo,
        ...bodyData,
        id: promoId,
        updatedAt: new Date().toISOString()
      }

      // Si type et value sont fournis, s'assurer qu'ils sont cohérents
      if (updated.type && updated.value !== undefined) {
        updated.type = updated.type === 'percent' ? 'percent' : 'fixed'
        updated.value = Number(updated.value)
        // Pour compatibilité avec l'ancien code
        if (updated.type === 'fixed') {
          updated.discount = updated.value
        } else {
          updated.discount = undefined
        }
      } else if (updated.discount !== undefined && !updated.type) {
        // Format ancien : s'assurer que type et value sont définis
        updated.type = 'fixed'
        updated.value = Number(updated.discount)
      }

      // Normaliser le code en majuscules
      if (updated.code) {
        updated.code = updated.code.toUpperCase()
      }

      // Sauvegarder dans la clé individuelle
      await redis.set(`promo:${promoId}`, updated)
      
      // Mettre à jour aussi le tableau data:promos.json pour compatibilité
      const promosArray = await redis.get('data:promos.json') || await redis.get('data:promos') || []
      const existingPromos = Array.isArray(promosArray) ? promosArray : []
      const promoIndex = existingPromos.findIndex(p => p && (p.id === promoId || String(p.id) === String(promoId)))
      
      if (promoIndex >= 0) {
        existingPromos[promoIndex] = updated
      } else {
        existingPromos.push(updated)
      }
      
      await redis.set('data:promos.json', existingPromos)
      await redis.set('data:promos', existingPromos)
      
      return res.json(updated)
    }

    if (req.method === 'DELETE') {
      await redis.del(`promo:${promoId}`)
      
      // Retirer aussi du tableau data:promos.json
      const promosArray = await redis.get('data:promos.json') || await redis.get('data:promos') || []
      const existingPromos = Array.isArray(promosArray) ? promosArray : []
      const filteredPromos = existingPromos.filter(p => p && p.id !== promoId && String(p.id) !== String(promoId))
      
      await redis.set('data:promos.json', filteredPromos)
      await redis.set('data:promos', filteredPromos)
      
      return res.json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error.message === 'Admin access required') {
      return res.status(403).json({ error: 'Accès admin requis' })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
