/**
 * Vérification de branche - Autorise uniquement sur la branche admin-panel
 */

export default async function handler(req, res) {
  // Récupérer la branche Git actuelle
  const currentBranch = process.env.VERCEL_GIT_COMMIT_REF || 
                       process.env.GIT_COMMIT_REF || 
                       'unknown'
  
  // Autoriser UNIQUEMENT sur la branche admin-panel
  // Accepter aussi les branches qui commencent par "admin" ou "panel-admin"
  const isAdminBranch = currentBranch === 'admin-panel' || 
                       currentBranch === 'panel-admin' ||
                       currentBranch.startsWith('admin') ||
                       currentBranch.includes('admin-panel') ||
                       currentBranch.includes('panel-admin')
  
  if (isAdminBranch) {
    return res.status(200).json({ 
      success: true,
      message: 'Accès autorisé',
      branch: currentBranch
    })
  } else {
    // Refuser l'accès sur les autres branches (notamment main)
    return res.status(403).json({ 
      success: false,
      message: 'Accès refusé - Panel admin disponible uniquement sur la branche admin-panel',
      branch: currentBranch
    })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
