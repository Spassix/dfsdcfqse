/**
 * Endpoint pour recevoir les données de détection de bots depuis le client
 * ET fonctions de détection de bots côté serveur
 */

import { redis } from './db.js'
import { logSecurityEvent, getClientIP } from './security-utils.js'

/**
 * Détecte les User-Agents de bots et outils d'automatisation
 */
const BOT_USER_AGENTS = [
  'selenium',
  'webdriver',
  'puppeteer',
  'playwright',
  'phantomjs',
  'headlesschrome',
  'headless',
  'nightmare',
  'scrapy',
  'beautifulsoup',
  'curl',
  'wget',
  'python-requests',
  'go-http-client',
  'httpie',
  'postman',
  'insomnia',
  'bot',
  'crawler',
  'spider',
  'scraper'
]

/**
 * Vérifie si le User-Agent est suspect
 */
export function isSuspiciousUserAgent(userAgent) {
  if (!userAgent) return { suspicious: true, reason: 'Missing User-Agent' }

  const uaLower = userAgent.toLowerCase()

  // Vérifier contre la liste de bots connus
  for (const botUA of BOT_USER_AGENTS) {
    if (uaLower.includes(botUA)) {
      return { suspicious: true, reason: `Bot User-Agent detected: ${botUA}` }
    }
  }

  // Vérifier les patterns suspects
  if (uaLower.includes('headless') && uaLower.includes('chrome')) {
    return { suspicious: true, reason: 'Headless Chrome detected' }
  }

  // Vérifier l'absence de détails navigateur normaux
  if (!uaLower.includes('mozilla') && !uaLower.includes('chrome') && !uaLower.includes('safari') && !uaLower.includes('firefox')) {
    return { suspicious: true, reason: 'Non-standard User-Agent' }
  }

  return { suspicious: false }
}

/**
 * Vérifie les headers pour détecter les outils d'automatisation
 */
export function checkSuspiciousHeaders(req) {
  const headers = req.headers || {}
  const suspicious = []

  // Vérifier l'absence de headers navigateur normaux
  const requiredHeaders = ['accept', 'accept-language', 'user-agent']
  const missingHeaders = requiredHeaders.filter(h => !headers[h.toLowerCase()])
  
  if (missingHeaders.length > 0) {
    suspicious.push(`Missing headers: ${missingHeaders.join(', ')}`)
  }

  // Vérifier les valeurs suspectes
  if (headers['accept'] && !headers['accept'].includes('text/html') && !headers['accept'].includes('application/json')) {
    suspicious.push('Suspicious Accept header')
  }

  if (headers['accept-language'] && headers['accept-language'].length < 2) {
    suspicious.push('Suspicious Accept-Language header')
  }

  return suspicious
}

/**
 * Analyse le fingerprint du navigateur envoyé par le client
 */
export function analyzeBrowserFingerprint(fingerprint) {
  if (!fingerprint) {
    return { suspicious: true, reason: 'Missing fingerprint' }
  }

  const issues = []

  // Vérifier webdriver
  if (fingerprint.webdriver === true) {
    issues.push('webdriver detected')
  }

  // Vérifier les dimensions suspectes
  if (fingerprint.screen && (fingerprint.screen.width === 0 || fingerprint.screen.height === 0)) {
    issues.push('Invalid screen dimensions')
  }

  if (fingerprint.window && (fingerprint.window.outerWidth === 0 || fingerprint.window.outerHeight === 0)) {
    issues.push('Invalid window dimensions')
  }

  // Vérifier les plugins manquants (souvent absents dans les bots)
  if (fingerprint.plugins === '' && fingerprint.userAgent && fingerprint.userAgent.includes('Chrome')) {
    issues.push('No plugins detected (suspicious for Chrome)')
  }

  // Vérifier hardwareConcurrency suspect
  if (fingerprint.hardwareConcurrency < 2) {
    issues.push('Low hardware concurrency')
  }

  // Vérifier deviceMemory suspect
  if (fingerprint.deviceMemory === 0 || fingerprint.deviceMemory === 'unknown') {
    issues.push('Invalid device memory')
  }

  // Vérifier timezone UTC (souvent utilisé par les bots)
  if (fingerprint.timezone === 'UTC' && fingerprint.language === 'en-US') {
    issues.push('UTC timezone with en-US (suspicious)')
  }

  return {
    suspicious: issues.length > 0,
    issues
  }
}

