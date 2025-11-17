/**
 * Utilitaire pour vérifier que le panel admin est accessible uniquement sur la branche admin
 */

/**
 * Vérifie si on est sur la branche admin
 * @returns {Promise<boolean>}
 */
export async function checkAdminBranch() {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : '/api')
    const response = await fetch(`${baseUrl}/admin-branch-check`, {
      method: 'GET',
      credentials: 'include'
    })
    
    if (!response.ok) {
      return false
    }
    
    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('Erreur lors de la vérification de la branche:', error)
    return false
  }
}

/**
 * Redirige vers une page d'erreur si on n'est pas sur la bonne branche
 */
export async function redirectIfNotAdminBranch() {
  const isAdminBranch = await checkAdminBranch()
  
  if (!isAdminBranch) {
    // Rediriger vers une page d'erreur ou le site principal
    window.location.href = '/'
    return false
  }
  
  return true
}
