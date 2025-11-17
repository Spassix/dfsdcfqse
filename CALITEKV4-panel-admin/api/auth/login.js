import { adminUsers, redis } from '../db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  checkRateLimit,
  resetRateLimit,
  checkAccountLock,
  recordFailedLogin,
  resetFailedLoginAttempts,
  validateUsername,
  validatePassword,
  sanitizeString,
  setSecurityHeaders,
  logSecurityEvent,
  getClientIP,
  isSuspiciousIP,
  blacklistIP
} from '../security-utils.js'

export default async function handler(req, res) {
  // Headers de sécurité
  setSecurityHeaders(res)
  
  // CORS Headers (restreint en production)
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
  const origin = req.headers.origin
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const clientIP = getClientIP(req)

  try {
    // Vérifier que les variables d'environnement sont configurées
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.error('Variables d\'environnement manquantes:', {
        UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      await logSecurityEvent('missing_env_vars', { ip: clientIP }, req)
      return res.status(500).json({ 
        error: 'Configuration serveur incomplète',
        message: 'Les variables d\'environnement UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN doivent être configurées dans Vercel Dashboard. Voir DEBUG_VERCEL_ENV.md pour plus d\'informations.'
      })
    }

    // --------- PARSING BODY (SAFE) ----------
    let body = {}

    if (req.body && typeof req.body === 'object') {
      body = req.body
    } else if (typeof req.body === 'string' && req.body.trim().length > 0) {
      try {
        body = JSON.parse(req.body)
      } catch (e) {
        return res.status(400).json({
          error: 'Invalid request body format',
          details: 'Body must be valid JSON'
        })
      }
    } else {
      return res.status(400).json({
        error: 'Invalid request body format',
        details: 'Empty body'
      })
    }

    // --------- NETTOYAGE DES ADMINS SANS VARS (NE DOIT JAMAIS PLANTER) ----------
    try {
      const envAdmins = {}
      for (const key of Object.keys(process.env)) {
        if (key.startsWith('DEFAULT_ADMIN_USERNAME')) {
          const index = key.replace('DEFAULT_ADMIN_USERNAME', '')
          envAdmins[index] = {
            username: process.env[`DEFAULT_ADMIN_USERNAME${index}`],
            password: process.env[`DEFAULT_ADMIN_PASSWORD${index}`]
          }
        }
      }

      const redisAdmins = await redis.keys('admin_user:*')

      for (const key of redisAdmins) {
        try {
          const raw = await redis.get(key)
          if (!raw) continue

          const user = JSON.parse(raw)

          const stillExists = Object.values(envAdmins).some(
            env => env.username && env.username === user.username
          )

          if (!stillExists) {
            console.log('Suppression auto d\'un admin retiré des variables :', user.username)
            await redis.del(key)
          }
        } catch (e) {
          console.error('Erreur lors du nettoyage d\'un admin Redis:', e)
          // on continue, on ne casse pas le login
        }
      }
    } catch (e) {
      console.error('Erreur bloc nettoyage admins:', e)
      // on log seulement, pas de throw → pas de 500
    }

    // Vérifier si l'IP est suspecte
    if (await isSuspiciousIP(clientIP)) {
      await logSecurityEvent('suspicious_ip_access', { ip: clientIP }, req)
      return res.status(403).json({ error: 'Accès refusé' })
    }

    // Valider et nettoyer les entrées
    const rawUsername = body?.username
    const rawPassword = body?.password

    if (!rawUsername || !rawPassword) {
      return res.status(400).json({ 
        error: 'Username and password are required',
        details: {
          hasUsername: !!rawUsername,
          hasPassword: !!rawPassword
        }
      })
    }

    // Récupérer les identifiants UNIQUEMENT depuis les variables d'environnement Vercel
    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD
    
    // Vérifier que les variables d'environnement sont bien configurées
    if (!defaultUsername || !defaultPassword) {
      await logSecurityEvent('missing_admin_env_vars', { hasUsername: !!defaultUsername, hasPassword: !!defaultPassword }, req)
      return res.status(500).json({ 
        error: 'Configuration de sécurité invalide',
        details: 'Les variables d\'environnement DEFAULT_ADMIN_USERNAME et DEFAULT_ADMIN_PASSWORD doivent être configurées dans Vercel'
      })
    }
    
    // Vérifier d'abord s'il existe des utilisateurs
    let hasUsers = false
    try {
      const keys = await redis.keys('admin_user:*')
      hasUsers = keys && keys.length > 0
    } catch (error) {
      // Ignorer l'erreur silencieusement
    }

    // Nettoyer le username
    const username = String(rawUsername || '').trim()
    
    // Vérifier si c'est le compte admin principal (celui configuré dans Vercel)
    const isAdminPrincipal = username === defaultUsername

    // Vérifier si l'utilisateur existe déjà dans Redis (créé via variables d'environnement)
    let existingUser = null
    try {
      existingUser = await adminUsers.getByUsername(username)
    } catch (e) {
      // Ignorer l'erreur, on continuera avec la validation
    }

    // Valider le format du username (sauf pour le compte admin principal OU si l'utilisateur existe déjà)
    if (!isAdminPrincipal && !existingUser) {
      const usernameValidation = validateUsername(username)
      if (!usernameValidation.valid) {
        await logSecurityEvent('invalid_username_format', { username: rawUsername }, req)
        return res.status(400).json({ 
          error: usernameValidation.error,
          field: 'username'
        })
      }
    }

    // Valider le format du password (sauf pour le compte admin principal OU si l'utilisateur existe déjà)
    if (!isAdminPrincipal && !existingUser) {
      const passwordValidation = validatePassword(rawPassword)
      if (!passwordValidation.valid) {
        await logSecurityEvent('invalid_password_format', { username }, req)
        return res.status(400).json({ 
          error: passwordValidation.error,
          field: 'password'
        })
      }
    }

    // Récupérer l'utilisateur depuis Redis (avec mot de passe)
    let userData = null
    try {
      userData = await adminUsers.getByUsername(username)
    } catch (error) {
      console.error('Erreur lors de la récupération utilisateur:', error)
    }

    // Si l'utilisateur n'existe pas OU si c'est le compte admin principal
    if (!userData || !userData.password) {
      // Si c'est le compte admin principal configuré dans Vercel, le créer/mettre à jour
      if (username === defaultUsername && rawPassword === defaultPassword) {
        try {
          const hashedPassword = await bcrypt.hash(defaultPassword, 10)
          const newUser = await adminUsers.create({
            id: `admin_${Date.now()}`,
            username: defaultUsername,
            password: hashedPassword,
            role: 'admin'
          })
          
          userData = await adminUsers.getByUsername(defaultUsername)
          
          if (!userData || !userData.password) {
            const userKey = `admin_user:${newUser.id}`
            const userDataToStore = {
              id: newUser.id,
              username: defaultUsername,
              password: hashedPassword,
              role: 'admin',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            await redis.set(userKey, JSON.stringify(userDataToStore))
            userData = userDataToStore
          }
        } catch (error) {
          console.error('Erreur lors de la création du compte admin:', error)
          return res.status(500).json({ 
            error: 'Erreur lors de la création du compte',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          })
        }
      } else {
        await logSecurityEvent('failed_login_no_user', { username }, req)
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100))
        return res.status(401).json({ error: 'Invalid credentials' })
      }
    }

    // Vérifier le mot de passe
    let isValid = false
    
    if (username === defaultUsername) {
      isValid = rawPassword === defaultPassword
      
      if (isValid) {
        const hashedPassword = await bcrypt.hash(defaultPassword, 10)
        const userKey = `admin_user:${userData.id}`
        const updatedUserData = {
          ...userData,
          password: hashedPassword
        }
        await redis.set(userKey, JSON.stringify(updatedUserData))
      }
    } else {
      try {
        isValid = await bcrypt.compare(rawPassword, userData.password)
      } catch (error) {
        await logSecurityEvent('password_verification_error', { username }, req)
        await recordFailedLogin(username)
        return res.status(401).json({ error: 'Invalid credentials' })
      }
    }
    
    if (!isValid) {
      await logSecurityEvent('failed_login', { username, ip: clientIP }, req)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET || JWT_SECRET === 'changez-moi-en-production') {
      await logSecurityEvent('weak_jwt_secret', { username }, req)
      return res.status(500).json({ error: 'Configuration de sécurité invalide' })
    }

    const token = jwt.sign(
      { 
        userId: userData.id, 
        username: userData.username,
        role: userData.role || 'admin',
        ip: clientIP,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { 
        expiresIn: '7d',
        algorithm: 'HS256'
      }
    )

    const refreshToken = jwt.sign(
      { 
        userId: userData.id, 
        type: 'refresh',
        ip: clientIP
      },
      JWT_SECRET,
      { 
        expiresIn: '7d',
        algorithm: 'HS256'
      }
    )

    await redis.setex(`refresh_token:${userData.id}`, 7 * 24 * 60 * 60, refreshToken)

    await logSecurityEvent('successful_login', { username, ip: clientIP }, req)

    res.setHeader('Set-Cookie', [
      `adminToken=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`,
      `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
    ])

    return res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: userData.id,
        username: userData.username,
        role: userData.role || 'admin'
      }
    })
  } catch (error) {
    console.error('ERREUR LOGIN:', error)
    await logSecurityEvent('login_error', { error: error.message, ip: clientIP }, req)
    return res.status(500).json({ error: 'Erreur de connexion' })
  }
}
