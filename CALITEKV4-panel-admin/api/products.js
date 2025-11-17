import { verifyToken } from './auth-utils-simple.js';
import { Redis } from '@upstash/redis';
import { readFileSync } from 'fs';
import { join } from 'path';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Initialise les produits depuis le fichier JSON
 */
function loadDefaultProducts() {
  try {
    const filePath = join(process.cwd(), 'api', 'data', 'products.json');
    const data = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // Fichier n'existe pas ou erreur de parsing - retourner tableau vide
    return [];
  }
}

/**
 * GET /api/products - Liste tous les produits (public)
 * POST /api/products - Crée un produit (authentifié)
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { ...corsHeaders });
    res.end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Lecture publique - pas besoin d'authentification
      let products = await redis.get('data:products');
      
      // S'assurer que products est un tableau valide
      if (!products || !Array.isArray(products) || products.length === 0) {
        // Essayer de charger depuis les clés individuelles product:*
        try {
          const productKeys = await redis.keys('product:*');
          if (productKeys && productKeys.length > 0) {
            const productValues = await redis.mget(...productKeys);
            products = productValues
              .map((val, idx) => {
                try {
                  return typeof val === 'string' ? JSON.parse(val) : val;
                } catch {
                  return null;
                }
              })
              .filter(p => p !== null && p.id);
            
            // Si on a trouvé des produits, les sauvegarder dans data:products
            if (products.length > 0) {
              await redis.set('data:products', products);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération depuis product:*:', error);
        }
        
        // Si toujours vide, essayer de charger depuis le fichier JSON par défaut
        if (!products || !Array.isArray(products) || products.length === 0) {
          products = loadDefaultProducts();
        }
        
        // Toujours s'assurer que c'est un tableau
        if (!Array.isArray(products)) {
          products = [];
        }
        
        // Sauvegarder dans Redis même si c'est vide (pour éviter de recharger à chaque fois)
        await redis.set('data:products', products);
      }
      
      // Garantir qu'on retourne toujours un tableau
      if (!Array.isArray(products)) {
        products = [];
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(products));
      return;
    }

    if (req.method === 'POST') {
      // Création - nécessite authentification
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Token manquant' }));
          return;
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        req.user = decoded;

        let body = '';
        await new Promise(resolve => {
          req.on('data', chunk => (body += chunk));
          req.on('end', resolve);
        });

        const productData = JSON.parse(body || '{}');

        // Validation
        if (!productData.name || !productData.category) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Nom et catégorie requis' }));
          return;
        }

        // Charger les produits existants
        let products = await redis.get('data:products') || [];
        if (!products || products.length === 0) {
          products = loadDefaultProducts();
        }

        // Vérifier si le produit existe déjà
        const exists = products.find(
          p => p.name.toLowerCase() === productData.name.toLowerCase() &&
               p.category === productData.category
        );

        if (exists) {
          res.writeHead(409, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Un produit avec ce nom existe déjà dans cette catégorie' }));
          return;
        }

        // Créer le nouveau produit
        const newProduct = {
          id: productData.id || Date.now(),
          ...productData,
          createdAt: productData.createdAt || new Date().toISOString(),
        };

        products.push(newProduct);
        await redis.set('data:products', products);

        res.writeHead(201, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, product: newProduct }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur création produit:', error);
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
      }
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non supportée' }));
  } catch (error) {
    console.error('Erreur products:', error);
    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
  }
}

export const config = {
  api: {
    bodyParser: false,
    maxDuration: 60,
  },
};
