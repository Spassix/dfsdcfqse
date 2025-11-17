/**
 * Script pour supprimer un utilisateur admin par username
 * Usage: node scripts/delete-admin-user.js <username>
 */

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

async function deleteAdminUser(username) {
  try {
    console.log(`🔍 Recherche de l'utilisateur "${username}"...`)
    
    // Récupérer toutes les clés admin_user:*
    const keys = await redis.keys('admin_user:*')
    
    if (!keys || keys.length === 0) {
      console.log('❌ Aucun utilisateur admin trouvé')
      return
    }
    
    // Récupérer tous les utilisateurs
    const usersData = await redis.mget(...keys)
    const users = usersData
      .filter(u => u !== null)
      .map(u => typeof u === 'string' ? JSON.parse(u) : u)
    
    // Trouver l'utilisateur
    const userToDelete = users.find(u => u.username === username)
    
    if (!userToDelete) {
      console.log(`❌ Utilisateur "${username}" non trouvé`)
      console.log('📋 Utilisateurs existants:')
      users.forEach(u => {
        console.log(`   - ${u.username} (${u.role})`)
      })
      return
    }
    
    // PROTECTION : Ne pas supprimer le compte admin principal
    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin_4c1dd9ac'
    if (userToDelete.username === defaultUsername) {
      console.log('❌ Impossible de supprimer le compte admin principal')
      return
    }
    
    console.log(`🗑️  Suppression de l'utilisateur "${username}" (ID: ${userToDelete.id})...`)
    
    // Supprimer l'utilisateur
    await redis.del(`admin_user:${userToDelete.id}`)
    
    console.log(`✅ Utilisateur "${username}" supprimé avec succès !`)
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

// Récupérer le username depuis les arguments
const username = process.argv[2]

if (!username) {
  console.log('Usage: node scripts/delete-admin-user.js <username>')
  console.log('Exemple: node scripts/delete-admin-user.js admin')
  process.exit(1)
}

deleteAdminUser(username)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
