/**
 * API Route pour supprimer un fichier Vercel Blob
 * POST /api/delete-blob
 * Body: { url: string }
 */

import { deleteBlobFile } from './blob-utils.js'
import { verifyAuth } from './auth-utils.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vérifier l'authentification
    const auth = await verifyAuth(req)
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { url } = req.body

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' })
    }

    // Supprimer le fichier Blob
    const deleted = await deleteBlobFile(url)

    if (deleted) {
      return res.status(200).json({ success: true, message: 'File deleted successfully' })
    } else {
      // Le fichier n'existe pas ou n'est pas un fichier Blob
      return res.status(200).json({ success: true, message: 'File not found or not a Blob file' })
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
