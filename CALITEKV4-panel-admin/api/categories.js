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
 * Initialise les catégories depuis le fichier JSON
 */
function loadDefaultCategories() {
  try {
    const filePath = join(process.cwd(), 'api', 'data', 'categories.json');
    const data = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // Fichier n'existe pas ou erreur de parsing - retourner tableau vide
    return [];
  }
}

/**
 * GET /api/categories - Liste toutes les catégories (public)
 * POST /api/categories - Crée une catégorie (authentifié)
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
      let categories = await redis.get('data:categories');
      
      // S'assurer que categories est un tableau valide
      if (!categories || !Array.isArray(categories) || categories.length === 0) {
        // Essayer de charger depuis les clés individuelles category:*
        try {
          const categoryKeys = await redis.keys('category:*');
          if (categoryKeys && categoryKeys.length > 0) {
            const categoryValues = await redis.mget(...categoryKeys);
            categories = categoryValues
              .map((val) => {
                try {
                  return typeof val === 'string' ? JSON.parse(val) : val;
                } catch {
                  return null;
                }
              })
              .filter(c => c !== null && c.id);
            
            // Si on a trouvé des catégories, les sauvegarder dans data:categories
            if (categories.length > 0) {
              await redis.set('data:categories', categories);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération depuis category:*:', error);
        }
        
        // Si toujours vide, essayer de charger depuis le fichier JSON par défaut
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
          categories = loadDefaultCategories();
        }
        
        // Toujours s'assurer que c'est un tableau
        if (!Array.isArray(categories)) {
          categories = [];
        }
        
        // Sauvegarder dans Redis même si c'est vide (pour éviter de recharger à chaque fois)
        await redis.set('data:categories', categories);
      }
      
      // Garantir qu'on retourne toujours un tableau
      if (!Array.isArray(categories)) {
        categories = [];
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(categories));
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

        const categoryData = JSON.parse(body || '{}');

        // Validation
        if (!categoryData.name) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Nom requis' }));
          return;
        }

        // Charger les catégories existantes
        let categories = await redis.get('data:categories') || [];
        if (!categories || categories.length === 0) {
          categories = loadDefaultCategories();
        }

        // Vérifier si la catégorie existe déjà
        const exists = categories.find(c => c.name.toLowerCase() === categoryData.name.toLowerCase());

        if (exists) {
          res.writeHead(409, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Une catégorie avec ce nom existe déjà' }));
          return;
        }

        // Créer la nouvelle catégorie
        const newCategory = {
          id: categoryData.id || Date.now(),
          name: categoryData.name,
          createdAt: categoryData.createdAt || new Date().toISOString(),
        };

        categories.push(newCategory);
        await redis.set('data:categories', categories);

        res.writeHead(201, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, category: newCategory }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur création catégorie:', error);
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

        const categoryData = JSON.parse(body || '{}');

        if (!categoryData.id) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'ID requis' }));
          return;
        }

        let categories = await redis.get('data:categories') || [];
        const index = categories.findIndex(c => c.id === categoryData.id);

        if (index === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Catégorie non trouvée' }));
          return;
        }

        categories[index] = { ...categories[index], ...categoryData };
        await redis.set('data:categories', categories);

        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, category: categories[index] }));
      } catch (error) {
        if (error.message === 'Token expiré' || error.message === 'Token invalide') {
          res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: error.message || 'Non autorisé' }));
          return;
        }
        console.error('Erreur modification catégorie:', error);
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

        let categories = await redis.get('data:categories') || [];
        const filtered = categories.filter(c => c.id !== id);

        if (filtered.length === categories.length) {
          res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Catégorie non trouvée' }));
          return;
        }

        await redis.set('data:categories', filtered);

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
    console.error('Erreur categories:', error);
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
