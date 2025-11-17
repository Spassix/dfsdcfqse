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
 * GET /api/socials - Liste tous les réseaux sociaux (public)
 * POST /api/socials - Crée un réseau social (authentifié)
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
      let socials = await redis.get('data:socials');
      
      // S'assurer que socials est un tableau valide
      if (!socials || !Array.isArray(socials)) {
        socials = [];
        // Initialiser dans Redis avec un tableau vide
        await redis.set('data:socials', socials);
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(socials));
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

        const socialData = JSON.parse(body || '{}');

        // Validation
        if (!socialData.name || !socialData.url) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Nom et URL requis' }));
          return;
        }

        // Charger les réseaux sociaux existants
        let socials = await redis.get('data:socials') || [];
        if (!Array.isArray(socials)) {
          socials = [];
        }

        // Vérifier si le réseau social existe déjà
        const exists = socials.find(
          s => s.name.toLowerCase() === socialData.name.toLowerCase() ||
               s.url === socialData.url
        );

        if (exists) {
          res.writeHead(409, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Un réseau social avec ce nom ou cette URL existe déjà' }));
          return;
        }

        // Créer le nouveau réseau social
        const newSocial = {
          id: socialData.id || Date.now(),
          ...socialData,
          createdAt: socialData.createdAt || new Date().toISOString(),
        };

        socials.push(newSocial);
        await redis.set('data:socials', socials);

        res.writeHead(201, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, social: newSocial }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur création réseau social:', error);
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
      }
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non supportée' }));
  } catch (error) {
    console.error('Erreur socials:', error);
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
