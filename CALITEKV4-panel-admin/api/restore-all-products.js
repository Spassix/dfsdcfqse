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
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Charge les produits par défaut depuis le fichier JSON
 */
function loadDefaultProducts() {
  try {
    const filePath = join(process.cwd(), 'api', 'data', 'products.json');
    const data = readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading default products:', error);
    return [];
  }
}

/**
 * POST /api/restore-all-products - Restaure tous les produits depuis le fichier JSON (authentifié)
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { ...corsHeaders });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non supportée' }));
    return;
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ error: 'Token manquant' }));
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    req.user = decoded;

    // Charger les produits par défaut depuis le fichier JSON
    const defaultProducts = loadDefaultProducts();

    if (!defaultProducts || defaultProducts.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ error: 'Aucun produit par défaut trouvé' }));
      return;
    }

    // Restaurer les produits dans Redis
    await redis.set('data:products', defaultProducts);

    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ 
      success: true, 
      message: `${defaultProducts.length} produits restaurés avec succès`,
      count: defaultProducts.length
    }));
  } catch (error) {
    if (error.message === 'Token expiré' || error.message === 'Token invalide') {
      res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
      return;
    }
    console.error('Erreur restauration produits:', error);
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
