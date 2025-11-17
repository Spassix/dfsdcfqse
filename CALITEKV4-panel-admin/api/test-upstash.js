import { Redis } from '@upstash/redis'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vérifier les variables d'environnement
    const hasUrl = !!process.env.UPSTASH_REDIS_REST_URL
    const hasToken = !!process.env.UPSTASH_REDIS_REST_TOKEN
    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN

    if (!hasUrl || !hasToken) {
      return res.status(200).json({
        success: false,
        configured: false,
        message: '❌ Variables Upstash manquantes',
        details: {
          UPSTASH_REDIS_REST_URL: hasUrl ? '✅ Configurée' : '❌ Manquante',
          UPSTASH_REDIS_REST_TOKEN: hasToken ? '✅ Configurée' : '❌ Manquante',
          BLOB_READ_WRITE_TOKEN: hasBlobToken ? '✅ Configurée' : '⚠️ Manquante (optionnel)',
        },
        help: 'Configurez les variables dans Vercel → Settings → Environment Variables'
      })
    }

    // Tester la connexion Redis avec Redis.fromEnv()
    const redis = Redis.fromEnv()

    // Test simple : ping
    await redis.set('test:connection', 'ok', { ex: 10 })
    const testResult = await redis.get('test:connection')

    if (testResult !== 'ok') {
      throw new Error('Redis connection test failed')
    }

    // Compter les clés principales
    const productKeys = await redis.keys('product:*')
    const categoryKeys = await redis.keys('category:*')
    const farmKeys = await redis.keys('farm:*')

    return res.status(200).json({
      success: true,
      configured: true,
      message: '✅ Upstash Redis connecté !',
      connection: {
        url: process.env.UPSTASH_REDIS_REST_URL?.substring(0, 30) + '...',
        status: '✅ Connecté et fonctionnel'
      },
      data: {
        products: `${productKeys.length} produit(s)`,
        categories: `${categoryKeys.length} catégorie(s)`,
        farms: `${farmKeys.length} farm(s)`,
      },
      blob: {
        configured: hasBlobToken,
        status: hasBlobToken ? '✅ Configuré' : '⚠️ Non configuré (uploads limités)'
      },
      help: {
        'Si données vides': 'Utilisez /api/init pour initialiser',
        'Ajouter des produits': 'Allez sur /admin/login',
        'Panel admin': 'Utilisez admin / admin@123@123'
      }
    })

  } catch (error) {
    console.error('Erreur test Upstash:', error)
    return res.status(500).json({
      success: false,
      configured: false,
      message: '❌ Erreur de connexion à Upstash',
      error: error.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      help: 'Vérifiez que vos credentials Upstash sont corrects dans Vercel Dashboard'
    })
  }
}
