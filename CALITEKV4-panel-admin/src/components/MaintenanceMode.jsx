import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getById } from '../utils/api'

const MaintenanceMode = ({ children }) => {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [backgroundImage, setBackgroundImage] = useState('')
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  // Vérifier si on est dans le panel admin
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const settings = await getById('settings', 'general')
        if (settings && settings.value) {
          setMaintenanceMode(settings.value.maintenanceMode || false)
          setMaintenanceMessage(settings.value.maintenanceMessage || '🔧 Site en maintenance')
          // Support des deux noms de propriété pour compatibilité
          setBackgroundImage(settings.value.maintenanceBackgroundImage || settings.value.backgroundImage || '')
        }
      } catch (error) {
        console.error('Erreur vérification maintenance:', error)
      } finally {
        setLoading(false)
      }
    }

    checkMaintenance()
  }, [location.pathname])

  // Si on charge, afficher un écran blanc
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  // Si mode maintenance activé ET qu'on n'est PAS dans l'admin, afficher la page de maintenance
  if (maintenanceMode && !isAdminRoute) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          backgroundColor: 'black'
        }}
      >
        {/* Overlay sombre */}
        {backgroundImage && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        )}

        {/* Contenu de maintenance */}
        <div className="relative z-10 text-center px-4 max-w-2xl">
          <div className="bg-black/90 backdrop-blur-xl rounded-3xl px-12 py-16 border-2 border-white/30 shadow-[0_0_60px_rgba(0,0,0,0.9)]">
            {/* Icône animée */}
            <div className="text-8xl mb-8 animate-pulse">
              🔧
            </div>

            {/* Message */}
            <div className="text-white text-2xl md:text-3xl font-light leading-relaxed whitespace-pre-line mb-8">
              {maintenanceMessage}
            </div>

            {/* Loader */}
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sinon, afficher normalement le contenu
  return children
}

export default MaintenanceMode
