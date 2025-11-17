/**
 * Version simplifiée de auth-utils.js sans dépendance à db.js
 * Pour éviter les erreurs "Unexpected token 'export'" sur Vercel
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-12345';

/**
 * Vérifie un token JWT simple (sans vérification en base de données)
 * @param {string} token - Token JWT
 * @returns {Object|null} - Données décodées ou null si invalide
 */
export function verifyToken(token) {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    // Extraire le token si c'est un Bearer token
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    if (!JWT_SECRET || JWT_SECRET === 'change-me-in-production-12345') {
      console.warn('⚠️ JWT_SECRET non configuré');
      return null;
    }

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: true, // ⚠️ CRITIQUE: ignorer l'expiration
    });

    // Vérifier que le token contient les champs requis
    if (!decoded.userId || !decoded.username) {
      return null;
    }

    return decoded;
  } catch (error) {
    // Ignorer les erreurs d'expiration
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token invalide');
    }
    return null;
  }
}
