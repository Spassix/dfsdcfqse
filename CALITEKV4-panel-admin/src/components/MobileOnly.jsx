import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Composant qui bloque l'accès sur PC/Desktop
 * Autorise uniquement les appareils mobiles
 */
const MobileOnly = ({ children }) => {
  const [isMobile, setIsMobile] = useState(true)
  const [isChecking, setIsChecking] = useState(true)
  const location = useLocation()

  // Vérifier si on est dans le panel admin (toujours autorisé)
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    const checkDevice = async () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera
      
      // Détecter si c'est un navigateur desktop
      const isDesktopOS = /windows|macintosh|linux/i.test(userAgent) && 
                          !/mobile|android|iphone|ipad|ipod/i.test(userAgent)
      
      // Regex pour détecter les mobiles
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i
      const isMobileUserAgent = mobileRegex.test(userAgent)
      
      // BLOQUER TOUT CE QUI EST PC
      // Si OS Desktop (Windows/Mac/Linux), BLOQUER TOUJOURS
      if (isDesktopOS) {
        setIsMobile(false)
        setIsChecking(false)
        return
      }
      
      // Si pas de User Agent mobile du tout, BLOQUER
      if (!isMobileUserAgent) {
        setIsMobile(false)
        setIsChecking(false)
        return
      }
      
      // Seuls les vrais mobiles/tablettes passent
      setIsMobile(true)
      setIsChecking(false)
    }

    // Vérifier immédiatement
    checkDevice().catch(() => {
      setIsMobile(false)
      setIsChecking(false)
    })

    // Réécouter en cas de redimensionnement (pour détecter les changements de taille)
    const handleResize = () => {
      checkDevice()
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', checkDevice)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  // Si on charge, afficher un écran de chargement
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  // Si on est dans l'admin, toujours autoriser
  if (isAdminRoute) {
    return children
  }

  // Si ce n'est pas un appareil mobile, bloquer l'accès
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center relative overflow-hidden">
        {/* Effet de fond animé */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-red-500/20 via-purple-500/20 to-blue-500/20 animate-pulse"></div>
        </div>

        {/* Contenu de blocage */}
        <div className="relative z-10 text-center px-4 max-w-2xl">
          <div className="bg-black/90 backdrop-blur-xl rounded-3xl px-12 py-16 border-2 border-red-500/30 shadow-[0_0_60px_rgba(255,0,0,0.3)]">
            {/* Icône */}
            <div className="text-8xl mb-8 animate-bounce">
              📱
            </div>

            {/* Titre */}
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-6">
              Accès Restreint
            </h1>

            {/* Message */}
            <div className="text-white/90 text-lg md:text-xl font-light leading-relaxed mb-8 space-y-4">
              <p>
                Ce site est uniquement accessible sur <strong className="text-white">appareils mobiles</strong> (téléphone, tablette).
              </p>
              <p className="text-red-400">
                L'accès depuis un ordinateur de bureau n'est pas autorisé pour des raisons de sécurité.
              </p>
              {(window.Telegram?.WebApp || /Telegram/i.test(navigator.userAgent)) && (
                <p className="text-yellow-400">
                  ⚠️ La mini app Telegram sur PC (Telegram Web ou Telegram Desktop) est également bloquée.
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gray-900/50 rounded-xl p-6 mb-6 border border-gray-800">
              <p className="text-white/80 text-sm md:text-base">
                <span className="font-semibold text-white">Pour accéder au site :</span>
              </p>
              <ul className="text-white/70 text-sm md:text-base mt-3 space-y-2 text-left max-w-md mx-auto">
                <li className="flex items-start">
                  <span className="mr-2">📱</span>
                  <span>Ouvrez ce site sur votre téléphone ou tablette</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">📲</span>
                  <span>Utilisez l'app Telegram sur votre téléphone (pas Telegram Web/Desktop)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🔒</span>
                  <span>Scannez le QR code si disponible</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🌐</span>
                  <span>Ou saisissez l'URL directement sur votre appareil mobile</span>
                </li>
              </ul>
            </div>

            {/* Détails techniques pour debug */}
            <div className="text-white/50 text-xs md:text-sm mt-6">
              <p>Détection : {window.innerWidth}px × {window.innerHeight}px</p>
              <p className="mt-1">User Agent : {navigator.userAgent.includes('Telegram') ? 'Telegram' : navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</p>
              {window.Telegram?.WebApp && (
                <>
                  <p className="mt-1">Telegram Mini App : {window.Telegram.WebApp.platform || 'Unknown'}</p>
                  <p className="mt-1">Touchscreen : {('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'Oui' : 'Non'}</p>
                  <p className="mt-1">Largeur écran : {window.innerWidth >= 1024 ? 'Large (PC)' : 'Petit (Mobile)'}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si c'est un appareil mobile, afficher le contenu normalement
  return children
}

export default MobileOnly
