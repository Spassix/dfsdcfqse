import { products } from './db.js'
import { Redis } from '@upstash/redis'
import { verifyAuth } from './auth-utils.js'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vérifier l'authentification
    const user = await verifyAuth(req)
    if (!user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Vous devez être connecté pour synchroniser les produits'
      })
    }

    // Récupérer les produits depuis data:products.json (ancien système)
    const oldProductsData = await redis.get('data:products.json')
    const oldProducts = oldProductsData ? (typeof oldProductsData === 'string' ? JSON.parse(oldProductsData) : oldProductsData) : []
    
    if (!Array.isArray(oldProducts)) {
      return res.json({ 
        success: true, 
        message: 'Aucun produit à migrer',
        migrated: 0,
        existing: 0
      })
    }

    // Récupérer les produits existants depuis product:* (nouveau système)
    const existingProducts = await products.getAll()
    const existingIds = new Set(existingProducts.map(p => String(p.id)))

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

        // Convertir le format ancien vers le nouveau format
        const newProduct = {
          id: productId,
          name: String(oldProduct.name || '').trim(),
          description: String(oldProduct.description || '').trim(),
          category: String(oldProduct.category || '').trim(),
          farm: String(oldProduct.farm || '').trim(),
          photo: oldProduct.photo ? String(oldProduct.photo).trim() : '',
          video: oldProduct.video ? String(oldProduct.video).trim() : '',
          price: oldProduct.price ? String(oldProduct.price).trim() : '',
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
          newProduct.variants = []
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
        errors.push({
          product: oldProduct.name || oldProduct.id,
          error: error.message
        })
      }
    }

    return res.json({
      success: true,
      message: `Synchronisation terminée`,
      migrated,
      skipped,
      existing: existingProducts.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Products sync error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
