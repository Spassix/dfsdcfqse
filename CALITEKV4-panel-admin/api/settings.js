import { verifyToken } from './auth-utils-simple.js';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/settings - Récupère tous les settings (public)
 * POST /api/settings - Crée/met à jour un setting (authentifié)
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { ...corsHeaders });
    res.end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Lecture publique - retourner tous les settings
      const settingsKeys = [
        'colors', 'events', 'loading', 'general', 'typography',
        'banner', 'config', 'cart_services', 'socials', 'reviews',
        'payments', 'productModal', 'farmsEnabled'
      ];
      
      const allSettings = {};
      
      for (const key of settingsKeys) {
        const value = await redis.get(`settings:${key}`);
        if (value !== null && value !== undefined) {
          allSettings[key] = value;
        }
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(allSettings));
      return;
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Modification - nécessite authentification
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

        const { key, value } = JSON.parse(body || '{}');
        
        if (!key) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Clé requise' }));
          return;
        }

        // Sauvegarder le setting dans Redis
        await redis.set(`settings:${key}`, value);

        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, key, value }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        // Erreur silencieuse
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
      }
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non supportée' }));
  } catch (error) {
    console.error('Erreur settings:', error);
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
