import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getById } from '../utils/api'

const EventBanner = () => {
  const [activeEvent, setActiveEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkActiveEvents()
  }, [])

  const checkActiveEvents = async () => {
    try {
      setLoading(true)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Réinitialiser l'heure pour la comparaison
      
      const data = await getById('settings', 'events')
      
      if (!data || !data.value) {
        setLoading(false)
        return
      }

      const events = data.value
      
      // Vérifier chaque événement
      for (const [eventKey, event] of Object.entries(events)) {
        if (event.enabled && event.startDate && event.endDate) {
          const startDate = new Date(event.startDate)
          startDate.setHours(0, 0, 0, 0)
          const endDate = new Date(event.endDate)
          endDate.setHours(23, 59, 59, 999) // Fin de journée
          
          if (today >= startDate && today <= endDate) {
            setActiveEvent({
              key: eventKey,
              ...event
            })
            setLoading(false)
            return
          }
        }
      }
      
      setActiveEvent(null)
    } catch (error) {
      console.error('Erreur lors de la vérification des événements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !activeEvent) {
    return null
  }

  const eventNames = {
    noel: '🎄 Noël',
    paques: '🐰 Pâques',
    saintValentin: '💕 Saint-Valentin',
    halloween: '🎃 Halloween',
    nouvelAn: '🎆 Nouvel An'
  }

  // Calculer le style du header pour qu'il soit en dessous du banner
  const headerStyle = activeEvent ? { marginTop: '80px' } : { marginTop: 0 }

  return (
    <AnimatePresence>
      {activeEvent && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-pink-600/90 to-purple-600/90 backdrop-blur-md border-b-2 border-white/30 shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl animate-bounce">
                  {eventNames[activeEvent.key] || '🎉'}
                </span>
                <div>
                  <h3 className="text-white font-bold text-lg sm:text-xl">
                    {eventNames[activeEvent.key] || 'Événement spécial'}
                  </h3>
                  {activeEvent.message && (
                    <p className="text-white/90 text-sm sm:text-base">
                      {activeEvent.message}
                    </p>
                  )}
                </div>
              </div>
              {activeEvent.banner && (
                <div className="hidden sm:block">
                  <img 
                    src={activeEvent.banner} 
                    alt="Bannière événement" 
                    className="h-12 sm:h-16 object-contain rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EventBanner
