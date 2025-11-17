import { Redis } from '@upstash/redis';
import { verifyAuth } from './auth-utils.js';

// Vérifier que les variables d'environnement sont configurées
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('⚠️ Variables d\'environnement Redis manquantes');
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * POST /api/import-products - Importe/restaure des produits depuis un JSON
 * Nécessite authentification admin
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { ...corsHeaders });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non autorisée' }));
    return;
  }

  try {
    // Vérifier l'authentification
    let user;
    try {
      user = await verifyAuth(req);
    } catch (authError) {
      console.error('Erreur authentification:', authError);
      res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ error: 'Accès admin requis', details: authError.message }));
      return;
    }
    
    if (!user || user.role !== 'admin') {
      res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ error: 'Accès admin requis' }));
      return;
    }

    // Lire le body
    let body = '';
    await new Promise(resolve => {
      req.on('data', chunk => (body += chunk));
      req.on('end', resolve);
    });

    const data = JSON.parse(body || '{}');
    
    // Accepter soit un tableau de produits, soit un objet avec une propriété products
    let productsToImport = Array.isArray(data) ? data : (data.products || []);
    
    if (!Array.isArray(productsToImport) || productsToImport.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ error: 'Aucun produit à importer' }));
      return;
    }

    console.log(`📦 Import de ${productsToImport.length} produits...`);

    // Importer chaque produit
    const imported = [];
    const errors = [];

    for (const product of productsToImport) {
      try {
        // S'assurer que le produit a un ID
        const productId = product.id || `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Structure complète du produit
        const productData = {
          id: productId,
          name: product.name || 'Produit sans nom',
          category: product.category || '',
          farm: product.farm || '',
          unit: product.unit || 'pièce',
          prices: product.prices || product.price || [], // Support ancien format
          photo: product.photo || product.image || '',
          video: product.video || '',
          description: product.description || '',
          featured: product.featured || false,
          createdAt: product.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Normaliser les prix (support ancien format)
        if (!Array.isArray(productData.prices) && productData.prices) {
          // Ancien format: { quantity: price } ou juste un nombre
          if (typeof productData.prices === 'object') {
            productData.prices = Object.entries(productData.prices).map(([qty, price]) => ({
              quantity: parseFloat(qty) || 1,
              price: parseFloat(price) || 0
            }));
          } else if (typeof productData.prices === 'number') {
            productData.prices = [{ quantity: 1, price: productData.prices }];
          } else {
            productData.prices = [];
          }
        }

        // Sauvegarder dans Redis avec la clé product:*
        await redis.set(`product:${productId}`, JSON.stringify(productData));
        
        // AUSSI ajouter à data:products.json (pour compatibilité)
        try {
          const legacyData = await redis.get('data:products.json');
          let parsed = [];
          if (legacyData) {
            parsed = typeof legacyData === 'string' ? JSON.parse(legacyData) : legacyData;
          }
          if (!Array.isArray(parsed)) {
            parsed = [];
          }
          
          // Vérifier si le produit existe déjà
          const existingIndex = parsed.findIndex(p => p.id === productId);
          if (existingIndex >= 0) {
            parsed[existingIndex] = productData;
          } else {
            parsed.push(productData);
          }
          
          await redis.set('data:products.json', JSON.stringify(parsed));
        } catch (legacyError) {
          console.warn('Erreur sauvegarde legacy:', legacyError);
        }

        imported.push(productId);
        console.log(`✅ Produit importé: ${productData.name} (${productId})`);
      } catch (error) {
        console.error(`❌ Erreur import produit:`, error);
        errors.push({
          product: product.name || product.id || 'Inconnu',
          error: error.message
        });
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({
      success: true,
      imported: imported.length,
      total: productsToImport.length,
      errors: errors.length,
      errorDetails: errors.length > 0 ? errors : undefined,
      message: `${imported.length} produits importés avec succès${errors.length > 0 ? `, ${errors.length} erreurs` : ''}`
    }));
  } catch (error) {
    console.error('Erreur import produits:', error);
    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ 
      error: 'Erreur serveur', 
      details: error.message 
    }));
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
