/**
 * Utilitaires d'authentification pour le frontend
 * Gère les tokens, refresh automatique, et déconnexion
 */

// Construire l'URL de manière obfusquée
const getAPIUrl = () => {
  const env = import.meta.env.VITE_API_URL
  if (env) return env
  const parts = ['/', 'api']
  return parts.join('')
}

const API_URL = getAPIUrl()

/**
 * Récupère le token depuis localStorage ou les cookies
 */
export function getAuthToken() {
  if (typeof window === 'undefined') return null
  
  // Essayer d'abord localStorage (pour compatibilité)
  const token = localStorage.getItem('adminToken')
  if (token) return token
  
  // Les cookies httpOnly ne sont pas accessibles par JavaScript
  // Le backend les utilisera automatiquement
  return null
}

/**
 * Stocke le token (pour compatibilité avec l'ancien système)
 */
export function setAuthToken(token, refreshToken, user) {
  if (typeof window === 'undefined') return
  
  if (token) {
    localStorage.setItem('adminToken', token)
  }
  
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
  }
  
  if (user) {
    localStorage.setItem('adminUser', user.username)
    localStorage.setItem('adminUserId', user.id)
    localStorage.setItem('adminRole', user.role || 'admin')
  }
}

/**
 * Supprime tous les tokens et données utilisateur
 */
export function clearAuth() {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('adminToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('adminUser')
  localStorage.removeItem('adminUserId')
  localStorage.removeItem('adminRole')
  
  // Supprimer aussi les cookies en les expirant
  document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
}

/**
 * Rafraîchit le token d'accès avec le refresh token
 */
export async function refreshToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token')
    }
    
    // Construire l'URL de manière obfusquée
    const refreshPath = ['/auth', '/refresh'].join('')
    const refreshUrl = API_URL + refreshPath
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Important pour envoyer les cookies
      body: JSON.stringify({ refreshToken })
    })
    
    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }
    
    const data = await response.json()
    
    if (data.success && data.token) {
      setAuthToken(data.token, data.refreshToken, null)
      return data.token
    }
    
    throw new Error('Invalid refresh response')
  } catch (error) {
    clearAuth()
    throw error
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export function isAuthenticated() {
  return !!getAuthToken()
}

/**
 * Récupère les informations de l'utilisateur depuis localStorage
 */
export function getUserInfo() {
  if (typeof window === 'undefined') return null
  
  const username = localStorage.getItem('adminUser')
  const userId = localStorage.getItem('adminUserId')
  const role = localStorage.getItem('adminRole')
  
  if (!username) return null
  
  return {
    username,
    id: userId,
    role: role || 'admin'
  }
}

// Cache pour les headers de sécurité (nonce, timestamp)
let securityHeadersCache = null
let securityHeadersExpiry = 0

/**
 * Génère un UUID simple côté client
 */
function generateUUID() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }
  // Fallback pour navigateurs plus anciens
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Récupère les headers de sécurité (nonce, timestamp)
 */
async function getSecurityHeaders() {
  const now = Date.now()
  
  // Régénérer les headers toutes les 4 minutes (avant expiration du nonce à 5 min)
  if (!securityHeadersCache || now > securityHeadersExpiry) {
    // Générer un nonce côté client (le serveur le vérifiera)
    const nonce = generateUUID() + '-' + Date.now()
    const timestamp = Date.now()
    
    securityHeadersCache = {
      'X-Nonce': nonce,
      'X-Timestamp': timestamp.toString(),
      'X-Requested-With': 'XMLHttpRequest'
    }
    
    // Expirer dans 4 minutes
    securityHeadersExpiry = now + (4 * 60 * 1000)
  }
  
  return securityHeadersCache
}

/**
 * Fait une requête authentifiée avec gestion automatique du refresh token
 */
export async function authenticatedFetch(url, options = {}) {
  const token = getAuthToken()
  
  // Récupérer les headers de sécurité
  const securityHeaders = await getSecurityHeaders()
  
  // Ajouter le token dans les headers
  const headers = {
    'Content-Type': 'application/json',
    ...securityHeaders,
    ...options.headers
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // Faire la requête avec credentials pour envoyer les cookies
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })
  
  // Si le token a expiré, essayer de le rafraîchir
  if (response.status === 401) {
    try {
      const newToken = await refreshToken()
      // Réessayer la requête avec le nouveau token
      headers['Authorization'] = `Bearer ${newToken}`
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      })
    } catch (error) {
      // Le refresh a échoué, rediriger vers login
      clearAuth()
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
      throw new Error('Authentication failed')
    }
  }
  
  return response
}
