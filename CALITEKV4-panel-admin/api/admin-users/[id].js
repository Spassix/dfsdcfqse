import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { id } = req.query
    // Importer verifyAuth seulement quand nécessaire (évite les problèmes de dépendance circulaire)
    const { verifyAuth } = await import('../auth-utils.js')
    const currentUser = await verifyAuth(req)
    
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      // Importer adminUsers dynamiquement pour éviter les problèmes de dépendance circulaire
      const { adminUsers } = await import('../db.js')
      const user = await adminUsers.getById(id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      // Ne pas exposer le mot de passe
      const { password, ...userWithoutPassword } = user
      return res.json(userWithoutPassword)
    }

    if (req.method === 'PUT') {
      // Importer redis et adminUsers dynamiquement pour éviter les problèmes de dépendance circulaire
      const { redis, adminUsers } = await import('../db.js')
      // Récupérer l'utilisateur complet avec mot de passe pour la mise à jour
      const existingRaw = await redis.get(`admin_user:${id}`)
      if (!existingRaw) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        })
      }

      const existing = typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw

      // Seuls les admins peuvent modifier les utilisateurs
      // Importer requireAdmin seulement quand nécessaire (évite les problèmes de dépendance circulaire)
      const { requireAdmin } = await import('../auth-utils.js')
      const isAdmin = await requireAdmin(req)
      if (!isAdmin) {
        return res.status(403).json({ 
          success: false,
          error: 'Seuls les administrateurs peuvent modifier les utilisateurs' 
        })
      }

      // PROTECTION : Empêcher la modification du compte admin principal
      const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin_4c1dd9ac'
      if (existing.username === defaultUsername) {
        // Ne pas permettre la modification du mot de passe du compte admin principal
        // Le mot de passe doit venir uniquement de DEFAULT_ADMIN_PASSWORD dans Vercel
        if (req.body.password) {
          return res.status(403).json({ 
            success: false,
            error: 'Le mot de passe du compte admin principal ne peut pas être modifié. Il est géré par les variables d\'environnement Vercel.' 
          })
        }
        
        // Ne pas permettre la suppression du rôle admin
        if (req.body.role && req.body.role !== 'admin') {
          return res.status(403).json({ 
            success: false,
            error: 'Le rôle du compte admin principal ne peut pas être modifié' 
          })
        }
      }

      const updateData = { ...req.body }
      
      // Si un nouveau mot de passe est fourni, le hasher
      // Sinon, conserver le mot de passe existant
      if (updateData.password && updateData.password.trim()) {
        updateData.password = await bcrypt.hash(updateData.password, 10)
      } else {
        // Conserver le mot de passe existant si aucun nouveau n'est fourni
        updateData.password = existing.password
      }

      // Valider le rôle si modifié
      if (updateData.role && updateData.role !== 'admin' && updateData.role !== 'moderator') {
        return res.status(400).json({ error: 'Role must be "admin" or "moderator"' })
      }

      try {
        const result = await adminUsers.update(id, updateData)
        return res.json({ 
          success: true,
          ...result 
        })
      } catch (error) {
        console.error('Error updating user:', error)
        return res.status(500).json({ 
          success: false,
          error: error.message || 'Erreur lors de la mise à jour de l\'utilisateur' 
        })
      }
    }

    if (req.method === 'DELETE') {
      // Seuls les admins peuvent supprimer des utilisateurs
      // Importer requireAdmin seulement quand nécessaire (évite les problèmes de dépendance circulaire)
      const { requireAdmin } = await import('../auth-utils.js')
      const isAdmin = await requireAdmin(req)
      if (!isAdmin) {
        return res.status(403).json({ 
          success: false,
          error: 'Seuls les administrateurs peuvent supprimer des utilisateurs' 
        })
      }

      // Importer adminUsers dynamiquement pour éviter les problèmes de dépendance circulaire
      const { adminUsers } = await import('../db.js')
      const user = await adminUsers.getById(id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      
      // PROTECTION ABSOLUE : Empêcher la suppression du compte admin principal
      const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin_4c1dd9ac'
      if (user.username === defaultUsername) {
        return res.status(403).json({ 
          success: false,
          error: 'Impossible de supprimer le compte admin principal. Ce compte est protégé et géré par les variables d\'environnement Vercel.' 
        })
      }
      
      try {
        await adminUsers.delete(id)
        return res.json({ 
          success: true,
          message: 'Utilisateur supprimé avec succès'
        })
      } catch (error) {
        console.error('Error deleting user:', error)
        return res.status(500).json({ 
          success: false,
          error: error.message || 'Erreur lors de la suppression de l\'utilisateur' 
        })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Admin user API error:', error)
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    })
  }
}
