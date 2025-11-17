import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Si GET, afficher l'interface HTML
  if (req.method === 'GET') {
    return res.status(200).send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Migration des Données</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { color: #667eea; margin-bottom: 10px; font-size: 2em; }
        p { color: #666; margin-bottom: 30px; line-height: 1.6; }
        button {
            width: 100%;
            padding: 15px 30px;
            font-size: 1.1em;
            font-weight: 600;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 15px;
        }
        .btn-migrate {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-migrate:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        .btn-migrate:disabled { opacity: 0.5; cursor: not-allowed; }
        .result {
            margin-top: 30px;
            padding: 20px;
            border-radius: 10px;
            background: #f8f9fa;
            display: none;
        }
        .result.show { display: block; }
        .result.success { background: #d4edda; border-left: 4px solid #28a745; }
        .result.error { background: #f8d7da; border-left: 4px solid #dc3545; }
        .loading { text-align: center; display: none; }
        .loading.show { display: block; }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        .stat-card h4 { color: #667eea; margin-bottom: 5px; font-size: 0.9em; }
        .stat-card p { color: #333; font-size: 1.5em; font-weight: bold; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Migration des Données</h1>
        <p>Migrez vos 57 produits + catégories + farms + réseaux sociaux vers le nouveau format.</p>
        
        <button class="btn-migrate" onclick="migrateData()" id="migrateBtn">
            🚀 Lancer la Migration Complète
        </button>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Migration en cours...</p>
        </div>
        
        <div class="result" id="result"></div>
    </div>

    <script>
        async function migrateData() {
            const resultDiv = document.getElementById('result');
            const loadingDiv = document.getElementById('loading');
            const migrateBtn = document.getElementById('migrateBtn');
            
            migrateBtn.disabled = true;
            loadingDiv.classList.add('show');
            resultDiv.className = 'result';
            resultDiv.innerHTML = '';

            try {
                const response = await fetch('/api/migrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const data = await response.json();
                
                loadingDiv.classList.remove('show');
                resultDiv.classList.add('show');

                if (data.success) {
                    let html = '<h3>🎉 Migration Réussie !</h3>';
                    html += '<div class="stats">';
                    
                    if (data.summary) {
                        Object.entries(data.summary).forEach(([key, value]) => {
                            html += \`<div class="stat-card"><h4>\${key}</h4><p>\${value}</p></div>\`;
                        });
                    }
                    
                    html += '</div>';
                    html += '<p style="margin-top: 20px; color: #28a745;">✅ Rafraîchissez le panel admin maintenant !</p>';
                    
                    resultDiv.innerHTML = html;
                    resultDiv.classList.add('success');
                } else {
                    resultDiv.innerHTML = \`<h3>❌ Erreur</h3><pre>\${JSON.stringify(data, null, 2)}</pre>\`;
                    resultDiv.classList.add('error');
                }
            } catch (error) {
                loadingDiv.classList.remove('show');
                resultDiv.classList.add('show', 'error');
                resultDiv.innerHTML = \`<h3>❌ Erreur</h3><p>\${error.message}</p>\`;
            } finally {
                migrateBtn.disabled = false;
            }
        }
    </script>
</body>
</html>
    `)
  }

  // Si POST, effectuer la migration
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method POST required' })
  }

  try {
    const results = {
      products: { migrated: 0 },
      categories: { migrated: 0 },
      farms: { migrated: 0 },
      socials: { migrated: 0 }
    }

    // MIGRER PRODUITS
    const productsData = await redis.get('data:products.json')
    if (productsData) {
      const products = typeof productsData === 'string' ? JSON.parse(productsData) : productsData
      if (Array.isArray(products)) {
        for (const product of products) {
          if (!product.id) continue
          await redis.set(\`product:\${product.id}\`, JSON.stringify({
            ...product,
            variants: product.quantities || product.variants || [],
            medias: [product.photo, product.video].filter(Boolean),
            createdAt: product.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))
          results.products.migrated++
        }
      }
    }

    // MIGRER CATEGORIES (extraire des produits)
    const categoriesSet = new Set()
    if (productsData) {
      const products = typeof productsData === 'string' ? JSON.parse(productsData) : productsData
      if (Array.isArray(products)) {
        products.forEach(p => {
          if (p.category && p.category.trim()) categoriesSet.add(p.category.trim())
        })
      }
    }
    for (const catName of categoriesSet) {
      const catId = \`cat_\${Date.now()}_\${Math.random().toString(36).substring(2, 9)}\`
      await redis.set(\`category:\${catId}\`, JSON.stringify({
        id: catId,
        name: catName,
        enabled: true,
        createdAt: new Date().toISOString()
      }))
      results.categories.migrated++
      await new Promise(resolve => setTimeout(resolve, 10)) // Éviter les collisions d'ID
    }

    // MIGRER FARMS (extraire des produits)
    const farmsSet = new Set()
    if (productsData) {
      const products = typeof productsData === 'string' ? JSON.parse(productsData) : productsData
      if (Array.isArray(products)) {
        products.forEach(p => {
          if (p.farm && p.farm.trim()) farmsSet.add(p.farm.trim())
        })
      }
    }
    for (const farmName of farmsSet) {
      const farmId = \`farm_\${Date.now()}_\${Math.random().toString(36).substring(2, 9)}\`
      await redis.set(\`farm:\${farmId}\`, JSON.stringify({
        id: farmId,
        name: farmName,
        enabled: true,
        createdAt: new Date().toISOString()
      }))
      results.farms.migrated++
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    return res.json({
      success: true,
      message: '🎉 Migration complète terminée !',
      results,
      summary: {
        'Produits': \`\${results.products.migrated} migrés\`,
        'Catégories': \`\${results.categories.migrated} créées\`,
        'Farms': \`\${results.farms.migrated} créées\`
      }
    })
  } catch (error) {
    console.error('Migration error:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
