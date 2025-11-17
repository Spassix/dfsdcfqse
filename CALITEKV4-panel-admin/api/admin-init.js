/**
 * Initialisation SÉCURISÉE des admins depuis les variables d'environnement
 * IGNORE les admins dont les variables n'existent pas
 */

import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let adminUsers, redis
    try {
      const dbModule = await import('./db.js')
      adminUsers = dbModule.adminUsers
      redis = dbModule.redis
    } catch (e) {
      return res.status(500).json({ error: 'Erreur config serveur' })
    }

    const createdAdmins = []
    const existingAdmins = []
    const errors = []

    // ON BOUCLE DE 1 À 10 MAIS SEULEMENT SI LES VARIABLES EXISTENT
    for (let i = 1; i <= 10; i++) {
      let usernameKey = i === 1 ? 'DEFAULT_ADMIN_USERNAME' : `DEFAULT_ADMIN_USERNAME${i}`
      let passwordKey = i === 1 ? 'DEFAULT_ADMIN_PASSWORD' : `DEFAULT_ADMIN_PASSWORD${i}`

      const username = process.env[usernameKey]
      const password = process.env[passwordKey]

      console.log(`Admin ${i}: ${usernameKey}=${username ? 'OK' : 'NO'} / ${passwordKey}=${password ? 'OK' : 'NO'}`)

      // ⚠️ SI AUCUNE VARIABLE = ON IGNORE DIRECT
      if (!username || !password) {
        console.log(`→ Admin ${i} ignoré (variables manquantes)`)
        continue
      }

      try {
        const existing = await adminUsers.getByUsername(username)

        if (existing) {
          existingAdmins.push({
            username: existing.username,
            id: existing.id
          })
        } else {
          // CRÉER L'ADMIN VALIDÉ
          const hashed = await bcrypt.hash(password, 10)
          const id = `admin_${Date.now()}_${i}`

          const data = {
            id,
            username,
            password: hashed,
            role: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          await redis.set(`admin_user:${id}`, JSON.stringify(data))
          createdAdmins.push({ username, id })
        }

      } catch (err) {
        errors.push(`Erreur admin ${i}: ${err.message}`)
      }
    }

    return res.json({
      success: true,
      createdAdmins,
      existingAdmins,
      errors
    })

  } catch (e) {
    return res.status(500).json({ error: 'Erreur interne' })
  }
}
