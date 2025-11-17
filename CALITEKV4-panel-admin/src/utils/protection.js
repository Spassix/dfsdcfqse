/**
 * Protection contre le vol de contenu
 * Désactive le clic droit, la copie, la sélection, etc.
 * Bloque l'accès aux outils de développement
 */

export const enableProtection = () => {

  // ❌ Protection désactivée uniquement si la variable est active
  if (import.meta.env.VITE_DISABLE_PROTECTION === 'true') {
    console.warn("🛑 Protection désactivée (branche admin-panel)");
    return;
  }

  // Désactiver le clic droit
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    return false
  }, false)

  // Désactiver la sélection de texte
  document.addEventListener('selectstart', (e) => {
    e.preventDefault()
    return false
  }, false)

  // Désactiver le glisser-déposer
  document.addEventListener('dragstart', (e) => {
    e.preventDefault()
    return false
  }, false)

  // Désactiver les raccourcis clavier (Ctrl+C, Ctrl+A, Ctrl+S, F12, etc.)
  const handleKeyDown = (e) => {
    if (e.ctrlKey && (e.key === 'c' || e.key === 'a' || e.key === 's' || e.key === 'p' || e.key === 'u')) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    if (e.ctrlKey && e.shiftKey && ['I','J','C','i','j','c'].includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    if (e.ctrlKey && e.shiftKey && ['K','k'].includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    if (e.ctrlKey && ['U','u'].includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }

  document.addEventListener('keydown', handleKeyDown, true)
  window.addEventListener('keydown', handleKeyDown, true)

  document.addEventListener('keypress', (e) => {
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }, true)

  document.addEventListener('keyup', (e) => {
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }, true)

  document.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
      e.preventDefault()
      return false
    }
  }, false)

  document.addEventListener('copy', (e) => {
    e.clipboardData.setData('text/plain', '')
    e.preventDefault()
    return false
  }, false)

  document.addEventListener('cut', (e) => {
    e.clipboardData.setData('text/plain', '')
    e.preventDefault()
    return false
  }, false)

  let devtoolsDetected = false
  const threshold = 160

  const detectDevTools = () => {
    const widthDiff = window.outerWidth - window.innerWidth
    const heightDiff = window.outerHeight - window.innerHeight

    if (widthDiff > threshold || heightDiff > threshold) {
      if (!devtoolsDetected) {
        devtoolsDetected = true
        document.body.innerHTML =
          '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-size:24px;font-family:Arial;text-align:center;padding:20px;"><div style="font-size:48px;margin-bottom:20px;">⚠️</div><div>Accès non autorisé aux outils de développement</div></div>'

        document.body.style.pointerEvents = 'none'
        document.body.style.userSelect = 'none'
      }
    } else {
      devtoolsDetected = false
    }
  }

  setInterval(detectDevTools, 200)

  let devtoolsOpen = false
  const element = new Image()
  Object.defineProperty(element, 'id', {
    get: function () {
      devtoolsOpen = true
      detectDevTools()
    }
  })

  setInterval(() => {
    if (!devtoolsDetected) {
      devtoolsOpen = false
      try {
        console.log('%c', element)
        console.clear()
        if (devtoolsOpen) detectDevTools()
      } catch (e) {}
    }
  }, 1000)

  setInterval(() => {
    if (!devtoolsDetected) {
      try {
        const start = performance.now()
        debugger
        const end = performance.now()
        if (end - start > 100) detectDevTools()
      } catch (e) {}
    }
  }, 2000)

  const images = document.querySelectorAll('img')
  images.forEach(img => {
    img.addEventListener('dragstart', (e) => {
      e.preventDefault()
      return false
    })
    img.style.userSelect = 'none'
    img.style.webkitUserSelect = 'none'
  })

  const videos = document.querySelectorAll('video')
  videos.forEach(video => {
    video.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      return false
    })
    video.setAttribute('controlsList', 'nodownload')
    video.style.userSelect = 'none'
    video.style.webkitUserSelect = 'none'
  })

  const style = document.createElement('style')
  style.setAttribute('data-protection', 'true')
  style.textContent = `
    * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    
    input, textarea, [contenteditable] {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
  `
  document.head.appendChild(style)

  window.addEventListener('resize', () => {
    setTimeout(detectDevTools, 100)
  })

  window.addEventListener('blur', () => {
    setTimeout(detectDevTools, 100)
  })

  const noop = () => {}
  const methods = ['log','debug','info','warn','error','assert','dir','dirxml','group','groupEnd','time','timeEnd','count','trace','profile','profileEnd']

  methods.forEach(method => {
    try {
      if (window.console && window.console[method]) {
        window.console[method] = noop
      }
    } catch (e) {}
  })

  try {
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      get: () => undefined,
      set: () => undefined
    })
  } catch (e) {}
}

export const disableProtection = () => {
  const style = document.querySelector('style[data-protection]')
  if (style) style.remove()
}
