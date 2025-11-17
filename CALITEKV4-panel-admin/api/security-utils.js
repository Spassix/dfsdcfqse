/**
 * Utilitaires de sécurité avancés pour protéger le panel admin
 * Protection contre : brute force, CSRF, XSS, injection, session hijacking
 */

import { redis } from './db.js'
import crypto from 'crypto'

// ============ RATE LIMITING ============

/**
 * Rate limiting pour bloquer les attaques brute force
 * @param {string} identifier - IP ou username
 * @param {number} maxAttempts - Nombre max de tentatives
 * @param {number} windowMs - Fenêtre de temps en ms
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number}>}
 */
export async function checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  
  try {
    const data = await redis.get(key)
    
    if (!data) {
      // Première tentative
      await redis.setex(key, Math.floor(windowMs / 1000), JSON.stringify({
        count: 1,
        firstAttempt: now,
        resetAt: now + windowMs
      }))
      return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs }
    }
    
    const limitData = typeof data === 'string' ? JSON.parse(data) : data
    const { count, resetAt } = limitData
    
    // Si la fenêtre est expirée, réinitialiser
    if (now > resetAt) {
      await redis.setex(key, Math.floor(windowMs / 1000), JSON.stringify({
        count: 1,
        firstAttempt: now,
        resetAt: now + windowMs
      }))
      return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs }
    }
    
    // Vérifier si le nombre de tentatives dépasse la limite
    if (count >= maxAttempts) {
      return { allowed: false, remaining: 0, resetAt }
    }
    
    // Incrémenter le compteur
    const newCount = count + 1
    const ttl = Math.floor((resetAt - now) / 1000)
    await redis.setex(key, ttl, JSON.stringify({
      ...limitData,
      count: newCount
    }))
    
    return { 
      allowed: true, 
      remaining: maxAttempts - newCount, 
      resetAt 
    }
  } catch (error) {
    // En cas d'erreur Redis, autoriser (fail-open pour éviter de bloquer le site)
    console.error('Rate limit error:', error)
    return { allowed: true, remaining: maxAttempts, resetAt: now + windowMs }
  }
}

/**
 * Réinitialise le rate limit pour un identifiant
 */
export async function resetRateLimit(identifier) {
  try {
    await redis.del(`rate_limit:${identifier}`)
  } catch (error) {
    console.error('Reset rate limit error:', error)
  }
}

// ============ ACCOUNT LOCKING ============

/**
 * Verrouille un compte après plusieurs tentatives échouées
 * @param {string} username - Nom d'utilisateur
 * @param {number} maxFailedAttempts - Nombre max de tentatives échouées
 * @param {number} lockDurationMs - Durée du verrouillage en ms
 * @returns {Promise<{locked: boolean, unlockAt: number|null}>}
 */
export async function checkAccountLock(username, maxFailedAttempts = 5, lockDurationMs = 30 * 60 * 1000) {
  const key = `account_lock:${username}`
  
  try {
    const data = await redis.get(key)
    
    if (!data) {
      return { locked: false, unlockAt: null }
    }
    
    const lockData = typeof data === 'string' ? JSON.parse(data) : data
    const { failedAttempts, lockedUntil } = lockData
    
    // Vérifier si le compte est toujours verrouillé
    if (lockedUntil && Date.now() < lockedUntil) {
      return { 
        locked: true, 
        unlockAt: lockedUntil,
        failedAttempts 
      }
    }
    
    // Si le verrouillage est expiré mais qu'il y a encore des tentatives échouées
    if (failedAttempts >= maxFailedAttempts) {
      // Re-verrouiller
      const newLockUntil = Date.now() + lockDurationMs
      await redis.setex(key, Math.floor(lockDurationMs / 1000), JSON.stringify({
        failedAttempts,
        lockedUntil: newLockUntil
      }))
      return { locked: true, unlockAt: newLockUntil, failedAttempts }
    }
    
    return { locked: false, unlockAt: null, failedAttempts }
  } catch (error) {
    console.error('Account lock check error:', error)
    return { locked: false, unlockAt: null }
  }
}

/**
 * Enregistre une tentative de connexion échouée
 */
