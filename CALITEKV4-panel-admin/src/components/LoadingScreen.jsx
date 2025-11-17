import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getById } from '../utils/api'

const LoadingScreen = ({ onComplete }) => {
  const [config, setConfig] = useState(null)
  const [show, setShow] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await getById('settings', 'loading')
        if (data && data.value) {
          setConfig({
            enabled: data.value.enabled !== false,
            text: data.value.text || 'Chargement...',
            duration: data.value.duration || 2000,
            backgroundColor: data.value.backgroundColor || '#667eea',
            style: data.value.style || 'spinner',
            backgroundType: data.value.backgroundType || 'color',
            backgroundImage: data.value.backgroundImage || '',
            backgroundVideo: data.value.backgroundVideo || ''
          })
        } else {
          // Si aucune config n'existe, désactiver l'écran de chargement par défaut
          setConfig({
            enabled: false,
            text: '',
            duration: 0,
            backgroundColor: '#667eea',
            style: 'spinner',
            backgroundType: 'color',
            backgroundImage: '',
            backgroundVideo: ''
          })
        }
      } catch (error) {
        console.error('Erreur:', error)
        // En cas d'erreur, désactiver l'écran de chargement
        setConfig({
          enabled: false,
          text: '',
          duration: 0,
          backgroundColor: '#667eea',
          style: 'spinner',
          backgroundType: 'color',
          backgroundImage: '',
          backgroundVideo: ''
        })
      }
    }
    loadConfig()
  }, [])

  useEffect(() => {
    if (!config) return
    if (!config.enabled) {
      setShow(false)
      onComplete?.()
      return
    }

    const intervalTime = 30
    const increment = 100 / (config.duration / intervalTime)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setShow(false)
            onComplete?.()
          }, 200)
          return 100
        }
        return prev + increment
      })
    }, intervalTime)

    return () => clearInterval(interval)
  }, [config, onComplete])

  // Ne RIEN afficher tant que la config n'est pas chargée
  if (!config) return null
  
  if (config && !config.enabled) return null
  if (!show) return null

  const renderLoader = () => {
    switch (config.style) {
      case 'progress':
        return (
          <div className="w-64">
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-white text-sm mt-2 text-center">{Math.round(progress)}%</p>
          </div>
        )
      case 'dots':
        return (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="w-4 h-4 bg-white rounded-full" animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        )
      case 'pulse':
        return <motion.div className="w-20 h-20 bg-white rounded-full" animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }} />
      case 'wave':
        return (
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div key={i} className="w-2 bg-white rounded-full" animate={{ height: [10, 40, 10] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }} />
            ))}
          </div>
        )
      case 'orbit':
        return (
          <div className="relative w-20 h-20">
            <motion.div className="absolute inset-0 border-2 border-white/30 rounded-full" />
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="absolute top-0 left-1/2 w-3 h-3 bg-white rounded-full -translate-x-1/2" style={{ transformOrigin: '50% 40px' }} animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.67, ease: 'linear' }} />
            ))}
          </div>
        )
      case 'bars':
        return (
          <div className="flex gap-1 items-end">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div key={i} className="w-2 bg-white rounded-t" animate={{ height: [10, 40, 10] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
            ))}
          </div>
        )
      case 'circle':
        return (
          <div className="relative w-20 h-20">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="absolute inset-0 border-2 border-white rounded-full" animate={{ scale: [0.8, 1.2], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }} />
            ))}
          </div>
        )
      default:
        return (
          <div className="relative w-20 h-20">
            <motion.div className="absolute inset-0 border-4 border-white/30 rounded-full" />
            <motion.div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
          </div>
        )
    }
  }

  const getBgStyle = () => {
    if (config.backgroundType === 'image' && config.backgroundImage) {
      return { backgroundImage: `url(${config.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }
    return { backgroundColor: config.backgroundColor }
  }

  return (
    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-[99999] flex items-center justify-center" style={getBgStyle()}>
      {config.backgroundType === 'video' && config.backgroundVideo && (
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src={config.backgroundVideo} type="video/mp4" />
        </video>
      )}
      {(config.backgroundType === 'image' || config.backgroundType === 'video') && (
        <div className="absolute inset-0 bg-black/40" />
      )}
      <motion.div key="content" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="relative z-10 flex flex-col items-center gap-6">
        {renderLoader()}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-white text-2xl md:text-3xl font-bold text-center px-4" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          {config.text}
        </motion.p>
        <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
        </div>
      </motion.div>
    </motion.div>
  )
}

export default LoadingScreen
