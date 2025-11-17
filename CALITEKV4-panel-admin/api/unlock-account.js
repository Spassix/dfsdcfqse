import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Déverrouille un compte admin et réinitialise tous les rate limits
 * Endpoint d'urgence pour débloquer les comptes
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { ...corsHeaders });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    let body = req.body;
    if (!body || (typeof body === 'string' && body.length > 0)) {
      try {
        if (typeof body === 'string') {
          body = JSON.parse(body);
        }
      } catch (e) {
        if (req.body && typeof req.body === 'object') {
          body = req.body;
        }
      }
    }

    const { username } = body || {};

    if (!username) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ error: 'Username required' }));
      return;
    }

    // Nettoyer le username
    const cleanUsername = String(username).trim();

    console.log(`🔓 Déverrouillage du compte: ${cleanUsername}`);

    // Supprimer toutes les clés de rate limiting et de verrouillage pour ce compte
    const keysToDelete = [
      `rate_limit:username:${cleanUsername}`,
      `account_lock:${cleanUsername}`,
      `failed_login:${cleanUsername}`,
      `login_attempts:${cleanUsername}`,
    ];

    let deletedCount = 0;
    for (const key of keysToDelete) {
      try {
        const deleted = await redis.del(key);
        if (deleted) {
          deletedCount++;
          console.log(`  ✅ Supprimé: ${key}`);
        }
      } catch (error) {
        console.log(`  ⚠️ Erreur suppression ${key}:`, error.message);
      }
    }

    // Supprimer aussi les rate limits IP (pour être sûr)
    try {
      const ipKeys = await redis.keys('rate_limit:ip:*');
      if (ipKeys && ipKeys.length > 0) {
        for (const ipKey of ipKeys) {
          await redis.del(ipKey);
          deletedCount++;
        }
        console.log(`  ✅ Supprimé ${ipKeys.length} rate limits IP`);
      }
    } catch (error) {
      console.log('  ⚠️ Erreur suppression rate limits IP:', error.message);
    }

    console.log(`✅ Compte déverrouillé: ${cleanUsername} (${deletedCount} clés supprimées)`);

    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({
      success: true,
      message: `Compte "${cleanUsername}" déverrouillé avec succès`,
      deletedKeys: deletedCount,
      details: 'Tous les rate limits et verrouillages ont été supprimés. Vous pouvez maintenant vous reconnecter.'
    }));
  } catch (error) {
    console.error('Erreur déverrouillage:', error);
    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ 
      error: 'Erreur serveur', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }));
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
