import { verifyToken } from './auth-utils-simple.js';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/export-all-products - Exporte tous les produits (authentifié)
 * Retourne un fichier JSON téléchargeable
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { ...corsHeaders });
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non autorisée' }));
    return;
  }

  // Nécessite authentification
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

    const products = await redis.get('data:products') || [];
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalProducts: products.length,
      products: products,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const filename = `products-export-${new Date().toISOString().split('T')[0]}.json`;

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      ...corsHeaders,
    });
    res.end(jsonString);
  } catch (error) {
    if (error.message === 'Token expiré' || error.message === 'Token invalide') {
      res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
      return;
    }
    console.error('Erreur export produits:', error);
    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
