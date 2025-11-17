/**
 * Utilitaires pour gérer les fichiers Vercel Blob
 */

import { del } from '@vercel/blob'

/**
 * Supprime un fichier depuis Vercel Blob
 * @param {string} url - URL complète du fichier Blob
 * @returns {Promise<boolean>} - True si supprimé avec succès
 */
export async function deleteBlobFile(url) {
  if (!url || !url.includes('vercel-storage.com')) {
    // Ce n'est pas un fichier Blob, ignorer
    return false
  }

  try {
    // Vercel Blob del() accepte soit l'URL complète, soit le nom du fichier
    // On peut utiliser l'URL complète directement
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN
    })

    return true
  } catch (error) {
    // Logs désactivés pour la sécurité
    // Ignorer les erreurs de suppression (fichier peut ne pas exister)
    return false
  }
}

/**
 * Supprime plusieurs fichiers depuis Vercel Blob
 * @param {string[]} urls - Tableau d'URLs de fichiers Blob
 * @returns {Promise<number>} - Nombre de fichiers supprimés avec succès
 */
export async function deleteBlobFiles(urls) {
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return 0
  }

  let deletedCount = 0
  
  // Supprimer tous les fichiers en parallèle
  const deletePromises = urls.map(url => deleteBlobFile(url))
  const results = await Promise.allSettled(deletePromises)
  
  deletedCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length
  
  return deletedCount
}
