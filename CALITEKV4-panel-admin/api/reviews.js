import { verifyToken } from './auth-utils-simple.js';
import { Redis } from '@upstash/redis';

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
 * GET /api/reviews - Liste tous les avis (public)
 * POST /api/reviews - Crée un avis (authentifié)
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
      let reviews = await redis.get('data:reviews');
      
      // S'assurer que reviews est un tableau valide
      if (!reviews || !Array.isArray(reviews)) {
        reviews = [];
        // Initialiser dans Redis avec un tableau vide
        await redis.set('data:reviews', reviews);
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(reviews));
      return;
    }

    if (req.method === 'POST') {
      // Création - permet aux utilisateurs non authentifiés de poster des avis
      // L'authentification est optionnelle (pour les admins qui veulent créer des avis approuvés directement)
      try {
        let body = '';
        await new Promise(resolve => {
          req.on('data', chunk => (body += chunk));
          req.on('end', resolve);
        });

        const reviewData = JSON.parse(body || '{}');

        // Vérifier les champs requis
        if (!reviewData.author || !reviewData.text) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Les champs author et text sont requis' }));
          return;
        }

        // Vérifier si l'utilisateur est authentifié (optionnel)
        let isAdmin = false;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            req.user = decoded;
            isAdmin = true; // Si authentifié, c'est probablement un admin
          } catch (authError) {
            // Si le token est invalide, continuer comme utilisateur non authentifié
            isAdmin = false;
          }
        }

        // Charger les avis existants
        let reviews = await redis.get('data:reviews') || [];
        if (!Array.isArray(reviews)) {
          reviews = [];
        }

        // Créer le nouvel avis
        // Les avis des utilisateurs non authentifiés sont en attente d'approbation par défaut
        const newReview = {
          id: reviewData.id || Date.now(),
          author: reviewData.author.trim(),
          text: reviewData.text.trim(),
          rating: reviewData.rating || 5,
          image: reviewData.image || null,
          approved: isAdmin ? (reviewData.approved !== undefined ? reviewData.approved : true) : false,
          createdAt: reviewData.createdAt || new Date().toISOString(),
        };

        reviews.push(newReview);
        await redis.set('data:reviews', reviews);

        res.writeHead(201, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, review: newReview }));
      } catch (error) {
        // Erreur silencieuse
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
      }
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non supportée' }));
  } catch (error) {
    // Erreur silencieuse
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
