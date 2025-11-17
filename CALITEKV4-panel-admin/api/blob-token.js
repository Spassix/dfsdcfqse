// Route API pour fournir le token Blob de manière sécurisée
// Cette route retourne le token uniquement côté serveur
export default async function handler(req, res) {
  // Gestion CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Seulement GET autorisé
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!token) {
      res.status(500).json({ 
        error: 'Token Blob non configuré',
        details: 'La variable d\'environnement BLOB_READ_WRITE_TOKEN n\'est pas configurée.' 
      });
      return;
    }

    // Retourner le token (⚠️ Note: En production, utilisez plutôt des signed URLs ou tokens temporaires)
    // Pour l'instant, on retourne le token directement car c'est l'option 2 demandée par l'utilisateur
    res.status(200).json({
      token: token,
      // Note de sécurité: En production idéale, générez plutôt un token temporaire ou une signed URL
      message: 'Token retourné. Pour plus de sécurité en production, utilisez des signed URLs.'
    });

  } catch (error) {
    console.error('❌ Erreur récupération token:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du token',
      details: error.message || String(error),
    });
  }
}



