/**
 * API obfusquée pour masquer les URLs dans le code source
 * Les URLs sont encodées et décodées à l'exécution
 */

// Encodage simple des URLs (base64 + rotation)
const encodeURL = (url) => {
  if (typeof window === 'undefined') return url
  
  // Rotation simple + base64
  const rotated = url.split('').map((char, i) => {
    const code = char.charCodeAt(0)
    return String.fromCharCode(code + (i % 3) + 1)
  }).join('')
  
  return btoa(rotated)
}

const decodeURL = (encoded) => {
  if (typeof window === 'undefined') return encoded
  
  try {
    const decoded = atob(encoded)
    return decoded.split('').map((char, i) => {
      const code = char.charCodeAt(0)
      return String.fromCharCode(code - (i % 3) - 1)
    }).join('')
  } catch (e) {
    return '/api'
  }
}

// URLs encodées (base64 + obfuscation)
const ENCODED_URLS = {
  api: 'L2FwaQ==', // /api
  authLogin: 'L2FwaS9hdXRoL2xvZ2lu', // /api/auth/login
  authRefresh: 'L2FwaS9hdXRoL3JlZnJlc2g=', // /api/auth/refresh
  botDetection: 'L2FwaS9ib3QtZGV0ZWN0aW9u', // /api/bot-detection
}

// Fonction pour obtenir l'URL de l'API de manière obfusquée
export function getAPIUrl() {
  if (typeof window === 'undefined') return '/api'
  
  // Vérifier les variables d'environnement d'abord
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) return envUrl
  
  // Utiliser l'URL encodée
  const encoded = ENCODED_URLS.api
  return decodeURL(encoded)
}

// Fonction pour construire une URL d'endpoint de manière obfusquée
export function buildEndpoint(path) {
  const base = getAPIUrl()
  
  // Si le path commence déjà par /api, le retourner tel quel
  if (path.startsWith('/api')) {
    return path
  }
  
  // Sinon, construire l'URL
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}

// Fonction pour masquer les URLs dans les requêtes fetch
export function obfuscatedFetch(url, options = {}) {
  // Décoder l'URL si nécessaire
  let decodedUrl = url
  
  // Si c'est une URL encodée connue, la décoder
  for (const [key, encoded] of Object.entries(ENCODED_URLS)) {
    if (url.includes(encoded)) {
      decodedUrl = decodeURL(encoded)
      break
    }
  }
  
  // Si c'est un endpoint relatif, construire l'URL complète
  if (decodedUrl.startsWith('/')) {
    decodedUrl = buildEndpoint(decodedUrl)
  }
  
  // Faire la requête avec l'URL décodée
  return fetch(decodedUrl, options)
}

// Export des endpoints encodés pour utilisation dans le code
export const endpoints = {
  login: () => buildEndpoint('/auth/login'),
  refresh: () => buildEndpoint('/auth/refresh'),
  botDetection: () => buildEndpoint('/bot-detection'),
  products: () => buildEndpoint('/products'),
  categories: () => buildEndpoint('/categories'),
  // Ajouter d'autres endpoints au besoin
}
