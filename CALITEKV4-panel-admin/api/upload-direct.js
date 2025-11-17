import { put } from '@vercel/blob'

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 300, // 5 minutes pour les gros fichiers
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vérifier que BLOB_READ_WRITE_TOKEN est configuré
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' })
    }

    // Vérifier la taille du Content-Length si disponible
    const contentLength = req.headers['content-length']
    const VERCEL_MAX_SIZE = 4.5 * 1024 * 1024 // 4.5MB limite Vercel
    const MAX_SIZE = 500 * 1024 * 1024 // 500MB max théorique
    
    if (contentLength && parseInt(contentLength) > VERCEL_MAX_SIZE) {
      return res.status(413).json({ 
        error: 'File too large for direct upload',
        message: 'Les fichiers de plus de 4.5MB doivent être uploadés via une autre méthode',
        maxSize: VERCEL_MAX_SIZE,
        actualSize: parseInt(contentLength)
      })
    }

    // Lire le body directement comme stream (chunk par chunk pour éviter de charger tout en mémoire)
    const chunks = []
    let totalSize = 0
    
    try {
      for await (const chunk of req) {
        totalSize += chunk.length
        if (totalSize > MAX_SIZE) {
          return res.status(413).json({ error: 'File too large (max 500MB)' })
        }
        chunks.push(chunk)
      }
    } catch (streamError) {
      // Si erreur lors de la lecture du stream, probablement une limite Vercel
      if (streamError.message && streamError.message.includes('413')) {
        return res.status(413).json({ 
          error: 'File too large',
          message: 'Le fichier dépasse la limite de taille autorisée (4.5MB max pour les uploads directs)',
          maxSize: VERCEL_MAX_SIZE
        })
      }
      throw streamError
    }
    
    const buffer = Buffer.concat(chunks)

    // Récupérer les headers pour le nom de fichier et le type
    const filename = req.headers['x-filename'] || `file_${Date.now()}`
    let contentType = req.headers['content-type'] || 'application/octet-stream'
    
    // Si le content-type est générique, essayer de le détecter depuis l'extension
    if (contentType === 'application/octet-stream' || (!contentType.includes('video') && !contentType.includes('image'))) {
      const ext = filename.split('.').pop()?.toLowerCase()
      const mimeTypes = {
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'webm': 'video/webm',
        'avi': 'video/x-msvideo',
        'mkv': 'video/x-matroska',
        'm4v': 'video/x-m4v',
        '3gp': 'video/3gpp',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
      }
      if (ext && mimeTypes[ext]) {
        contentType = mimeTypes[ext]
      }
    }
    

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const extension = filename.split('.').pop() || 'bin'
    const uniqueFilename = `${timestamp}_${randomStr}.${extension}`


    // Upload vers Vercel Blob avec le bon Content-Type
    // S'assurer que le Content-Type est correct pour les vidéos
    const finalContentType = contentType || 'application/octet-stream'
    
    
    const blob = await put(uniqueFilename, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: finalContentType,
      addRandomSuffix: false, // Garder le nom de fichier tel quel pour préserver l'extension
    })


    return res.json({
      success: true,
      url: blob.url,
      filename: uniqueFilename,
      size: buffer.length,
      type: contentType
    })
  } catch (error) {
    // Erreur silencieuse
    
    // Détecter les erreurs 413 de Vercel
    if (error.status === 413 || error.message?.includes('413') || error.message?.includes('Payload Too Large')) {
      return res.status(413).json({ 
        error: 'File too large',
        message: 'Le fichier dépasse la limite de taille autorisée (4.5MB max pour les uploads directs sur Vercel)',
        maxSize: 4.5 * 1024 * 1024,
        suggestion: 'Utilisez une méthode d\'upload alternative pour les fichiers volumineux'
      })
    }
    
    return res.status(500).json({ error: error.message || 'Upload failed' })
  }
}
