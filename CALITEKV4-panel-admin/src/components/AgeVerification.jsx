import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getById } from '../utils/api'

const AgeVerification = ({ onVerified }) => {
  const [config, setConfig] = useState({
    enabled: false,
    text: 'Vous devez être majeur pour accéder à ce site',
    image: '',
    backgroundType: 'theme' // theme, image, video, color
  })
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const data = await getById('settings', 'ageVerification')
      if (data && data.value) {
        const loadedConfig = {
          enabled: data.value.enabled !== false,
          text: data.value.text || 'Vous devez être majeur pour accéder à ce site',
          image: data.value.image || '',
          backgroundType: data.value.backgroundType || 'theme'
        }
        setConfig(loadedConfig)
        
        // Vérifier si déjà vérifié dans sessionStorage ET si la vérification est activée
        const verified = sessionStorage.getItem('ageVerified')
        if (verified === 'true' && loadedConfig.enabled) {
          setShow(false)
          onVerified?.()
        } else if (!loadedConfig.enabled) {
          // Si la vérification est désactivée, autoriser l'accès
          setShow(false)
          onVerified?.()
        }
      } else {
        // Pas de configuration = pas de vérification
        setShow(false)
        onVerified?.()
      }
    } catch (error) {
      // En cas d'erreur, autoriser l'accès par défaut
      setShow(false)
      onVerified?.()
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    sessionStorage.setItem('ageVerified', 'true')
    setShow(false)
    setTimeout(() => onVerified?.(), 300)
  }

  const handleDecline = () => {
    alert('Vous devez être majeur pour accéder à ce site.')
    window.location.href = 'https://www.google.com'
  }

  const getBackgroundStyle = () => {
    // Utiliser le thème de la boutique (fond actuel)
    if (config.backgroundType === 'theme') {
      return {
        background: 'var(--color-background, #000000)',
        backgroundImage: 'var(--background-image, none)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    
    if (config.backgroundType === 'image' && config.image) {
      return {
        backgroundImage: `url(${config.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }
    }
    
    return {
      background: 'var(--color-background, #000000)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }

  if (loading) {
    return null
  }

  if (!config.enabled) {
    // Si la vérification est désactivée, autoriser l'accès immédiatement
    if (show) {
      setShow(false)
      onVerified?.()
    }
    return null
  }

  if (!show) {
    return null
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100]"
          style={{
            ...getBackgroundStyle(),
            backgroundSize: config.backgroundType === 'image' && config.image ? 'cover' : 'auto',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            boxSizing: 'border-box'
          }}
        >
          {/* Overlay sombre - réduit pour mieux voir l'image */}
          <div 
            className={`absolute inset-0 ${config.backgroundType === 'image' && config.image ? 'bg-black/40' : 'bg-black/60'} backdrop-blur-sm`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%'
            }}
          />
          
          {/* Contenu centré */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 max-w-lg w-full bg-slate-900/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 border-2 border-white/30 shadow-2xl"
            style={{
              position: 'relative',
              margin: 'auto',
              maxHeight: '90vh',
              overflowY: 'auto',
              alignSelf: 'center',
              justifySelf: 'center',
              flexShrink: 0
            }}
          >
            {/* Image si configurée */}
            {config.image && config.backgroundType !== 'image' && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img 
                  src={config.image} 
                  alt="Vérification âge" 
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {/* Texte - amélioré pour meilleure visibilité */}
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 text-center leading-tight" style={{ 
              textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)',
              color: '#ffffff !important'
            }}>
              {config.text || 'Vous devez être majeur pour accéder à ce site'}
            </h2>

            <p className="text-white text-center mb-6 text-base sm:text-lg font-medium" style={{ 
              textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8)',
              color: '#ffffff !important'
            }}>
              En cliquant sur "Oui, j'ai plus de 18 ans", vous confirmez que vous êtes majeur.
            </p>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg transition-all text-base sm:text-lg shadow-lg hover:shadow-xl"
                style={{ color: '#ffffff !important' }}
              >
                ✅ Oui, j'ai plus de 18 ans
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 py-4 px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all text-base sm:text-lg shadow-lg hover:shadow-xl"
                style={{ color: '#ffffff !important' }}
              >
                ❌ Non, j'ai moins de 18 ans
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AgeVerification
