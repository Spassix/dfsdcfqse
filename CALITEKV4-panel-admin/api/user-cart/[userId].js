import { Redis } from '@upstash/redis';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req, res) {
  const method = req.method || 'GET';

  if (method === 'OPTIONS') {
    res.writeHead(200, { ...corsHeaders });
    res.end();
    return;
  }

  try {
    const { userId = '' } = req.query;
    const safeUserId = Array.isArray(userId) ? userId[0] : String(userId || '');
    
    if (!safeUserId || safeUserId.includes('..') || safeUserId.includes('/') || safeUserId.length > 100) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ error: 'ID utilisateur invalide' }));
      return;
    }

    const storageKey = `user_cart:${safeUserId}`;

    if (method === 'GET') {
      const redis = Redis.fromEnv();
      const value = await redis.get(storageKey);
      const cart = value || [];
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(cart));
      return;
    }

    if (method === 'PUT') {
      let body = '';
      await new Promise(resolve => {
        req.on('data', chunk => (body += chunk));
        req.on('end', resolve);
      });

      let parsed;
      try {
        parsed = JSON.parse(body || '[]');
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Données invalides' }));
        return;
      }

      // Valider que c'est un tableau
      if (!Array.isArray(parsed)) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Le panier doit être un tableau' }));
        return;
      }

      const redis = Redis.fromEnv();
      await redis.set(storageKey, parsed);
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non supportée' }));
  } catch (err) {
    console.error('Erreur user-cart:', err);
    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Erreur serveur', details: String(err && err.message ? err.message : err) }));
  }
}

export const config = {
  api: {
    bodyParser: false,
    maxDuration: 60,
  },
  maxDuration: 60,
};

