/**
 * Utilitaire pour Upstash Redis
 * Utilise @upstash/redis pour interagir avec Redis
 */

import { Redis } from '@upstash/redis'
// Importer bcryptjs de la même manière que dans les autres fichiers API
import bcrypt from 'bcryptjs'

// Initialiser Redis avec les variables d'environnement (avec gestion d'erreur)
let redisInstance = null
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } else {
    redisInstance = Redis.fromEnv()
  }
} catch (error) {
  console.error('Erreur initialisation Redis dans db.js:', error?.message || error)
  // Redis sera null si l'initialisation échoue
}

export const redis = redisInstance

// Helper pour parser JSON en toute sécurité
function safeJSONParse(str, defaultValue = []) {
  if (!str) return defaultValue
  // Si c'est déjà un objet/tableau, le retourner tel quel
  if (typeof str !== 'string') {
    if (Array.isArray(str)) return str
    if (typeof str === 'object') return str
    return defaultValue
  }
  try {
    const parsed = JSON.parse(str)
    return parsed
  } catch (e) {
    // Si le parsing échoue, essayer de voir si c'est déjà un objet
    if (typeof str === 'object') return str
    console.warn('JSON parse error (non bloquant):', typeof str, str?.substring?.(0, 100))
    return defaultValue
  }
}

// Helper pour sérialiser en JSON
function safeJSONStringify(obj) {
  try {
    return JSON.stringify(obj)
  } catch (e) {
    console.error('JSON stringify error:', obj)
    return '[]'
  }
}

