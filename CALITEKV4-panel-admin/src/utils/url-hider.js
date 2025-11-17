/**
 * Masque les URLs dans le code source
 * Reconstruit les URLs dynamiquement pour éviter qu'elles soient visibles avec F12
 */

// Table de mapping obfusquée (les clés sont non évidentes)
const _m = {
  _a: '/',
  _b: 'api',
  _c: 'auth',
  _d: 'login',
  _e: 'refresh',
  _f: 'bot',
  _g: 'detection',
  _h: 'products',
  _i: 'categories',
  _j: 'socials',
  _k: 'settings',
  _l: 'reviews',
  _m: 'farms',
  _n: 'promos',
  _o: 'events',
}

// Fonction de reconstruction (nom non évident)
const _r = (...keys) => {
  return keys.map(k => _m[k] || k).join('')
}

// Fonction pour obtenir l'URL de base
export const getBase = () => {
  const env = import.meta.env.VITE_API_URL
  if (env) return env
  return _r('_a', '_b')
}

// Endpoints obfusqués
export const endpoints = {
  login: () => getBase() + _r('_a', '_c', '_a', '_d'),
  refresh: () => getBase() + _r('_a', '_c', '_a', '_e'),
  botDetection: () => getBase() + _r('_a', '_f', '-', '_g'),
  products: () => getBase() + _r('_a', '_h'),
  categories: () => getBase() + _r('_a', '_i'),
  socials: () => getBase() + _r('_a', '_j'),
  settings: () => getBase() + _r('_a', '_k'),
  reviews: () => getBase() + _r('_a', '_l'),
  farms: () => getBase() + _r('_a', '_m'),
  promos: () => getBase() + _r('_a', '_n'),
  events: () => getBase() + _r('_a', '_o'),
}

// Fonction générique pour construire des URLs
export const buildUrl = (path) => {
  if (path.startsWith('http')) return path
  const base = getBase()
  const cleanPath = path.startsWith('/') ? path : '/' + path
  return base + cleanPath
}

// Fonction pour masquer une URL dans une string
export const hideUrl = (url) => {
  // Reconstruire l'URL depuis des parties
  const parts = url.split('/').filter(Boolean)
  return '/' + parts.join('/')
}
