import { apiTokens } from './db.js'
import { verifyAuth, requireAdmin } from './auth-utils.js'
import { setSecurityHeaders, logSecurityEvent, getClientIP } from './security-utils.js'

export default async function handler(req, res) {
  setSecurityHeaders(res)
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const user = await verifyAuth(req)
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // GET - Lister tous les tokens de l'utilisateur
    if (req.method === 'GET') {
      const tokens = await apiTokens.getTokensByUserId(user.userId)
      return res.json({ success: true, tokens })
    }

    // POST - Créer un nouveau token API
    if (req.method === 'POST') {
      const { name, expiresInDays } = req.body
      
      // Valider les paramètres
      const tokenName = name || `API Token ${new Date().toLocaleDateString()}`
      const expiresIn = expiresInDays && expiresInDays > 0 && expiresInDays <= 365 
        ? expiresInDays 
        : 90 // Par défaut 90 jours
      
      // Générer le token
      const tokenData = await apiTokens.generateToken(user.userId, tokenName, expiresIn)
      
      await logSecurityEvent('api_token_created', { 
        userId: user.userId, 
        tokenId: tokenData.id,
        ip: getClientIP(req) 
      }, req)
      
      return res.json({
        success: true,
        token: tokenData.token, // Token en clair (à sauvegarder immédiatement)
        id: tokenData.id,
        name: tokenData.name,
        expiresAt: tokenData.expiresAt,
        createdAt: tokenData.createdAt,
        warning: '⚠️ Ce token ne sera affiché qu\'une seule fois. Sauvegardez-le maintenant !'
      })
    }

    // DELETE - Révoquer ou supprimer un token
    if (req.method === 'DELETE') {
      const { tokenId, action = 'revoke' } = req.body
      
      if (!tokenId) {
        return res.status(400).json({ error: 'tokenId is required' })
      }
      
      try {
        if (action === 'delete') {
          await apiTokens.deleteToken(tokenId, user.userId)
          await logSecurityEvent('api_token_deleted', { 
            userId: user.userId, 
            tokenId,
            ip: getClientIP(req) 
          }, req)
        } else {
          await apiTokens.revokeToken(tokenId, user.userId)
          await logSecurityEvent('api_token_revoked', { 
            userId: user.userId, 
            tokenId,
            ip: getClientIP(req) 
          }, req)
        }
        
        return res.json({ success: true })
      } catch (error) {
        if (error.message === 'Token not found') {
          return res.status(404).json({ error: 'Token not found' })
        }
        if (error.message === 'Unauthorized') {
          return res.status(403).json({ error: 'Unauthorized' })
        }
        throw error
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API tokens error:', error)
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    })
  }
}
