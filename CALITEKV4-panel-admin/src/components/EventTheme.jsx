import React, { useState, useEffect } from 'react'
import { getById } from '../utils/api'
import EventDecorations from './EventDecorations'
import { log, warn, error } from '../utils/logger'

const EventTheme = ({ children }) => {
  const [activeEvent, setActiveEvent] = useState(null)

  useEffect(() => {
    checkActiveEvents()
    // Vérifier toutes les 10 secondes si un événement devient actif/inactif (plus réactif)
    const interval = setInterval(checkActiveEvents, 10000)
    return () => clearInterval(interval)
  }, [])

  const checkActiveEvents = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Essayer d'abord avec settings:events
      let data = await getById('settings', 'events')
      // Log désactivé pour la sécurité
      
      // Si pas trouvé ou pas de value, essayer directement avec events API
      if (!data || !data.value) {
        try {
          const { getAll } = await import('../utils/api')
          const eventsData = await getAll('events')
          // Log désactivé pour la sécurité
          
          if (eventsData && typeof eventsData === 'object') {
            // Si eventsData est directement l'objet d'événements
            if (eventsData.noel || eventsData.paques || eventsData.saintValentin) {
              data = { value: eventsData }
            } else {
              // Sinon, essayer de trouver la structure
              data = { value: eventsData }
            }
          }
        } catch (e) {
          error('Impossible de récupérer les événements:', e)
        }
      }
      
      if (!data || !data.value) {
        // Log désactivé pour la sécurité
        setActiveEvent(null)
        applyTheme(null)
        return
      }

      const events = data.value
      // Logs désactivés pour la sécurité
      
      // Vérifier chaque événement dans l'ordre de priorité (le premier actif gagne)
      const eventOrder = ['noel', 'paques', 'saintValentin', 'halloween', 'nouvelAn']
      
      for (const eventKey of eventOrder) {
        const event = events[eventKey]
        if (!event) {
          // Log désactivé pour la sécurité
          continue
        }
        
        // Log désactivé pour la sécurité
        
        // Vérifier que l'événement est activé
        if (!event.enabled) {
          // Log désactivé pour la sécurité
          continue
        }
        
        // Vérifier que les dates sont définies
        if (!event.startDate || !event.endDate) {
          warn(`${eventKey} n'a pas de dates définies`)
          continue
        }
        
        const startDate = new Date(event.startDate)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(event.endDate)
        endDate.setHours(23, 59, 59, 999)
        
        // Vérifier que les dates sont valides
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          warn(`${eventKey} a des dates invalides`)
          continue
        }
        
        // Vérifier que la date de fin est après la date de début
        if (endDate < startDate) {
          warn(`${eventKey} a une date de fin avant la date de début, correction...`)
          // Corriger en ajoutant 7 jours à la date de début
          const correctedEndDate = new Date(startDate)
          correctedEndDate.setDate(correctedEndDate.getDate() + 7)
          correctedEndDate.setHours(23, 59, 59, 999)
          endDate.setTime(correctedEndDate.getTime())
          // Log désactivé pour la sécurité
        }
        
        // Log désactivé pour la sécurité
        
        // Vérifier si aujourd'hui est dans la plage de dates
        if (today >= startDate && today <= endDate) {
          // Log désactivé pour la sécurité
          const eventWithKey = {
            key: eventKey,
            ...event
          }
          setActiveEvent(eventWithKey)
          applyTheme(eventWithKey)
          return // Arrêter dès qu'on trouve un événement actif
        } else {
          // Log désactivé pour la sécurité
        }
      }
      
      // Log désactivé pour la sécurité
      
      setActiveEvent(null)
      applyTheme(null)
    } catch (err) {
      error('Erreur lors de la vérification des événements:', err)
      applyTheme(null)
    }
  }

  const applyTheme = (event) => {
    const root = document.documentElement
    const body = document.body
    
    if (!event || !event.key) {
      // Réinitialiser les couleurs par défaut
      root.style.setProperty('--event-primary', '')
      root.style.setProperty('--event-secondary', '')
      root.style.setProperty('--event-accent', '')
      root.style.setProperty('--event-gradient', '')
      root.style.setProperty('--event-overlay', '')
      body.classList.remove('event-active')
      body.classList.remove('event-effects-enabled')
      body.removeAttribute('data-event')
      root.classList.remove('event-active')
      // Log désactivé pour la sécurité
      return
    }

    // Appliquer le thème selon le type d'événement
    const themes = {
      noel: {
        primary: '#dc2626', // Rouge Noël
        secondary: '#16a34a', // Vert Noël
        accent: '#fbbf24', // Or
        gradient: 'linear-gradient(135deg, #dc2626 0%, #16a34a 100%)',
        overlay: 'rgba(220, 38, 38, 0.1)' // Overlay rouge léger
      },
      paques: {
        primary: '#f472b6', // Rose
        secondary: '#a78bfa', // Violet
        accent: '#fbbf24', // Jaune
        gradient: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)',
        overlay: 'rgba(244, 114, 182, 0.1)' // Overlay rose léger
      },
      saintValentin: {
        primary: '#ec4899', // Rose
        secondary: '#f43f5e', // Rose foncé
        accent: '#fda4af', // Rose clair
        gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
        overlay: 'rgba(236, 72, 153, 0.1)' // Overlay rose léger
      },
      halloween: {
        primary: '#f97316', // Orange
        secondary: '#7c2d12', // Marron foncé
        accent: '#fbbf24', // Jaune
        gradient: 'linear-gradient(135deg, #f97316 0%, #7c2d12 100%)',
        overlay: 'rgba(249, 115, 22, 0.1)' // Overlay orange léger
      },
      nouvelAn: {
        primary: '#3b82f6', // Bleu
        secondary: '#8b5cf6', // Violet
        accent: '#fbbf24', // Or
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        overlay: 'rgba(59, 130, 246, 0.1)' // Overlay bleu léger
      }
    }

    const themeColors = themes[event.key] || {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#fbbf24',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
      overlay: 'rgba(236, 72, 153, 0.1)'
    }

    // Appliquer toutes les variables CSS
    root.style.setProperty('--event-primary', themeColors.primary)
    root.style.setProperty('--event-secondary', themeColors.secondary)
    root.style.setProperty('--event-accent', themeColors.accent)
    root.style.setProperty('--event-gradient', themeColors.gradient)
    root.style.setProperty('--event-overlay', themeColors.overlay)
    
    // IMPORTANT: NE PAS modifier les couleurs de texte - elles restent blanches/noires
    // Les événements n'affectent que les décorations et bordures, pas les textes
    
    // Ajouter la classe pour activer tous les styles
    body.classList.add('event-active')
    body.setAttribute('data-event', event.key)
    root.classList.add('event-active')
    
    // Les effets visuels sont toujours activés si l'événement est actif
    // (le toggle a été retiré du panel admin)
    body.classList.add('event-effects-enabled')
    
    // Forcer les couleurs de texte à rester blanches/noires
    const textPrimary = getComputedStyle(root).getPropertyValue('--color-text-primary') || '#ffffff'
    body.style.setProperty('color', textPrimary, 'important')
    
    // Appliquer le thème noir/blanc selon l'événement
    // Certains événements peuvent avoir un fond plus clair (Pâques, Nouvel An)
    const lightThemeEvents = ['paques', 'nouvelAn']
    if (lightThemeEvents.includes(event.key)) {
      body.classList.add('light-theme')
      // Log désactivé pour la sécurité
    } else {
      body.classList.remove('light-theme')
      // Log désactivé pour la sécurité
    }
    
    // Log désactivé pour la sécurité
  }

  return (
    <>
      {activeEvent && <EventDecorations eventKey={activeEvent.key} />}
      {children}
    </>
  )
}

export default EventTheme
