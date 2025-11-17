/**
 * Redirection vers la boutique depuis application mobile
 */

import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function TelegramPanel() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Rediriger immédiatement vers la boutique (page d'accueil)
    // Peu importe si c'est depuis Telegram ou autre, on va à la boutique
    window.location.href = '/'
  }, [])

  const authenticateUser = async (id, username, firstName) => {
    try {
      // Rediriger directement vers la boutique (page d'accueil)
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur redirection:', error)
    }
  }

  // Afficher un écran de chargement pendant la redirection
  return (
    <div className="min-h-screen cosmic-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Redirection vers la boutique...</p>
      </div>
    </div>
  )
}
