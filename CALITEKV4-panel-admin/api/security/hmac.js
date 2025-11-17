/**
 * Système HMAC pour sécuriser la communication entre panel admin et boutique
 * Utilise des clés secrètes rotatives stockées dans Redis
 */

import crypto from 'crypto'
import { redis } from '../db.js'

const HMAC_SECRET_KEY = process.env.HMAC_SECRET_KEY || 'change-me-in-production-hmac-key'
const KEY_ROTATION_INTERVAL = 7 * 24 * 60 * 60 * 1000 // 7 jours en millisecondes

/**
 * Génère une signature HMAC pour une requête
 * @param {string} method - Méthode HTTP (GET, POST, etc.)
 * @param {string} path - Chemin de la requête
 * @param {string|object} body - Corps de la requête (sera stringifié si objet)
 * @param {number} timestamp - Timestamp de la requête
 * @returns {string} - Signature HMAC
 */
export function generateHMAC(method, path, body, timestamp) {
  const bodyString = typeof body === 'object' ? JSON.stringify(body) : (body || '')
  const message = `${method}:${path}:${bodyString}:${timestamp}`
  
  const hmac = crypto.createHmac('sha256', HMAC_SECRET_KEY)
  hmac.update(message)
  return hmac.digest('hex')
}

/**
 * Vérifie une signature HMAC
 * @param {string} signature - Signature à vérifier
 * @param {string} method - Méthode HTTP
 * @param {string} path - Chemin de la requête
 * @param {string|object} body - Corps de la requête
 * @param {number} timestamp - Timestamp de la requête
 * @returns {boolean} - True si la signature est valide
 */
export function verifyHMAC(signature, method, path, body, timestamp) {
  const expectedSignature = generateHMAC(method, path, body, timestamp)
  
  // Utiliser timingSafeEqual pour éviter les attaques par timing
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Génère une nouvelle clé HMAC et la stocke dans Redis
 * @returns {Promise<string>} - Nouvelle clé
 */
export async function rotateHMACKey() {
  const newKey = crypto.randomBytes(32).toString('hex')
  const keyId = `hmac_key_${Date.now()}`
  
  // Stocker la nouvelle clé avec expiration
  await redis.setex(`hmac_key:${keyId}`, Math.floor(KEY_ROTATION_INTERVAL / 1000), newKey)
  
  // Marquer comme clé active
  await redis.set('hmac_key:active', keyId)
  
  // Garder les anciennes clés pendant 24h pour permettre la transition
  const oldKeyId = await redis.get('hmac_key:active')
  if (oldKeyId && oldKeyId !== keyId) {
    await redis.expire(`hmac_key:${oldKeyId}`, 24 * 60 * 60) // 24h
  }
  
  return newKey
}

/**
 * Récupère la clé HMAC active
 * @returns {Promise<string>} - Clé active
 */
export async function getActiveHMACKey() {
  const keyId = await redis.get('hmac_key:active')
  if (!keyId) {
    // Si aucune clé n'existe, créer une nouvelle
    return await rotateHMACKey()
  }
  
  const key = await redis.get(`hmac_key:${keyId}`)
  if (!key) {
    // Si la clé a expiré, créer une nouvelle
    return await rotateHMACKey()
  }
  
  return key
}

/**
 * Middleware pour vérifier les requêtes HMAC
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 * @param {Function} next - Fonction suivante
 * @returns {Promise<void>}
 */
export async function verifyHMACRequest(req, res, next) {
  try {
    // Récupérer les headers HMAC
    const signature = req.headers['x-hmac-signature']
    const timestamp = req.headers['x-hmac-timestamp']
    
    if (!signature || !timestamp) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Signature HMAC manquante'
      })
      return
    }
    
    // Vérifier que le timestamp n'est pas trop ancien (max 5 minutes)
    const requestTime = parseInt(timestamp, 10)
    const now = Date.now()
    const timeDiff = Math.abs(now - requestTime)
    
    if (timeDiff > 5 * 60 * 1000) { // 5 minutes
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Requête expirée'
      })
      return
    }
    
    // Lire le body
    let body = ''
    if (req.body && typeof req.body === 'object') {
      body = JSON.stringify(req.body)
    } else {
      await new Promise(resolve => {
        req.on('data', chunk => (body += chunk))
        req.on('end', resolve)
      })
    }
    
    // Vérifier la signature
    const isValid = verifyHMAC(
      signature,
      req.method,
      req.url,
      body,
      requestTime
    )
    
    if (!isValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Signature HMAC invalide'
      })
      return
    }
    
    // Signature valide, continuer
    if (next) next()
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erreur lors de la vérification HMAC'
    })
  }
}

/**
 * Génère les headers HMAC pour une requête
 * @param {string} method - Méthode HTTP
 * @param {string} path - Chemin
 * @param {string|object} body - Corps
 * @returns {Object} - Headers à ajouter
 */
export function generateHMACHeaders(method, path, body) {
  const timestamp = Date.now()
  const signature = generateHMAC(method, path, body, timestamp)
  
  return {
    'X-HMAC-Signature': signature,
    'X-HMAC-Timestamp': timestamp.toString()
  }
}

