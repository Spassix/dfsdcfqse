/**
 * Gestion des décorations de fêtes
 * Applique les thèmes selon la configuration
 */

(function() {
  'use strict';

  let currentTheme = null;
  let decorationsInterval = null;
  let starInterval = null;
  let ornamentInterval = null;

  /**
   * Initialise le système de thèmes de fête
   */
  function initHolidayThemes() {
    // Supprimer toutes les étoiles flottantes existantes au démarrage
    const existingStars = document.querySelectorAll('.star-decoration, .holiday-decoration.star-decoration');
    existingStars.forEach(el => el.remove());
    
    loadHolidayTheme();
    
    // Écouter les changements de configuration
    window.addEventListener('adminDataUpdated', function(e) {
      if (e.detail.key === 'config') {
        loadHolidayTheme();
      }
    });
    
    // Écouter les changements de storage
    window.addEventListener('storage', function(e) {
      if (e.key === 'site_config') {
        loadHolidayTheme();
      }
    });
  }

  /**
   * Charge le thème de fête depuis la configuration
   */
  function loadHolidayTheme() {
    try {
      const configData = localStorage.getItem('site_config');
      if (!configData) {
        removeHolidayTheme();
        return;
      }

      const config = JSON.parse(configData);
      const theme = config.holidayTheme || null;

      if (theme && theme !== 'none' && theme !== '') {
        applyHolidayTheme(theme);
      } else {
        removeHolidayTheme();
      }
    } catch (error) {
      console.error('Erreur chargement thème de fête:', error);
      removeHolidayTheme();
    }
  }

  /**
   * Applique un thème de fête
   * @param {string} theme - Nom du thème (christmas, easter, newyear, halloween)
   */
  function applyHolidayTheme(theme) {
    if (currentTheme === theme) {
      return; // Déjà appliqué
    }

    // Retirer l'ancien thème
    removeHolidayTheme();
    
    // Supprimer toutes les étoiles flottantes existantes
    const existingStars = document.querySelectorAll('.star-decoration, .holiday-decoration.star-decoration');
    existingStars.forEach(el => el.remove());

    // Ajouter la classe au body
    document.body.classList.add(`holiday-${theme}`);
    currentTheme = theme;

    // Générer les décorations selon le thème
    switch(theme) {
      case 'christmas':
        createChristmasDecorations();
        break;
      case 'easter':
        createEasterDecorations();
        break;
      case 'newyear':
        createNewYearDecorations();
        break;
      case 'halloween':
        createHalloweenDecorations();
        break;
    }
  }

  /**
   * Retire le thème de fête actuel
   */
  function removeHolidayTheme() {
    if (currentTheme) {
      document.body.classList.remove(`holiday-${currentTheme}`);
      currentTheme = null;
    }
    
    // Nettoyer les décorations
    clearDecorations();
  }

  /**
   * Nettoie toutes les décorations
   */
  function clearDecorations() {
    // Arrêter tous les intervalles si actifs
    if (decorationsInterval) {
      clearInterval(decorationsInterval);
      decorationsInterval = null;
    }
    if (starInterval) {
      clearInterval(starInterval);
      starInterval = null;
    }
    if (ornamentInterval) {
      clearInterval(ornamentInterval);
      ornamentInterval = null;
    }

    // Supprimer tous les éléments de décoration
    const decorations = document.querySelectorAll('.holiday-decoration');
    decorations.forEach(el => el.remove());

    // Supprimer explicitement les étoiles flottantes
    const floatingStars = document.querySelectorAll('.star-decoration, .holiday-decoration.star-decoration');
    floatingStars.forEach(el => el.remove());

    // Supprimer toutes les guirlandes et décorations de modales
    const garlands = document.querySelectorAll('.christmas-garland, .christmas-garland-section, .modal-holiday-decoration');
    garlands.forEach(el => el.remove());

    // Supprimer les flocons de neige de l'écran de chargement
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      const loadingSnowflakes = loadingScreen.querySelectorAll('.loading-snowflake');
      loadingSnowflakes.forEach(s => s.remove());
    }

    // Nettoyer aussi l'animation du sapin si elle existe
    if (window.removeChristmasTreeAnimation) {
      window.removeChristmasTreeAnimation();
    }
  }

  /**
   * Ajouter des décorations aux modales de produits selon le thème
   */
  function addDecorationsToModals() {
    if (!currentTheme) {
      return; // Pas de thème actif
    }
    // Essayer plusieurs sélecteurs pour trouver la modale
    const modalSelectors = [
      '#productModal',
      '.product-modal',
      '.pm-wrap',
      '[id*="productModal"]',
      '[class*="product-modal"]',
      '[class*="pm-wrap"]'
    ];
    
    let modals = [];
    modalSelectors.forEach(selector => {
      try {
        const found = document.querySelectorAll(selector);
        if (found.length > 0) {
          modals = Array.from(found);
        }
      } catch (e) {
        console.warn('Sélecteur invalide:', selector);
      }
    });
    
    // Si aucune modale trouvée, essayer de la trouver par structure
    if (modals.length === 0) {
      const allModals = document.querySelectorAll('[id*="Modal"], [class*="modal"]');
      allModals.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'absolute') {
          if (el.offsetWidth > 300 && el.offsetHeight > 200) {
            modals.push(el);
          }
        }
      });
    }
    
    if (modals.length === 0) {
      return; // Aucune modale trouvée
    }
    
    modals.forEach((modal) => {
      // Vérifier si une décoration existe déjà
      if (modal.querySelector('.modal-holiday-decoration')) {
        return;
      }

      // S'assurer que la modale a un positionnement relatif
      const computedStyle = window.getComputedStyle(modal);
      if (computedStyle.position === 'static' || !computedStyle.position) {
        modal.style.position = 'relative';
      }

      // Décorations selon le thème
      if (currentTheme === 'christmas') {
          // Guirlandes de Noël - À l'intérieur de la modale
          const garland = document.createElement('div');
          garland.className = 'christmas-garland modal-holiday-decoration';
          
          const numLights = 10;
          for (let i = 0; i < numLights; i++) {
            const light = document.createElement('div');
            light.className = 'garland-light';
            light.style.left = (i * (100 / (numLights - 1))) + '%';
            light.style.top = '6px';
            light.style.animationDelay = (i * 0.25) + 's';
            garland.appendChild(light);
          }
          
          for (let i = 0; i < numLights; i++) {
            const light = document.createElement('div');
            light.className = 'garland-light';
            light.style.left = (i * (100 / (numLights - 1))) + '%';
            light.style.top = 'auto';
            light.style.bottom = '6px';
            light.style.animationDelay = (i * 0.25 + 0.5) + 's';
            garland.appendChild(light);
          }
          
          garland.style.position = 'absolute';
          garland.style.top = '0';
          garland.style.left = '0';
          garland.style.right = '0';
          garland.style.bottom = '0';
          garland.style.zIndex = '999';
          garland.style.pointerEvents = 'none';
          garland.style.overflow = 'visible';
          
          modal.appendChild(garland);
        } else if (currentTheme === 'easter') {
          // Bordure d'œufs de Pâques - À l'intérieur de la modale
          const easterBorder = document.createElement('div');
          easterBorder.className = 'modal-holiday-decoration easter-modal-border';
          easterBorder.style.position = 'absolute';
          easterBorder.style.top = '10px';
          easterBorder.style.left = '10px';
          easterBorder.style.right = '10px';
          easterBorder.style.bottom = '10px';
          easterBorder.style.zIndex = '999';
          easterBorder.style.pointerEvents = 'none';
          easterBorder.style.border = '3px dashed #ffd700';
          easterBorder.style.borderRadius = '20px';
          easterBorder.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.2)';
          easterBorder.style.animation = 'easterBorderPulse 2s ease-in-out infinite';
          modal.appendChild(easterBorder);

          // Ajouter quelques œufs décoratifs à l'intérieur
          for (let i = 0; i < 4; i++) {
            const egg = document.createElement('div');
            egg.className = 'modal-holiday-decoration easter-egg-small';
            egg.style.position = 'absolute';
            egg.style.width = '20px';
            egg.style.height = '25px';
            egg.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
            egg.style.background = i % 2 === 0 ? 'linear-gradient(135deg, #ff6b9d, #c44569)' : 'linear-gradient(135deg, #ffd93d, #ffa500)';
            egg.style.top = (10 + i * 20) + '%';
            egg.style.left = i % 2 === 0 ? '10px' : 'auto';
            egg.style.right = i % 2 === 1 ? '10px' : 'auto';
            egg.style.zIndex = '1000';
            egg.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
            egg.style.animation = `easterEggFloat ${2 + i * 0.5}s ease-in-out infinite`;
            egg.style.animationDelay = (i * 0.3) + 's';
            egg.style.pointerEvents = 'none';
            modal.appendChild(egg);
          }
        } else if (currentTheme === 'newyear') {
          // Bordure de confettis - À l'intérieur de la modale
          const confettiBorder = document.createElement('div');
          confettiBorder.className = 'modal-holiday-decoration newyear-modal-border';
          confettiBorder.style.position = 'absolute';
          confettiBorder.style.top = '10px';
          confettiBorder.style.left = '10px';
          confettiBorder.style.right = '10px';
          confettiBorder.style.bottom = '10px';
          confettiBorder.style.zIndex = '999';
          confettiBorder.style.pointerEvents = 'none';
          confettiBorder.style.border = '3px solid transparent';
          confettiBorder.style.borderImage = 'linear-gradient(45deg, #ffd700, #ff6b6b, #4ecdc4, #ffe66d, #a8e6cf) 1';
          confettiBorder.style.borderRadius = '20px';
          confettiBorder.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6)';
          confettiBorder.style.animation = 'newyearBorderShine 3s linear infinite';
          modal.appendChild(confettiBorder);

          // Ajouter des confettis flottants à l'intérieur
          const confettiColors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'];
          for (let i = 0; i < 8; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'modal-holiday-decoration confetti-small';
            confetti.style.position = 'absolute';
            confetti.style.width = '8px';
            confetti.style.height = '8px';
            confetti.style.background = confettiColors[i % confettiColors.length];
            confetti.style.top = (10 + i * 10) + '%';
            confetti.style.left = i % 2 === 0 ? '10px' : 'auto';
            confetti.style.right = i % 2 === 1 ? '10px' : 'auto';
            confetti.style.zIndex = '1000';
            confetti.style.borderRadius = i % 2 === 0 ? '50%' : '0';
            confetti.style.transform = `rotate(${i * 45}deg)`;
            confetti.style.animation = `confettiFloat ${1.5 + i * 0.2}s ease-in-out infinite`;
            confetti.style.animationDelay = (i * 0.2) + 's';
            confetti.style.pointerEvents = 'none';
            modal.appendChild(confetti);
          }
        } else if (currentTheme === 'halloween') {
          // Bordure d'Halloween - À l'intérieur de la modale
          const halloweenBorder = document.createElement('div');
          halloweenBorder.className = 'modal-holiday-decoration halloween-modal-border';
          halloweenBorder.style.position = 'absolute';
          halloweenBorder.style.top = '10px';
          halloweenBorder.style.left = '10px';
          halloweenBorder.style.right = '10px';
          halloweenBorder.style.bottom = '10px';
          halloweenBorder.style.zIndex = '999';
          halloweenBorder.style.pointerEvents = 'none';
          halloweenBorder.style.border = '3px solid #ff8c00';
          halloweenBorder.style.borderRadius = '20px';
          halloweenBorder.style.boxShadow = '0 0 25px rgba(255, 140, 0, 0.7), inset 0 0 25px rgba(255, 140, 0, 0.3)';
          halloweenBorder.style.background = 'linear-gradient(135deg, rgba(139, 0, 0, 0.1), rgba(255, 140, 0, 0.1))';
          halloweenBorder.style.animation = 'halloweenBorderGlow 2s ease-in-out infinite';
          modal.appendChild(halloweenBorder);

          // Ajouter des chauves-souris décoratives à l'intérieur
          for (let i = 0; i < 4; i++) {
            const bat = document.createElement('div');
            bat.className = 'modal-holiday-decoration bat-small';
            bat.textContent = '🦇';
            bat.style.position = 'absolute';
            bat.style.fontSize = '20px';
            bat.style.top = (10 + i * 20) + '%';
            bat.style.left = i % 2 === 0 ? '10px' : 'auto';
            bat.style.right = i % 2 === 1 ? '10px' : 'auto';
            bat.style.zIndex = '1000';
            bat.style.animation = `batFly ${3 + i * 0.5}s ease-in-out infinite`;
            bat.style.animationDelay = (i * 0.4) + 's';
            bat.style.filter = 'drop-shadow(0 0 5px rgba(255, 140, 0, 0.8))';
            bat.style.pointerEvents = 'none';
            modal.appendChild(bat);
          }
        }
    });
  }
  
  // Exposer la fonction globalement pour qu'elle puisse être appelée depuis product-modal.js
  window.addDecorationsToModals = addDecorationsToModals;

  /**
   * Ajouter des flocons de neige sur l'écran de chargement si le thème Noël est actif
   */
  function addSnowflakesToLoadingScreen() {
    if (currentTheme !== 'christmas') {
      return; // Pas de thème Noël actif
    }

    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen || loadingScreen.classList.contains('hidden')) {
      return; // Pas d'écran de chargement visible
    }

    // Vérifier si des flocons existent déjà
    if (loadingScreen.querySelector('.loading-snowflake')) {
      return;
    }

    // Créer des flocons de neige pour l'écran de chargement
    function createLoadingSnowflake() {
      const snowflake = document.createElement('div');
      snowflake.className = 'holiday-decoration snowflake loading-snowflake';
      snowflake.textContent = '❄';
      
      // Position initiale fixe
      const leftPosition = Math.random() * 100;
      snowflake.style.position = 'absolute';
      snowflake.style.left = leftPosition + '%';
      snowflake.style.top = '-20px';
      
      // Taille fixe pour éviter les changements
      const sizeType = Math.floor(Math.random() * 3);
      if (sizeType === 0) {
        snowflake.style.fontSize = '1.5em';
        snowflake.style.animationDuration = '15s';
      } else if (sizeType === 1) {
        snowflake.style.fontSize = '1em';
        snowflake.style.animationDuration = '20s';
      } else {
        snowflake.style.fontSize = '1.8em';
        snowflake.style.animationDuration = '18s';
      }
      
      // Opacité fixe
      snowflake.style.opacity = sizeType === 1 ? '0.7' : (sizeType === 2 ? '0.9' : '1');
      
      // Animation delay
      snowflake.style.animationDelay = Math.random() * 2 + 's';
      
      // Styles fixes pour éviter les conflits
      snowflake.style.zIndex = '100000';
      snowflake.style.pointerEvents = 'none';
      snowflake.style.userSelect = 'none';
      snowflake.style.willChange = 'transform, opacity';
      
      loadingScreen.appendChild(snowflake);

      // Supprimer après l'animation complète (durée max + marge)
      const maxDuration = Math.max(15, 20, 18) * 1000; // 20 secondes en ms
      setTimeout(() => {
        if (snowflake.parentNode) {
          snowflake.style.opacity = '0';
          snowflake.style.transition = 'opacity 0.5s ease-out';
          setTimeout(() => {
            if (snowflake.parentNode) {
              snowflake.remove();
            }
          }, 500);
        }
      }, maxDuration + 2000);
    }

    // Créer des flocons toutes les 500ms
    const loadingSnowflakeInterval = setInterval(() => {
      if (currentTheme === 'christmas' && loadingScreen && !loadingScreen.classList.contains('hidden')) {
        createLoadingSnowflake();
      } else {
        clearInterval(loadingSnowflakeInterval);
      }
    }, 500);

    // Créer les premiers flocons
    for (let i = 0; i < 10; i++) {
      setTimeout(() => createLoadingSnowflake(), i * 200);
    }

    // Nettoyer quand l'écran de chargement disparaît
    const observer = new MutationObserver(() => {
      if (loadingScreen.classList.contains('hidden')) {
        clearInterval(loadingSnowflakeInterval);
        const snowflakes = loadingScreen.querySelectorAll('.loading-snowflake');
        snowflakes.forEach(s => s.remove());
      }
    });
    observer.observe(loadingScreen, { attributes: true, attributeFilter: ['class'] });
  }

  /**
   * Observer l'écran de chargement pour ajouter des flocons de neige
   */
  function observeLoadingScreen() {
    // Vérifier si l'écran de chargement existe
    function checkLoadingScreen() {
      const loadingScreen = document.getElementById('loadingScreen');
      if (loadingScreen) {
        // Observer les changements de l'écran de chargement
        const observer = new MutationObserver(() => {
          if (!loadingScreen.classList.contains('hidden') && currentTheme === 'christmas') {
            setTimeout(() => addSnowflakesToLoadingScreen(), 100);
          }
        });
        observer.observe(loadingScreen, { 
          attributes: true, 
          attributeFilter: ['class', 'style'],
          childList: true
        });

        // Vérifier immédiatement si l'écran est visible
        if (!loadingScreen.classList.contains('hidden') && currentTheme === 'christmas') {
          setTimeout(() => addSnowflakesToLoadingScreen(), 200);
        }
      } else {
        // Réessayer si l'écran n'existe pas encore
        setTimeout(checkLoadingScreen, 500);
      }
    }

    checkLoadingScreen();

    // Écouter les événements de mise à jour de l'écran de chargement
    window.addEventListener('adminDataUpdated', (e) => {
      if (e.detail.key === 'loadingscreen' && currentTheme === 'christmas') {
        setTimeout(() => addSnowflakesToLoadingScreen(), 300);
      }
    });
  }

  /**
   * Observer les modales pour ajouter des décorations
   */
  function observeModals() {
    const observer = new MutationObserver(() => {
      if (currentTheme && document.body.classList.contains(`holiday-${currentTheme}`)) {
        addDecorationsToModals();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Vérifier aussi quand une modale s'ouvre
    function checkModal() {
      const productModal = document.getElementById('productModal');
      if (productModal) {
        const modalObserver = new MutationObserver(() => {
          const isVisible = productModal.style.display !== 'none' && 
                           productModal.offsetParent !== null &&
                           !productModal.classList.contains('hidden') &&
                           window.getComputedStyle(productModal).display !== 'none';
          if (isVisible && currentTheme) {
            setTimeout(() => addDecorationsToModals(), 200);
          }
        });
        modalObserver.observe(productModal, { 
          attributes: true, 
          attributeFilter: ['style', 'class'],
          childList: true,
          subtree: true
        });
        
        // Vérifier immédiatement si la modale est déjà ouverte
        const isVisible = productModal.style.display !== 'none' && 
                         productModal.offsetParent !== null &&
                         !productModal.classList.contains('hidden') &&
                         window.getComputedStyle(productModal).display !== 'none';
        if (isVisible && currentTheme) {
          setTimeout(() => addDecorationsToModals(), 300);
        }
      } else {
        // Réessayer si la modale n'existe pas encore
        setTimeout(checkModal, 500);
      }
    }
    
    checkModal();
    
    // Intercepter l'ouverture de la modale via showProductModal
    if (window.showProductModal) {
      const originalShowModal = window.showProductModal;
      window.showProductModal = function(...args) {
        const result = originalShowModal.apply(this, args);
        if (currentTheme) {
          setTimeout(() => addDecorationsToModals(), 500);
        }
        return result;
      };
    }
  }

  /**
   * Crée les décorations de Noël
   */
  function createChristmasDecorations() {
    const activeDecorations = new Set();
    
    // Supprimer toutes les étoiles flottantes existantes au démarrage
    const existingStars = document.querySelectorAll('.star-decoration, .holiday-decoration.star-decoration');
    existingStars.forEach(el => el.remove());
    
    // Créer des flocons de neige
    function createSnowflake() {
      const snowflake = document.createElement('div');
      snowflake.className = 'holiday-decoration snowflake';
      snowflake.textContent = '❄';
      
      // Position initiale fixe
      const leftPosition = Math.random() * 100;
      snowflake.style.left = leftPosition + '%';
      snowflake.style.top = '-20px';
      
      // Taille fixe pour éviter les changements
      const sizeType = Math.floor(Math.random() * 3);
      if (sizeType === 0) {
        snowflake.style.fontSize = '1.5em';
        snowflake.style.animationDuration = '15s';
      } else if (sizeType === 1) {
        snowflake.style.fontSize = '1em';
        snowflake.style.animationDuration = '20s';
      } else {
        snowflake.style.fontSize = '1.8em';
        snowflake.style.animationDuration = '18s';
      }
      
      // Opacité fixe
      snowflake.style.opacity = sizeType === 1 ? '0.7' : (sizeType === 2 ? '0.9' : '1');
      
      // Animation delay
      snowflake.style.animationDelay = Math.random() * 2 + 's';
      
      // Styles fixes pour éviter les conflits
      snowflake.style.position = 'fixed';
      snowflake.style.zIndex = '9999';
      snowflake.style.pointerEvents = 'none';
      snowflake.style.userSelect = 'none';
      snowflake.style.willChange = 'transform, opacity';
      
      document.body.appendChild(snowflake);

      // Supprimer après l'animation complète (durée max + marge)
      const maxDuration = Math.max(15, 20, 18) * 1000; // 20 secondes en ms
      setTimeout(() => {
        if (snowflake.parentNode) {
          snowflake.style.opacity = '0';
          snowflake.style.transition = 'opacity 0.5s ease-out';
          setTimeout(() => {
            if (snowflake.parentNode) {
              snowflake.remove();
            }
          }, 500);
        }
      }, maxDuration + 2000);
    }

    // Créer une étoile (réduite) - DÉSACTIVÉ
    // Les étoiles flottantes ont été désactivées selon la demande
    function createStar() {
      // Fonction désactivée - ne crée plus d'étoiles flottantes
      return;
    }

    // Créer une boule de Noël (réduite) - DÉSACTIVÉ
    // Les bulles de couleurs flottantes ont été désactivées selon la demande
    function createOrnament() {
      // Fonction désactivée - ne crée plus de bulles flottantes
      return;
    }

    // Créer des guirlandes autour des cartes produits
    function addGarlandsToProductCards() {
      // Attendre que les produits soient chargés
      setTimeout(() => {
        const productCards = document.querySelectorAll('.product-card, [data-product-id], .products-grid > *');
        
        productCards.forEach((card, index) => {
          // Vérifier si la guirlande existe déjà
          if (card.querySelector('.christmas-garland')) {
            return;
          }

          const garland = document.createElement('div');
          garland.className = 'christmas-garland';
          
          // Créer les lampes de la guirlande (positionnées sur la corde)
          const numLights = 8;
          for (let i = 0; i < numLights; i++) {
            const light = document.createElement('div');
            light.className = 'garland-light';
            // Positionner les lampes sur la corde (en haut)
            light.style.left = (i * (100 / (numLights - 1))) + '%';
            light.style.top = '-6px';
            light.style.animationDelay = (i * 0.25) + 's';
            garland.appendChild(light);
          }
          
          // Ajouter aussi des lampes en bas
          for (let i = 0; i < numLights; i++) {
            const light = document.createElement('div');
            light.className = 'garland-light';
            light.style.left = (i * (100 / (numLights - 1))) + '%';
            light.style.top = 'auto';
            light.style.bottom = '-6px';
            light.style.animationDelay = (i * 0.25 + 0.5) + 's';
            garland.appendChild(light);
          }
          
          card.style.position = 'relative';
          card.appendChild(garland);
        });
      }, 1000);
    }

    // Ajouter des guirlandes sur les cartes de service (mais pas sur les sections principales)
    function addGarlandsToServiceCards() {
      setTimeout(() => {
        // Guirlandes sur les cartes de service uniquement
        const serviceCards = document.querySelectorAll('.service-card, .home-services > *, .promo-card');
        serviceCards.forEach((card) => {
          if (card.querySelector('.christmas-garland')) {
            return;
          }

          const garland = document.createElement('div');
          garland.className = 'christmas-garland';
          
          const numLights = 6;
          for (let i = 0; i < numLights; i++) {
            const light = document.createElement('div');
            light.className = 'garland-light';
            light.style.left = (i * (100 / (numLights - 1))) + '%';
            light.style.top = '-6px';
            light.style.animationDelay = (i * 0.25) + 's';
            garland.appendChild(light);
          }
          
          // Ajouter aussi des lampes en bas
          for (let i = 0; i < numLights; i++) {
            const light = document.createElement('div');
            light.className = 'garland-light';
            light.style.left = (i * (100 / (numLights - 1))) + '%';
            light.style.top = 'auto';
            light.style.bottom = '-6px';
            light.style.animationDelay = (i * 0.25 + 0.5) + 's';
            garland.appendChild(light);
          }
          
          // S'assurer que la carte a un positionnement relatif
          const computedStyle = window.getComputedStyle(card);
          if (computedStyle.position === 'static') {
            card.style.position = 'relative';
          }
          
          // S'assurer que la guirlande est bien positionnée
          garland.style.position = 'absolute';
          garland.style.top = '-10px';
          garland.style.left = '-10px';
          garland.style.right = '-10px';
          garland.style.bottom = '-10px';
          garland.style.zIndex = '1';
          
          card.appendChild(garland);
        });
      }, 1500);
    }

    // Observer les changements dans la grille de produits
    function observeProductGrid() {
      const productsGrid = document.getElementById('productsGrid');
      if (productsGrid) {
        const observer = new MutationObserver(() => {
          if (currentTheme === 'christmas' && document.body.classList.contains('holiday-christmas')) {
            addGarlandsToProductCards();
          }
        });
        observer.observe(productsGrid, { childList: true, subtree: true });
      }
    }

    // Créer un flocon toutes les 500ms
    decorationsInterval = setInterval(() => {
      if (currentTheme === 'christmas' && document.body.classList.contains('holiday-christmas')) {
        createSnowflake();
      }
    }, 500);

    // Créer une étoile toutes les 3 secondes (réduit) - DÉSACTIVÉ
    // Les étoiles flottantes ont été désactivées
    starInterval = null; // Pas d'intervalle pour les étoiles flottantes

    // Créer une boule toutes les 4 secondes (réduit) - DÉSACTIVÉ
    // Les bulles de couleurs flottantes ont été désactivées
    ornamentInterval = null; // Pas d'intervalle pour les boules

    // Créer les premiers flocons
    for (let i = 0; i < 10; i++) {
      setTimeout(() => createSnowflake(), i * 200);
    }

    // Les étoiles flottantes initiales ont été désactivées
    // Les boules initiales ont été désactivées

    // Ajouter des guirlandes en haut des sections principales et sur la navigation
    function addGarlandsToSections() {
      setTimeout(() => {
        // Guirlandes en haut des sections principales uniquement
        const sections = document.querySelectorAll('#accueil, #boutique, #avis, #contact');
        sections.forEach((section) => {
          if (section.querySelector('.christmas-garland-section')) {
            return;
          }

          const garland = document.createElement('div');
          garland.className = 'christmas-garland-section';
          
          // Créer les lampes de la guirlande (positionnées sur la corde)
          const numLights = 12;
          for (let i = 0; i < numLights; i++) {
            const light = document.createElement('div');
            light.className = 'garland-light';
            light.style.left = (i * (100 / (numLights - 1))) + '%';
            light.style.top = '1px';
            light.style.animationDelay = (i * 0.2) + 's';
            garland.appendChild(light);
          }
          
          if (!section.style.position || section.style.position === 'static') {
            section.style.position = 'relative';
          }
          section.appendChild(garland);
        });

        // Guirlande sur la navigation en bas
        const nav = document.querySelector('.bottom-nav');
        if (nav && !nav.querySelector('.christmas-garland-section')) {
          const garland = document.createElement('div');
          garland.className = 'christmas-garland-section';
          
          const numLights = 10;
          for (let i = 0; i < numLights; i++) {
            const light = document.createElement('div');
            light.className = 'garland-light';
            light.style.left = (i * (100 / (numLights - 1))) + '%';
            light.style.top = '1px';
            light.style.animationDelay = (i * 0.2) + 's';
            garland.appendChild(light);
          }
          
          if (!nav.style.position || nav.style.position === 'static') {
            nav.style.position = 'relative';
          }
          nav.appendChild(garland);
        }
      }, 1500);
    }

    // Observer les changements dans le DOM pour ajouter des guirlandes aux sections
    function observeDOMForSections() {
      const observer = new MutationObserver(() => {
        if (currentTheme === 'christmas' && document.body.classList.contains('holiday-christmas')) {
          addGarlandsToSections();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }


    // Ajouter les guirlandes
    addGarlandsToProductCards();
    addGarlandsToServiceCards();
    addGarlandsToSections();
    addDecorationsToModals();
    observeProductGrid();
    observeDOMForSections();
    observeModals();
    
    // Ajouter des flocons de neige sur l'écran de chargement
    observeLoadingScreen();

  }

  /**
   * Crée les décorations de Pâques
   */
  function createEasterDecorations() {
    // Créer des œufs de Pâques
    function createEasterEgg() {
      const egg = document.createElement('div');
      egg.className = 'holiday-decoration easter-egg';
      egg.style.left = Math.random() * 100 + '%';
      egg.style.top = Math.random() * 100 + '%';
      egg.style.animationDuration = (Math.random() * 2 + 3) + 's';
      egg.style.animationDelay = Math.random() * 2 + 's';
      document.body.appendChild(egg);

      // Supprimer après un délai
      setTimeout(() => {
        if (egg.parentNode) {
          egg.remove();
        }
      }, 15000);
    }

    // Créer un œuf toutes les 2 secondes
    decorationsInterval = setInterval(() => {
      if (currentTheme === 'easter' && document.body.classList.contains('holiday-easter')) {
        createEasterEgg();
      }
    }, 2000);

    // Créer les premiers œufs
    for (let i = 0; i < 5; i++) {
      setTimeout(() => createEasterEgg(), i * 500);
    }

    // Ajouter les décorations aux modales
    addDecorationsToModals();
    observeModals();
  }

  /**
   * Crée les décorations du Nouvel An
   */
  function createNewYearDecorations() {
    // Créer des confettis
    function createConfetti() {
      const confetti = document.createElement('div');
      confetti.className = 'holiday-decoration confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      confetti.style.animationDelay = Math.random() * 1 + 's';
      
      // Couleurs variées
      const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'];
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      
      document.body.appendChild(confetti);

      // Supprimer après l'animation
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.remove();
        }
      }, 8000);
    }

    // Créer des confettis toutes les 300ms
    decorationsInterval = setInterval(() => {
      if (currentTheme === 'newyear' && document.body.classList.contains('holiday-newyear')) {
        createConfetti();
      }
    }, 300);

    // Créer les premiers confettis
    for (let i = 0; i < 20; i++) {
      setTimeout(() => createConfetti(), i * 150);
    }

    // Ajouter les décorations aux modales
    addDecorationsToModals();
    observeModals();
  }

  /**
   * Crée les décorations d'Halloween
   */
  function createHalloweenDecorations() {
    // Créer des chauves-souris
    function createBat() {
      const bat = document.createElement('div');
      bat.className = 'holiday-decoration bat';
      bat.textContent = '🦇';
      bat.style.left = '-50px';
      bat.style.top = Math.random() * 50 + '%';
      bat.style.animationDuration = (Math.random() * 3 + 5) + 's';
      bat.style.animationDelay = Math.random() * 2 + 's';
      document.body.appendChild(bat);

      // Supprimer après l'animation
      setTimeout(() => {
        if (bat.parentNode) {
          bat.remove();
        }
      }, 15000);
    }

    // Créer une chauve-souris toutes les 3 secondes
    decorationsInterval = setInterval(() => {
      if (currentTheme === 'halloween' && document.body.classList.contains('holiday-halloween')) {
        createBat();
      }
    }, 3000);

    // Créer les premières chauves-souris
    for (let i = 0; i < 3; i++) {
      setTimeout(() => createBat(), i * 1000);
    }

    // Ajouter les décorations aux modales
    addDecorationsToModals();
    observeModals();
  }

  // Initialiser quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHolidayThemes);
  } else {
    initHolidayThemes();
  }

  // Exposer la fonction pour réinitialiser le thème si nécessaire
  window.reloadHolidayTheme = function() {
    loadHolidayTheme();
  };

})();

