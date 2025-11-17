/**
 * Détection avancée des bots et outils d'automatisation
 * Protège contre Selenium, Puppeteer, Playwright, etc.
 */

/**
 * Détecte si le navigateur est contrôlé par un outil d'automatisation
 */
export function detectAutomation() {
  if (typeof window === 'undefined') return false

  const checks = {
    // Propriété webdriver (Selenium, Puppeteer, etc.)
    webdriver: navigator.webdriver === true,
    
    // Propriétés Chrome DevTools Protocol
    chrome: window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect,
    
    // Propriétés Puppeteer
    puppeteer: window.navigator.webdriver || window.__puppeteer_evaluation__ || window.__PUPPETEER__,
    
    // Propriétés Selenium
    selenium: window.document.$cdc_asdjflasutopfhvcZLmcfl_ || window.document.$chrome_asyncScriptInfo,
    
    // Propriétés Playwright
    playwright: window.__playwright || window.__pw_manual || window.__pw_original,
    
    // Propriétés PhantomJS
    phantom: window.callPhantom || window._phantom,
    
    // Propriétés Nightmare
    nightmare: window.__nightmare,
    
    // Headless Chrome détection
    headless: navigator.webdriver && !window.chrome,
    
    // Propriétés manquantes dans les vrais navigateurs
    missingPlugins: navigator.plugins.length === 0,
    missingLanguages: navigator.languages.length === 0,
    
    // User-Agent suspect
    suspiciousUA: /HeadlessChrome|PhantomJS|Selenium|WebDriver|Puppeteer|Playwright/i.test(navigator.userAgent),
    
    // Permissions API suspectes
    permissionsAPI: navigator.permissions && navigator.permissions.query && typeof navigator.permissions.query.toString === 'function' && navigator.permissions.query.toString().includes('native code'),
    
    // Canvas fingerprinting détection
    canvasFingerprint: (() => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('Bot detection', 2, 2)
        const fingerprint = canvas.toDataURL()
        // Les bots ont souvent des fingerprints identiques ou suspects
        return fingerprint.length < 100 || fingerprint.includes('data:image/png;base64,')
      } catch (e) {
        return false
      }
    })(),
    
    // WebGL détection
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (!gl) return false
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          return renderer.includes('SwiftShader') || renderer.includes('Google SwiftShader')
        }
        return false
      } catch (e) {
        return false
      }
    })(),
    
    // Propriétés window suspectes
    windowProperties: window.outerHeight === 0 || window.outerWidth === 0,
    
    // Screen properties suspectes
    screenProperties: screen.width === 0 || screen.height === 0 || screen.availWidth === 0,
    
    // Timezone suspecte (souvent UTC pour les bots)
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone === 'UTC' && navigator.language === 'en-US',
    
    // Battery API (souvent absente dans les bots)
    batteryAPI: !navigator.getBattery || typeof navigator.getBattery !== 'function',
    
    // Connection API (souvent absente dans les bots)
    connectionAPI: !navigator.connection && !navigator.mozConnection && !navigator.webkitConnection,
    
    // DeviceMemory (souvent absente dans les bots)
    deviceMemory: !navigator.deviceMemory || navigator.deviceMemory === 0,
    
    // HardwareConcurrency suspect (souvent 1 ou 2 pour les bots)
    hardwareConcurrency: navigator.hardwareConcurrency < 2,
    
    // Platform suspecte
    platform: navigator.platform === '' || navigator.platform === 'Win32',
    
    // Vendor suspect
    vendor: navigator.vendor === '' || !navigator.vendor,
    
    // AppVersion suspect
    appVersion: navigator.appVersion === '' || !navigator.appVersion.includes('Chrome') && !navigator.appVersion.includes('Firefox') && !navigator.appVersion.includes('Safari'),
  }

  // Compter les détections
  const detections = Object.values(checks).filter(Boolean).length
  
  // Si plus de 3 détections, c'est probablement un bot
  return detections >= 3
}

/**
 * Détecte les propriétés spécifiques des outils d'automatisation
 */
export function detectSpecificTools() {
  if (typeof window === 'undefined') return []

  const tools = []
  
  // Selenium
  if (window.document.$cdc_asdjflasutopfhvcZLmcfl_ || window.document.$chrome_asyncScriptInfo || navigator.webdriver) {
    tools.push('Selenium')
  }
  
  // Puppeteer
  if (window.__puppeteer_evaluation__ || window.__PUPPETEER__ || (navigator.webdriver && window.chrome && window.chrome.runtime)) {
    tools.push('Puppeteer')
  }
  
  // Playwright
  if (window.__playwright || window.__pw_manual || window.__pw_original) {
    tools.push('Playwright')
  }
  
  // PhantomJS
  if (window.callPhantom || window._phantom) {
    tools.push('PhantomJS')
  }
  
  // Nightmare
  if (window.__nightmare) {
    tools.push('Nightmare')
  }
  
  // Headless Chrome
  if (navigator.webdriver && !window.chrome && navigator.userAgent.includes('HeadlessChrome')) {
    tools.push('Headless Chrome')
  }
  
  return tools
}

/**
 * Génère un fingerprint du navigateur pour vérification
 */
export function generateBrowserFingerprint() {
  if (typeof window === 'undefined') return null

  const fingerprint = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory || 'unknown',
    maxTouchPoints: navigator.maxTouchPoints || 0,
    screen: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth
    },
    window: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    plugins: Array.from(navigator.plugins).map(p => p.name).join(','),
    webdriver: navigator.webdriver || false,
    timestamp: Date.now()
  }

  return fingerprint
}

/**
 * Vérifie si c'est un vrai navigateur humain
 */
export function isHumanBrowser() {
  if (typeof window === 'undefined') return false

  // EXCEPTION : Autoriser Telegram Web App (mini app)
  const isTelegramWebApp = window.Telegram?.WebApp !== undefined
  const isTelegramUserAgent = /telegram/i.test(navigator.userAgent || '')
  
  if (isTelegramWebApp || isTelegramUserAgent) {
    // Telegram Web App est autorisé même si détecté comme bot
    return true
  }

  // Vérifications de base
  if (detectAutomation()) {
    return false
  }

  // Vérifier les outils spécifiques
  const tools = detectSpecificTools()
  if (tools.length > 0) {
    return false
  }

  // Vérifications supplémentaires
  if (navigator.webdriver) {
    return false
  }

  if (window.outerHeight === 0 || window.outerWidth === 0) {
    return false
  }

  if (screen.width === 0 || screen.height === 0) {
    return false
  }

  // Vérifier que les plugins sont présents (les bots n'ont souvent pas de plugins)
  if (navigator.plugins.length === 0 && navigator.userAgent.includes('Chrome')) {
    return false
  }

  return true
}

/**
 * Envoie les données de détection au serveur
 */
export async function sendBotDetectionData() {
  const isBot = !isHumanBrowser()
  const tools = detectSpecificTools()
  const fingerprint = generateBrowserFingerprint()
  const automationDetected = detectAutomation()

  return {
    isBot,
    tools,
    fingerprint,
    automationDetected,
    timestamp: Date.now()
  }
}
