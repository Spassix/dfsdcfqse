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
 * Initialise les farms depuis le fichier JSON
 */
function loadDefaultFarms() {
  try {
    const filePath = join(process.cwd(), 'api', 'data', 'farms.json');
    const data = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // Fichier n'existe pas ou erreur de parsing - retourner tableau vide
    return [];
  }
}

/**
 * GET /api/farms - Liste toutes les farms (public)
 * POST /api/farms - Crée une farm (authentifié)
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
      let farms = await redis.get('data:farms');
      
      // S'assurer que farms est un tableau valide
      if (!farms || !Array.isArray(farms) || farms.length === 0) {
        // Essayer de charger depuis les clés individuelles farm:*
        try {
          const farmKeys = await redis.keys('farm:*');
          if (farmKeys && farmKeys.length > 0) {
            const farmValues = await redis.mget(...farmKeys);
            farms = farmValues
              .map((val) => {
                try {
                  return typeof val === 'string' ? JSON.parse(val) : val;
                } catch {
                  return null;
                }
              })
              .filter(f => f !== null && f.id);
            
            // Si on a trouvé des farms, les sauvegarder dans data:farms
            if (farms.length > 0) {
              await redis.set('data:farms', farms);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération depuis farm:*:', error);
        }
        
        // Si toujours vide, essayer de charger depuis le fichier JSON par défaut
        if (!farms || !Array.isArray(farms) || farms.length === 0) {
          farms = loadDefaultFarms();
        }
        
        // Toujours s'assurer que c'est un tableau
        if (!Array.isArray(farms)) {
          farms = [];
        }
        
        // Sauvegarder dans Redis même si c'est vide (pour éviter de recharger à chaque fois)
        await redis.set('data:farms', farms);
      }
      
      // Garantir qu'on retourne toujours un tableau
      if (!Array.isArray(farms)) {
        farms = [];
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(farms));
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

        const farmData = JSON.parse(body || '{}');

        // Validation
        if (!farmData.name) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Nom requis' }));
          return;
        }

        // Charger les farms existantes
        let farms = await redis.get('data:farms') || [];
        if (!farms || farms.length === 0) {
          farms = loadDefaultFarms();
        }

        // Vérifier si la farm existe déjà
        const exists = farms.find(f => f.name.toLowerCase() === farmData.name.toLowerCase());

        if (exists) {
          res.writeHead(409, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Une farm avec ce nom existe déjà' }));
          return;
        }

        // Créer la nouvelle farm
        const newFarm = {
          id: farmData.id || Date.now(),
          name: farmData.name,
          createdAt: farmData.createdAt || new Date().toISOString(),
        };

        farms.push(newFarm);
        await redis.set('data:farms', farms);

        res.writeHead(201, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, farm: newFarm }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur création farm:', error);
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

        const farmData = JSON.parse(body || '{}');

        if (!farmData.id) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'ID requis' }));
          return;
        }

        let farms = await redis.get('data:farms') || [];
        const index = farms.findIndex(f => f.id === farmData.id);

        if (index === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Farm non trouvée' }));
          return;
        }

        farms[index] = { ...farms[index], ...farmData };
        await redis.set('data:farms', farms);

        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, farm: farms[index] }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur modification farm:', error);
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

        let farms = await redis.get('data:farms') || [];
        const filtered = farms.filter(f => f.id !== id);

        if (filtered.length === farms.length) {
          res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Farm non trouvée' }));
          return;
        }

        await redis.set('data:farms', filtered);

        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur suppression farm:', error);
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Erreur serveur', details: error.message }));
      }
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non supportée' }));
  } catch (error) {
    console.error('Erreur farms:', error);
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
