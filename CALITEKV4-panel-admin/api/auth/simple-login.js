/**
 * LOGIN - Vérifie avec tous les admins créés depuis les variables d'environnement
 * Supporte plusieurs admins (DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_USERNAME_2, etc.)
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // CORS simplifié - accepte TOUT
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Lire le body
    const { username, password } = req.body || {};

    // Vérifier que les champs sont fournis
    if (!username || !password) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'Server error' });
    }

    // Importer dynamiquement pour éviter les problèmes de dépendance circulaire
    let adminUsers
    try {
      const dbModule = await import('../db.js')
      adminUsers = dbModule.adminUsers
      
      if (!adminUsers) {
        throw new Error('adminUsers not found in db.js')
      }
    } catch (importError) {
      console.error('Erreur import db.js:', importError)
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Chercher l'utilisateur dans Redis par username
    let user
    try {
      user = await adminUsers.getByUsername(username.trim())
    } catch (dbError) {
      console.error('Erreur recherche utilisateur:', dbError)
      return res.status(500).json({ error: 'Database error' })
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Vérifier que l'utilisateur a un mot de passe
    if (!user.password) {
      console.error('User found but no password:', user.username)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Vérifier le mot de passe avec bcrypt
    let passwordMatch
    try {
      passwordMatch = await bcrypt.compare(password, user.password)
    } catch (bcryptError) {
      console.error('Erreur comparaison mot de passe:', bcryptError)
      return res.status(500).json({ error: 'Server error' })
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role || 'admin',
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Générer le refresh token
    const refreshToken = jwt.sign(
      { 
        userId: user.id,
        type: 'refresh',
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      accessToken: token,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'admin'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
