import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      // Vérifier l'authentification
      // Importer verifyAuth seulement quand nécessaire (évite les problèmes de dépendance circulaire)
      const { verifyAuth } = await import('./auth-utils.js')
      const user = await verifyAuth(req)
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      
      // Importer adminUsers dynamiquement pour éviter les problèmes de dépendance circulaire
      const { adminUsers } = await import('./db.js')
      const users = await adminUsers.getAll()
      // Ne pas exposer les mots de passe
      const usersWithoutPasswords = users.map(u => {
        const { password, ...rest } = u
        return rest
      })
      return res.json(usersWithoutPasswords)
    }

    if (req.method === 'POST') {
      // DÉSACTIVÉ : La création d'utilisateurs via le panel est désactivée
      // Les admins doivent être créés via les variables d'environnement Vercel
      return res.status(403).json({ 
        success: false,
        error: 'La création d\'utilisateurs via le panel est désactivée. Les admins doivent être créés via les variables d\'environnement Vercel (DEFAULT_ADMIN_USERNAME_1, DEFAULT_ADMIN_PASSWORD_1, DEFAULT_ADMIN_USERNAME_2, DEFAULT_ADMIN_PASSWORD_2, etc.). Utilisez /api/admin-init pour initialiser les admins depuis les variables d\'environnement.' 
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Admin users API error:', error)
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    })
  }
}
