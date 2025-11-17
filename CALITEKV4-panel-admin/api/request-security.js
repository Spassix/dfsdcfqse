/**
 * Sécurité renforcée pour les requêtes API
 * Protection contre les attaques CURL, replay attacks, et décodage de tokens
 */

import crypto from 'crypto'
import { redis } from './db.js'
import { logSecurityEvent, getClientIP } from './security-utils.js'
import { detectBot, isIPBlocked } from './bot-detection.js'

const HMAC_SECRET = process.env.HMAC_SECRET || process.env.JWT_SECRET || 'changez-moi-en-production'
const NONCE_EXPIRY = 300 // 5 minutes
const MAX_REQUESTS_PER_MINUTE = 30

/**
 * Génère un nonce unique pour chaque requête
 */
export async function generateNonce() {
  const nonce = crypto.randomBytes(32).toString('hex')
  const timestamp = Date.now()
  
  // Stocker le nonce dans Redis avec expiration
  await redis.setex(`nonce:${nonce}`, NONCE_EXPIRY, timestamp.toString())
  
  return { nonce, timestamp }
}

/**
 * Vérifie qu'un nonce est valide et n'a pas été réutilisé
 */
export async function verifyNonce(nonce, timestamp) {
  if (!nonce || !timestamp) {
    return { valid: false, error: 'Nonce et timestamp requis' }
  }

  // Vérifier le format du timestamp
  const timestampNum = parseInt(timestamp)
  if (isNaN(timestampNum)) {
    return { valid: false, error: 'Timestamp invalide' }
  }

  // Vérifier que le timestamp n'est pas trop vieux (replay attack)
  const age = Date.now() - timestampNum
  if (age > NONCE_EXPIRY * 1000) {
    return { valid: false, error: 'Nonce expiré' }
  }

  // Vérifier que le timestamp n'est pas dans le futur (plus de 5 secondes de tolérance)
  if (timestampNum > Date.now() + 5000) {
    return { valid: false, error: 'Timestamp dans le futur' }
  }

  // Vérifier que le nonce n'a pas déjà été utilisé (protection replay)
  const nonceKey = `nonce:${nonce}`
  const existing = await redis.get(nonceKey)
  
  if (existing) {
    // Le nonce existe déjà, c'est une tentative de réutilisation
    await logSecurityEvent('nonce_reuse_attempt', { nonce, timestamp })
    return { valid: false, error: 'Nonce déjà utilisé' }
  }

  // Stocker le nonce pour éviter la réutilisation
  await redis.setex(nonceKey, NONCE_EXPIRY, timestamp.toString())
  
  return { valid: true }
}

/**
 * Génère une signature HMAC pour une requête
 */
export function generateRequestSignature(method, path, body, nonce, timestamp, userId) {
  // Créer une chaîne à signer avec tous les paramètres
  const dataToSign = [
    method.toUpperCase(),
    path,
    body ? JSON.stringify(body) : '',
    nonce,
    timestamp.toString(),
    userId || ''
  ].join('|')

  // Générer la signature HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(dataToSign)
    .digest('hex')

  return signature
}

/**
 * Vérifie la signature HMAC d'une requête
 */
export function verifyRequestSignature(req, signature, nonce, timestamp, userId) {
  const method = req.method
  const path = req.url.split('?')[0] // Sans query params
  const body = req.body ? JSON.stringify(req.body) : ''

  const expectedSignature = generateRequestSignature(
    method,
    path,
    req.body,
    nonce,
    timestamp,
    userId
  )

  // Comparaison constante pour éviter les timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

/**
 * Vérifie l'origine de la requête (protection contre CURL direct)
 */
export function verifyRequestOrigin(req) {
  const origin = req.headers.origin || req.headers.referer || ''
  const host = req.headers.host || ''
  
  // En production, vérifier que la requête vient du bon domaine
  // En développement, être plus permissif pour faciliter les tests
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    
    if (allowedOrigins.length > 0 && !allowedOrigins.includes('*')) {
      const isAllowed = allowedOrigins.some(allowed => {
        const allowedClean = allowed.trim()
        return origin.includes(allowedClean) || host.includes(allowedClean)
      })
      
      if (!isAllowed) {
        return { valid: false, error: 'Origine non autorisée' }
      }
    }
  }

  // Vérifier les headers requis pour une vraie requête navigateur
  // En développement, être plus permissif
  if (process.env.NODE_ENV === 'production') {
    const userAgent = req.headers['user-agent']
    const accept = req.headers['accept']
    
    // Les requêtes CURL simples n'ont généralement pas tous ces headers
    if (!userAgent || !accept) {
      return { valid: false, error: 'Headers manquants' }
    }

    // Détecter les user-agents suspects (CURL, wget, etc.)
    const suspiciousAgents = ['curl', 'wget', 'python-requests', 'go-http-client', 'httpie']
    const userAgentLower = userAgent.toLowerCase()
    
    if (suspiciousAgents.some(agent => userAgentLower.includes(agent))) {
      return { valid: false, error: 'User-Agent suspect' }
    }
  }

  return { valid: true }
}

/**
 * Rate limiting strict par IP et par utilisateur
 */
