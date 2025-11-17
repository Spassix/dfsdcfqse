export default async function handler(req, res) {
  const method = req.method || 'GET';

  // CORS preflight
  if (method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // Refuser les écritures sur Vercel (FS en lecture seule)
  if (method !== 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(405).json({ error: 'Méthode non supportée sur Vercel (lecture seule)' });
    return;
  }

  try {
    const { path = [] } = req.query;
    // Normaliser et sécuriser le chemin demandé
    const requested = Array.isArray(path) ? path.join('/') : String(path || '');
    if (requested.includes('..')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(400).json({ error: 'Chemin invalide' });
      return;
    }

    // Health check simple
    if (requested === 'health' || requested === '/health') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({ status: 'ok', connected: true });
      return;
    }

    // Exemple: /api/products.json -> api/products.json (dans le repo)
    const fs = await import('fs');
    const nodePath = await import('path');
    const root = process.cwd();
    const filePath = nodePath.join(root, 'api', requested);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(content);
      return;
    }

    // Valeurs par défaut si le fichier est absent
    const defaults = (name) => {
      if (name.includes('admin_users')) return [];
      if (name.includes('products')) return [];
      if (name.includes('categories')) return [];
      if (name.includes('farms')) return [];
      if (name.includes('promos')) return [];
      if (name.includes('socials')) return [];
      if (name.includes('cart_services')) return {};
      if (name.includes('cart_options')) return {};
      if (name.includes('cart_slots')) return [];
      if (name.includes('homeSections')) return [];
      return {};
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(defaults(requested));
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Erreur serveur', details: String(err && err.message ? err.message : err) });
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};

