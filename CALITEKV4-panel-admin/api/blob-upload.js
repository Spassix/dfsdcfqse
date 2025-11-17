// Route API pour gérer les uploads via @vercel/blob/client
// Cette route est appelée par Vercel Blob SDK côté client via handleUploadUrl
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  // Gestion CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-vercel-blob-file-name, x-vercel-blob-pathname');

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Seulement POST autorisé
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  try {
    // Vérifier le token
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      res.status(500).json({ error: 'Token Blob non configuré' });
      return;
    }

    // Récupérer le nom du fichier depuis les headers
    const fileName = req.headers['x-vercel-blob-file-name'] || `file_${Date.now()}`;
    const pathname = req.headers['x-vercel-blob-pathname'] || '';
    
    // Le body est le fichier brut - lire le stream sur Vercel
    // Sur Vercel Serverless Functions, on doit lire le stream manuellement
    let fileBuffer;
    
    try {
      // Méthode 1: Essayer de lire req comme stream
      if (req[Symbol.asyncIterator]) {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        fileBuffer = Buffer.concat(chunks);
      } else {
        // Méthode 2: Utiliser req.on pour les streams Node.js
        const chunks = [];
        await new Promise((resolve, reject) => {
          req.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });
          req.on('end', resolve);
          req.on('error', reject);
        });
        fileBuffer = Buffer.concat(chunks);
      }
    } catch (streamError) {
      // Méthode 3: Fallback - essayer req.body si disponible
      if (req.body) {
        if (Buffer.isBuffer(req.body)) {
          fileBuffer = req.body;
        } else {
          fileBuffer = Buffer.from(req.body);
        }
      } else {
        throw new Error('Impossible de lire le body: ' + streamError.message);
      }
    }
    
    if (!fileBuffer || fileBuffer.length === 0) {
      res.status(400).json({ error: 'Aucune donnée reçue' });
      return;
    }

    // Déterminer le chemin final
    let finalFileName = '';
    if (pathname) {
      // Si pathname est fourni, l'utiliser comme base (déjà avec chemin complet)
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      // Nettoyer le pathname mais garder la structure du chemin
      const sanitizedName = pathname.replace(/[^a-zA-Z0-9./_-]/g, '_');
      // Ajouter timestamp et suffixe avant l'extension
      if (sanitizedName.includes('.')) {
        const parts = sanitizedName.split('.');
        const ext = parts.pop();
        const nameWithoutExt = parts.join('.');
        finalFileName = `${nameWithoutExt}_${timestamp}_${randomSuffix}.${ext}`;
      } else {
        // Pas d'extension dans pathname, utiliser celle de fileName
        const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
        finalFileName = `${sanitizedName}_${timestamp}_${randomSuffix}.${ext}`;
      }
    } else {
      // Détecter selon l'extension
      const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
      let uploadPath = '';
      if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
        uploadPath = 'video';
      } else {
        uploadPath = 'products';
      }
      
      // Nom de fichier final avec chemin
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      finalFileName = `${uploadPath}/${sanitizedName}_${timestamp}_${randomSuffix}`;
    }

    console.log(`📤 Upload direct vers Blob: ${finalFileName} (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Upload vers Vercel Blob avec put()
    const blob = await put(finalFileName, fileBuffer, {
      access: 'public',
      token: token,
      addRandomSuffix: false,
    });

    console.log(`✅ Fichier uploadé: ${blob.url}`);

    // Retourner la réponse au format attendu par @vercel/blob/client
    res.status(200).json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: blob.size,
    });

  } catch (error) {
    console.error('❌ Erreur upload Blob:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'upload',
      details: error.message || String(error),
    });
  }
}

export const config = {
  api: {
    bodyParser: false, // Pas de parsing automatique pour les fichiers bruts
  },
  maxDuration: 300, // 5 minutes
};



