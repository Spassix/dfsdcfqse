/**
 * Utilitaires d'authentification pour protéger les routes API admin
 * Sécurité renforcée avec validation stricte
 */

import jwt from 'jsonwebtoken'
import { adminUsers, redis } from './db.js'
import { setSecurityHeaders, logSecurityEvent, getClientIP } from './security-utils.js'
import { secureAdminRequest } from './request-security.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-12345'

if (!JWT_SECRET || JWT_SECRET === 'changez-moi-en-production' || JWT_SECRET === 'change-me-in-production-12345') {
  console.error('⚠️  ATTENTION: JWT_SECRET doit être défini et fort en production!')
  console.warn('⚠️ Configurez JWT_SECRET dans Vercel Dashboard pour la sécurité.')
}

/**
 * Vérifie si l'utilisateur est authentifié
 * Supporte les tokens JWT ET les tokens API
 * @param {Object} req - Requête HTTP (Vercel format)
 * @returns {Object|null} - Données de l'utilisateur ou null si non authentifié
 */
export async function verifyAuth(req) {
  try {
    // Vérifier que req et req.headers existent
    if (!req || !req.headers) {
      return null
    }
    
    if (!JWT_SECRET || JWT_SECRET === 'changez-moi-en-production') {
      await logSecurityEvent('auth_verification_failed', { reason: 'weak_jwt_secret' }, req)
      return null
    }

    // Récupérer le token depuis le header Authorization ou les cookies
    let token = null
    
    // Essayer d'abord depuis les cookies (plus sécurisé)
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {})
      token = cookies.adminToken
    }
    
    // Sinon, essayer depuis le header Authorization
    if (!token) {
      const authHeader = req.headers.authorization || req.headers['authorization'] || ''
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    
    if (!token) {
      return null
    }

    // Vérifier si c'est un token API (64 caractères hexadécimaux)
    // Les tokens API font 64 caractères (32 bytes en hex)
    if (token.length === 64 && /^[a-f0-9]+$/i.test(token)) {
      try {
        const { apiTokens } = await import('./db.js')
        const tokenData = await apiTokens.verifyToken(token)
        
        if (!tokenData) {
          await logSecurityEvent('invalid_api_token', { ip: getClientIP(req) }, req)
          return null
        }
        
        // Récupérer les données utilisateur
        const userData = await adminUsers.getById(tokenData.userId)
        if (!userData) {
          await logSecurityEvent('api_token_user_not_found', { userId: tokenData.userId }, req)
          return null
        }
        
        await logSecurityEvent('api_token_used', { 
          userId: tokenData.userId, 
          tokenId: tokenData.id,
          ip: getClientIP(req) 
        }, req)
        
        return {
          userId: userData.id,
          username: userData.username,
          role: userData.role || 'admin',
          authType: 'api_token',
          tokenId: tokenData.id
        }
      } catch (error) {
        await logSecurityEvent('api_token_verification_error', { 
          error: error.message, 
          ip: getClientIP(req) 
        }, req)
        return null
      }
    }

    // Valider le format du token (basique)
    if (typeof token !== 'string' || token.length < 10) {
      await logSecurityEvent('invalid_token_format', { ip: getClientIP(req) }, req)
      return null
    }

    // Protection supplémentaire : vérifier que le token n'est pas un JWT décodé
    // Les JWT ont toujours 3 parties séparées par des points
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      await logSecurityEvent('invalid_jwt_structure', { ip: getClientIP(req) }, req)
      return null
    }
    
    // Vérifier le token avec vérification stricte
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'], // Forcer l'algorithme HS256 uniquement
        // ignoreExpiration: false - Les tokens expirés doivent être rejetés pour la sécurité
        maxAge: '7d' // Durée maximale de 7 jours
      })
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        await logSecurityEvent('expired_token_attempt', { ip: getClientIP(req) }, req)
      } else if (error.name === 'JsonWebTokenError') {
        await logSecurityEvent('invalid_token_attempt', { ip: getClientIP(req) }, req)
      } else if (error.name === 'JsonWebTokenError' && error.message.includes('invalid algorithm')) {
        await logSecurityEvent('invalid_token_algorithm', { ip: getClientIP(req) }, req)
      }
      return null
    }
    
    // Vérifier que ce n'est pas un refresh token utilisé comme access token
    if (decoded.type === 'refresh') {
      await logSecurityEvent('refresh_token_as_access_token', { userId: decoded.userId }, req)
      return null
    }

    // Vérifier que le token contient les champs requis
    if (!decoded.userId || !decoded.username) {
      await logSecurityEvent('invalid_token_payload', { ip: getClientIP(req) }, req)
      return null
    }

    // Vérifier l'IP si elle est stockée dans le token (protection contre vol de token)
    const clientIP = getClientIP(req)
    if (decoded.ip && decoded.ip !== clientIP) {
      await logSecurityEvent('token_ip_mismatch', { 
        tokenIP: decoded.ip, 
        requestIP: clientIP,
        userId: decoded.userId 
      }, req)
      // Ne pas bloquer complètement, mais logger (IP peut changer avec VPN/proxy)
      // return null
    }
    
    // Vérifier que l'utilisateur existe toujours
    let userData
    try {
      userData = await adminUsers.getById(decoded.userId)
      if (!userData) {
        await logSecurityEvent('user_not_found', { userId: decoded.userId }, req)
        return null
      }
    } catch (error) {
      await logSecurityEvent('user_lookup_error', { userId: decoded.userId }, req)
      return null
    }
    
    // Vérifier le rôle depuis la base de données (pas depuis le token)
    const role = userData.role || 'admin'
    
    return {
      userId: decoded.userId,
      username: decoded.username || userData.username,
      role: role
    }
  } catch (error) {
    await logSecurityEvent('auth_verification_error', { error: error.message, ip: getClientIP(req) }, req)
    return null
  }
}

