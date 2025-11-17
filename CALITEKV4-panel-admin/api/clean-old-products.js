import { products } from './db.js'

export default async function handler(req, res) {
  // CORS
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
    console.log('🧹 Nettoyage des anciens produits...')
    
    // Noms EXACTS des produits à supprimer
    const productsToDelete = [
      '🟢COCAINE PURE « 21 » +95%❄️',
      'MOUSSEUX 🧽',
      '🌋 Lemon Cherry Gelato 🍒🍋‍🟩',
      'CALI PLATE 🇺🇸'
    ]
    
    // 1. Charger tous les produits
    const allProducts = await products.getAll()
    console.log(`📦 Total produits avant nettoyage: ${allProducts.length}`)
    
    // 2. Trouver les produits à supprimer
    const toDelete = allProducts.filter(p => 
      productsToDelete.some(name => p.name && p.name.trim() === name.trim())
    )
    
    console.log(`🗑️ Produits trouvés à supprimer: ${toDelete.length}`)
    toDelete.forEach(p => console.log(`  - ${p.name} (ID: ${p.id})`))
    
    // 3. Supprimer chaque produit individuellement (supprime les clés product:*)
    let deletedCount = 0
    for (const product of toDelete) {
      try {
        await products.delete(product.id)
        console.log(`✅ Supprimé: ${product.name}`)
        deletedCount++
      } catch (error) {
        console.error(`❌ Erreur suppression ${product.name}:`, error.message)
      }
    }
    
    // 4. Vérifier le résultat
    const remaining = await products.getAll()
    console.log(`📦 Total produits après nettoyage: ${remaining.length}`)
    
    return res.json({
      success: true,
      message: `${deletedCount} produits supprimés`,
      deleted: toDelete.map(p => ({ id: p.id, name: p.name })),
      remainingCount: remaining.length
    })
    
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error)
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    })
  }
}
