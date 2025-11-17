// Blacklist des produits à ne pas afficher sur la boutique
const BLACKLIST_PRODUCTS = [
  '🟢COCAINE PURE « 21 » +95%❄️',
  'MOUSSEUX 🧽',
  '🌋 Lemon Cherry Gelato 🍒🍋‍🟩',
  'CALI PLATE 🇺🇸'
]

/**
 * Vérifie si un produit est blacklisté
 */
export function isBlacklisted(product) {
  if (!product || !product.name) return false
  
  const productName = product.name.trim()
  
  return BLACKLIST_PRODUCTS.some(blacklistedName => 
    productName === blacklistedName.trim() ||
    productName.includes(blacklistedName.trim())
  )
}

/**
 * Filtre les produits pour enlever les blacklistés
 */
export function filterBlacklisted(products) {
  if (!Array.isArray(products)) return []
  
  const filtered = products.filter(p => !isBlacklisted(p))
  
  const hiddenCount = products.length - filtered.length
  if (hiddenCount > 0) {
    console.log(`🚫 ${hiddenCount} produits blacklistés cachés de la boutique`)
  }
  
  return filtered
}
