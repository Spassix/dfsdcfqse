import { useEffect } from 'react'

/**
 * Composant de protection pour masquer toutes les sources et désactiver les outils de développement
 * dans le panel admin
 */
export default function AdminProtection() {
  useEffect(() => {
    // Désactiver le clic droit
    const handleContextMenu = (e) => {
      e.preventDefault()
      return false
    }

    // Désactiver F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
    const handleKeyDown = (e) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault()
        return false
      }
      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault()
        return false
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault()
        return false
      }
      // Ctrl+Shift+C (Inspect)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault()
        return false
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault()
        return false
      }
      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault()
        return false
      }
      // Ctrl+P (Print)
      if (e.ctrlKey && e.keyCode === 80) {
        e.preventDefault()
        return false
      }
      // Ctrl+A (Select All)
      if (e.ctrlKey && e.keyCode === 65) {
        e.preventDefault()
        return false
      }
    }

    // Masquer la sélection de texte
    const handleSelectStart = (e) => {
      e.preventDefault()
      return false
    }

    // Désactiver le drag and drop
    const handleDragStart = (e) => {
      e.preventDefault()
      return false
    }

    // Masquer les sources dans les éléments HTML (sans casser les CSS)
    const hideSources = () => {
      // Masquer tous les attributs src et href SAUF les CSS et les styles essentiels
      const allElements = document.querySelectorAll('*')
      allElements.forEach(el => {
        // Ignorer les balises essentielles pour le CSS et les styles
        const tagName = el.tagName?.toLowerCase()
        if (tagName === 'link' || tagName === 'style' || tagName === 'script') {
          return // Ne pas toucher aux CSS, styles et scripts
        }
        
        // Masquer les src (images, vidéos, etc.)
        if (el.src && !el.hasAttribute('data-protected')) {
          // Ne pas supprimer les src des images/vidéos dans le contenu admin
          // Seulement masquer les sources externes suspectes
          const src = el.src
          if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
            el.setAttribute('data-original-src', src)
            // Ne pas supprimer complètement, juste masquer visuellement
            // el.removeAttribute('src') // DÉSACTIVÉ pour éviter de casser les images
          }
          el.setAttribute('data-protected', 'true')
        }
        
        // Masquer les href (liens externes uniquement)
        if (el.href && !el.hasAttribute('data-protected-href')) {
          const href = el.href
          // Ne jamais toucher aux href des balises <link> (CSS)
          if (tagName !== 'link' && href && !href.startsWith('#') && !href.startsWith('/')) {
            el.setAttribute('data-original-href', href)
            // Ne pas supprimer pour éviter de casser la navigation
            // el.removeAttribute('href') // DÉSACTIVÉ
          }
          el.setAttribute('data-protected-href', 'true')
        }
      })
    }

    // Bloquer la console
    const blockConsole = () => {
      const noop = () => {}
      const methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd']
      
      methods.forEach(method => {
        if (window.console && window.console[method]) {
          window.console[method] = noop
        }
      })
    }

    // Masquer les erreurs dans la console
    window.addEventListener('error', (e) => {
      e.preventDefault()
      return false
    })

    // Désactiver les événements
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('dragstart', handleDragStart)

    // Bloquer la console
    blockConsole()

    // Masquer les sources périodiquement (moins fréquemment pour éviter les problèmes de performance)
    // DÉSACTIVÉ pour éviter de casser les CSS et styles
    // const interval = setInterval(hideSources, 1000)

    // Nettoyage
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('dragstart', handleDragStart)
      // clearInterval(interval) // Désactivé car interval n'est plus utilisé
    }
  }, [])

  return null
}
