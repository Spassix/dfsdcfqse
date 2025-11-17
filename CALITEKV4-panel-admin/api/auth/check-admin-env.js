/**
 * Endpoint de debug pour vérifier les variables d'environnement admin
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const foundVars = {}
    const allEnvKeys = Object.keys(process.env)
    
    // Chercher toutes les variables admin
    const adminPatterns = [
      'DEFAULT_ADMIN_USERNAME',
      'DEFAULT_ADMIN_PASSWORD',
      'DEFAULT_ADMIN_USERNAME_2',
      'DEFAULT_ADMIN_PASSWORD_2',
      'DEFAULT_ADMIN_USERNAME_3',
      'DEFAULT_ADMIN_PASSWORD_3',
      'DEFAULT_ADMIN_USERNAME1',
      'DEFAULT_ADMIN_PASSWORD1',
      'DEFAULT_ADMIN_USERNAME2',
      'DEFAULT_ADMIN_PASSWORD2',
    ]

    // Chercher aussi dynamiquement
    for (let i = 1; i <= 10; i++) {
      const patterns = [
        `DEFAULT_ADMIN_USERNAME_${i}`,
        `DEFAULT_ADMIN_PASSWORD_${i}`,
        `DEFAULT_ADMIN_USERNAME${i}`,
        `DEFAULT_ADMIN_PASSWORD${i}`,
      ]
      adminPatterns.push(...patterns)
    }

    adminPatterns.forEach(pattern => {
      if (process.env[pattern]) {
        foundVars[pattern] = pattern.includes('PASSWORD') 
          ? '***' + process.env[pattern].slice(-2) // Afficher seulement les 2 derniers caractères
          : process.env[pattern]
      }
    })

    // Chercher aussi toutes les variables qui contiennent "ADMIN" et "USERNAME" ou "PASSWORD"
    const relatedVars = {}
    allEnvKeys.forEach(key => {
      if (key.includes('ADMIN') && (key.includes('USERNAME') || key.includes('PASSWORD'))) {
        if (!foundVars[key]) {
          relatedVars[key] = key.includes('PASSWORD')
            ? '***' + process.env[key].slice(-2)
            : process.env[key]
        }
      }
    })

    return res.json({
      success: true,
      foundVariables: foundVars,
      relatedVariables: relatedVars,
      totalFound: Object.keys(foundVars).length,
      instructions: {
        format: 'Pour créer plusieurs admins, utilisez:\n' +
                'Admin 1: DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD\n' +
                'Admin 2: DEFAULT_ADMIN_USERNAME_2, DEFAULT_ADMIN_PASSWORD_2\n' +
                'Admin 3: DEFAULT_ADMIN_USERNAME_3, DEFAULT_ADMIN_PASSWORD_3\n' +
                'etc.\n\n' +
                'OU sans underscore:\n' +
                'Admin 2: DEFAULT_ADMIN_USERNAME2, DEFAULT_ADMIN_PASSWORD2\n' +
                'Admin 3: DEFAULT_ADMIN_USERNAME3, DEFAULT_ADMIN_PASSWORD3\n' +
                'etc.',
        nextStep: 'Après avoir ajouté les variables dans Vercel, appelez POST /api/admin-init pour créer les comptes'
      }
    })
  } catch (error) {
    console.error('Erreur check admin env:', error)
    return res.status(500).json({
      error: 'Erreur lors de la vérification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
