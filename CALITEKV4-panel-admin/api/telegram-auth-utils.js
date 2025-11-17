/**
 * Utilitaires pour vérifier les données Telegram Web App
 */

import crypto from 'crypto'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

/**
 * Vérifie les données initData de Telegram Web App
 */
export async function verifyTelegramWebAppData(initData) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.warn('TELEGRAM_BOT_TOKEN non configuré')
      return { isValid: false, user: null }
    }

    // Parser initData
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    params.delete('hash')

    // Créer la clé secrète
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(TELEGRAM_BOT_TOKEN)
      .digest()

    // Créer le hash de vérification
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    // Vérifier le hash
    if (calculatedHash !== hash) {
      return { isValid: false, user: null }
    }

    // Extraire les données utilisateur
    const userStr = params.get('user')
    if (!userStr) {
      return { isValid: false, user: null }
    }

    const user = JSON.parse(userStr)

    // Vérifier que les données ne sont pas expirées (optionnel)
    const authDate = parseInt(params.get('auth_date'))
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 86400) { // 24 heures
      return { isValid: false, user: null, reason: 'expired' }
    }

    return {
      isValid: true,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name
      }
    }
  } catch (error) {
    console.error('Erreur vérification Telegram Web App:', error)
    return { isValid: false, user: null }
  }
}
