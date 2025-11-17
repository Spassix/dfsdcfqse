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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Vérifier que Redis est initialisé
    if (!redis) {
      console.error('Redis non initialisé - vérifier les variables d\'environnement')
      if (req.method === 'GET') {
        // Retourner un tableau vide pour ne pas casser le frontend
        return res.status(200).json([])
      }
      return res.status(500).json({ error: 'Service Redis non disponible' })
    }

    // ───────────────────────────
    // GET — CLIENT + ADMIN
    // ───────────────────────────
    if (req.method === 'GET') {
      // Vérifier si c'est un admin (pour retourner toutes les promos)
      let isAdmin = false
      try {
        const authHeader = req.headers.authorization
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7)
          // Importer verifyToken seulement quand nécessaire (évite les problèmes de dépendance circulaire)
          const { verifyToken } = await import('./auth-utils-simple.js')
          const user = verifyToken(token)
          isAdmin = user && user.role === 'admin'
        }
      } catch (e) {
        // Non authentifié = accès public
      }

      // Essayer d'abord data:promos (format tableau)
      let promos = await redis.get('data:promos')

      // Si pas de tableau, essayer de récupérer depuis les clés individuelles promo:*
      if (!promos || !Array.isArray(promos) || promos.length === 0) {
        try {
          const keys = await redis.keys('promo:*')
          if (keys && keys.length > 0) {
            const promosData = await redis.mget(...keys)
            promos = promosData
              .filter(p => p !== null)
              .map(p => {
                if (typeof p === 'string') {
                  try {
                    return JSON.parse(p)
                  } catch (e) {
                    return null
                  }
                }
                return p
              })
              .filter(p => p !== null)
            
            // Sauvegarder dans data:promos pour la prochaine fois
            if (promos.length > 0) {
              await redis.set('data:promos', promos)
            }
          }
        } catch (err) {
          console.error('Erreur récupération promos individuelles:', err)
        }
      }

      // Sécurité : si null → tableau vide
      if (!promos || !Array.isArray(promos)) {
        promos = []
      }

      // Côté client → retourner seulement les promos activées
      // Côté admin → retourner toutes les promos
      const activePromos = isAdmin ? promos : promos.filter(p => p && p.enabled !== false)

      return res.status(200).json(activePromos)
    }

    // ───────────────────────────
    // POST — ADMIN PANEL
    // ───────────────────────────
    if (req.method === 'POST') {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token manquant' })
      }
      
      const token = authHeader.substring(7)
      // Importer verifyToken seulement quand nécessaire (évite les problèmes de dépendance circulaire)
      const { verifyToken } = await import('./auth-utils-simple.js')
      const user = verifyToken(token)
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès admin requis' })
      }

      // Parser le body manuellement car bodyParser est désactivé
      let body = ''
      await new Promise(resolve => {
        req.on('data', chunk => (body += chunk))
        req.on('end', resolve)
      })

      const bodyData = JSON.parse(body || '{}')
      const { code, type, value, minAmount, enabled } = bodyData

      if (!code) return res.status(400).json({ error: 'Code requis' })

      let promoValue = Number(value)
      if (isNaN(promoValue) || promoValue <= 0) {
        return res.status(400).json({ error: 'Valeur invalide' })
      }

      const promoId = `promo_${Date.now()}`
      const newPromo = {
        id: promoId,
        code: code.toUpperCase().trim(),
        type: type || 'fixed',
        value: promoValue,
        discount: type === 'fixed' ? promoValue : undefined,
        minAmount: Number(minAmount) || 0,
        enabled: enabled !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Charger tableau existant depuis data:promos
      let promos = await redis.get('data:promos')
      if (!Array.isArray(promos)) {
        // Essayer de charger depuis les clés individuelles
        try {
          const keys = await redis.keys('promo:*')
          if (keys && keys.length > 0) {
            const promosData = await redis.mget(...keys)
            promos = promosData
              .filter(p => p !== null)
              .map(p => {
                if (typeof p === 'string') {
                  try {
                    return JSON.parse(p)
                  } catch (e) {
                    return null
                  }
                }
                return p
              })
              .filter(p => p !== null)
          } else {
            promos = []
          }
        } catch (err) {
          console.error('Erreur chargement promos:', err)
          promos = []
        }
      }

      // Remplacer si un code existe déjà
      const idx = promos.findIndex(p => p && p.code === newPromo.code)
      if (idx >= 0) {
        newPromo.id = promos[idx].id // Garder l'ID existant
        promos[idx] = newPromo
      } else {
        promos.push(newPromo)
      }

      // Sauvegarder dans data:promos ET dans la clé individuelle
      await redis.set('data:promos', promos)
      await redis.set(`promo:${newPromo.id}`, JSON.stringify(newPromo))

      return res.status(200).json(newPromo)
    }

    return res.status(405).json({ error: 'Méthode non autorisée' })
  } catch (error) {
    console.error('Promos API error:', error)
    // Pour GET, retourner un tableau vide au lieu d'une erreur 500
    if (req.method === 'GET') {
      return res.status(200).json([])
    }
    if (error.message === 'Admin access required') {
      return res.status(403).json({ error: 'Accès admin requis' })
    }
    return res.status(500).json({ error: 'Erreur interne serveur' })
  }
}

export const config = {
  api: { bodyParser: false },
}
