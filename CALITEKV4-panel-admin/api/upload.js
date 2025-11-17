import { put } from '@vercel/blob'
import Busboy from 'busboy'

// Désactiver le bodyParser pour permettre l'upload de fichiers volumineux
// Augmenter maxDuration pour les gros fichiers (300 secondes = 5 minutes)
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

    // Parser FormData avec busboy
    // Busboy permet de streamer les fichiers sans les charger entièrement en mémoire
    return new Promise((resolve, reject) => {
      const bb = Busboy({ headers: req.headers })
      let fileBuffer = null
      let filename = null
      let contentType = null
      let fileReceived = false

      bb.on('file', (name, file, info) => {
        const { filename: fileName, encoding, mimeType } = info
        filename = fileName
        contentType = mimeType || 'application/octet-stream'
        fileReceived = true
        
        console.log('📥 Réception du fichier:', filename, 'Type:', contentType)
        
        const chunks = []
        file.on('data', (data) => {
          chunks.push(data)
        })
        
        file.on('end', async () => {
          try {
            fileBuffer = Buffer.concat(chunks)
            console.log('✅ Fichier reçu, taille:', (fileBuffer.length / 1024 / 1024).toFixed(2) + 'MB')
            
            // Générer un nom de fichier unique
            const timestamp = Date.now()
            const randomStr = Math.random().toString(36).substring(2, 15)
            const extension = filename.split('.').pop() || 'bin'
            const uniqueFilename = `${timestamp}_${randomStr}.${extension}`

            console.log('📤 Upload vers Vercel Blob:', uniqueFilename)
            
            // Upload vers Vercel Blob
            const blob = await put(uniqueFilename, fileBuffer, {
              access: 'public',
              token: process.env.BLOB_READ_WRITE_TOKEN,
              contentType: contentType,
            })

            console.log('✅ Upload Blob réussi:', blob.url)

            res.json({
              success: true,
              url: blob.url,
              filename: uniqueFilename,
              size: fileBuffer.length,
              type: contentType
            })
            resolve()
          } catch (error) {
            console.error('❌ Upload error:', error)
            res.status(500).json({ error: error.message || 'Upload failed' })
            resolve()
          }
        })
      })

      bb.on('error', (error) => {
        console.error('❌ Busboy error:', error)
        res.status(500).json({ error: error.message || 'Failed to parse file' })
        resolve()
      })

      bb.on('finish', () => {
        if (!fileReceived) {
          res.status(400).json({ error: 'No file received' })
          resolve()
        }
      })

      req.pipe(bb)
    })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ error: error.message || 'Upload failed' })
  }
}
