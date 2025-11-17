import { initDatabase } from './db.js'

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const result = await initDatabase()
    
    // Ajouter les informations sur les variables d'environnement (sans exposer le mot de passe)
    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin'
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Junior50300.'
    
    return res.json({
      ...result,
      credentials: {
        username: defaultUsername,
        passwordLength: defaultPassword.length,
        hasCustomUsername: !!process.env.DEFAULT_ADMIN_USERNAME,
        hasCustomPassword: !!process.env.DEFAULT_ADMIN_PASSWORD,
        note: 'Utilisez ces identifiants pour vous connecter'
      }
    })
  } catch (error) {
    console.error('Init error:', error)
    return res.status(500).json({ error: error.message || 'Initialization failed' })
  }
}