// ============ PRODUCTS ============
export const products = {
  async getAll() {
    // Vérifier d'abord data:products.json (utilisé par le frontend admin)
    const legacyData = await redis.get('data:products.json')
    let legacyProducts = []
    
    if (legacyData) {
      try {
        const parsed = typeof legacyData === 'string' ? JSON.parse(legacyData) : legacyData
        if (Array.isArray(parsed)) {
          legacyProducts = parsed
        }
      } catch (e) {
        console.warn('Error parsing legacy products data:', e)
      }
    }
    
    // Récupérer aussi les produits stockés individuellement (product:*)
    const keys = await redis.keys('product:*')
    let individualProducts = []
    
    if (keys && keys.length > 0) {
      const productsData = await redis.mget(...keys)
      individualProducts = productsData
        .filter(p => p !== null)
      .map(p => {
        const product = typeof p === 'string' ? JSON.parse(p) : p
        // S'assurer que medias est toujours un tableau
        let medias = safeJSONParse(product.medias, [])
        // Si medias est vide mais qu'on a photo/video, les ajouter
        if (medias.length === 0) {
          if (product.photo && product.photo.trim()) medias.push(product.photo)
          if (product.video && product.video.trim()) medias.push(product.video)
        }
        // Parser variants et quantities de manière sécurisée
        let variants = []
        if (product.variants) {
          variants = Array.isArray(product.variants) ? product.variants : safeJSONParse(product.variants, [])
        } else if (product.quantities) {
          variants = Array.isArray(product.quantities) ? product.quantities : safeJSONParse(product.quantities, [])
        }
        
        return {
          ...product,
          variants: variants,
          quantities: variants, // Garder pour compatibilité
          medias: medias
        }
      })
    }
    
    // Fusionner les deux sources, en évitant les doublons (par ID)
    const allProductsMap = new Map()
    
    // Ajouter d'abord les produits legacy
    legacyProducts.forEach(p => {
      if (p && p.id) {
        allProductsMap.set(String(p.id), p)
      }
    })
    
    // Ajouter les produits individuels (écrasent les legacy en cas de doublon)
    individualProducts.forEach(p => {
      if (p && p.id) {
        allProductsMap.set(String(p.id), p)
      }
    })
    
    // Convertir en tableau et trier, en s'assurant que les produits ont le bon format
    return Array.from(allProductsMap.values())
      .map(p => {
        // Parser variants de manière sécurisée
        let variants = []
        if (p.variants) {
          variants = Array.isArray(p.variants) ? p.variants : safeJSONParse(p.variants, [])
        } else if (p.quantities) {
          variants = Array.isArray(p.quantities) ? p.quantities : safeJSONParse(p.quantities, [])
        }
        
        // S'assurer que quantities existe (pour compatibilité frontend)
        if (variants.length === 0 && p.price) {
          variants = [{
            grammage: 1,
            unit: p.unit || 'g',
            price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0
          }]
        }
        
        return {
          ...p,
          variants: variants,
          quantities: variants // Toujours synchroniser quantities avec variants
        }
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  },

  async getById(id) {
    // Nettoyer l'ID si il contient déjà le préfixe "product:"
    let cleanId = String(id || '')
    if (cleanId.startsWith('product:')) {
      cleanId = cleanId.replace(/^product:/, '')
    }
    
    // Vérifier d'abord dans product:* (stockage individuel)
    let product = await redis.get(`product:${cleanId}`)
    
    // Si pas trouvé, chercher dans data:products.json (legacy)
    if (!product) {
      const legacyData = await redis.get('data:products.json')
      if (legacyData) {
        try {
          const parsed = typeof legacyData === 'string' ? JSON.parse(legacyData) : legacyData
          if (Array.isArray(parsed)) {
            const found = parsed.find(p => p && String(p.id) === String(cleanId))
            if (found) {
              product = found
            }
          }
        } catch (e) {
          console.warn('Error parsing legacy products data:', e)
        }
      }
    }
    
    if (!product) return null
    
    const p = typeof product === 'string' ? JSON.parse(product) : product
    // S'assurer que medias est toujours un tableau
    let medias = safeJSONParse(p.medias, [])
    // Si medias est vide mais qu'on a photo/video, les ajouter
    if (medias.length === 0) {
      if (p.photo && p.photo.trim()) medias.push(p.photo)
      if (p.video && p.video.trim()) medias.push(p.video)
    }
    
    // Parser variants et quantities de manière sécurisée
    let variants = []
    if (p.variants) {
      variants = Array.isArray(p.variants) ? p.variants : safeJSONParse(p.variants, [])
    } else if (p.quantities) {
      variants = Array.isArray(p.quantities) ? p.quantities : safeJSONParse(p.quantities, [])
    }
    
    return {
      ...p,
      variants: variants,
      quantities: variants, // Garder pour compatibilité
      medias: medias
    }
  },

  async create(data) {
    // Générer un ID sécurisé si non fourni
    let id = data.id ? String(data.id).replace(/[^a-zA-Z0-9_-]/g, '_') : `product_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    // Nettoyer l'ID si il contient déjà le préfixe "product:"
    if (id.startsWith('product:')) {
      id = id.replace(/^product:/, '')
    }
    
    // Nettoyer et valider les données
    const name = String(data.name || '').trim()
    const description = String(data.description || '').trim()
    const category = String(data.category || '').trim()
    const farm = String(data.farm || '').trim()
    const photo = data.photo ? String(data.photo).trim() : ''
    const video = data.video ? String(data.video).trim() : ''
    const medias = Array.isArray(data.medias) ? data.medias : []
    const price = data.price ? (typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0) : 0
    const unit = String(data.unit || 'g').trim()
    const featured = Boolean(data.featured)
    
    // Gérer les variants/quantities (format frontend)
    let variants = []
    if (Array.isArray(data.variants) && data.variants.length > 0) {
      variants = data.variants
    } else if (Array.isArray(data.quantities) && data.quantities.length > 0) {
      // Convertir quantities en variants
      variants = data.quantities.map(q => ({
        grammage: q.grammage || 1,
        unit: q.unit || unit,
        price: q.price || (price * (q.grammage || 1))
      }))
    } else if (price > 0) {
      // Créer une variante par défaut
      variants = [{ grammage: 1, unit: unit, price: price }]
    }
    
    // Si pas de variants, créer une variante par défaut avec prix 0
    if (variants.length === 0) {
      variants = [{ grammage: 1, unit: unit, price: 0 }]
    }
    
    if (!name) {
      throw new Error('Le nom du produit est requis')
    }
    
    if (!category) {
      throw new Error('La catégorie est requise')
    }
    
    const product = {
      id,
      name,
      description,
      category,
      farm,
      photo,
      video,
      medias: safeJSONStringify(medias),
      variants: safeJSONStringify(variants),
      quantities: safeJSONStringify(variants), // Garder pour compatibilité
      price,
      unit,
      grammages: data.grammages || '',
      customPrices: data.customPrices || '',
      featured,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    }
    
    try {
      const productJson = JSON.stringify(product)
      await redis.set(`product:${id}`, productJson)
      return { success: true, id, ...product }
    } catch (error) {
      // Logs désactivés pour la sécurité (ne pas exposer les données)
      throw new Error(`Failed to save product: ${error.message}`)
    }
  },

  async update(id, data) {
    // Nettoyer l'ID si il contient déjà le préfixe "product:"
    let cleanId = String(id || '')
    if (cleanId.startsWith('product:')) {
      cleanId = cleanId.replace(/^product:/, '')
    }
    
    const existing = await this.getById(cleanId)
    if (!existing) {
      throw new Error('Product not found')
    }
    
    // Nettoyer et valider les données
    const name = data.name !== undefined ? String(data.name).trim() : existing.name
    const description = data.description !== undefined ? String(data.description).trim() : existing.description
    const category = data.category !== undefined ? String(data.category).trim() : existing.category
    const farm = data.farm !== undefined ? String(data.farm).trim() : existing.farm
    const photo = data.photo !== undefined ? String(data.photo).trim() : existing.photo
    const video = data.video !== undefined ? String(data.video).trim() : existing.video
    const medias = data.medias !== undefined ? (Array.isArray(data.medias) ? data.medias : existing.medias || []) : existing.medias || []
    const price = data.price !== undefined ? (typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0) : (existing.price || 0)
    const unit = data.unit !== undefined ? String(data.unit).trim() : (existing.unit || 'g')
    const featured = data.featured !== undefined ? Boolean(data.featured) : (existing.featured || false)
    
    // Gérer les variants/quantities
    let variants = []
    if (data.variants !== undefined && Array.isArray(data.variants) && data.variants.length > 0) {
      variants = data.variants
    } else if (data.quantities !== undefined && Array.isArray(data.quantities) && data.quantities.length > 0) {
      variants = data.quantities.map(q => ({
        grammage: q.grammage || 1,
        unit: q.unit || unit,
        price: q.price || (price * (q.grammage || 1))
      }))
    } else if (existing.variants) {
      const existingVariants = safeJSONParse(existing.variants, [])
      variants = existingVariants.length > 0 ? existingVariants : [{ grammage: 1, unit: unit, price: price }]
    } else {
      variants = [{ grammage: 1, unit: unit, price: price }]
    }
    
    if (!name) {
      throw new Error('Le nom du produit est requis')
    }
    
    if (!category) {
      throw new Error('La catégorie est requise')
    }
    
    const product = {
      ...existing,
      id: cleanId,
      name,
      description,
      category,
      farm,
      photo,
      video,
      medias: safeJSONStringify(medias),
      variants: safeJSONStringify(variants),
      quantities: safeJSONStringify(variants), // Garder pour compatibilité
      price,
      unit,
      grammages: data.grammages !== undefined ? data.grammages : (existing.grammages || ''),
      customPrices: data.customPrices !== undefined ? data.customPrices : (existing.customPrices || ''),
      featured,
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    try {
      const productJson = JSON.stringify(product)
      await redis.set(`product:${cleanId}`, productJson)
      return { success: true, id: cleanId, ...product }
    } catch (error) {
      // Logs désactivés pour la sécurité (ne pas exposer les données)
      throw new Error(`Failed to update product: ${error.message}`)
    }
  },

  async delete(id) {
    // Nettoyer l'ID si il contient déjà le préfixe "product:"
    let cleanId = String(id || '')
    if (cleanId.startsWith('product:')) {
      cleanId = cleanId.replace(/^product:/, '')
    }
    
    // Récupérer le produit avant suppression pour obtenir les URLs des fichiers
    const product = await this.getById(cleanId)
    
    // Supprimer les fichiers Blob (photo, vidéo, médias)
    if (product) {
      const filesToDelete = []
      
      // Ajouter la photo si elle existe
      if (product.photo && product.photo.trim()) {
        filesToDelete.push(product.photo)
      }
      
      // Ajouter la vidéo si elle existe
      if (product.video && product.video.trim()) {
        filesToDelete.push(product.video)
      }
      
      // Ajouter les médias si ils existent
      if (product.medias) {
        try {
          const medias = typeof product.medias === 'string' ? JSON.parse(product.medias) : product.medias
          if (Array.isArray(medias)) {
            medias.forEach(media => {
              if (media && media.trim() && !filesToDelete.includes(media)) {
                filesToDelete.push(media)
              }
            })
          }
        } catch (e) {
          // Ignorer les erreurs de parsing
        }
      }
      
      // Supprimer tous les fichiers depuis Vercel Blob
      if (filesToDelete.length > 0) {
        try {
          const { deleteBlobFiles } = await import('./blob-utils.js')
          await deleteBlobFiles(filesToDelete)
        } catch (error) {
          // Continuer même si la suppression des fichiers échoue
        }
      }
    }
    
    // Supprimer de Redis
    await redis.del(`product:${cleanId}`)
    
    return { success: true, deletedProduct: product }
  }
}

// ============ CATEGORIES ============
export const categories = {
  async getAll() {
    const keys = await redis.keys('category:*')
    if (!keys || keys.length === 0) return []
    
    const categories = await redis.mget(...keys)
    return categories
      .filter(c => c !== null)
      .map(c => typeof c === 'string' ? JSON.parse(c) : c)
  },

  async getById(id) {
    const category = await redis.get(`category:${id}`)
    if (!category) return null
    return typeof category === 'string' ? JSON.parse(category) : category
  },

  async create(data) {
    // Générer un ID sécurisé (alphanumérique uniquement)
    const id = data.id ? String(data.id).replace(/[^a-zA-Z0-9_-]/g, '_') : `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    // Nettoyer et valider les données
    const name = String(data.name || '').trim()
    const icon = String(data.icon || '').trim()
    const description = String(data.description || '').trim()
    
    if (!name) {
      throw new Error('Le nom de la catégorie est requis')
    }
    
    const category = {
      id,
      name,
      icon: icon || '🎁',
      description
    }
    
    try {
      const categoryJson = JSON.stringify(category)
      await redis.set(`category:${id}`, categoryJson)
      return { success: true, id, ...category }
    } catch (error) {
      // Logs désactivés pour la sécurité
      throw new Error(`Failed to save category: ${error.message}`)
    }
  },

  async update(id, data) {
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Category not found')
    }
    
    // Nettoyer et valider les données
    const name = data.name !== undefined ? String(data.name).trim() : existing.name
    const icon = data.icon !== undefined ? String(data.icon).trim() : existing.icon
    const description = data.description !== undefined ? String(data.description).trim() : existing.description
    
    if (!name) {
      throw new Error('Le nom de la catégorie est requis')
    }
    
    const category = {
      ...existing,
      id: String(id),
      name,
      icon: icon || '🎁',
      description,
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    try {
      const categoryJson = JSON.stringify(category)
      await redis.set(`category:${id}`, categoryJson)
      return { success: true, id, ...category }
    } catch (error) {
      // Logs désactivés pour la sécurité
      throw new Error(`Failed to update category: ${error.message}`)
    }
  },

  async delete(id) {
    // Récupérer la catégorie avant suppression pour obtenir l'URL de l'icône
    const category = await this.getById(id)
    
    // Supprimer le fichier Blob de l'icône si elle existe
    if (category && category.icon && category.icon.includes('vercel-storage.com')) {
      try {
        const { deleteBlobFile } = await import('./blob-utils.js')
        await deleteBlobFile(category.icon)
      } catch (error) {
        // Continuer même si la suppression du fichier échoue
      }
    }
    
    // Supprimer de Redis
    await redis.del(`category:${id}`)
    return { success: true }
  }
}

// ============ SOCIALS ============
export const socials = {
  async getAll() {
    const keys = await redis.keys('social:*')
    if (!keys || keys.length === 0) return []
    
    const socials = await redis.mget(...keys)
    return socials
      .filter(s => s !== null)
      .map(s => typeof s === 'string' ? JSON.parse(s) : s)
  },

  async getById(id) {
    const social = await redis.get(`social:${id}`)
    if (!social) return null
    return typeof social === 'string' ? JSON.parse(social) : social
  },

  async create(data) {
    // Générer un ID sécurisé si non fourni
    const id = data.id ? String(data.id).replace(/[^a-zA-Z0-9_-]/g, '_') : `social_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    // Nettoyer et valider les données
    const name = String(data.name || '').trim()
    const icon = data.icon ? String(data.icon).trim() : '🌐'
    const description = data.description ? String(data.description).trim() : ''
    const url = data.url ? String(data.url).trim() : ''
    
    if (!name) {
      throw new Error('Le nom du réseau social est requis')
    }
    
    const social = {
      id,
      name,
      icon,
      description,
      url,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    }
    
    try {
      const socialJson = JSON.stringify(social)
      await redis.set(`social:${id}`, socialJson)
      return { success: true, id, ...social }
    } catch (error) {
      // Logs désactivés pour la sécurité
      throw new Error(`Failed to save social: ${error.message}`)
    }
  },

  async update(id, data) {
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Social not found')
    }
    
    // Nettoyer et valider les données
    const name = data.name !== undefined ? String(data.name).trim() : existing.name
    const icon = data.icon !== undefined ? String(data.icon).trim() : existing.icon
    const description = data.description !== undefined ? String(data.description).trim() : existing.description
    const url = data.url !== undefined ? String(data.url).trim() : existing.url
    
    if (!name) {
      throw new Error('Le nom du réseau social est requis')
    }
    
    const social = {
      ...existing,
      id,
      name,
      icon: icon || '🌐',
      description,
      url,
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    try {
      const socialJson = JSON.stringify(social)
      await redis.set(`social:${id}`, socialJson)
      return { success: true, id, ...social }
    } catch (error) {
      // Logs désactivés pour la sécurité
      throw new Error(`Failed to update social: ${error.message}`)
    }
  },

  async delete(id) {
    await redis.del(`social:${id}`)
    return { success: true }
  }
}

// ============ FARMS ============
export const farms = {
  async getAll() {
    const keys = await redis.keys('farm:*')
    if (!keys || keys.length === 0) return []
    
    const farms = await redis.mget(...keys)
    return farms
      .filter(f => f !== null)
      .map(f => typeof f === 'string' ? JSON.parse(f) : f)
  },

  async getById(id) {
    const farm = await redis.get(`farm:${id}`)
    if (!farm) return null
    return typeof farm === 'string' ? JSON.parse(farm) : farm
  },

  async create(data) {
    // Générer un ID sécurisé (alphanumérique uniquement)
    const id = data.id ? String(data.id).replace(/[^a-zA-Z0-9_-]/g, '_') : `farm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    // Nettoyer et valider les données
    const name = String(data.name || '').trim()
    const image = data.image ? String(data.image).trim() : null
    const description = data.description ? String(data.description).trim() : null
    
    if (!name) {
      throw new Error('Le nom de la farm est requis')
    }
    
    const farm = {
      id,
      name,
      image: image || '',
      description: description || ''
    }
    
    try {
      const farmJson = JSON.stringify(farm)
      await redis.set(`farm:${id}`, farmJson)
      return { success: true, id, ...farm }
    } catch (error) {
      // Logs désactivés pour la sécurité
      throw new Error(`Failed to save farm: ${error.message}`)
    }
  },

  async update(id, data) {
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Farm not found')
    }
    
    // Nettoyer et valider les données
    const name = data.name !== undefined ? String(data.name).trim() : existing.name
    const image = data.image !== undefined ? String(data.image).trim() : existing.image
    const description = data.description !== undefined ? String(data.description).trim() : existing.description
    
    if (!name) {
      throw new Error('Le nom de la farm est requis')
    }
    
    const farm = {
      ...existing,
      id: String(id),
      name,
      image: image || '',
      description: description || '',
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    try {
      const farmJson = JSON.stringify(farm)
      await redis.set(`farm:${id}`, farmJson)
      return { success: true, id, ...farm }
    } catch (error) {
      // Logs désactivés pour la sécurité
      throw new Error(`Failed to update farm: ${error.message}`)
    }
  },

  async delete(id) {
    // Récupérer la farm avant suppression pour obtenir l'URL de l'image
    const farm = await this.getById(id)
    
    // Supprimer le fichier Blob de l'image si elle existe
    if (farm && farm.image && farm.image.includes('vercel-storage.com')) {
      try {
        const { deleteBlobFile } = await import('./blob-utils.js')
        await deleteBlobFile(farm.image)
      } catch (error) {
        // Continuer même si la suppression du fichier échoue
      }
    }
    
    // Supprimer de Redis
    await redis.del(`farm:${id}`)
    return { success: true }
  }
}

// ============ SETTINGS ============
export const settings = {
  async getAll() {
    const keys = await redis.keys('setting:*')
    if (!keys || keys.length === 0) return []
    
    const settings = await redis.mget(...keys)
    return settings
      .filter(s => s !== null)
      .map(s => {
        const setting = typeof s === 'string' ? JSON.parse(s) : s
        return {
          key: setting.key,
          value: typeof setting.value === 'string' ? safeJSONParse(setting.value, setting.value) : setting.value
        }
      })
  },

  async getByKey(key) {
    const setting = await redis.get(`setting:${key}`)
    if (!setting) return null
    
    const s = typeof setting === 'string' ? JSON.parse(setting) : setting
    return {
      key: s.key,
      value: typeof s.value === 'string' ? safeJSONParse(s.value, s.value) : s.value
    }
  },

  async createOrUpdate(key, value) {
    const setting = {
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      updatedAt: new Date().toISOString()
    }
    
    await redis.set(`setting:${key}`, JSON.stringify(setting))
    return { success: true, key, value }
  }
}

// ============ ADMIN USERS ============
export const adminUsers = {
  async getAll() {
    const keys = await redis.keys('admin_user:*')
    if (!keys || keys.length === 0) return []
    
    const users = await redis.mget(...keys)
    return users
      .filter(u => u !== null)
      .map(u => {
        const user = typeof u === 'string' ? JSON.parse(u) : u
        // Ne pas retourner le mot de passe
        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
      })
  },

  async getById(id) {
    const user = await redis.get(`admin_user:${id}`)
    if (!user) return null
    
    const u = typeof user === 'string' ? JSON.parse(user) : user
    const { password, ...userWithoutPassword } = u
    return userWithoutPassword
  },

  async getByUsername(username) {
    const keys = await redis.keys('admin_user:*')
    if (!keys || keys.length === 0) return null
    
    const users = await redis.mget(...keys)
    for (const user of users) {
      if (!user) continue
      const u = typeof user === 'string' ? JSON.parse(user) : user
      if (u.username === username) {
        return u // Retourner avec le mot de passe pour l'authentification
      }
    }
    return null
  },

  async create(data) {
    const id = data.id || Date.now().toString()
    const user = {
      id,
      username: data.username || '',
      password: data.password || '',
      role: data.role || 'moderator', // Par défaut modérateur
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await redis.set(`admin_user:${id}`, JSON.stringify(user))
    const { password, ...userWithoutPassword } = user
    return { success: true, id, ...userWithoutPassword }
  },

  async update(id, data) {
    const existing = await redis.get(`admin_user:${id}`)
    if (!existing) {
      throw new Error('User not found')
    }
    
    const existingUser = typeof existing === 'string' ? JSON.parse(existing) : existing
    const user = {
      ...existingUser,
      ...data,
      id,
      updatedAt: new Date().toISOString()
    }
    
    await redis.set(`admin_user:${id}`, JSON.stringify(user))
    const { password, ...userWithoutPassword } = user
    return { success: true, id, ...userWithoutPassword }
  },

  async delete(id) {
    await redis.del(`admin_user:${id}`)
    return { success: true }
  }
}

// ============ API TOKENS ============
export const apiTokens = {
  /**
   * Génère un nouveau token API
   */
  async generateToken(userId, name = 'API Token', expiresInDays = 90) {
    const crypto = await import('crypto')
    const token = crypto.randomBytes(32).toString('hex')
    const tokenId = `api_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    
    // Hash le token pour stockage sécurisé
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    
    const tokenData = {
      id: tokenId,
      userId,
      hashedToken, // Stocker seulement le hash, jamais le token en clair
      name,
      createdAt: new Date().toISOString(),
      expiresAt,
      lastUsedAt: null,
      isActive: true
    }
    
    // Stocker le token avec le hash comme clé
    await redis.set(`api_token:${hashedToken}`, JSON.stringify(tokenData))
    
    // Indexer par userId pour récupération facile
    const userTokensKey = `api_tokens_user:${userId}`
    await redis.lpush(userTokensKey, tokenId)
    
    // Stocker les métadonnées du token
    await redis.set(`api_token_meta:${tokenId}`, JSON.stringify(tokenData))
    
    // Retourner le token en clair (une seule fois !)
    return {
      id: tokenId,
      token, // Token en clair (à sauvegarder par l'utilisateur)
      name,
      expiresAt,
      createdAt: tokenData.createdAt
    }
  },

  /**
   * Vérifie et récupère les données d'un token API
   */
  async verifyToken(token) {
    const crypto = await import('crypto')
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    
    const tokenData = await redis.get(`api_token:${hashedToken}`)
    if (!tokenData) {
      return null
    }
    
    const data = typeof tokenData === 'string' ? JSON.parse(tokenData) : tokenData
    
    // Vérifier si le token est actif
    if (!data.isActive) {
      return null
    }
    
    // Vérifier l'expiration
    if (new Date(data.expiresAt) < new Date()) {
      return null
    }
    
    // Mettre à jour lastUsedAt
    data.lastUsedAt = new Date().toISOString()
    await redis.set(`api_token:${hashedToken}`, JSON.stringify(data))
    await redis.set(`api_token_meta:${data.id}`, JSON.stringify(data))
    
    return data
  },

  /**
   * Récupère tous les tokens d'un utilisateur
   */
  async getTokensByUserId(userId) {
    const userTokensKey = `api_tokens_user:${userId}`
    const tokenIds = await redis.lrange(userTokensKey, 0, -1)
    
    if (!tokenIds || tokenIds.length === 0) {
      return []
    }
    
    const tokens = []
    for (const tokenId of tokenIds) {
      const meta = await redis.get(`api_token_meta:${tokenId}`)
      if (meta) {
        const tokenData = typeof meta === 'string' ? JSON.parse(meta) : meta
        // Ne pas retourner le hash, seulement les métadonnées
        const { hashedToken, ...safeData } = tokenData
        tokens.push(safeData)
      }
    }
    
    return tokens.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  /**
   * Révoque un token API
   */
  async revokeToken(tokenId, userId) {
    // Vérifier que le token appartient à l'utilisateur
    const meta = await redis.get(`api_token_meta:${tokenId}`)
    if (!meta) {
      throw new Error('Token not found')
    }
    
    const tokenData = typeof meta === 'string' ? JSON.parse(meta) : meta
    if (tokenData.userId !== userId) {
      throw new Error('Unauthorized')
    }
    
    // Marquer comme inactif
    tokenData.isActive = false
    
    // Mettre à jour dans Redis avec le hash stocké
    if (tokenData.hashedToken) {
      await redis.set(`api_token:${tokenData.hashedToken}`, JSON.stringify(tokenData))
    }
    
    await redis.set(`api_token_meta:${tokenId}`, JSON.stringify(tokenData))
    
    return { success: true }
  },

  /**
   * Supprime complètement un token
   */
  async deleteToken(tokenId, userId) {
    // Vérifier que le token appartient à l'utilisateur
    const meta = await redis.get(`api_token_meta:${tokenId}`)
    if (!meta) {
      throw new Error('Token not found')
    }
    
    const tokenData = typeof meta === 'string' ? JSON.parse(meta) : meta
    if (tokenData.userId !== userId) {
      throw new Error('Unauthorized')
    }
    
    // Supprimer le token avec le hash stocké
    if (tokenData.hashedToken) {
      await redis.del(`api_token:${tokenData.hashedToken}`)
    }
    
    await redis.del(`api_token_meta:${tokenId}`)
    
    // Retirer de l'index
    const userTokensKey = `api_tokens_user:${userId}`
    await redis.lrem(userTokensKey, 1, tokenId)
    
    return { success: true }
  }
}

// ============ EVENTS ============
export const events = {
  async get() {
    try {
      const data = await redis.get('settings:events')
      if (!data) return null
      return typeof data === 'string' ? JSON.parse(data) : data
    } catch (error) {
      console.error('Error getting events:', error)
      return null
    }
  },

  async save(data) {
    try {
      await redis.set('settings:events', JSON.stringify(data))
      return { success: true, ...data }
    } catch (error) {
      console.error('Error saving events:', error)
      throw new Error(`Failed to save events: ${error.message}`)
    }
  }
}

// ============ REVIEWS ============
export const reviews = {
  async getAll() {
    try {
      const keys = await redis.keys('review:*')
      if (!keys || keys.length === 0) return []
      
      const reviews = await redis.mget(...keys)
      return reviews
        .filter(r => r !== null)
        .map(r => typeof r === 'string' ? JSON.parse(r) : r)
    } catch (error) {
      console.error('Error getting reviews:', error)
      return []
    }
  },

  async getById(id) {
    try {
      const data = await redis.get(`review:${id}`)
      if (!data) return null
      return typeof data === 'string' ? JSON.parse(data) : data
    } catch (error) {
      console.error('Error getting review:', error)
      return null
    }
  },

  async create(data) {
    try {
      const id = data.id || `review_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const review = {
        ...data,
        id,
        approved: data.approved !== undefined ? data.approved : false,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await redis.set(`review:${id}`, JSON.stringify(review))
      return review
    } catch (error) {
      console.error('Error creating review:', error)
      throw new Error(`Failed to create review: ${error.message}`)
    }
  },

  async update(id, data) {
    try {
      const existing = await this.getById(id)
      if (!existing) {
        throw new Error('Review not found')
      }
      
      const review = {
        ...existing,
        ...data,
        id,
        updatedAt: new Date().toISOString()
      }
      
      await redis.set(`review:${id}`, JSON.stringify(review))
      return review
    } catch (error) {
      console.error('Error updating review:', error)
      throw new Error(`Failed to update review: ${error.message}`)
    }
  },

  async delete(id) {
    try {
      // Récupérer la review avant suppression pour obtenir l'URL de l'image
      const review = await this.getById(id)
      
      // Supprimer le fichier Blob de l'image si elle existe
      if (review && review.image && review.image.includes('vercel-storage.com')) {
        try {
          const { deleteBlobFile } = await import('./blob-utils.js')
          await deleteBlobFile(review.image)
        } catch (error) {
          // Continuer même si la suppression du fichier échoue
        }
      }
      
      // Supprimer de Redis
      await redis.del(`review:${id}`)
      return { success: true }
    } catch (error) {
      // Logs désactivés pour la sécurité
      throw new Error(`Failed to delete review: ${error.message}`)
    }
  },

  async save(data) {
    // Upsert: créer ou mettre à jour
    if (data.id) {
      return await this.update(data.id, data)
    } else {
      return await this.create(data)
    }
  }
}

// ============ PROMOS ============
export const promos = {
  async getAll() {
    const keys = await redis.keys('promo:*')
    if (!keys || keys.length === 0) return []
    
    const promosData = await redis.mget(...keys)
    return promosData
      .filter(p => p !== null)
      .map(p => typeof p === 'string' ? JSON.parse(p) : p)
  },

  async getById(id) {
    const promo = await redis.get(`promo:${id}`)
    if (!promo) return null
    return typeof promo === 'string' ? JSON.parse(promo) : promo
  },

  async getByCode(code) {
    const allPromos = await this.getAll()
    return allPromos.find(p => p.code && p.code.toUpperCase() === code.toUpperCase())
  },

  async create(data) {
    const id = data.id || `promo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    const promo = {
      id,
      code: String(data.code || '').toUpperCase().trim(),
      discount: Number(data.discount) || 0,
      minAmount: Number(data.minAmount) || 0,
      enabled: data.enabled !== false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    if (!promo.code) {
      throw new Error('Le code promo est requis')
    }
    
    // Vérifier si le code existe déjà
    const existing = await this.getByCode(promo.code)
    if (existing && existing.id !== id) {
      throw new Error('Ce code promo existe déjà')
    }
    
    await redis.set(`promo:${id}`, JSON.stringify(promo))
    return promo
  },

  async update(id, data) {
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error('Promo non trouvée')
    }
    
    const updated = {
      ...existing,
      ...data,
      id,
      code: data.code ? String(data.code).toUpperCase().trim() : existing.code,
      discount: data.discount !== undefined ? Number(data.discount) : existing.discount,
      minAmount: data.minAmount !== undefined ? Number(data.minAmount) : existing.minAmount,
      enabled: data.enabled !== undefined ? data.enabled : existing.enabled,
      updatedAt: new Date().toISOString()
    }
    
    // Vérifier si le nouveau code existe déjà (sauf pour cette promo)
    if (data.code && data.code.toUpperCase() !== existing.code.toUpperCase()) {
      const existingWithCode = await this.getByCode(data.code)
      if (existingWithCode && existingWithCode.id !== id) {
        throw new Error('Ce code promo existe déjà')
      }
    }
    
    await redis.set(`promo:${id}`, JSON.stringify(updated))
    return updated
  },

  async delete(id) {
    await redis.del(`promo:${id}`)
    return { success: true }
  },

  async save(data) {
    if (data.id) {
      return await this.update(data.id, data)
    } else {
      return await this.create(data)
    }
  }
}

// ============ INIT DATABASE ============
export async function initDatabase() {
  // Créer un utilisateur admin par défaut s'il n'existe pas
  // IMPORTANT : Utilise UNIQUEMENT les variables d'environnement Vercel
  const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD
  
  // Vérifier que les variables d'environnement sont configurées
  if (!defaultUsername || !defaultPassword) {
    return { 
      success: false, 
      error: 'Les variables d\'environnement DEFAULT_ADMIN_USERNAME et DEFAULT_ADMIN_PASSWORD doivent être configurées dans Vercel'
    }
  }
  
  const existingAdmin = await adminUsers.getByUsername(defaultUsername)
  if (!existingAdmin) {
    // bcrypt est importé en haut du fichier (même méthode que dans admin-users.js)
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)
    await adminUsers.create({
      id: `admin_${Date.now()}`,
      username: defaultUsername,
      password: hashedPassword,
      role: 'admin' // Admin par défaut est toujours admin
    })
    return { 
      success: true, 
      message: 'Database initialized',
      username: defaultUsername,
      note: 'Admin user created with credentials from environment variables'
    }
  }
  
  return { 
    success: true, 
    message: 'Database already initialized',
    username: defaultUsername
  }
}
