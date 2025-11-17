export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { username } = req.body

    if (!username) {
      return res.status(400).json({ error: 'Username is required' })
    }

    // Importer adminUsers dynamiquement pour éviter les problèmes de dépendance circulaire
    const { adminUsers } = await import('./db.js')
    
    // Trouver l'utilisateur par username
    const allUsers = await adminUsers.getAll()
    const userToDelete = allUsers.find(u => u.username === username)

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' })
    }

    // PROTECTION : Ne pas supprimer le compte admin principal
    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin_4c1dd9ac'
    if (userToDelete.username === defaultUsername) {
      return res.status(403).json({ 
        error: 'Impossible de supprimer le compte admin principal' 
      })
    }

    // Supprimer l'utilisateur
    await adminUsers.delete(userToDelete.id)

    return res.json({ 
      success: true,
      message: `Utilisateur "${username}" supprimé avec succès` 
    })
  } catch (error) {
    console.error('Delete admin user error:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}
