/**
 * Script pour supprimer le code promo de l'ancienne boutique FRAPPY94
 */

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

async function deleteFrappy94Promo() {
  try {
    console.log('🔍 Recherche des codes promo FRAPPY94...')
    
    // Récupérer tous les codes promo
    const promosArray = await redis.get('data:promos.json') || await redis.get('data:promos') || []
    const keys = await redis.keys('promo:*')
    
    console.log(`📊 Trouvé ${promosArray?.length || 0} promos dans le tableau et ${keys?.length || 0} clés individuelles`)
    
    let foundPromos = []
    
    // Chercher dans le tableau
    if (Array.isArray(promosArray)) {
      for (const promo of promosArray) {
        if (promo && (promo.code?.toUpperCase().includes('FRAPPY94') || promo.code?.toUpperCase().includes('FRAPPY'))) {
          foundPromos.push({ ...promo, source: 'tableau' })
        }
      }
    }
    
    // Chercher dans les clés individuelles
    for (const key of keys) {
      const promo = await redis.get(key)
      if (promo && (promo.code?.toUpperCase().includes('FRAPPY94') || promo.code?.toUpperCase().includes('FRAPPY'))) {
        foundPromos.push({ ...promo, source: 'clé', key })
      }
    }
    
    if (foundPromos.length === 0) {
      console.log('✅ Aucun code promo FRAPPY94 trouvé')
      return
    }
    
    console.log(`\n🎯 Codes promo FRAPPY94 trouvés (${foundPromos.length}):`)
    foundPromos.forEach((promo, index) => {
      console.log(`\n${index + 1}. Code: ${promo.code}`)
      console.log(`   ID: ${promo.id}`)
      console.log(`   Type: ${promo.type || 'N/A'}`)
      console.log(`   Valeur: ${promo.value || promo.discount || 'N/A'}`)
      console.log(`   Source: ${promo.source}`)
      if (promo.key) console.log(`   Clé Redis: ${promo.key}`)
    })
    
    // Supprimer tous les codes promo FRAPPY94
    console.log('\n🗑️  Suppression des codes promo FRAPPY94...')
    
    let deletedCount = 0
    
    for (const promo of foundPromos) {
      try {
        // Supprimer la clé individuelle si elle existe
        if (promo.key) {
          await redis.del(promo.key)
          console.log(`✅ Supprimé: ${promo.key}`)
          deletedCount++
        } else if (promo.id) {
          const key = `promo:${promo.id}`
          await redis.del(key)
          console.log(`✅ Supprimé: ${key}`)
          deletedCount++
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la suppression de ${promo.id}:`, error.message)
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
      console.log(`✅ Tableau mis à jour: ${promosArray.length} → ${filteredPromos.length} promos`)
    }
    
    console.log(`\n✅ Suppression terminée: ${deletedCount} code(s) promo supprimé(s)`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

deleteFrappy94Promo()
