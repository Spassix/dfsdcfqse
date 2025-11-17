/**
 * Configuration CORS sécurisée
 * Remplace les CORS ouverts (*) par des origines spécifiques
 */

/**
 * Récupère les origines autorisées depuis les variables d'environnement
 * @returns {string[]} - Liste des origines autorisées
 */
function getAllowedOrigins() {
  // En développement, permettre localhost
  if (process.env.NODE_ENV !== 'production') {
    return [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ]
  }
  
  // En production, utiliser les variables d'environnement
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  const vercelBranchUrl = process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null
  
  const origins = [...allowedOrigins]
  if (vercelUrl) origins.push(vercelUrl)
  if (vercelBranchUrl) origins.push(vercelBranchUrl)
  
  return origins.filter(Boolean)
}

/**
 * Vérifie si une origine est autorisée
 * @param {string} origin - Origine à vérifier
 * @returns {boolean} - True si autorisée
 */
export function isOriginAllowed(origin) {
  if (!origin) return false
  
  const allowedOrigins = getAllowedOrigins()
  
  // Si aucune restriction n'est définie, refuser par défaut (sécurité)
  if (allowedOrigins.length === 0) {
    return false
  }
  
  return allowedOrigins.some(allowed => {
    // Support des patterns avec wildcard
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*')
      const regex = new RegExp(`^${pattern}$`)
      return regex.test(origin)
    }
    
    return origin === allowed || origin.startsWith(allowed)
  })
}

/**
 * Configure les headers CORS pour une réponse
 * @param {Object} res - Objet réponse
 * @param {string} origin - Origine de la requête
 * @returns {Object} - Headers CORS configurés
 */
export function setCORSHeaders(res, origin) {
  const allowedOrigins = getAllowedOrigins()
  
  // Si aucune origine n'est spécifiée ou si elle n'est pas autorisée
  if (!origin || !isOriginAllowed(origin)) {
    // En développement, utiliser la première origine autorisée
    if (process.env.NODE_ENV !== 'production' && allowedOrigins.length > 0) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0])
    } else {
      // En production, ne pas autoriser si l'origine n'est pas dans la liste
      return {}
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  
  // Headers CORS standards
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-HMAC-Signature, X-HMAC-Timestamp')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 heures
  
  // Headers de sécurité supplémentaires
  res.setHeader('Vary', 'Origin')
  
  return {
    'Access-Control-Allow-Origin': origin && isOriginAllowed(origin) ? origin : (allowedOrigins[0] || ''),
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-HMAC-Signature, X-HMAC-Timestamp',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  }
}

/**
 * Middleware CORS pour les routes API
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 * @param {Function} next - Fonction suivante
 * @returns {void}
 */
export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin || req.headers.referer
  
  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res, origin)
    res.status(200).end()
    return
  }
  
  // Vérifier l'origine pour les autres méthodes
  if (origin && !isOriginAllowed(origin)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Origine non autorisée'
    })
    return
  }
  
  // Ajouter les headers CORS
  setCORSHeaders(res, origin)
  
  if (next) next()
}

