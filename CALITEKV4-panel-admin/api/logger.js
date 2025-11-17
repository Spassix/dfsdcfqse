/**
 * Système de logging sécurisé pour les API routes
 * Désactive tous les logs en production
 */

const isDevelopment = process.env.NODE_ENV !== 'production'
const isDebugEnabled = process.env.DEBUG === 'true'

/**
 * Log seulement en développement
 */
export const log = (...args) => {
  if (isDevelopment && isDebugEnabled) {
    console.log(...args)
  }
}

/**
 * Log d'information (toujours désactivé en production)
 */
export const info = (...args) => {
  if (isDevelopment && isDebugEnabled) {
    console.info(...args)
  }
}

/**
 * Log d'avertissement (toujours désactivé en production)
 */
export const warn = (...args) => {
  if (isDevelopment && isDebugEnabled) {
    console.warn(...args)
  }
}

/**
 * Log d'erreur (toujours actif pour le debugging critique)
 */
export const error = (...args) => {
  console.error(...args)
}

/**
 * Log de debug (seulement si DEBUG=true)
 */
export const debug = (...args) => {
  if (isDebugEnabled) {
    console.log('[DEBUG]', ...args)
  }
}
