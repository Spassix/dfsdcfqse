import React, { useEffect } from 'react'
import { getById } from '../utils/api'
import { error } from '../utils/logger'

const ColorTheme = ({ children }) => {
  useEffect(() => {
    loadAndApplyColors()
    // Réappliquer les couleurs toutes les 5 secondes pour s'assurer qu'elles sont toujours appliquées
    const interval = setInterval(loadAndApplyColors, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadAndApplyColors = async () => {
    try {
      const data = await getById('settings', 'colors')
      
      if (data && data.value) {
        applyColors(data.value)
      } else {
        // Appliquer les couleurs par défaut (noir et blanc)
        applyColors({
          textPrimary: '#ffffff',
          textSecondary: '#9ca3af',
          textHeading: '#ffffff',
          backgroundColor: '#000000',
          cardBackground: '#1e293b',
          borderColor: '#334155',
          buttonText: '#ffffff',
          buttonBackground: '#3b82f6',
          linkColor: '#60a5fa',
          accentColor: '#ffffff'
        })
      }
    } catch (err) {
      error('Erreur lors du chargement des couleurs:', err)
      // Appliquer les couleurs par défaut en cas d'erreur
      applyColors({
        textPrimary: '#ffffff',
        textSecondary: '#9ca3af',
        textHeading: '#ffffff',
        backgroundColor: '#000000',
        cardBackground: '#1e293b',
        borderColor: '#334155',
        buttonText: '#ffffff',
        buttonBackground: '#3b82f6',
        linkColor: '#60a5fa',
        accentColor: '#ffffff'
      })
    }
  }

  const applyColors = (colorSettings) => {
    const root = document.documentElement
    const body = document.body
    
    // Vérifier si une image de fond est configurée
    const hasBackgroundImage = body.classList.contains('has-background-image') || 
                               root.classList.contains('has-background-image')
    
    // Appliquer les variables CSS
    root.style.setProperty('--color-text-primary', colorSettings.textPrimary)
    root.style.setProperty('--color-text-secondary', colorSettings.textSecondary)
    root.style.setProperty('--color-text-heading', colorSettings.textHeading)
    // Ne pas écraser le background si une image de fond est configurée
    if (!hasBackgroundImage) {
      root.style.setProperty('--color-background', colorSettings.backgroundColor)
    } else {
      root.style.setProperty('--color-background', 'transparent')
    }
    root.style.setProperty('--color-card-background', colorSettings.cardBackground)
    root.style.setProperty('--color-border', colorSettings.borderColor)
    root.style.setProperty('--color-button-text', colorSettings.buttonText)
    root.style.setProperty('--color-button-background', colorSettings.buttonBackground)
    root.style.setProperty('--color-link', colorSettings.linkColor)
    root.style.setProperty('--color-accent', colorSettings.accentColor)
    
    // Appliquer directement sur le body aussi
    body.style.setProperty('--color-text-primary', colorSettings.textPrimary)
    body.style.setProperty('--color-text-secondary', colorSettings.textSecondary)
    body.style.setProperty('--color-text-heading', colorSettings.textHeading)
    // Ne pas écraser le background si une image de fond est configurée
    if (!hasBackgroundImage) {
      body.style.setProperty('--color-background', colorSettings.backgroundColor)
      // Ne pas appliquer backgroundColor directement sur body si image de fond existe
      body.style.removeProperty('background-color')
    } else {
      body.style.setProperty('--color-background', 'transparent')
      // S'assurer que backgroundColor ne masque pas l'image
      body.style.setProperty('background-color', 'transparent', 'important')
    }
    
    // Forcer les couleurs de texte même avec les événements
    body.style.setProperty('color', colorSettings.textPrimary, 'important')
    
    // Log désactivé pour la sécurité
  }

  return <>{children}</>
}

export default ColorTheme
