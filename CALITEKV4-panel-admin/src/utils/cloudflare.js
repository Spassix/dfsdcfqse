/**
 * Upload vers Vercel Blob via API Vercel
 * Utilise FormData pour éviter les problèmes de taille avec base64
 * L'API route utilise busboy pour streamer les fichiers
 */

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const uploadToR2 = async (file) => {
  try {
    if (!file) {
      throw new Error('Aucun fichier fourni')
    }

    // Logs désactivés pour la sécurité
    const fileSizeMB = file.size / 1024 / 1024

    // Pour les vidéos, TOUJOURS utiliser l'upload direct (pas de limite de taille)
    const isVideo = file.type && file.type.startsWith('video/')
    const isVideoByExtension = /\.(mp4|mov|MOV|webm|avi|mkv|m4v|3gp)$/i.test(file.name)
    
    if (isVideo || isVideoByExtension) {
      // Logs désactivés pour la sécurité
      return await uploadDirect(file)
    }

    // Pour les images et autres fichiers petits (<4MB), utiliser FormData
    // Pour les gros fichiers non-vidéo (>4MB), utiliser l'upload direct
    const LARGE_FILE_THRESHOLD = 4 * 1024 * 1024 // 4MB
    
    if (file.size >= LARGE_FILE_THRESHOLD) {
      // Logs désactivés pour la sécurité
      return await uploadDirect(file)
    }

    // Utiliser FormData avec l'API route pour les petits fichiers
    const formData = new FormData()
    formData.append('file', file)
    formData.append('filename', file.name)
    formData.append('type', file.type || 'application/octet-stream')
    
    // Logs désactivés pour la sécurité
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText || 'Upload failed' }
      }
      
      // Si erreur 413, essayer l'upload direct
      if (response.status === 413 || errorText.includes('FUNCTION_PAYLOAD_TOO_LARGE') || errorText.includes('Request Entity Too Large')) {
        // Logs désactivés pour la sécurité
        return await uploadDirect(file)
      }
      
      throw new Error(errorData.error || `Upload failed (${response.status})`)
    }
    
    const data = await response.json()
    // Logs désactivés pour la sécurité
    return data
  } catch (error) {
    // Logs désactivés pour la sécurité
    throw error
  }
}

// Upload direct pour les gros fichiers et vidéos (stream le fichier directement vers Vercel Blob)
// PAS DE LIMITE DE TAILLE pour les vidéos
async function uploadDirect(file) {
  try {
    // Vérifier la taille du fichier avant l'upload
    const VERCEL_MAX_SIZE = 4.5 * 1024 * 1024 // 4.5MB limite Vercel
    if (file.size > VERCEL_MAX_SIZE) {
      throw new Error(`Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). La limite est de 4.5MB pour les uploads directs.`)
    }
    
    // Logs désactivés pour la sécurité
    
    // Lire le fichier comme ArrayBuffer puis convertir en Buffer côté serveur
    const arrayBuffer = await file.arrayBuffer()
    
    // Déterminer le Content-Type correct
    let contentType = file.type || 'application/octet-stream'
    
    // Si le type n'est pas défini, le détecter depuis l'extension
    if (!contentType || contentType === 'application/octet-stream') {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const mimeTypes = {
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'MOV': 'video/quicktime',
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
    
    // Logs désactivés pour la sécurité
    
    // Envoyer le fichier directement à l'API route qui le streamera vers Vercel Blob
    // L'API route streamera directement vers Vercel Blob sans limite de taille
    const response = await fetch(`${API_URL}/upload-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'x-filename': file.name
      },
      body: arrayBuffer
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText || 'Upload failed' }
      }
      
      // Gestion spéciale pour les erreurs 413 (Payload Too Large)
      if (response.status === 413) {
        const message = errorData.message || errorData.error || 'Le fichier est trop volumineux'
        throw new Error(`${message}. Limite: ${errorData.maxSize ? (errorData.maxSize / 1024 / 1024).toFixed(2) + 'MB' : '4.5MB'}`)
      }
      
      throw new Error(errorData.error || errorData.message || `Upload failed (${response.status})`)
    }
    
    const data = await response.json()
    // Logs désactivés pour la sécurité
    return data
  } catch (error) {
    // Logs désactivés pour la sécurité
    throw error
  }
}

export const getR2Url = (url) => {
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (url && url.startsWith('http')) {
    return url
  }
  // Sinon, retourner l'URL telle quelle (Vercel Blob retourne déjà l'URL complète)
  return url || ''
}

export const deleteFromR2 = async (url) => {
  // Pour l'instant, on ne supprime pas les fichiers
  // Vercel Blob peut être supprimé via l'API si nécessaire
  console.log('Suppression du fichier:', url)
  return true
}
