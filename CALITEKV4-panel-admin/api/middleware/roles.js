/**
 * Système de gestion des rôles avec hiérarchie stricte
 * Rôles : founder > manager > editor
 */

import { verifyAuth } from '../auth-utils.js'
import { logSecurityEvent, getClientIP } from '../security-utils.js'

// Hiérarchie des rôles (plus le nombre est élevé, plus les permissions sont importantes)
const ROLE_HIERARCHY = {
  editor: 1,
  manager: 2,
  founder: 3,
  admin: 3 // Alias pour founder (compatibilité)
}

/**
 * Vérifie si un rôle a les permissions nécessaires
 * @param {string} userRole - Rôle de l'utilisateur
 * @param {string} requiredRole - Rôle minimum requis
 * @returns {boolean}
 */
export function hasRolePermission(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  return userLevel >= requiredLevel
}

/**
 * Middleware pour exiger une authentification
 * @param {Function} handler - Handler de la route
 * @returns {Function} - Handler protégé
 */
export function requireAuth(handler) {
  return async (req, res) => {
    const user = await verifyAuth(req)
    
    if (!user) {
      await logSecurityEvent('unauthorized_access_attempt', {
        path: req.url,
        method: req.method,
        ip: getClientIP(req)
      }, req)
      
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentification requise'
      })
      return
    }
    
    req.user = user
    return handler(req, res)
  }
}

/**
 * Middleware pour exiger un rôle spécifique
 * @param {string} requiredRole - Rôle minimum requis (founder, manager, editor)
 * @param {Function} handler - Handler de la route
 * @returns {Function} - Handler protégé
 */
export function requireRole(requiredRole) {
  return (handler) => {
    return async (req, res) => {
      // D'abord vérifier l'authentification
      const user = await verifyAuth(req)
      
      if (!user) {
        await logSecurityEvent('unauthorized_access_attempt', {
          path: req.url,
          method: req.method,
          ip: getClientIP(req)
        }, req)
        
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentification requise'
        })
        return
      }
      
      // Vérifier le rôle
      if (!hasRolePermission(user.role, requiredRole)) {
        await logSecurityEvent('insufficient_permissions', {
          path: req.url,
          method: req.method,
          userId: user.userId,
          userRole: user.role,
          requiredRole,
          ip: getClientIP(req)
        }, req)
        
        res.status(403).json({
          error: 'Forbidden',
          message: `Accès refusé. Rôle requis : ${requiredRole}`
        })
        return
      }
      
      req.user = user
      return handler(req, res)
    }
  }
}

/**
 * Middleware pour exiger le rôle founder (accès complet)
 * @param {Function} handler - Handler de la route
 * @returns {Function} - Handler protégé
 */
export function requireFounder(handler) {
  return requireRole('founder')(handler)
}

/**
 * Middleware pour exiger le rôle manager ou supérieur
 * @param {Function} handler - Handler de la route
 * @returns {Function} - Handler protégé
 */
export function requireManager(handler) {
  return requireRole('manager')(handler)
}

/**
 * Middleware pour exiger le rôle editor ou supérieur
 * @param {Function} handler - Handler de la route
 * @returns {Function} - Handler protégé
 */
export function requireEditor(handler) {
  return requireRole('editor')(handler)
}

/**
 * Vérifie si l'utilisateur peut effectuer une action
 * @param {Object} user - Utilisateur authentifié
 * @param {string} action - Action à effectuer
 * @param {Object} resource - Ressource concernée (optionnel)
 * @returns {boolean}
 */
export function canPerformAction(user, action, resource = null) {
  if (!user || !user.role) {
    return false
  }
  
  // Founder peut tout faire
  if (user.role === 'founder' || user.role === 'admin') {
    return true
  }
  
  // Manager peut gérer les produits, catégories, mais pas les utilisateurs
  if (user.role === 'manager') {
    const managerActions = ['create_product', 'update_product', 'delete_product', 'create_category', 'update_category']
    return managerActions.includes(action)
  }
  
  // Editor peut seulement modifier le contenu
  if (user.role === 'editor') {
    const editorActions = ['update_product', 'update_category']
    return editorActions.includes(action)
  }
  
  return false
}

