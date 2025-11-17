import { Redis } from '@upstash/redis';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req, res) {
  const method = req.method || 'GET';

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, { ...corsHeaders });
    res.end();
    return;
  }

  try {
    const storageKey = 'data:messages.json';

    if (method === 'GET') {
      const redis = Redis.fromEnv();
      let messages = await redis.get(storageKey);
      
      // Fallback: vérifier l'ancienne clé pour migration UNIQUEMENT si la clé n'existe pas du tout
      // Ne pas restaurer si c'est un tableau vide (messages supprimés)
      if (messages === null || messages === undefined) {
        const oldKey = 'data:messages';
        const oldMessages = await redis.get(oldKey);
        if (oldMessages && Array.isArray(oldMessages) && oldMessages.length > 0) {
          // Migrer vers la nouvelle clé
          await redis.set(storageKey, oldMessages);
          messages = oldMessages;
        }
      }
      
      // S'assurer que messages est un tableau
      if (!Array.isArray(messages)) {
        messages = [];
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(messages));
      return;
    }

    if (method === 'POST') {
      let body = '';
      await new Promise(resolve => {
        req.on('data', chunk => (body += chunk));
        req.on('end', resolve);
      });

      const data = JSON.parse(body || '{}');
      const { telegramUsername, message } = data;

      if (!telegramUsername || !message) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ error: 'Nom d\'utilisateur Telegram et message requis' }));
        return;
      }

      // Charger les messages existants
      const redis = Redis.fromEnv();
      let existingMessages = await redis.get(storageKey);
      
      // Fallback: vérifier l'ancienne clé pour migration UNIQUEMENT si la clé n'existe pas du tout
      // Ne pas restaurer si c'est un tableau vide (messages supprimés)
      if (existingMessages === null || existingMessages === undefined) {
        const oldKey = 'data:messages';
        const oldMessages = await redis.get(oldKey);
        if (oldMessages && Array.isArray(oldMessages) && oldMessages.length > 0) {
          // Migrer vers la nouvelle clé
          await redis.set(storageKey, oldMessages);
          existingMessages = oldMessages;
        }
      }
      
      // S'assurer que existingMessages est un tableau
      if (!Array.isArray(existingMessages)) {
        existingMessages = [];
      }

      // Ajouter le nouveau message
      const newMessage = {
        id: Date.now(),
        telegramUsername: telegramUsername.trim(),
        message: message.trim(),
        read: false,
        createdAt: new Date().toISOString()
      };

      const updatedMessages = [...existingMessages, newMessage];

      // Sauvegarder dans Redis
      await redis.set(storageKey, updatedMessages);

      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ success: true, message: 'Message envoyé avec succès' }));
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Méthode non supportée' }));
  } catch (err) {
    console.error('Erreur API messages:', err);
    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Erreur serveur', details: String(err && err.message ? err.message : err) }));
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};

