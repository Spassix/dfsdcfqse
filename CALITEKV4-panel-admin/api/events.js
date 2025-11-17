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
 * Initialise les événements depuis le fichier JSON
 */
function loadDefaultEvents() {
  try {
    const filePath = join(process.cwd(), 'api', 'data', 'events.json');
    const data = readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading default events:', error);
    return [];
  }
}

/**
 * GET /api/events - Liste tous les événements (public)
 * POST /api/events - Crée un événement (authentifié)
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
      let events = await redis.get('data:events');
      
      // S'assurer que events est un objet valide (pas un tableau)
      if (!events || typeof events !== 'object' || Array.isArray(events)) {
        // Essayer de charger depuis le fichier JSON par défaut
        events = loadDefaultEvents();
        // Toujours s'assurer que c'est un objet
        if (!events || typeof events !== 'object' || Array.isArray(events)) {
          events = {};
        }
        // Sauvegarder dans Redis même si c'est vide
        await redis.set('data:events', events);
      }
      
      // Garantir qu'on retourne toujours un objet
      if (!events || typeof events !== 'object' || Array.isArray(events)) {
        events = {};
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(events));
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

        const eventData = JSON.parse(body || '{}');

        // Validation
        if (!eventData.title) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Titre requis' }));
          return;
        }

        // Charger les événements existants
        let events = await redis.get('data:events') || [];
        if (!events || events.length === 0) {
          events = loadDefaultEvents();
        }

        // Créer le nouvel événement
        const newEvent = {
          id: eventData.id || Date.now(),
          title: eventData.title,
          description: eventData.description || '',
          date: eventData.date || new Date().toISOString(),
          location: eventData.location || '',
          image: eventData.image || '',
          createdAt: eventData.createdAt || new Date().toISOString(),
        };

        events.push(newEvent);
        await redis.set('data:events', events);

        res.writeHead(201, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, event: newEvent }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur création événement:', error);
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
      }
      return;
    }

    if (req.method === 'PUT') {
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

        const eventData = JSON.parse(body || '{}');

        if (!eventData.id) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'ID requis' }));
          return;
        }

        let events = await redis.get('data:events') || [];
        const index = events.findIndex(e => e.id === eventData.id);

        if (index === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Événement non trouvé' }));
          return;
        }

        events[index] = { ...events[index], ...eventData };
        await redis.set('data:events', events);

        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, event: events[index] }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur modification événement:', error);
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

        let body = '';
        await new Promise(resolve => {
          req.on('data', chunk => (body += chunk));
          req.on('end', resolve);
        });

        const { id } = JSON.parse(body || '{}');

        if (!id) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'ID requis' }));
          return;
        }

        let events = await redis.get('data:events') || [];
        const filtered = events.filter(e => e.id !== id);

        if (filtered.length === events.length) {
          res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Événement non trouvé' }));
          return;
        }

        await redis.set('data:events', filtered);

        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur suppression événement:', error);
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
      }
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non supportée' }));
  } catch (error) {
    console.error('Erreur events:', error);
    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
  }
}

export const config = {
  api: {
    bodyParser: false,
    maxDuration: 60,
  },
}
