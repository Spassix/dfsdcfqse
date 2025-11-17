/**
 * Endpoint de diagnostic pour vérifier les variables d'environnement
 * NE PAS EXPOSER EN PRODUCTION - À supprimer après diagnostic
 */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin'
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Junior50300.'
    
    // Vérifier si des utilisateurs existent
    const { redis } = await import('../db.js')
    let hasUsers = false
    let userCount = 0
    try {
      const keys = await redis.keys('admin_user:*')
      hasUsers = keys && keys.length > 0
      userCount = keys ? keys.length : 0
    } catch (error) {
      // Ignorer
    }

    return res.json({
      success: true,
      environment: {
        hasDefaultUsername: !!process.env.DEFAULT_ADMIN_USERNAME,
        hasDefaultPassword: !!process.env.DEFAULT_ADMIN_PASSWORD,
        defaultUsername: defaultUsername,
        defaultPasswordLength: defaultPassword.length,
        defaultPasswordPreview: defaultPassword.substring(0, 3) + '...',
      },
      database: {
        hasUsers,
        userCount
      },
      note: 'Utilisez ces identifiants pour vous connecter'
    })
  } catch (error) {
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}
