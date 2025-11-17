import React, { useState, useEffect } from 'react'
import { error as logError } from '../../utils/logger'
import { motion } from 'framer-motion'
import { getById, save } from '../../utils/api.js'

const Events = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [events, setEvents] = useState({
    noel: {
      enabled: false,
      startDate: '',
      endDate: '',
      backgroundEnabled: false
    },
    paques: {
      enabled: false,
      startDate: '',
      endDate: '',
      backgroundEnabled: false
    },
    saintValentin: {
      enabled: false,
      startDate: '',
      endDate: '',
      backgroundEnabled: false
    },
    halloween: {
      enabled: false,
      startDate: '',
      endDate: '',
      backgroundEnabled: false
    },
    nouvelAn: {
      enabled: false,
      startDate: '',
      endDate: '',
      backgroundEnabled: false
    }
  })

  // Calculer automatiquement les dates des événements pour l'année en cours
  const calculateEventDates = (eventName) => {
    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1
    
    switch (eventName) {
      case 'noel':
        return {
          startDate: `${currentYear}-12-01`,
          endDate: `${currentYear}-12-31`
        }
      case 'paques':
        // Calcul de Pâques (premier dimanche après la première pleine lune de printemps)
        const easterDate = calculateEaster(currentYear)
        const easterStart = new Date(easterDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 1 semaine avant
        const easterEnd = new Date(easterDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 semaine après
        
        // S'assurer que la date de fin est après la date de début
        if (easterEnd < easterStart) {
          // Si problème, utiliser l'année suivante
          const nextEasterDate = calculateEaster(currentYear + 1)
          return {
            startDate: new Date(nextEasterDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date(nextEasterDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        }
        
        return {
          startDate: easterStart.toISOString().split('T')[0],
          endDate: easterEnd.toISOString().split('T')[0]
        }
      case 'saintValentin':
        return {
          startDate: `${currentYear}-02-01`,
          endDate: `${currentYear}-02-14`
        }
      case 'halloween':
        return {
          startDate: `${currentYear}-10-25`,
          endDate: `${currentYear}-11-02`
        }
      case 'nouvelAn':
        return {
          startDate: `${currentYear}-12-28`,
          endDate: `${nextYear}-01-05`
        }
      default:
        return { startDate: '', endDate: '' }
    }
  }

  // Calculer la date de Pâques (algorithme de Gauss)
  const calculateEaster = (year) => {
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31)
    const day = ((h + l - 7 * m + 114) % 31) + 1
    return new Date(year, month - 1, day)
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await getById('settings', 'events')
      
      if (data && data.value) {
        // Initialiser avec les dates calculées automatiquement si pas définies
        const updatedEvents = { ...events }
        Object.keys(updatedEvents).forEach(eventKey => {
          if (data.value[eventKey]) {
            updatedEvents[eventKey] = {
              ...updatedEvents[eventKey],
              ...data.value[eventKey]
            }
          }
          // Si pas de dates, calculer automatiquement
          if (!updatedEvents[eventKey].startDate || !updatedEvents[eventKey].endDate) {
            const dates = calculateEventDates(eventKey)
            updatedEvents[eventKey] = {
              ...updatedEvents[eventKey],
              startDate: dates.startDate,
              endDate: dates.endDate
            }
          }
        })
        setEvents(updatedEvents)
      } else {
        // Initialiser avec les dates calculées automatiquement
        const updatedEvents = { ...events }
        Object.keys(updatedEvents).forEach(eventKey => {
          const dates = calculateEventDates(eventKey)
          updatedEvents[eventKey] = {
            ...updatedEvents[eventKey],
            startDate: dates.startDate,
            endDate: dates.endDate
          }
        })
        setEvents(updatedEvents)
      }
    } catch (error) {
      logError('Erreur')
      // Initialiser avec les dates calculées automatiquement même en cas d'erreur
      const updatedEvents = { ...events }
      Object.keys(updatedEvents).forEach(eventKey => {
        const dates = calculateEventDates(eventKey)
        updatedEvents[eventKey] = {
          ...updatedEvents[eventKey],
          startDate: dates.startDate,
          endDate: dates.endDate
        }
      })
      setEvents(updatedEvents)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      console.log('💾 Sauvegarde des événements:', events)
      
      // Vérifier que les événements sont bien structurés
      const eventsToSave = { ...events }
      Object.keys(eventsToSave).forEach(eventKey => {
        const event = eventsToSave[eventKey]
        console.log(`📋 ${eventKey}:`, {
          enabled: event.enabled,
          startDate: event.startDate,
          endDate: event.endDate
        })
        
        // S'assurer que les dates sont définies
        if (!event.startDate || !event.endDate) {
          const dates = calculateEventDates(eventKey)
          eventsToSave[eventKey] = {
            ...event,
            startDate: event.startDate || dates.startDate,
            endDate: event.endDate || dates.endDate
          }
        }
      })
      
      const result = await save('settings', {
        key: 'events',
        value: eventsToSave
      })
      
      console.log('✅ Résultat sauvegarde:', result)
      
      alert('✅ Événements sauvegardés avec succès! Les effets seront visibles dans quelques secondes.')
      
      // Forcer une vérification immédiate des événements
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      logError('Erreur')
      alert('❌ Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'))
    } finally {
      setSaving(false)
    }
  }

  const handleEventChange = (eventKey, field, value) => {
    setEvents(prev => {
      const newEvents = { ...prev }
      
      // Si on active un événement, désactiver tous les autres
      if (field === 'enabled' && value === true) {
        Object.keys(newEvents).forEach(key => {
          if (key !== eventKey) {
            newEvents[key] = {
              ...newEvents[key],
              enabled: false
            }
          }
        })
      }
      
      // Mettre à jour l'événement sélectionné
      newEvents[eventKey] = {
        ...newEvents[eventKey],
        [field]: value
      }
      
      return newEvents
    })
  }

  const handleAutoFillDates = (eventKey) => {
    const dates = calculateEventDates(eventKey)
    console.log(`📅 Dates calculées pour ${eventKey}:`, dates)
    
    // Vérifier que les dates sont valides
    const startDate = new Date(dates.startDate)
    const endDate = new Date(dates.endDate)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      alert(`❌ Erreur: Dates invalides pour ${eventKey}`)
      return
    }
    
    if (endDate < startDate) {
      console.warn(`⚠️ Date de fin avant date de début pour ${eventKey}, correction...`)
      // Corriger en ajoutant 7 jours à la date de début
      const correctedEndDate = new Date(startDate)
      correctedEndDate.setDate(correctedEndDate.getDate() + 7)
      dates.endDate = correctedEndDate.toISOString().split('T')[0]
      console.log(`✅ Date corrigée:`, dates.endDate)
    }
    
    handleEventChange(eventKey, 'startDate', dates.startDate)
    handleEventChange(eventKey, 'endDate', dates.endDate)
  }

  const eventLabels = {
    noel: { name: '🎄 Noël', description: 'Décembre' },
    paques: { name: '🐰 Pâques', description: 'Avril (calculé automatiquement)' },
    saintValentin: { name: '💕 Saint-Valentin', description: 'Février' },
    halloween: { name: '🎃 Halloween', description: 'Octobre-Novembre' },
    nouvelAn: { name: '🎆 Nouvel An', description: 'Décembre-Janvier' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
          🎉 Événements
        </h1>
        <p className="text-white text-sm sm:text-base">Configurez les événements saisonniers de votre boutique</p>
      </motion.div>

      <div className="space-y-4 sm:space-y-6">
        {Object.keys(events).map((eventKey) => {
          const event = events[eventKey]
          const label = eventLabels[eventKey]
          
          return (
            <motion.div
              key={eventKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neon-border rounded-xl p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                <div>
                  <h3 className="text-white font-bold text-base sm:text-lg lg:text-xl">{label.name}</h3>
                  <p className="text-white text-sm">{label.description}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={event.enabled}
                      onChange={(e) => handleEventChange(eventKey, 'enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-white text-sm sm:text-base">Activer</span>
                  </label>
                </div>
              </div>

              {event.enabled && (
                <div className="space-y-4 mt-4">
                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm mb-2">Date de début</label>
                      <input
                        type="date"
                        value={event.startDate}
                        onChange={(e) => handleEventChange(eventKey, 'startDate', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-white"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-2">Date de fin</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={event.endDate}
                          onChange={(e) => handleEventChange(eventKey, 'endDate', e.target.value)}
                          className="flex-1 px-3 sm:px-4 py-2 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleAutoFillDates(eventKey)}
                          className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm whitespace-nowrap"
                        >
                          Auto
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}

        {/* Bouton de sauvegarde */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-end"
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 sm:px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder les événements'}
          </button>
        </motion.div>
      </div>
      </div>
    </div>
  )
}

export default Events