/**
 * Vérifie si une requête provient d'un bot
 */
export async function detectBot(req, clientFingerprint = null) {
  const userAgent = req.headers['user-agent'] || ''
  const ip = getClientIP(req)

  // 1. Vérifier le User-Agent
  const uaCheck = isSuspiciousUserAgent(userAgent)
  if (uaCheck.suspicious) {
    await logSecurityEvent('bot_detected_ua', { 
      reason: uaCheck.reason, 
      userAgent, 
      ip 
    }, req)
    return { isBot: true, reason: uaCheck.reason, confidence: 'high' }
  }

  // 2. Vérifier les headers suspects
  const suspiciousHeaders = checkSuspiciousHeaders(req)
  if (suspiciousHeaders.length > 0) {
    await logSecurityEvent('bot_detected_headers', { 
      suspicious: suspiciousHeaders, 
      userAgent, 
      ip 
    }, req)
    return { isBot: true, reason: `Suspicious headers: ${suspiciousHeaders.join(', ')}`, confidence: 'high' }
  }

  // 3. Analyser le fingerprint si fourni
  if (clientFingerprint) {
    const fingerprintAnalysis = analyzeBrowserFingerprint(clientFingerprint)
    if (fingerprintAnalysis.suspicious) {
      await logSecurityEvent('bot_detected_fingerprint', { 
        issues: fingerprintAnalysis.issues, 
        userAgent, 
        ip 
      }, req)
      return { isBot: true, reason: `Fingerprint issues: ${fingerprintAnalysis.issues.join(', ')}`, confidence: 'medium' }
    }
  }

  // 4. Vérifier le rate limiting (les bots font souvent beaucoup de requêtes)
  const rateLimitKey = `bot_check:${ip}`
  const requestCount = await redis.incr(rateLimitKey)
  await redis.expire(rateLimitKey, 60) // Expire après 1 minute

  if (requestCount > 100) {
    await logSecurityEvent('bot_detected_rate', { 
      requestCount, 
      userAgent, 
      ip 
    }, req)
    return { isBot: true, reason: 'Excessive requests', confidence: 'medium' }
  }

  return { isBot: false }
}

/**
 * Bloque une IP suspecte
 */
export async function blockSuspiciousIP(ip, reason) {
  const blockKey = `blocked_ip:${ip}`
  await redis.setex(blockKey, 3600, JSON.stringify({ reason, timestamp: Date.now() })) // Blocage 1h
  await logSecurityEvent('ip_blocked', { ip, reason })
}

/**
 * Vérifie si une IP est bloquée
 */
export async function isIPBlocked(ip) {
  const blockKey = `blocked_ip:${ip}`
  const blocked = await redis.get(blockKey)
  return !!blocked
}

/**
 * Handler pour l'endpoint POST /api/bot-detection
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const clientIP = getClientIP(req)

  try {
    // Vérifier si l'IP est déjà bloquée
    if (await isIPBlocked(clientIP)) {
      await logSecurityEvent('blocked_ip_access_attempt', { ip: clientIP }, req)
      return res.status(403).json({ error: 'IP blocked' })
    }

    // Récupérer les données de détection du client
    const detectionData = req.body || {}
    const { isBot, tools, fingerprint, automationDetected } = detectionData

    // Détecter les bots côté serveur aussi
    const serverBotDetection = await detectBot(req, fingerprint)

    // Si le client ou le serveur détecte un bot, bloquer
    if (isBot || serverBotDetection.isBot || automationDetected || (tools && tools.length > 0)) {
      const reason = isBot ? 'Client-side bot detection' : 
                    serverBotDetection.isBot ? serverBotDetection.reason :
                    automationDetected ? 'Automation detected' :
                    `Tools detected: ${tools.join(', ')}`

      await blockSuspiciousIP(clientIP, reason)
      await logSecurityEvent('bot_blocked', { 
        ip: clientIP,
        reason,
        tools: tools || [],
        userAgent: req.headers['user-agent']
      }, req)

      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Automated access detected and blocked'
      })
    }

    // Si tout est OK, retourner un succès
    return res.status(200).json({ 
      success: true,
      message: 'Access granted'
    })

  } catch (error) {
    await logSecurityEvent('bot_detection_error', { 
      error: error.message, 
      ip: clientIP 
    }, req)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
