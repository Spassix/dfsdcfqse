import { verifyToken } from '../auth-utils-simple.js';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Endpoint générique pour lire/écrire des données dans Redis
 * Compatible avec l'ancien système de fichiers JSON
 * GET /api/db/farms.json - Lit data:farms depuis Redis
 * PUT /api/db/farms.json - Écrit dans data:farms dans Redis
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { ...corsHeaders });
    res.end();
    return;
  }

  try {
    const { path = [] } = req.query;
    const requested = Array.isArray(path) ? path.join('/') : String(path || '');
    
    // Extraire le nom du fichier sans .json
    let fileName = requested.replace('.json', '');
    
    // Gérer les cas spéciaux (products.json -> data:products, pas data:products.json)
    // Le panel admin envoie "products.json" mais Redis stocke dans "data:products"
    if (fileName.endsWith('.json')) {
      fileName = fileName.replace('.json', '');
    }
    
    // Mapping vers les clés Redis
    const redisKey = `data:${fileName}`;

    if (req.method === 'GET') {
      // Lecture depuis Redis
      let data = await redis.get(redisKey);
      
      // Valeurs par défaut si aucune donnée
      if (!data) {
        data = getDefaultData(fileName);
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(data));
      return;
    }

    if (req.method === 'PUT') {
      // Écriture nécessite authentification
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Token manquant' }));
        return;
      }

      const token = authHeader.substring(7);
      try {
        const decoded = verifyToken(token);
        req.user = decoded;
      } catch (error) {
        res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
        return;
      }

      let body = '';
      await new Promise(resolve => {
        req.on('data', chunk => (body += chunk));
        req.on('end', resolve);
      });

      const data = JSON.parse(body || '{}');

      // Écrire dans Redis
      await redis.set(redisKey, data);

      // Si on sauvegarde products, synchroniser aussi vers product:* (clés individuelles)
      if (fileName === 'products' && Array.isArray(data)) {
        try {
          // Supprimer tous les anciens produits individuels
          const existingKeys = await redis.keys('product:*');
          if (existingKeys && existingKeys.length > 0) {
            await redis.del(...existingKeys);
          }
          
          // Créer les produits individuels
          for (const product of data) {
            if (product && product.id) {
              const productId = String(product.id);
              await redis.set(`product:${productId}`, JSON.stringify(product));
            }
          }
          
          console.log(`✅ Synchronisé ${data.length} produits vers product:*`);
        } catch (syncError) {
          console.error('Erreur synchronisation product:*:', syncError);
          // Continuer même en cas d'erreur de synchronisation
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non supportée' }));
  } catch (error) {
    console.error('Erreur db:', error);
    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
  }
}

function getDefaultData(fileName) {
  const defaults = {
    'products': [],
    'categories': [],
    'farms': [],
    'payments': [],
    'promos': [],
    'socials': [],
    'reviews': [],
    'messages': [],
    'admin_users': [],
    'cart_options': [],
    'cart_slots': [],
    'banner': { text: '', enabled: false },
    'loadingscreen': { enabled: false, text: 'Chargement...', duration: 3000 },
    'config': { shopName: 'ThePlug CoffeeShop', shopTagline: 'Votre meilleur café à Paris 🌿' },
    'cart_services': { home: true, postal: true, meet: true },
    'maintenance': { enabled: false, message: '' },
    'typography': { family: 'Inter', size: 16 },
    'categoriesEnabled': true,
    'farmsEnabled': true,
    'productModal': {},
  };

  return defaults[fileName] || {};
}

export const config = {
  api: {
    bodyParser: false,
    maxDuration: 60,
  },
};
