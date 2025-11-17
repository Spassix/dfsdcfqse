/**
 * Endpoint temporaire pour supprimer le code promo FRAPPY94
 * À supprimer après utilisation
 */

import { Redis } from '@upstash/redis'
import { verifyToken } from './auth-utils-simple.js'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vérifier l'authentification admin
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' })
    }
    
    const token = authHeader.substring(7)
    const user = verifyToken(token)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès admin requis' })
    }

    console.log('🔍 Recherche des codes promo FRAPPY94...')
    
    // Récupérer tous les codes promo
    const promosArray = await redis.get('data:promos.json') || await redis.get('data:promos') || []
    const keys = await redis.keys('promo:*')
    
    let foundPromos = []
    
    // Chercher dans le tableau
    if (Array.isArray(promosArray)) {
      for (const promo of promosArray) {
        if (promo && promo.code) {
          const codeUpper = promo.code.toUpperCase()
          if (codeUpper.includes('FRAPPY94') || codeUpper.includes('FRAPPY')) {
            foundPromos.push({ ...promo, source: 'tableau' })
          }
        }
      }
    }
    
    // Chercher dans les clés individuelles
    for (const key of keys) {
      const promo = await redis.get(key)
      if (promo && promo.code) {
        const codeUpper = promo.code.toUpperCase()
        if (codeUpper.includes('FRAPPY94') || codeUpper.includes('FRAPPY')) {
          foundPromos.push({ ...promo, source: 'clé', key })
        }
      }
    }
    
    if (foundPromos.length === 0) {
      return res.json({ 
        success: true, 
        message: 'Aucun code promo FRAPPY94 trouvé',
        deleted: 0 
      })
    }
    
    // Supprimer tous les codes promo FRAPPY94
    let deletedCount = 0
    const deletedIds = []
    
    for (const promo of foundPromos) {
      try {
        // Supprimer la clé individuelle si elle existe
        if (promo.key) {
          await redis.del(promo.key)
          deletedIds.push(promo.id)
          deletedCount++
        } else if (promo.id) {
          const key = `promo:${promo.id}`
          await redis.del(key)
          deletedIds.push(promo.id)
          deletedCount++
        }
      } catch (error) {
        console.error(`Erreur lors de la suppression de ${promo.id}:`, error.message)
      }
    }
    
    // Mettre à jour le tableau en retirant les promos FRAPPY94
    if (Array.isArray(promosArray)) {
      const filteredPromos = promosArray.filter(p => {
        if (!p || !p.code) return true
        const codeUpper = p.code.toUpperCase()
        return !codeUpper.includes('FRAPPY94') && !codeUpper.includes('FRAPPY')
      })
      
      await redis.set('data:promos.json', filteredPromos)
      await redis.set('data:promos', filteredPromos)
    }
    
    return res.json({
      success: true,
      message: `${deletedCount} code(s) promo FRAPPY94 supprimé(s)`,
      deleted: deletedCount,
      deletedIds: deletedIds,
      foundPromos: foundPromos.map(p => ({
        id: p.id,
        code: p.code,
        source: p.source
      }))
    })
    
  } catch (error) {
    console.error('Erreur:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
