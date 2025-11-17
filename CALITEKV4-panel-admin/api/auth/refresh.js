import { refreshAccessToken } from '../auth-utils.js'
import { setSecurityHeaders, logSecurityEvent, getClientIP } from '../security-utils.js'

export default async function handler(req, res) {
  setSecurityHeaders(res)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vérifier que les variables d'environnement sont configurées
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.error('Variables d\'environnement manquantes:', {
        UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      await logSecurityEvent('missing_env_vars', { ip: getClientIP(req) }, req)
      return res.status(500).json({ 
        error: 'Configuration serveur incomplète',
        message: 'Les variables d\'environnement UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN doivent être configurées dans Vercel Dashboard.'
      })
    }

    // Récupérer le refresh token depuis les cookies ou le body
    let refreshToken = null
    
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {})
      refreshToken = cookies.refreshToken
    }
    
    if (!refreshToken && req.body?.refreshToken) {
      refreshToken = req.body.refreshToken
    }
    
    if (!refreshToken) {
      await logSecurityEvent('refresh_token_missing', { ip: getClientIP(req) }, req)
      return res.status(401).json({ error: 'Refresh token required' })
    }

    const result = await refreshAccessToken(refreshToken)
    
    if (!result) {
      await logSecurityEvent('refresh_token_invalid', { ip: getClientIP(req) }, req)
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    // Retourner les nouveaux tokens dans des cookies httpOnly
    res.setHeader('Set-Cookie', [
      `adminToken=${result.token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=7200`,
      `refreshToken=${result.refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
    ])

    return res.json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken
    })
  } catch (error) {
    await logSecurityEvent('refresh_error', { error: error.message, ip: getClientIP(req) }, req)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