/**
 * Vérifie si l'utilisateur est admin (pas modérateur)
 * @param {Object} req - Requête HTTP
 * @returns {boolean} - True si admin
 */
export async function requireAdmin(req) {
  const user = await verifyAuth(req)
  return user && user.role === 'admin'
}

/**
 * Middleware pour protéger une route admin avec headers de sécurité
 * @param {Function} handler - Handler de la route
 * @returns {Function} - Handler protégé
 */
export function requireAuth(handler) {
  return async (req, res) => {
    // Ajouter les headers de sécurité
    setSecurityHeaders(res)
    
    // Vérifier l'authentification
    const user = await verifyAuth(req)
    
    if (!user) {
      await logSecurityEvent('unauthorized_access_attempt', { 
        path: req.url, 
        method: req.method,
        ip: getClientIP(req) 
      }, req)
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      })
    }

    // Sécurité renforcée : vérifier l'origine, rate limiting, nonce, signature
    const securityCheck = await secureAdminRequest(req, user.userId)
    if (!securityCheck.valid) {
      return res.status(securityCheck.status || 403).json({ 
        error: 'Forbidden',
        message: securityCheck.error || 'Requête non autorisée'
      })
    }

    // Ajouter l'utilisateur à la requête pour utilisation dans le handler
    req.user = user
    
    // Appeler le handler original
    try {
      return await handler(req, res)
    } catch (error) {
      await logSecurityEvent('handler_error', { 
        error: error.message,
        path: req.url,
        userId: user.userId 
      }, req)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

/**
 * Vérifie si la requête provient d'une source autorisée
 * @param {Object} req - Requête HTTP
 * @returns {boolean} - True si autorisé
 */
export function isAuthorizedOrigin(req) {
  if (process.env.NODE_ENV !== 'production') {
    return true // En développement, accepter toutes les origines
  }
  
  const origin = req.headers.origin || req.headers.referer
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
  
  if (allowedOrigins.length === 0) {
    return true // Si aucune restriction n'est définie
  }
  
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true
    return origin && origin.includes(allowed)
  })
}

/**
 * Rafraîchit un token d'accès avec un refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<{token: string, refreshToken: string}|null>}
 */
export async function refreshAccessToken(refreshToken) {
  try {
    if (!JWT_SECRET) {
      return null
    }
    
    const decoded = jwt.verify(refreshToken, JWT_SECRET)
    
    if (decoded.type !== 'refresh') {
      return null
    }
    
    // Vérifier que le refresh token existe dans Redis
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`)
    if (!storedToken || storedToken !== refreshToken) {
      return null
    }
    
    // Récupérer les données utilisateur
    const userData = await adminUsers.getById(decoded.userId)
    if (!userData) {
      return null
    }
    
    // Générer un nouveau access token
    const newToken = jwt.sign(
      { 
        userId: userData.id, 
        username: userData.username,
        role: userData.role || 'admin',
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    )
    
    // Générer un nouveau refresh token
    const newRefreshToken = jwt.sign(
      { userId: userData.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    // Mettre à jour dans Redis
    await redis.setex(`refresh_token:${userData.id}`, 7 * 24 * 60 * 60, newRefreshToken)
    
    return {
      token: newToken,
      refreshToken: newRefreshToken
    }
  } catch (error) {
    return null
  }
}

// Export alias pour compatibilité avec les anciens imports
export const verifyToken = verifyAuth
