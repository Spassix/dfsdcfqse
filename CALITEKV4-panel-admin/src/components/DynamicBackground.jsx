import { useEffect, useState } from 'react'

const DynamicBackground = () => {
  const [backgroundImage, setBackgroundImage] = useState('')

  useEffect(() => {
    const loadBackground = async () => {
      try {
        const { getById } = await import('../utils/api')
        const data = await getById('settings', 'general')
        
        if (data && data.value && data.value.backgroundImage) {
          console.log('Image de fond trouvée:', data.value.backgroundImage)
          setBackgroundImage(data.value.backgroundImage)
        } else {
          console.log('Aucune image de fond configurée')
        }
      } catch (error) {
        console.error('Error loading background:', error)
      }
    }
    
    // Charger immédiatement
    loadBackground()
  }, [])

  useEffect(() => {
    // Créer ou mettre à jour le style CSS global
    let styleElement = document.getElementById('dynamic-background-style')
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'dynamic-background-style'
      document.head.appendChild(styleElement)
    }

    if (backgroundImage) {
      console.log('Application de l\'image de fond:', backgroundImage)
      
      // Vérifier que l'URL est valide en préchargeant l'image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        console.log('Image de fond chargée avec succès:', backgroundImage)
        
        // Définir la variable CSS pour l'image de fond
        document.documentElement.style.setProperty('--shop-background-image', `url(${backgroundImage})`)
        
        // Appliquer les styles CSS directement dans le style global
        styleElement.textContent = `
          /* Image de fond sur html et body - Mode mosaïque adaptatif */
          html.has-background-image {
            background-image: url(${backgroundImage}) !important;
            background-size: auto !important;
            background-position: top left !important;
            background-attachment: fixed !important;
            background-repeat: repeat !important;
            background-color: transparent !important;
            min-height: 100vh !important;
            width: 100% !important;
          }
          
          body.has-background-image {
            background-image: url(${backgroundImage}) !important;
            background-size: auto !important;
            background-position: top left !important;
            background-attachment: fixed !important;
            background-repeat: repeat !important;
            background-color: transparent !important;
            min-height: 100vh !important;
            width: 100% !important;
          }
          
          /* Adaptation mobile - image plus petite pour mieux s'afficher */
          @media (max-width: 768px) {
            html.has-background-image,
            body.has-background-image {
              background-size: 200px auto !important;
              background-attachment: scroll !important;
            }
          }
          
          /* Adaptation tablette */
          @media (min-width: 769px) and (max-width: 1024px) {
            html.has-background-image,
            body.has-background-image {
              background-size: 300px auto !important;
              background-attachment: fixed !important;
            }
          }
          
          /* Adaptation desktop */
          @media (min-width: 1025px) {
            html.has-background-image,
            body.has-background-image {
              background-size: auto !important;
              background-attachment: fixed !important;
            }
          }
          
          /* Forcer l'image de fond même sur les éléments avec cosmic-bg - Mode mosaïque adaptatif */
          html.has-background-image .cosmic-bg,
          body.has-background-image .cosmic-bg,
          .has-background-image .cosmic-bg {
            background-image: url(${backgroundImage}) !important;
            background-size: auto !important;
            background-position: top left !important;
            background-attachment: fixed !important;
            background-repeat: repeat !important;
            animation: none !important;
            min-height: 100vh !important;
            width: 100% !important;
          }
          
          /* Adaptation mobile pour cosmic-bg */
          @media (max-width: 768px) {
            html.has-background-image .cosmic-bg,
            body.has-background-image .cosmic-bg,
            .has-background-image .cosmic-bg {
              background-size: 200px auto !important;
              background-attachment: scroll !important;
            }
          }
          
          /* Adaptation tablette pour cosmic-bg */
          @media (min-width: 769px) and (max-width: 1024px) {
            html.has-background-image .cosmic-bg,
            body.has-background-image .cosmic-bg,
            .has-background-image .cosmic-bg {
              background-size: 300px auto !important;
              background-attachment: fixed !important;
            }
          }
          
          /* Adaptation desktop pour cosmic-bg */
          @media (min-width: 1025px) {
            html.has-background-image .cosmic-bg,
            body.has-background-image .cosmic-bg,
            .has-background-image .cosmic-bg {
              background-size: auto !important;
              background-attachment: fixed !important;
            }
          }
          
          /* Masquer le gradient de cosmic-bg quand il y a une image */
          html.has-background-image .cosmic-bg::before,
          body.has-background-image .cosmic-bg::before,
          .has-background-image .cosmic-bg::before {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
          }
          
          /* Réduire l'opacité du body::before pour laisser voir l'image */
          body.has-background-image::before {
            opacity: 0.1 !important;
            background: transparent !important;
          }
          
          /* S'assurer que le contenu est au-dessus de l'image */
          #root {
            position: relative;
            z-index: 1;
          }
        `
        
        // Ajouter une classe pour identifier qu'une image de fond est active
        document.body.classList.add('has-background-image')
        document.documentElement.classList.add('has-background-image')
        
        // Ajouter aussi sur #root pour que les styles s'appliquent aux enfants
        const root = document.getElementById('root')
        if (root) {
          root.classList.add('has-background-image')
        }
        
        // S'assurer que backgroundColor ne masque pas l'image (important pour éviter que ColorTheme l'écrase)
        document.body.style.setProperty('background-color', 'transparent', 'important')
        document.documentElement.style.setProperty('background-color', 'transparent', 'important')
        
        // Réappliquer périodiquement pour éviter que d'autres composants écrasent l'image
        const imageUrl = backgroundImage // Capturer la valeur pour l'interval
        const reapplyInterval = setInterval(() => {
          if (document.body.classList.contains('has-background-image')) {
            document.body.style.setProperty('background-image', `url(${imageUrl})`, 'important')
            document.body.style.setProperty('background-color', 'transparent', 'important')
            document.documentElement.style.setProperty('background-color', 'transparent', 'important')
            
            // Réappliquer aussi sur les éléments cosmic-bg - Mode mosaïque adaptatif
            const cosmicElements = document.querySelectorAll('.cosmic-bg')
            const isMobile = window.innerWidth <= 768
            const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024
            
            cosmicElements.forEach(el => {
              el.style.setProperty('background-image', `url(${imageUrl})`, 'important')
              el.style.setProperty('background-position', 'top left', 'important')
              el.style.setProperty('background-repeat', 'repeat', 'important')
              
              // Adapter selon la taille d'écran
              if (isMobile) {
                el.style.setProperty('background-size', '200px auto', 'important')
                el.style.setProperty('background-attachment', 'scroll', 'important')
              } else if (isTablet) {
                el.style.setProperty('background-size', '300px auto', 'important')
                el.style.setProperty('background-attachment', 'fixed', 'important')
              } else {
                el.style.setProperty('background-size', 'auto', 'important')
                el.style.setProperty('background-attachment', 'fixed', 'important')
              }
            })
            
            // Adapter aussi body et html selon la taille d'écran
            if (isMobile) {
              document.body.style.setProperty('background-size', '200px auto', 'important')
              document.body.style.setProperty('background-attachment', 'scroll', 'important')
            } else if (isTablet) {
              document.body.style.setProperty('background-size', '300px auto', 'important')
              document.body.style.setProperty('background-attachment', 'fixed', 'important')
            } else {
              document.body.style.setProperty('background-size', 'auto', 'important')
              document.body.style.setProperty('background-attachment', 'fixed', 'important')
            }
          }
        }, 3000) // Réappliquer toutes les 3 secondes
        
        // Stocker l'interval pour le nettoyer plus tard
        if (window.__backgroundReapplyInterval) {
          clearInterval(window.__backgroundReapplyInterval)
        }
        window.__backgroundReapplyInterval = reapplyInterval
      }
      
      img.onerror = () => {
        console.error('Erreur lors du chargement de l\'image de fond:', backgroundImage)
        styleElement.textContent = ''
        document.documentElement.style.removeProperty('--shop-background-image')
        document.body.classList.remove('has-background-image')
        document.documentElement.classList.remove('has-background-image')
        const root = document.getElementById('root')
        if (root) {
          root.classList.remove('has-background-image')
        }
        // Nettoyer l'interval si l'image ne charge pas
        if (window.__backgroundReapplyInterval) {
          clearInterval(window.__backgroundReapplyInterval)
          delete window.__backgroundReapplyInterval
        }
      }
      
      img.src = backgroundImage
    } else {
      // Supprimer les styles si pas d'image
      styleElement.textContent = ''
      document.documentElement.style.removeProperty('--shop-background-image')
      document.body.classList.remove('has-background-image')
      document.documentElement.classList.remove('has-background-image')
      const root = document.getElementById('root')
      if (root) {
        root.classList.remove('has-background-image')
      }
      // Nettoyer l'interval si pas d'image
      if (window.__backgroundReapplyInterval) {
        clearInterval(window.__backgroundReapplyInterval)
        delete window.__backgroundReapplyInterval
      }
    }
    
    // Nettoyer lors du démontage
    return () => {
      const existingStyle = document.getElementById('dynamic-background-style')
      if (existingStyle) {
        existingStyle.remove()
      }
      // Nettoyer l'interval de réapplication
      if (window.__backgroundReapplyInterval) {
        clearInterval(window.__backgroundReapplyInterval)
        delete window.__backgroundReapplyInterval
      }
    }
  }, [backgroundImage])

  return null
}

export default DynamicBackground
