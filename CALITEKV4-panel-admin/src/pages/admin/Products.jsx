import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadToR2 } from '../../utils/cloudflare'
import { getAll, save, deleteById, deleteBlobFile } from '../../utils/api'
import { error as logError } from '../../utils/logger'

const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterFarm, setFilterFarm] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchCategoriesAndFarms()
  }, [])

  const fetchProducts = async () => {
    try {
      const data = await getAll('products')
      // Vérifier que data est un tableau
      if (Array.isArray(data)) {
        // Trier par catégorie puis par farm
        const sorted = data.sort((a, b) => {
          if (a.category !== b.category) {
            return (a.category || '').localeCompare(b.category || '')
          }
          return (a.farm || '').localeCompare(b.farm || '')
        })
        setProducts(sorted)
        setFilteredProducts(sorted)
      } else {
        console.error('Les produits ne sont pas un tableau:', data)
        setProducts([])
        setFilteredProducts([])
      }
    } catch (error) {
      logError('Error fetching products:', error)
      setProducts([])
      setFilteredProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les produits
  useEffect(() => {
    let filtered = [...products]

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par catégorie
    if (filterCategory) {
      filtered = filtered.filter(product => {
        const catId = String(product.category)
        const catName = getCategoryName(product.category)
        return catId === filterCategory || catName === filterCategory
      })
    }

    // Filtre par farm
    if (filterFarm) {
      filtered = filtered.filter(product => {
        const farmId = String(product.farm)
        const farmName = getFarmName(product.farm)
        return farmId === filterFarm || farmName === filterFarm
      })
    }

    setFilteredProducts(filtered)
  }, [searchTerm, filterCategory, filterFarm, products, categories, farms])

  const fetchCategoriesAndFarms = async () => {
    try {
      const cats = await getAll('categories')
      const farmsList = await getAll('farms')
      setCategories(Array.isArray(cats) ? cats : [])
      setFarms(Array.isArray(farmsList) ? farmsList : [])
    } catch (error) {
      logError('Error fetching categories/farms:', error)
      setCategories([])
      setFarms([])
    }
  }

  // Fonction pour convertir ID -> Nom
  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => String(c.id) === String(categoryId))
    return cat ? cat.name : categoryId
  }

  const getFarmName = (farmId) => {
    const farm = farms.find(f => String(f.id) === String(farmId))
    return farm ? farm.name : farmId
  }

  // Fonction pour détecter si c'est un iframe Cloudflare Stream
  const isCloudflareStreamIframe = (url) => {
    if (!url) return false
    return url.includes('cloudflarestream.com') && url.includes('iframe')
  }

  // Fonction pour détecter si c'est une vidéo
  const isVideo = (url) => {
    if (!url) return false
    
    // Vérifier les extensions vidéo (y compris celles des vidéos iPhone)
    const videoExtensions = ['.mp4', '.webm', '.mov', '.MOV', '.avi', '.mkv', '.m4v', '.3gp']
    if (videoExtensions.some(ext => url.toLowerCase().includes(ext))) return true
    
    // Vérifier les types MIME
    if (url.startsWith('data:video')) return true
    
    // Vérifier si c'est une URL Vercel Blob - TOUTES les URLs blob avec extension vidéo
    if ((url.includes('blob.vercel-storage.com') || url.includes('vercel-storage.com')) && 
        videoExtensions.some(ext => url.toLowerCase().includes(ext))) {
      return true
    }
    
    return false
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return

    try {
      await deleteById('products', id)
      fetchProducts()
    } catch (error) {
      logError('Error deleting product')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              Gestion des Produits
            </h1>
            <p className="text-white text-sm sm:text-base">
              {filteredProducts.length} produit(s) affiché(s) sur {products.length} au total
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-2"
          >
            <span>➕</span>
            <span className="whitespace-nowrap">Ajouter un produit</span>
          </button>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Rechercher un produit..."
              className="w-full px-4 py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-white transition-colors"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterFarm}
              onChange={(e) => setFilterFarm(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-white transition-colors"
            >
              <option value="">Toutes les farms</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid - Mobile | Table - Desktop */}
      <div className="neon-border rounded-2xl overflow-hidden bg-slate-900/50 backdrop-blur-sm">
        {/* Mobile Grid View */}
        <div className="lg:hidden grid grid-cols-1 gap-3 sm:gap-4 p-3 sm:p-4">
          {Array.isArray(filteredProducts) && filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800/30 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                  {(product.photo || product.video || product.image) ? (
                    isCloudflareStreamIframe(product.video || product.photo || product.image) ? (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-slate-900">
                        🎥
                      </div>
                    ) : isVideo(product.video || product.photo || product.image) ? (
                      <video
                        src={product.video || product.photo || product.image}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={product.photo || product.video || product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      📦
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{product.name}</h3>
                  <p className="text-white text-sm line-clamp-2">{product.description}</p>
                  <p className="text-white font-semibold mt-1">
                    {product.variants && product.variants.length > 0
                      ? product.variants[0].price
                      : product.quantities && product.quantities.length > 0
                      ? `${product.quantities[0].price}€`
                      : product.price || '0€'}
                  </p>
                  <p className="text-white text-xs">{getCategoryName(product.category)}</p>
                  {product.farm && <p className="text-white text-xs">🌾 {getFarmName(product.farm)}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 px-3 py-2 bg-gray-700/20 border border-gray-600/50 rounded-lg text-white hover:bg-gray-600/30 transition-colors text-sm"
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 px-3 py-2 bg-gray-800/20 border border-gray-600/50 rounded-lg text-white hover:bg-gray-700/30 transition-colors text-sm"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-semibold text-white">Image</th>
                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-semibold text-white">Nom</th>
                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-semibold text-white">Prix</th>
                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-semibold text-white">Catégorie</th>
                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-semibold text-white">Farm</th>
                <th className="px-4 xl:px-6 py-3 xl:py-4 text-right text-xs xl:text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {Array.isArray(filteredProducts) && filteredProducts.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 xl:px-6 py-3 xl:py-4">
                    <div className="w-12 h-12 xl:w-16 xl:h-16 rounded-lg overflow-hidden bg-slate-800">
                      {(product.photo || product.video || product.image) ? (
                        isCloudflareStreamIframe(product.video || product.photo || product.image) ? (
                          <div className="w-full h-full flex items-center justify-center text-2xl bg-slate-900 relative z-10">
                            🎥
                          </div>
                        ) : isVideo(product.video || product.photo || product.image) ? (
                          <video
                            src={product.video || product.photo || product.image}
                            className="w-full h-full object-cover relative z-10"
                            muted
                          />
                        ) : (
                          <img
                            src={product.photo || product.video || product.image}
                            alt={product.name}
                            className="w-full h-full object-cover relative z-10"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl relative z-10">
                          📦
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4">
                    <div className="text-white font-medium text-sm xl:text-base">{product.name}</div>
                    <div className="text-white text-xs xl:text-sm line-clamp-1">{product.description}</div>
                  </td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-white font-semibold text-sm xl:text-base">
                    {product.variants && product.variants.length > 0
                      ? product.variants[0].price
                      : product.quantities && product.quantities.length > 0
                      ? `${product.quantities[0].price}€`
                      : product.price || '0€'}
                  </td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-white text-sm xl:text-base">{getCategoryName(product.category)}</td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-white text-sm xl:text-base">{product.farm ? getFarmName(product.farm) : '-'}</td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4">
                    <div className="flex items-center justify-end space-x-1 xl:space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="px-2 xl:px-3 py-1.5 xl:py-2 bg-gray-700/20 border border-gray-600/50 rounded-lg text-white hover:bg-gray-600/30 transition-colors text-sm xl:text-base"
                        aria-label="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="px-2 xl:px-3 py-1.5 xl:py-2 bg-gray-800/20 border border-gray-600/50 rounded-lg text-white hover:bg-gray-700/30 transition-colors text-sm xl:text-base"
                        aria-label="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ProductModal
            product={editingProduct}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false)
              fetchProducts()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const ProductModal = ({ product, onClose, onSuccess }) => {
  // Initialiser les variantes : gérer variants (nouveaux) ET quantities (migrés)
  const getInitialVariants = () => {
    console.log('🔍 Initialisation variants pour produit:', product)
    
    if (product?.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      // Nouvelle structure
      console.log('✅ Utilisation variants:', product.variants)
      return product.variants.map(v => ({
        name: v.name || '',
        price: v.price || ''
      }))
    } else if (product?.quantities && Array.isArray(product.quantities) && product.quantities.length > 0) {
      // Ancienne structure (produits migrés) - convertir quantities en variants
      const converted = product.quantities.map(q => ({
        name: `${q.grammage}${q.unit}`,
        price: `${q.price}€`
      }))
      console.log('✅ Conversion quantities → variants:', converted)
      return converted
    } else if (product?.price) {
      // Fallback si seulement price existe
      console.log('✅ Fallback avec price:', product.price)
      return [{
        name: 'Standard',
        price: typeof product.price === 'number' ? `${product.price}€` : product.price
      }]
    } else {
      // Nouveau produit
      console.log('✅ Nouveau produit vide')
      return [{ name: '', price: '' }]
    }
  }

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    farm: product?.farm || ''
  })
  const [photo, setPhoto] = useState(product?.photo || product?.image || null)
  const [video, setVideo] = useState(product?.video || product?.media || null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [variants, setVariants] = useState(getInitialVariants())
  const [categories, setCategories] = useState([])
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const cats = await getAll('categories')
      const farmsList = await getAll('farms')
      setCategories(cats)
      setFarms(farmsList)
      
      // Si le produit a des noms (produits migrés), trouver les IDs correspondants
      if (product) {
        // Trouver l'ID de la catégorie si c'est un nom
        if (product.category && isNaN(product.category)) {
          const cat = cats.find(c => c.name === product.category)
          if (cat) {
            setFormData(prev => ({ ...prev, category: cat.id }))
          }
        }
        
        // Trouver l'ID de la farm si c'est un nom
        if (product.farm && isNaN(product.farm)) {
          const farm = farmsList.find(f => f.name === product.farm)
          if (farm) {
            setFormData(prev => ({ ...prev, farm: farm.id }))
          }
        }
      }
    }
    fetchData()
  }, [])

  const handlePhotoUpload = async (file) => {
    if (!file) {
      return
    }
    
    try {
      // Supprimer l'ancienne photo si elle existe
      if (photo && photo.includes('vercel-storage.com')) {
        await deleteBlobFile(photo)
      }
      
      const uploadResult = await uploadToR2(file)
      
      if (!uploadResult || !uploadResult.url) {
        throw new Error('Pas d\'URL dans la réponse du serveur')
      }
      
      setPhoto(uploadResult.url)
      alert('✅ Photo uploadée avec succès !')
    } catch (error) {
      logError('Erreur upload photo')
      alert('❌ Erreur lors de l\'upload de la photo: ' + error.message)
    }
  }

  const handleVideoUpload = async (file) => {
    if (!file) {
      return
    }
    
    // Vérifier que c'est bien une vidéo
    if (!file.type.startsWith('video/')) {
      alert('❌ Veuillez sélectionner un fichier vidéo')
      return
    }
    
    try {
      setUploadingVideo(true)
      
      // Supprimer l'ancienne vidéo si elle existe
      if (video && video.includes('vercel-storage.com')) {
        await deleteBlobFile(video)
      }
      
      const uploadResult = await uploadToR2(file)
      
      if (!uploadResult || !uploadResult.url) {
        throw new Error('Pas d\'URL dans la réponse du serveur')
      }
      
      // Vérifier que l'URL est valide
      if (!uploadResult.url || !uploadResult.url.startsWith('http')) {
        throw new Error('URL vidéo invalide reçue du serveur: ' + uploadResult.url)
      }
      
      setVideo(uploadResult.url)
      alert('✅ Vidéo uploadée avec succès !')
    } catch (error) {
      logError('Erreur upload vidéo')
      alert('❌ Erreur lors de l\'upload de la vidéo: ' + error.message)
    } finally {
      setUploadingVideo(false)
    }
  }

  const addVariant = () => {
    setVariants([...variants, { name: '', price: '' }])
  }

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index))
    }
  }

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants]
    newVariants[index][field] = value
    setVariants(newVariants)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Valider les variantes
      const validVariants = variants.filter(v => v.name && v.price)
      if (validVariants.length === 0) {
        alert('Veuillez ajouter au moins une variante valide')
        setLoading(false)
        return
      }

      // Construire le tableau de médias (photo en premier pour affichage, puis vidéo)
      const medias = []
      if (photo && photo.trim()) medias.push(photo) // Photo en premier pour l'affichage dans les cartes
      if (video && video.trim()) medias.push(video) // Vidéo ensuite
      
      // IMPORTANT : Préserver TOUTES les données existantes du produit
      // Pour les produits migrés, on garde quantities, media, customPrices, etc.
      const productData = product ? { ...product } : {}
      
      // Mettre à jour SEULEMENT les champs modifiés
      productData.name = formData.name.trim()
      productData.description = formData.description.trim()
      productData.category = formData.category
      productData.farm = formData.farm
      productData.photo = photo || productData.photo || ''
      productData.video = video || productData.video || ''
      productData.medias = medias.length > 0 ? medias : productData.medias
      productData.variants = validVariants
      productData.updatedAt = new Date().toISOString()
      
      // Pour la compatibilité avec l'ancien système
      if (!productData.image) {
        productData.image = video || photo || null
      }
      if (!productData.price && validVariants[0]) {
        productData.price = validVariants[0].price
      }

      // Si c'est une modification, préserver l'ID et createdAt
      if (product?.id) {
        productData.id = product.id
        productData.createdAt = productData.createdAt || new Date().toISOString()
      } else {
        // Pour un nouveau produit
        productData.createdAt = new Date().toISOString()
      }

      // Logs désactivés pour la sécurité
      const result = await save('products', productData)
      
      if (result && result.error) {
        throw new Error(result.error)
      }
      
      setLoading(false)
      onSuccess()
    } catch (error) {
      logError('Error saving product')
      alert('Erreur lors de la sauvegarde du produit: ' + (error.message || 'Erreur inconnue'))
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="neon-border rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 bg-slate-900 w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6">
          {product ? 'Modifier le produit' : 'Ajouter un produit'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Informations de base */}
          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">Nom du produit</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Nom du produit"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows="3"
              placeholder="Description du produit"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white transition-colors resize-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">Catégorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:border-white transition-colors"
            >
              <option value="">Sélectionner une catégorie</option>
              {Array.isArray(categories) && categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon && !cat.icon.startsWith('http') ? cat.icon + ' ' : ''}{cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">Farm</label>
            <select
              value={formData.farm}
              onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:border-white transition-colors"
            >
              <option value="">Aucune farm</option>
              {Array.isArray(farms) && farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Photo */}
          <div className="border border-gray-700/30 rounded-lg p-3 sm:p-4">
            <label className="block text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">📸 Photo du produit</label>
            
            {/* Aperçu de la photo */}
            {photo && (
              <div className="mb-3 relative group">
                <div className="w-full h-32 sm:h-40 rounded overflow-hidden bg-slate-800 border border-gray-700/30">
                  <img 
                    src={photo} 
                    alt="Aperçu photo" 
                    className="w-full h-full object-cover relative z-10"
                    onError={(e) => {
                      // Log désactivé pour la sécurité
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (photo && photo.includes('vercel-storage.com')) {
                      await deleteBlobFile(photo)
                    }
                    setPhoto(null)
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20 text-sm sm:text-base"
                >
                  ×
                </button>
              </div>
            )}

            {/* Upload photo */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handlePhotoUpload(e.target.files[0])
                  e.target.value = '' // Réinitialiser le champ
                }
              }}
              className="w-full px-3 sm:px-4 py-2 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-white file:mr-2 file:py-1 file:px-2 sm:file:px-3 file:rounded file:border-0 file:bg-gray-700 file:text-white file:text-xs file:cursor-pointer"
            />
          </div>

          {/* Vidéo */}
          <div className="border border-gray-700/30 rounded-lg p-3 sm:p-4">
            <label className="block text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">🎥 Vidéo du produit</label>
            
            {/* Aperçu de la vidéo */}
            {video && (
              <div className="mb-3 relative group">
                <div className="w-full h-32 sm:h-40 rounded overflow-hidden bg-slate-800 border border-gray-700/30 relative">
                  <video 
                    key={video}
                    src={video} 
                    className="w-full h-full object-cover relative z-10" 
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    onError={(e) => {
                      const videoEl = e.target
                      const error = videoEl.error
                      // Logs désactivés pour la sécurité
                      
                      // Afficher un message d'erreur
                      const errorMsg = document.createElement('div')
                      errorMsg.className = 'absolute inset-0 flex items-center justify-center bg-red-900/50 text-red-300 text-xs p-2 z-20'
                      errorMsg.textContent = `Erreur vidéo (Code: ${error?.code || '?'})`
                      videoEl.parentElement.appendChild(errorMsg)
                      
                      videoEl.style.display = 'none'
                    }}
                    onLoadedData={(e) => {
                      // Log désactivé pour la sécurité
                      const errorMsg = e.target.parentElement.querySelector('.bg-red-900\\/50')
                      if (errorMsg) errorMsg.remove()
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-20">
                    {video.includes('.mp4') ? 'MP4' : video.includes('.mov') ? 'MOV' : 'VIDÉO'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (video && video.includes('vercel-storage.com')) {
                      await deleteBlobFile(video)
                    }
                    setVideo(null)
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20 text-sm sm:text-base"
                >
                  ×
                </button>
              </div>
            )}

            {/* Upload vidéo */}
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleVideoUpload(e.target.files[0])
                  e.target.value = '' // Réinitialiser le champ
                }
              }}
              disabled={uploadingVideo}
              className="w-full px-3 sm:px-4 py-2 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-white file:mr-2 file:py-1 file:px-2 sm:file:px-3 file:rounded file:border-0 file:bg-gray-700 file:text-white file:text-xs file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {uploadingVideo && (
              <p className="text-blue-400 text-xs sm:text-sm mt-2 flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Upload de la vidéo en cours...
              </p>
            )}
            <p className="text-white text-xs mt-2">Taille max: 500MB (vidéos iPhone en bonne qualité acceptées)</p>
          </div>

          {/* Variantes */}
          <div className="border border-gray-700/30 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
              <label className="block text-white font-semibold text-sm sm:text-base">💰 Variantes (Quantité + Prix)</label>
              <button
                type="button"
                onClick={addVariant}
                className="px-3 py-1.5 sm:py-1 bg-gray-700 text-white rounded text-xs sm:text-sm hover:bg-gray-600 transition-colors"
              >
                + Ajouter
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {variants.map((variant, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-800/50 p-2 sm:p-3 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="5g"
                      value={variant.name || ''}
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-gray-700/30 rounded text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="20€"
                      value={variant.price || ''}
                      onChange={(e) => updateVariant(index, 'price', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-gray-700/30 rounded text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white"
                      required
                    />
                  </div>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="px-3 py-2 bg-gray-800/20 text-white rounded hover:bg-gray-700/30 text-sm sm:text-base transition-colors sm:w-auto w-full"
                    >
                      🗑️ Supprimer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading || uploadingVideo}
              className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold text-sm sm:text-base hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadingVideo}
              className="flex-1 py-2.5 sm:py-3 bg-gray-700 rounded-lg text-white font-semibold text-sm sm:text-base hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default AdminProducts