export async function recordFailedLogin(username) {
  const key = `account_lock:${username}`
  const maxFailedAttempts = 5
  const lockDurationMs = 30 * 60 * 1000 // 30 minutes
  
  try {
    const data = await redis.get(key)
    let lockData = { failedAttempts: 0, lockedUntil: null }
    
    if (data) {
      lockData = typeof data === 'string' ? JSON.parse(data) : data
    }
    
    lockData.failedAttempts = (lockData.failedAttempts || 0) + 1
    
    // Si le nombre de tentatives dépasse la limite, verrouiller
    if (lockData.failedAttempts >= maxFailedAttempts) {
      lockData.lockedUntil = Date.now() + lockDurationMs
      await redis.setex(key, Math.floor(lockDurationMs / 1000), JSON.stringify(lockData))
    } else {
      // Sinon, juste incrémenter (TTL de 1 heure)
      await redis.setex(key, 3600, JSON.stringify(lockData))
    }
    
    return lockData
  } catch (error) {
    console.error('Record failed login error:', error)
  }
}

/**
 * Réinitialise les tentatives échouées après une connexion réussie
 */
export async function resetFailedLoginAttempts(username) {
  try {
    await redis.del(`account_lock:${username}`)
  } catch (error) {
    console.error('Reset failed login attempts error:', error)
  }
}

// ============ CSRF PROTECTION ============

/**
 * Génère un token CSRF
 */
export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Vérifie un token CSRF
 * @param {string} token - Token à vérifier
 * @param {string} sessionToken - Token de session stocké
 */
export function verifyCSRFToken(token, sessionToken) {
  if (!token || !sessionToken) {
    return false
  }
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(sessionToken)
  )
}

// ============ INPUT VALIDATION & SANITIZATION ============

/**
 * Nettoie et valide une chaîne de caractères
 */
export function sanitizeString(input, maxLength = 1000) {
  if (typeof input !== 'string') {
    return ''
  }
  
  // Limiter la longueur
  let cleaned = input.trim().substring(0, maxLength)
  
  // Supprimer les caractères dangereux pour XSS
  cleaned = cleaned
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
  
  return cleaned
}

/**
 * Valide un nom d'utilisateur
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' }
  }
  
  const cleaned = username.trim()
  
  if (cleaned.length < 3 || cleaned.length > 50) {
    return { valid: false, error: 'Username must be between 3 and 50 characters' }
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores and hyphens' }
  }
  
  return { valid: true, cleaned }
}

/**
 * Valide un mot de passe
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' }
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' }
  }
  
  // Vérifier la complexité
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return { 
      valid: false, 
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    }
  }
  
  return { valid: true }
}

// ============ SECURITY HEADERS ============

/**
 * Ajoute les headers de sécurité HTTP
 */
export function setSecurityHeaders(res) {
  // Protection XSS
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // Content Security Policy stricte
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; frame-ancestors 'none';"
  )
  
  // Strict Transport Security (si HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
}

// ============ SECURITY LOGGING ============

/**
 * Enregistre un événement de sécurité
 */
export async function logSecurityEvent(type, details, req) {
  const logEntry = {
    type, // 'failed_login', 'rate_limit_exceeded', 'suspicious_activity', etc.
    timestamp: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    details: sanitizeString(JSON.stringify(details), 500)
  }
  
  try {
    const key = `security_log:${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    // Garder les logs pendant 30 jours
    await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(logEntry))
    
    // Garder aussi un index par type pour faciliter les recherches
    const indexKey = `security_log_index:${type}`
    await redis.lpush(indexKey, key)
    await redis.ltrim(indexKey, 0, 1000) // Garder seulement les 1000 derniers
    await redis.expire(indexKey, 30 * 24 * 60 * 60)
  } catch (error) {
    console.error('Security logging error:', error)
  }
}

// ============ IP VALIDATION ============

/**
 * Récupère l'IP réelle du client
 */
export function getClientIP(req) {
  if (!req || !req.headers) {
    return 'unknown'
  }
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown'
}

/**
 * Vérifie si une IP est suspecte (blacklist basique)
 */
export async function isSuspiciousIP(ip) {
  if (!ip || ip === 'unknown') {
    return true
  }
  
  // Vérifier dans une liste noire (peut être étendue)
  try {
    const blacklisted = await redis.get(`ip_blacklist:${ip}`)
    return blacklisted !== null
  } catch (error) {
    return false
  }
}

/**
 * Ajoute une IP à la liste noire
 */
export async function blacklistIP(ip, durationSeconds = 24 * 60 * 60) {
  try {
    await redis.setex(`ip_blacklist:${ip}`, durationSeconds, '1')
  } catch (error) {
    console.error('Blacklist IP error:', error)
  }
}
