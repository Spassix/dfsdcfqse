import { products } from './db.js'
import { Redis } from '@upstash/redis'
import { verifyAuth } from './auth-utils.js'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Accepter GET et POST pour faciliter l'utilisation
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vérifier l'authentification (optionnel pour GET, requis pour POST)
    if (req.method === 'POST') {
      const user = await verifyAuth(req)
      if (!user) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Vous devez être connecté pour synchroniser les produits'
        })
      }
    }

    // Récupérer les produits depuis data:products.json (ancien système)
    const oldProductsData = await redis.get('data:products.json')
    let oldProducts = []
    
    if (oldProductsData) {
      try {
        oldProducts = typeof oldProductsData === 'string' ? JSON.parse(oldProductsData) : oldProductsData
      } catch (e) {
        console.error('Erreur parsing oldProductsData:', e)
        oldProducts = []
      }
    }
    
    if (!Array.isArray(oldProducts)) {
      return res.json({ 
        success: true, 
        message: 'Aucun produit à migrer',
        migrated: 0,
        skipped: 0,
        existing: 0,
        oldCount: 0
      })
    }

    // Récupérer les produits existants depuis product:* (nouveau système)
    let existingProducts = []
    try {
      existingProducts = await products.getAll()
    } catch (e) {
      console.error('Erreur récupération produits existants:', e)
      existingProducts = []
    }
    
    const existingIds = new Set(existingProducts.map(p => String(p.id)))

    // Si GET, retourner juste les statistiques
    if (req.method === 'GET') {
      return res.json({
        success: true,
        oldCount: oldProducts.length,
        existingCount: existingProducts.length,
        toMigrate: oldProducts.filter(p => {
          const productId = String(p.id || '')
          return !existingIds.has(productId)
        }).length,
        message: `Prêt à migrer. ${oldProducts.length} produits dans l'ancien système, ${existingProducts.length} dans le nouveau.`
      })
    }

    // POST : Effectuer la migration
    let migrated = 0
    let skipped = 0
    let errors = []

    // Migrer chaque produit
    for (const oldProduct of oldProducts) {
      try {
        const productId = String(oldProduct.id || `product_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`)
        
        // Vérifier si le produit existe déjà
        if (existingIds.has(productId)) {
          skipped++
          continue
        }

        // S'assurer qu'on a un nom valide
        let productName = String(oldProduct.name || '').trim()
        if (!productName || productName === productId || productName.startsWith('product:')) {
          productName = `Produit ${productId}` || 'Produit sans nom'
        }

        // Convertir le format ancien vers le nouveau format
        const newProduct = {
          id: productId,
          name: productName,
          description: String(oldProduct.description || '').trim(),
          category: String(oldProduct.category || '').trim(),
          farm: String(oldProduct.farm || '').trim(),
          photo: oldProduct.photo ? String(oldProduct.photo).trim() : '',
          video: oldProduct.video ? String(oldProduct.video).trim() : '',
          price: oldProduct.price ? String(oldProduct.price).trim() : '',
          unit: String(oldProduct.unit || 'g').trim(),
          featured: Boolean(oldProduct.featured),
          createdAt: oldProduct.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        // Gérer les variantes/quantities
        if (oldProduct.quantities && Array.isArray(oldProduct.quantities) && oldProduct.quantities.length > 0) {
          newProduct.variants = oldProduct.quantities.map(q => ({
            grammage: Number(q.grammage) || 1,
            unit: String(q.unit || oldProduct.unit || 'g').trim(),
            price: String(q.price || oldProduct.price || '0').trim()
          }))
        } else if (oldProduct.price) {
          newProduct.variants = [{
            grammage: 1,
            unit: String(oldProduct.unit || 'g').trim(),
            price: String(oldProduct.price).trim()
          }]
        } else {
          // Si pas de prix, créer une variante par défaut avec prix 0
          newProduct.variants = [{
            grammage: 1,
            unit: String(oldProduct.unit || 'g').trim(),
            price: '0'
          }]
        }

        // S'assurer qu'on a au moins une variante
        if (!newProduct.variants || newProduct.variants.length === 0) {
          newProduct.variants = [{
            grammage: 1,
            unit: 'g',
            price: '0'
          }]
        }

        // Gérer les médias
        const medias = []
        if (newProduct.photo) medias.push(newProduct.photo)
        if (newProduct.video) medias.push(newProduct.video)
        newProduct.medias = medias

        // Créer le produit dans le nouveau système
        await products.create(newProduct)
        migrated++
      } catch (error) {
        console.error(`Erreur migration produit ${oldProduct.id}:`, error)
        errors.push({
          product: oldProduct.name || oldProduct.id,
          id: oldProduct.id,
          error: error.message || String(error)
        })
      }
    }

    return res.json({
      success: true,
      message: `Synchronisation terminée`,
      migrated,
      skipped,
      existing: existingProducts.length,
      oldCount: oldProducts.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Products migration error:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
