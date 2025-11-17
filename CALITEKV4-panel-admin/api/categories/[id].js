import { verifyToken } from '../auth-utils-simple.js';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/categories/[id] - Récupère une catégorie (public)
 * PUT /api/categories/[id] - Met à jour une catégorie (authentifié)
 * DELETE /api/categories/[id] - Supprime une catégorie (authentifié)
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { ...corsHeaders });
    res.end();
    return;
  }

  try {
    const { id } = req.query;
    const categoryId = Array.isArray(id) ? id[0] : id;

    if (!categoryId) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ error: 'ID catégorie requis' }));
      return;
    }

    if (req.method === 'GET') {
      // Lecture publique
      const categories = await redis.get('data:categories') || [];
      const category = categories.find(c => c.id === parseInt(categoryId) || c.id === categoryId || String(c.id) === String(categoryId));

      if (!category) {
        res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Catégorie non trouvée' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(category));
      return;
    }

    if (req.method === 'PUT') {
      // Mise à jour - nécessite authentification
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

        const updateData = JSON.parse(body || '{}');
        const categories = await redis.get('data:categories') || [];
        const categoryIndex = categories.findIndex(c => c.id === parseInt(categoryId) || c.id === categoryId || String(c.id) === String(categoryId));

        if (categoryIndex === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Catégorie non trouvée' }));
          return;
        }

        // Mettre à jour la catégorie
        categories[categoryIndex] = {
          ...categories[categoryIndex],
          ...updateData,
          id: categories[categoryIndex].id, // Garder l'ID original
          updatedAt: new Date().toISOString(),
        };

        await redis.set('data:categories', categories);

        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, category: categories[categoryIndex] }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur mise à jour catégorie:', error);
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
      }
      return;
    }

    if (req.method === 'DELETE') {
      // Suppression - nécessite authentification
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

        const categories = await redis.get('data:categories') || [];
        const categoryIndex = categories.findIndex(c => c.id === parseInt(categoryId) || c.id === categoryId || String(c.id) === String(categoryId));

        if (categoryIndex === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Catégorie non trouvée' }));
          return;
        }

        categories.splice(categoryIndex, 1);
        await redis.set('data:categories', categories);

        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur suppression catégorie:', error);
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
      }
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non supportée' }));
  } catch (error) {
    console.error('Erreur categories/[id]:', error);
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
