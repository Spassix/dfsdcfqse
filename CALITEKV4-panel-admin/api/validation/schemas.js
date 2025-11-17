/**
 * Schémas de validation Zod pour toutes les entrées API
 * Protection contre les injections et données malformées
 */

import { z } from 'zod'

// ============ AUTHENTIFICATION ============

export const loginSchema = z.object({
  username: z.string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(50, 'Le nom d\'utilisateur ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores')
    .trim(),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
})

// ============ PRODUITS ============

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .trim(),
  description: z.string()
    .max(5000, 'La description ne peut pas dépasser 5000 caractères')
    .optional()
    .default(''),
  category: z.string()
    .min(1, 'La catégorie est requise')
    .max(100, 'La catégorie ne peut pas dépasser 100 caractères')
    .trim(),
  farm: z.string()
    .max(100, 'Le nom de la ferme ne peut pas dépasser 100 caractères')
    .optional()
    .default(''),
  photo: z.string().url('URL de photo invalide').optional().default(''),
  video: z.string().url('URL de vidéo invalide').optional().default(''),
  medias: z.array(z.string().url()).optional().default([]),
  price: z.number()
    .min(0, 'Le prix ne peut pas être négatif')
    .max(999999, 'Le prix est trop élevé')
    .optional()
    .default(0),
  unit: z.string()
    .max(20, 'L\'unité ne peut pas dépasser 20 caractères')
    .optional()
    .default('g'),
  variants: z.array(z.object({
    grammage: z.number().min(0.1).max(100000),
    unit: z.string().max(20),
    price: z.number().min(0).max(999999)
  })).optional().default([]),
  featured: z.boolean().optional().default(false),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

export const productUpdateSchema = productSchema.partial().extend({
  id: z.string().min(1, 'L\'ID est requis')
})

// ============ CATÉGORIES ============

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  icon: z.string()
    .max(10, 'L\'icône ne peut pas dépasser 10 caractères')
    .optional()
    .default('🎁'),
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .default('')
})

// ============ FARMS ============

export const farmSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  image: z.string().url('URL d\'image invalide').optional().default(''),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional()
    .default('')
})

// ============ SOCIALS ============

export const socialSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .trim(),
  icon: z.string()
    .max(10, 'L\'icône ne peut pas dépasser 10 caractères')
    .optional()
    .default('🌐'),
  description: z.string()
    .max(200, 'La description ne peut pas dépasser 200 caractères')
    .optional()
    .default(''),
  url: z.string()
    .url('URL invalide')
    .max(500, 'L\'URL ne peut pas dépasser 500 caractères')
    .optional()
    .default('')
})

// ============ REVIEWS ============

export const reviewSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, 'L\'ID du produit est requis'),
  userId: z.string().min(1, 'L\'ID de l\'utilisateur est requis'),
  rating: z.number()
    .min(1, 'La note doit être entre 1 et 5')
    .max(5, 'La note doit être entre 1 et 5'),
  comment: z.string()
    .max(1000, 'Le commentaire ne peut pas dépasser 1000 caractères')
    .optional()
    .default(''),
  image: z.string().url('URL d\'image invalide').optional().default(''),
  approved: z.boolean().optional().default(false),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

// ============ PROMOS ============

export const promoSchema = z.object({
  id: z.string().optional(),
  code: z.string()
    .min(3, 'Le code doit contenir au moins 3 caractères')
    .max(20, 'Le code ne peut pas dépasser 20 caractères')
    .regex(/^[A-Z0-9_-]+$/, 'Le code ne peut contenir que des lettres majuscules, chiffres, tirets et underscores')
    .transform(val => val.toUpperCase()),
  discount: z.number()
    .min(0, 'La réduction ne peut pas être négative')
    .max(100, 'La réduction ne peut pas dépasser 100%'),
  minAmount: z.number()
    .min(0, 'Le montant minimum ne peut pas être négatif')
    .optional()
    .default(0),
  enabled: z.boolean().optional().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

// ============ ADMIN USERS ============

export const adminUserSchema = z.object({
  id: z.string().optional(),
  username: z.string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(50, 'Le nom d\'utilisateur ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores')
    .trim(),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
    .optional(),
  role: z.enum(['founder', 'manager', 'editor', 'admin'], {
    errorMap: () => ({ message: 'Le rôle doit être founder, manager, editor ou admin' })
  }).optional().default('editor')
})

// ============ SETTINGS ============

export const settingSchema = z.object({
  key: z.string()
    .min(1, 'La clé est requise')
    .max(100, 'La clé ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'La clé ne peut contenir que des lettres, chiffres, tirets et underscores'),
  value: z.union([z.string(), z.number(), z.boolean(), z.object({}).passthrough()])
})

// ============ VALIDATION HELPER ============

/**
 * Valide les données avec un schéma Zod
 * @param {z.ZodSchema} schema - Schéma Zod
 * @param {any} data - Données à valider
 * @returns {{success: boolean, data?: any, error?: string}}
 */
export function validate(schema, data) {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        success: false,
        error: firstError?.message || 'Validation échouée',
        details: error.errors
      }
    }
    return {
      success: false,
      error: 'Erreur de validation'
    }
  }
}

/**
 * Middleware de validation pour les routes API
 * @param {z.ZodSchema} schema - Schéma Zod
 * @returns {Function} - Middleware
 */
export function validateRequest(schema) {
  return async (req, res, next) => {
    try {
      let body = ''
      
      // Lire le body si ce n'est pas déjà fait
      if (req.body && typeof req.body === 'object') {
        body = req.body
      } else {
        await new Promise(resolve => {
          req.on('data', chunk => (body += chunk))
          req.on('end', resolve)
        })
        body = body ? JSON.parse(body) : {}
      }
      
      const validation = validate(schema, body)
      
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation échouée',
          message: validation.error,
          details: validation.details
        })
        return
      }
      
      req.validatedData = validation.data
      if (next) next()
    } catch (error) {
      res.status(400).json({
        error: 'Erreur de parsing',
        message: error.message
      })
    }
  }
}

