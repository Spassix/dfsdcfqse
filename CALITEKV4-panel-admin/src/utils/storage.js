// Gestion du stockage avec IndexedDB (beaucoup plus d'espace que localStorage)

const DB_NAME = 'AvecAmourDB'
const DB_VERSION = 1

// Initialiser IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Store pour les produits
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' })
      }
      
      // Store pour les catégories
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' })
      }
      
      // Store pour les réseaux sociaux
      if (!db.objectStoreNames.contains('socials')) {
        db.createObjectStore('socials', { keyPath: 'id' })
      }
      
      // Store pour les paramètres
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }
  })
}

// Obtenir tous les éléments d'un store
export const getAll = async (storeName) => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Obtenir un élément par ID
export const getById = async (storeName, id) => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(id)
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Ajouter ou mettre à jour un élément
export const save = async (storeName, item) => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(item)
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Supprimer un élément
export const remove = async (storeName, id) => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Sauvegarder tous les éléments (remplace tout)
export const saveAll = async (storeName, items) => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    
    // Vider le store d'abord
    store.clear()
    
    // Ajouter tous les éléments
    items.forEach(item => store.put(item))
    
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// Migration depuis localStorage vers IndexedDB
export const migrateFromLocalStorage = async () => {
  try {
    // Migrer les produits
    const productsStr = localStorage.getItem('products')
    if (productsStr) {
      const products = JSON.parse(productsStr)
      await saveAll('products', products)
      console.log('✅ Produits migrés vers IndexedDB')
    }
    
    // Initialiser les catégories par défaut si aucune
    const categories = await getAll('categories')
    if (categories.length === 0) {
      const defaultCategories = [
        { id: '1', name: 'Catégorie 1', icon: '🎁', description: 'Description catégorie 1' },
        { id: '2', name: 'Catégorie 2', icon: '💎', description: 'Description catégorie 2' }
      ]
      await saveAll('categories', defaultCategories)
    }
    
    // Initialiser les réseaux sociaux par défaut
    const socials = await getAll('socials')
    if (socials.length === 0) {
      const defaultSocials = [
        { id: '1', icon: '🌳', name: 'Linktree', description: 'Mon diapositive', url: '#' },
        { id: '2', icon: '💬', name: 'WhatsApp', description: 'Contactez-nous directement', url: '#' },
        { id: '3', icon: '📱', name: 'Telegram', description: 'Rejoignez notre canal', url: '#' },
        { id: '4', icon: '📷', name: 'Instagram', description: 'Suivez-nous', url: '#' }
      ]
      await saveAll('socials', defaultSocials)
    }
    
  } catch (error) {
    console.error('Erreur lors de la migration:', error)
  }
}

// Initialiser au chargement
migrateFromLocalStorage()