export async function checkStrictRateLimit(req, userId = null) {
  const clientIP = getClientIP(req)
  const now = Date.now()
  const minuteAgo = now - 60000

  // Rate limiting par IP
  const ipKey = `rate_limit:ip:${clientIP}`
  const ipRequests = await redis.zcount(ipKey, minuteAgo, now)
  
  if (ipRequests >= MAX_REQUESTS_PER_MINUTE) {
    await logSecurityEvent('rate_limit_exceeded_ip', { ip: clientIP }, req)
    return { allowed: false, error: 'Trop de requêtes depuis cette IP' }
  }

  // Rate limiting par utilisateur si authentifié
  if (userId) {
    const userKey = `rate_limit:user:${userId}`
    const userRequests = await redis.zcount(userKey, minuteAgo, now)
    
    if (userRequests >= MAX_REQUESTS_PER_MINUTE) {
      await logSecurityEvent('rate_limit_exceeded_user', { userId }, req)
      return { allowed: false, error: 'Trop de requêtes pour cet utilisateur' }
    }

    // Ajouter la requête au compteur utilisateur
    await redis.zadd(userKey, now, `${now}-${Math.random()}`)
    await redis.expire(userKey, 60)
  }

  // Ajouter la requête au compteur IP
  await redis.zadd(ipKey, now, `${now}-${Math.random()}`)
  await redis.expire(ipKey, 60)

  return { allowed: true }
}

/**
 * Middleware de sécurité complet pour les requêtes admin
 * DÉSACTIVÉ - Autorise tout pour éviter les blocages
 */
export async function secureAdminRequest(req, userId = null) {
  // TOUTES LES VÉRIFICATIONS SONT DÉSACTIVÉES
  // Retourne toujours valid: true
  return { valid: true }

  /* CODE DÉSACTIVÉ - NE PAS SUPPRIMER (backup)
  const clientIP = getClientIP(req)

  // 0. Vérifier si l'IP est bloquée
  if (await isIPBlocked(clientIP)) {
    await logSecurityEvent('blocked_ip_access_attempt', { ip: clientIP }, req)
    return { 
      valid: false, 
      error: 'IP bloquée',
      status: 403
    }
  }

  // 0.5. Détecter les bots
  const botDetection = await detectBot(req)
  if (botDetection.isBot) {
    await logSecurityEvent('bot_detected_request', { 
      reason: botDetection.reason,
      confidence: botDetection.confidence,
      ip: clientIP,
      userAgent: req.headers['user-agent']
    }, req)
    return { 
      valid: false, 
      error: 'Accès automatisé détecté',
      status: 403
    }
  }
  *

  // TOUTES CES VÉRIFICATIONS SONT DÉSACTIVÉES
  /*
  // 1. Vérifier l'origine
  const originCheck = verifyRequestOrigin(req)
  if (!originCheck.valid) {
    await logSecurityEvent('invalid_request_origin', { 
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
      ip: clientIP
    }, req)
    return { 
      valid: false, 
      error: originCheck.error || 'Origine non autorisée',
      status: 403
    }
  }

  // 2. Vérifier le rate limiting
  const rateLimitCheck = await checkStrictRateLimit(req, userId)
  if (!rateLimitCheck.allowed) {
    return { 
      valid: false, 
      error: rateLimitCheck.error || 'Trop de requêtes',
      status: 429
    }
  }

  // 3. Vérifier les headers de sécurité requis (en production uniquement)
  if (process.env.NODE_ENV === 'production') {
    const requiredHeaders = {
      'x-requested-with': 'XMLHttpRequest', // Protection contre certaines attaques CSRF
    }

    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const actualValue = req.headers[header.toLowerCase()]
      if (!actualValue || actualValue !== expectedValue) {
        await logSecurityEvent('missing_security_header', { header, ip: getClientIP(req) }, req)
        return { 
          valid: false, 
          error: 'Headers de sécurité manquants',
          status: 403
        }
      }
    }
  }

  // 4. Vérifier le nonce et la signature si fournis
  *
  const nonce = req.headers['x-nonce']
  const timestamp = req.headers['x-timestamp']
  const signature = req.headers['x-signature']

  if (nonce && timestamp && signature) {
    // Vérifier le nonce
    const nonceCheck = await verifyNonce(nonce, timestamp)
    if (!nonceCheck.valid) {
      await logSecurityEvent('invalid_nonce', { nonce, ip: getClientIP(req) }, req)
      return { 
        valid: false, 
        error: nonceCheck.error || 'Nonce invalide',
        status: 403
      }
    }

    // Vérifier la signature
    if (!verifyRequestSignature(req, signature, nonce, timestamp, userId)) {
      await logSecurityEvent('invalid_request_signature', { 
        nonce, 
        ip: getClientIP(req) 
      }, req)
      return { 
        valid: false, 
        error: 'Signature invalide',
        status: 403
      }
    }
  }

  return { valid: true }
}

/**
 * Génère les headers de sécurité pour une requête frontend
 */
export async function generateSecurityHeaders(userId = null) {
  const { nonce, timestamp } = await generateNonce()
  return {
    'X-Nonce': nonce,
    'X-Timestamp': timestamp.toString(),
    'X-Requested-With': 'XMLHttpRequest'
  }
}
