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
 * GET /api/reviews/[id] - Récupère un avis (public)
 * PUT /api/reviews/[id] - Met à jour un avis (authentifié)
 * DELETE /api/reviews/[id] - Supprime un avis (authentifié)
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { ...corsHeaders });
    res.end();
    return;
  }

  try {
    const { id } = req.query;
    const reviewId = Array.isArray(id) ? id[0] : id;

    if (!reviewId) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ error: 'ID avis requis' }));
      return;
    }

    if (req.method === 'GET') {
      // Lecture publique
      const reviews = await redis.get('data:reviews') || [];
      const review = reviews.find(r => r.id === parseInt(reviewId) || r.id === reviewId || String(r.id) === String(reviewId));

      if (!review) {
        res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Avis non trouvé' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(review));
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
        const reviews = await redis.get('data:reviews') || [];
        const reviewIndex = reviews.findIndex(r => r.id === parseInt(reviewId) || r.id === reviewId || String(r.id) === String(reviewId));

        if (reviewIndex === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Avis non trouvé' }));
          return;
        }

        // Mettre à jour l'avis
        reviews[reviewIndex] = {
          ...reviews[reviewIndex],
          ...updateData,
          id: reviews[reviewIndex].id, // Garder l'ID original
          updatedAt: new Date().toISOString(),
        };

        await redis.set('data:reviews', reviews);

        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, review: reviews[reviewIndex] }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur mise à jour avis:', error);
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

        const reviews = await redis.get('data:reviews') || [];
        const reviewIndex = reviews.findIndex(r => r.id === parseInt(reviewId) || r.id === reviewId || String(r.id) === String(reviewId));

        if (reviewIndex === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Avis non trouvé' }));
          return;
        }

        reviews.splice(reviewIndex, 1);
        await redis.set('data:reviews', reviews);

        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur suppression avis:', error);
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
      }
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non supportée' }));
  } catch (error) {
    console.error('Erreur reviews/[id]:', error);
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
