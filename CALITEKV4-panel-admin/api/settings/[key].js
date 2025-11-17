import { Redis } from '@upstash/redis';
import { verifyToken } from '../auth-utils-simple.js';
import { readFileSync } from 'fs';
import { join } from 'path';

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
 * Retourne des valeurs par défaut pour un setting
 * Ne lit PLUS de fichiers (causait ENOENT sur Vercel)
 */
function initializeDefaultSetting(key) {
  // Valeurs par défaut basiques pour chaque setting
  const defaults = {
    'colors': {},
    'events': [],
    'loading': { enabled: false },
    'general': {},
    'typography': {},
    'banner': { enabled: false },
    'config': {},
    'cart_services': [],
    'cart': {
      services: [
        { name: 'Livraison', label: '🚚 Livraison', description: 'Livraison à domicile', fee: 0, enabled: true, slots: ['9h-12h', '12h-15h', '15h-18h', '18h-21h'] },
        { name: 'Meetup', label: '🤝 Meetup', description: 'Rendez-vous en personne', fee: 0, enabled: true, slots: ['10h', '14h', '16h', '20h'] },
        { name: 'Envoi', label: '📦 Envoi postal', description: 'Envoi par la poste', fee: 0, enabled: true, slots: ['Envoi sous 24h', 'Envoi sous 48h', 'Envoi express'] }
      ],
      payments: [
        { label: '💵 Espèces', enabled: true },
        { label: '💳 Carte bancaire', enabled: true },
        { label: '🏦 Virement', enabled: true },
        { label: '₿ Crypto', enabled: false }
      ],
      alertEnabled: false,
      alertMessage: '',
      promosEnabled: true,
      contactLinks: [
        { name: 'WhatsApp', url: '', services: [] },
        { name: 'Telegram', url: '', services: [] }
      ]
    },
    'socials': [],
    'reviews': { enabled: false },
    'payments': {},
    'productModal': {},
    'farmsEnabled': { enabled: true },
  };

  return defaults[key] || null;
}

/**
 * GET /api/settings/[key] - Récupère un setting (public)
 * PUT /api/settings/[key] - Met à jour un setting (authentifié)
 * POST /api/settings/[key] - Crée/met à jour un setting (authentifié)
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { ...corsHeaders });
    res.end();
    return;
  }

  // Extraire la clé depuis l'URL
  const urlParts = req.url.split('/');
  const key = urlParts[urlParts.length - 1].split('?')[0];

  try {
    if (req.method === 'GET') {
      // Lecture publique - pas besoin d'authentification
      let setting = await redis.get(`settings:${key}`);
      
      // Si pas de données en Redis, initialiser depuis le fichier JSON
      if (setting === null || setting === undefined) {
        const defaultSetting = initializeDefaultSetting(key);
        if (defaultSetting !== null) {
          // Sauvegarder dans Redis pour les prochaines fois
          await redis.set(`settings:${key}`, defaultSetting);
          setting = defaultSetting;
        } else {
          // Aucun setting trouvé
          res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: 'Setting non trouvé' }));
          return;
        }
      }

      // Retourner au format attendu par le panel admin : { value: ... }
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ value: setting }));
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

        const settingData = JSON.parse(body || '{}');

        // Sauvegarder le setting dans Redis
        // Si settingData a une propriété value, sauvegarder seulement la valeur
        const valueToSave = settingData.value !== undefined ? settingData.value : settingData;
        await redis.set(`settings:${key}`, valueToSave);

        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true, value: valueToSave }));
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
