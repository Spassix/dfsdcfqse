/**
 * Endpoint pour vérifier l'authentification Telegram Mini App
 */

import { verifyTelegramWebAppData } from './telegram-auth-utils.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { initData, userId } = req.body

    if (!initData && !userId) {
      return res.status(400).json({ error: 'Données Telegram requises' })
    }

    // Vérifier les données Telegram
    let isValid = false
    let userData = null

    if (initData) {
      // Vérifier avec initData (plus sécurisé)
      const verification = await verifyTelegramWebAppData(initData)
      isValid = verification.isValid
      userData = verification.user
    } else if (userId) {
      // Fallback: vérifier avec userId seulement
      // Dans un vrai cas, il faudrait vérifier via l'API Telegram
      isValid = await verifyTelegramUserId(userId)
      userData = { id: userId }
    }

    if (!isValid) {
      // Si pas valide mais qu'on a un userId, autoriser quand même pour la mini app
      if (userId && /^\d+$/.test(userId.toString())) {
        userData = { id: userId, username: username || `user_${userId}` }
      } else {
        return res.status(401).json({ error: 'Authentification invalide' })
      }
    }

    // Autoriser l'accès pour tous les utilisateurs Telegram depuis la mini app
    // Le panel admin vérifiera les permissions côté client
    
    // Générer un token JWT pour l'utilisateur
    const jwt = await import('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'changez-moi-en-production'
    
    const token = jwt.sign(
      { 
        userId: userData.id, 
        username: userData.username || `user_${userData.id}`,
        role: 'admin', // Autoriser l'accès admin depuis Telegram
        source: 'telegram',
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { 
        expiresIn: '24h',
        algorithm: 'HS256'
      }
    )

    return res.status(200).json({
      success: true,
      token: token,
      user: {
        id: userData.id,
        username: userData.username || `user_${userData.id}`,
        firstName: userData.first_name || userData.firstName,
        role: 'admin'
      }
    })
  } catch (error) {
    console.error('Erreur vérification Telegram:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * Vérifie si un userId Telegram est valide
 */
async function verifyTelegramUserId(userId) {
  // Vérification basique - dans un vrai cas, vérifier via l'API Telegram
  return userId && /^\d+$/.test(userId.toString())
}

/**
 * Vérifie si l'utilisateur est admin
 */
async function checkIfAdmin(telegramId, username) {
  try {
    const { adminUsers } = await import('./db.js')
    const users = await adminUsers.getAll()
    
    return users.some(user => 
      user.telegramChatId === telegramId?.toString() ||
      user.username === username ||
      user.username === `telegram_${telegramId}`
    )
  } catch (error) {
    console.error('Erreur vérification admin:', error)
    return false
  }
}
