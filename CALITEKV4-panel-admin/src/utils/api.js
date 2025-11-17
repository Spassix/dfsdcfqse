/**
 * API Client pour communiquer avec Cloudflare Worker
 */

// Construire l'URL de manière obfusquée pour masquer dans le code source
const getAPIUrl = () => {
  const env = import.meta.env.VITE_API_URL
  if (env) return env
  const parts = ['/', 'api']
  return parts.join('')
}

const API_URL = getAPIUrl()

/**
 * Récupère les headers avec authentification si disponible
 */
function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  }
  
  // Ajouter le token d'authentification si disponible
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

// ============ PRODUCTS ============
export const getAll = async (type) => {
  try {
    if (type === 'products') {
      const response = await fetch(`${API_URL}/products`)
      if (!response.ok) {
        console.error(`Erreur ${response.status} lors de la récupération des produits`)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    }
    
    if (type === 'categories') {
      const response = await fetch(`${API_URL}/categories`)
      if (!response.ok) {
        console.error(`Erreur ${response.status} lors de la récupération des catégories`)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    }
    
    if (type === 'socials') {
      const response = await fetch(`${API_URL}/socials`)
      if (!response.ok) {
        console.error(`Erreur ${response.status} lors de la récupération des réseaux sociaux`)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    }
    
    if (type === 'settings') {
      const response = await fetch(`${API_URL}/settings`)
      if (!response.ok) {
        console.error(`Erreur ${response.status} lors de la récupération des paramètres`)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    }
    
    if (type === 'events') {
      const response = await fetch(`${API_URL}/events`)
      if (!response.ok) {
        console.error(`Erreur ${response.status} lors de la récupération des événements`)
        return {}
      }
      const data = await response.json()
      return data || {}
    }
    
    if (type === 'reviews') {
      const response = await fetch(`${API_URL}/reviews`)
      if (!response.ok) {
        console.error(`Erreur ${response.status} lors de la récupération des avis`)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    }
    
    if (type === 'farms') {
      const response = await fetch(`${API_URL}/farms`)
      if (!response.ok) {
        console.error(`Erreur ${response.status} lors de la récupération des farms`)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    }
    
    if (type === 'promos') {
      const response = await fetch(`${API_URL}/promos`)
      if (!response.ok) {
        console.error(`Erreur ${response.status} lors de la récupération des promos`)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    }
    
    return []
  } catch (error) {
    console.error(`Erreur lors de la récupération de ${type}:`, error)
    // Retourner un tableau vide pour les types qui attendent un tableau
    if (['products', 'categories', 'socials', 'farms', 'reviews', 'promos'].includes(type)) {
      return []
    }
    // Retourner un objet vide pour les autres types
    return {}
  }
}

export const getById = async (type, id) => {
  if (type === 'products') {
    const response = await fetch(`${API_URL}/products/${id}`)
    return await response.json()
  }
  
  if (type === 'settings') {
    try {
      console.log(`=== getById settings/${id} ===`)
      console.log('URL:', `${API_URL}/settings/${id}`)
      const response = await fetch(`${API_URL}/settings/${id}`)
      console.log('Response status:', response.status, response.ok)
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Setting not found (404)')
          return null
        }
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      console.log('=== getById settings response ===')
      console.log('Raw data:', JSON.stringify(data, null, 2))
      console.log('data.value:', JSON.stringify(data?.value, null, 2))
      return data
    } catch (error) {
      console.error(`=== Error fetching setting ${id} ===`)
      console.error('Error:', error)
      console.error('Stack:', error.stack)
      return null
    }
  }
  
  if (type === 'reviews') {
    try {
      const response = await fetch(`${API_URL}/reviews/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Error fetching review ${id}:`, error)
      return null
    }
  }
  
  return null
}

export const deleteById = async (type, id) => {
  try {
    const response = await fetch(`${API_URL}/${type}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
      }
      throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error deleting ${type} ${id}:`, error)
    throw error
  }
}

export const save = async (type, data) => {
  if (type === 'products') {
    // Pour les nouveaux produits, toujours utiliser POST
    // Pour les mises à jour, utiliser PUT avec l'ID existant
    const isNew = !data.id || data.id === 'new'
    
    if (isNew) {
      // Nouveau produit - POST sans ID dans l'URL
      const url = `${API_URL}/products`
      console.log('Product save (POST):', { url, method: 'POST', data })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      
      console.log('Product save response:', { status: response.status, statusText: response.statusText, ok: response.ok })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Product save error:', { status: response.status, errorText })
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
        }
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
      }
      
      return await response.json()
    } else {
      // Mise à jour - PUT avec ID
      const response = await fetch(`${API_URL}/products/${data.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
        }
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
      }
      
      return await response.json()
    }
  }
  
  if (type === 'categories') {
    const isNew = !data.id || data.id === 'new'
    
    if (isNew) {
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
        }
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
      }
      
      return await response.json()
    } else {
      const response = await fetch(`${API_URL}/categories/${data.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
        }
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
      }
      
      return await response.json()
    }
  }
  
  if (type === 'socials') {
    const isNew = !data.id || data.id === 'new'
    
    if (isNew) {
      const response = await fetch(`${API_URL}/socials`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
        }
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
      }
      
      return await response.json()
    } else {
      // Mise à jour - PUT avec ID
      const response = await fetch(`${API_URL}/socials/${data.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
        }
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
      }
      
      return await response.json()
    }
  }
  
  if (type === 'settings') {
    if (!data.key) {
      throw new Error('La clé (key) est requise pour sauvegarder les settings')
    }
    
    const url = `${API_URL}/settings/${data.key}`
    console.log('Settings save request:', { url, method: 'PUT', data })
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    console.log('Settings save response:', { status: response.status, statusText: response.statusText, ok: response.ok })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Settings save error:', { status: response.status, errorText })
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
      }
      throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
    }
    
    return await response.json()
  }
  
  if (type === 'reviews') {
    const isNew = !data.id || data.id === 'new'
    
    if (isNew) {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
        }
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
      }
      
      return await response.json()
    } else {
      const response = await fetch(`${API_URL}/reviews/${data.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
        }
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
      }
      
      return await response.json()
    }
  }
  
  if (type === 'farms') {
    // Pour les nouvelles farms, toujours utiliser POST
    // Pour les mises à jour, utiliser PUT avec l'ID existant
    const isNew = !data.id || data.id === 'new'
    
    if (isNew) {
      // Nouvelle farm - POST sans ID dans l'URL
      const response = await fetch(`${API_URL}/farms`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
        }
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
      }
      
      return await response.json()
    } else {
      // Mise à jour - PUT avec ID
      const response = await fetch(`${API_URL}/farms/${data.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
        }
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
      }
      
      return await response.json()
    }
  }
  
  if (type === 'settings') {
    // Pour les settings, utiliser PUT avec la clé dans l'URL
    const key = data.key || data.id
    if (!key) {
      throw new Error('Key is required for settings')
    }
    
    const requestBody = {
      key: key,
      value: data.value
    }
    console.log('=== Settings save request ===')
    console.log('Key:', key)
    console.log('Value:', JSON.stringify(data.value, null, 2))
    console.log('Request body:', JSON.stringify(requestBody, null, 2))
    console.log('URL:', `${API_URL}/settings/${key}`)
    
    const response = await fetch(`${API_URL}/settings/${key}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('=== Settings save ERROR ===')
      console.error('Status:', response.status)
      console.error('Error text:', errorText)
      console.error('URL:', `${API_URL}/settings/${key}`)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
      }
      throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
    }
    
    const result = await response.json()
    console.log('=== Settings save response ===')
    console.log('Result:', JSON.stringify(result, null, 2))
    return result
  }
  
  throw new Error(`Type non supporté: ${type}`)
}

/**
 * Supprime un fichier Vercel Blob
 * @param {string} url - URL du fichier à supprimer
 */
export const deleteBlobFile = async (url) => {
  if (!url || !url.includes('vercel-storage.com')) {
    // Ce n'est pas un fichier Blob, ignorer
    return { success: true }
  }

  try {
    const response = await fetch(`${API_URL}/delete-blob`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        throw new Error(`Erreur ${response.status}: ${response.statusText || errorText}`)
      }
      throw new Error(errorData.error || errorData.message || `Erreur ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error deleting blob file:', error)
    // Ne pas faire échouer l'opération si la suppression échoue
    return { success: false, error: error.message }
  }
}
