import { useEffect, useState } from 'react'
import { getById } from '../utils/api'

export const ThemeProvider = ({ children }) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const loadTheme = async () => {
      try {
        console.log('🎨 Chargement du thème...')
        const settings = await getById('settings', 'general')
        
        console.log('Paramètres reçus:', settings)
        
        if (settings && settings.value) {
          // Appliquer les couleurs personnalisées via des variables CSS
          const root = document.documentElement
          
          const textColor = settings.value.textColor || '#ffffff'
          const secondaryTextColor = settings.value.secondaryTextColor || '#9ca3af'
          const headingColor = settings.value.headingColor || '#ffffff'
          const accentColor = settings.value.accentColor || '#ffffff'
          
          console.log('Application des couleurs:')
          console.log('- Texte principal:', textColor)
          console.log('- Texte secondaire:', secondaryTextColor)
          console.log('- Titres:', headingColor)
          console.log('- Accentuation:', accentColor)
          
          root.style.setProperty('--color-text', textColor)
          root.style.setProperty('--color-text-secondary', secondaryTextColor)
          root.style.setProperty('--color-heading', headingColor)
          root.style.setProperty('--color-accent', accentColor)
          
          console.log('✅ Thème appliqué avec succès !')
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement du thème:', error)
      } finally {
        setLoaded(true)
      }
    }

    loadTheme()
  }, [])

  // Afficher les enfants même si le chargement échoue
  return children
}
