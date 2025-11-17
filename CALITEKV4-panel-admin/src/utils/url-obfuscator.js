/**
 * Obfuscateur d'URLs pour masquer les endpoints dans le code source
 * Utilise plusieurs techniques pour rendre les URLs invisibles
 */

// Table de mapping obfusquée (stockée de manière non évidente)
const URL_MAP = {
  // Utiliser des noms non évidents
  _a: '/api',
  _b: '/auth',
  _c: '/login',
  _d: '/refresh',
  _e: '/bot-detection',
  _f: '/products',
  _g: '/categories',
}

// Fonction de reconstruction d'URL (non évidente)
const build = (...parts) => {
  return parts.map(p => URL_MAP[p] || p).join('')
}

// Fonctions exportées avec des noms non évidents
export const getBase = () => {
  const env = import.meta.env.VITE_API_URL
  return env || build('_a')
}

export const getLogin = () => build('_a', '_b', '_c')
export const getRefresh = () => build('_a', '_b', '_d')
export const getBotDetection = () => build('_a', '_e')
export const getProducts = () => build('_a', '_f')
export const getCategories = () => build('_a', '_g')

// Fonction générique pour construire des endpoints
export const endpoint = (name) => {
  const map = {
    login: getLogin,
    refresh: getRefresh,
    bot: getBotDetection,
    products: getProducts,
    categories: getCategories,
  }
  
  const fn = map[name]
  return fn ? fn() : `${getBase()}/${name}`
}

// Masquer les URLs dans les strings en les reconstruisant dynamiquement
export const hideURL = (url) => {
  // Si c'est déjà une URL complète, la retourner
  if (url.startsWith('http')) return url
  
  // Sinon, reconstruire depuis les parties
  const parts = url.split('/').filter(Boolean)
  return '/' + parts.join('/')
}
