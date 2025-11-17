import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../components/Header'
import { useCart } from '../contexts/CartContext'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])
  const [farms, setFarms] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [selectedMedia, setSelectedMedia] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [orderLink, setOrderLink] = useState('#')
  const [orderButtonText, setOrderButtonText] = useState('Commander')

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { getById, getAll } = await import('../utils/api')
      
      // Charger le produit
      const productData = await getById('products', id)
      
      if (!productData) {
        setError('Produit non trouvé')
        setLoading(false)
        return
      }
      
      setProduct(productData)
      
      // Charger les catégories et farms
      const [categoriesData, farmsData] = await Promise.all([
        getAll('categories'),
        getAll('farms')
      ])
      
      setCategories(categoriesData || [])
      setFarms(farmsData || [])
      
      // Charger les paramètres de commande
      try {
        const orderSettings = await getById('settings', 'order')
        if (orderSettings?.value) {
          if (orderSettings.value.orderLink) {
            setOrderLink(orderSettings.value.orderLink)
          }
          if (orderSettings.value.orderButtonText) {
            setOrderButtonText(orderSettings.value.orderButtonText)
          }
        }
      } catch (err) {
        console.error('Erreur paramètres de commande:', err)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Erreur chargement produit:', err)
      setError('Erreur lors du chargement du produit')
      setLoading(false)
    }
  }

  // Fonction pour détecter si c'est une vidéo
  const isVideo = (url) => {
    if (!url) return false
    const videoExtensions = ['.mp4', '.webm', '.mov', '.MOV', '.avi', '.mkv', '.m4v']
    return videoExtensions.some(ext => url.toLowerCase().includes(ext))
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Chargement du produit...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error
  if (error || !product) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Header />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8">
              <p className="text-red-400 text-xl mb-4">❌ {error || 'Produit non trouvé'}</p>
              <Link to="/products">
                <button className="px-6 py-3 bg-white text-white rounded-lg hover:bg-gray-200 transition-colors">
                  ← Retour aux produits
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Construire la liste des médias
  const medias = []
  
  // 1. Photo en premier (pour affichage prioritaire)
  if (product.photo && product.photo.trim()) {
    medias.push(product.photo)
  }
  
  // 2. Image (si différente de photo)
  if (product.image && product.image.trim() && product.image !== product.photo) {
    medias.push(product.image)
  }
  
  // 3. Vidéo (toujours afficher)
  if (product.video && product.video.trim()) {
    if (!medias.includes(product.video)) {
      medias.push(product.video)
    }
  }
  
  // 4. Media field (ancienne structure)
  if (product.media && product.media.trim()) {
    if (!medias.includes(product.media)) {
      medias.push(product.media)
    }
  }
  
  // 5. Tableau medias (nouvelle structure)
  if (product.medias && Array.isArray(product.medias)) {
    product.medias.forEach(media => {
      if (media && media.trim() && !medias.includes(media)) {
        medias.push(media)
      }
    })
  }
  
  // Médias du produit configurés

  const currentMedia = medias[selectedMedia] || medias[0]

  // Construire les variantes
  let variants = []
  
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    // Nouvelle structure
    variants = product.variants
  } else if (product.quantities && Array.isArray(product.quantities) && product.quantities.length > 0) {
    // Ancienne structure (produits migrés)
    variants = product.quantities.map(q => ({
      name: `${q.grammage}${q.unit}`,
      price: `${q.price}€`
    }))
  } else if (product.price) {
    // Fallback
    variants = [{
      name: 'Standard',
      price: typeof product.price === 'number' ? `${product.price}€` : product.price
    }]
  } else {
    variants = [{
      name: 'Standard',
      price: 'Prix sur demande'
    }]
  }

  const currentVariant = variants[selectedVariant] || variants[0]

  // Trouver les noms de catégorie et farm
  let categoryName = product.category || 'Sans catégorie'
  let farmName = product.farm || 'Non spécifiée'
  
  // Si c'est un ID numérique, chercher le nom
  if (product.category && !isNaN(product.category)) {
    const cat = categories.find(c => String(c.id) === String(product.category))
    if (cat) categoryName = cat.name
  }
  
  if (product.farm && !isNaN(product.farm)) {
    const f = farms.find(fm => String(fm.id) === String(product.farm))
    if (f) farmName = f.name
  }

  const handleAddToCart = () => {
    addToCart(product, currentVariant, quantity)
    alert(`✅ ${product.name} (${currentVariant.name}) x${quantity} ajouté au panier !`)
  }

  const handleBuyNow = () => {
    addToCart(product, currentVariant, quantity)
    navigate('/cart')
  }

  const handleCommand = () => {
    if (!orderLink || orderLink === '#') {
      alert('Lien de commande non configuré. Contactez l\'administrateur.')
      return
    }
    
    const message = `Bonjour, je voudrais commander:\n\n${product.name}\n${currentVariant.name} - ${currentVariant.price}`
    
    if (orderLink.includes('wa.me') || orderLink.includes('whatsapp')) {
      const urlWithMessage = `${orderLink}${orderLink.includes('?') ? '&' : '?'}text=${encodeURIComponent(message)}`
      window.open(urlWithMessage, '_blank')
    } else {
      window.open(orderLink, '_blank')
    }
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <Header />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center space-x-2 text-white text-sm"
          >
            <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-white transition-colors">Produits</Link>
            <span>/</span>
            <span className="text-white truncate">{product.name}</span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Galerie Médias */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Média Principal */}
              <div className="neon-border rounded-2xl overflow-hidden bg-slate-900/50 backdrop-blur-sm aspect-square">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedMedia}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full"
                  >
                    {currentMedia ? (
                      isVideo(currentMedia) ? (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <video
                            src={currentMedia}
                            className="w-full h-full object-contain"
                            controls
                            loop
                            playsInline
                          />
                        </div>
                      ) : (
                        <img
                          src={currentMedia}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-9xl">
                        🎁
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Miniatures */}
              {medias.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {medias.map((media, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedMedia(index)}
                      className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedMedia === index
                          ? 'border-white shadow-lg'
                          : 'border-gray-700/30 hover:border-white/50'
                      }`}
                    >
                      {isVideo(media) ? (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <div className="text-3xl">🎥</div>
                        </div>
                      ) : (
                        <img 
                          src={media} 
                          alt={`${product.name} ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Informations Produit */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Titre et Badges */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
                  {product.name}
                </h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categoryName && (
                    <span className="px-3 py-1 bg-black/80 backdrop-blur-sm border border-white/50 rounded-full text-white text-sm">
                      🏷️ {categoryName}
                    </span>
                  )}
                  {farmName && (
                    <span className="px-3 py-1 bg-black/80 backdrop-blur-sm border border-white/50 rounded-full text-white text-sm">
                      🌾 {farmName}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="neon-border rounded-xl p-6 bg-black/90 backdrop-blur-xl border-2 border-white/30">
                  <h3 className="text-xl font-bold text-white mb-3">📝 Description</h3>
                  <p className="text-white leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Variantes */}
              <div className="neon-border rounded-xl p-6 bg-black/90 backdrop-blur-xl border-2 border-white/30">
                <h3 className="text-xl font-bold text-white mb-4">💰 Options & Prix</h3>
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedVariant(index)}
                      className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                        selectedVariant === index
                          ? 'border-white bg-white/10 text-white'
                          : 'border-gray-700/30 bg-slate-800/50 text-white hover:border-white/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{selectedVariant === index ? '✓' : '○'}</span>
                        <div className="text-left">
                          <div className="text-lg font-bold text-white">{variant.name}</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white">{variant.price}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quantité et Boutons */}
              <div className="neon-border rounded-xl p-6 bg-black/90 backdrop-blur-xl border-2 border-white/30 space-y-4">
                {/* Sélecteur de quantité */}
                <div>
                  <label className="block text-white font-bold mb-2">Quantité</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold text-xl"
                    >
                      -
                    </button>
                    <span className="text-white font-bold text-xl w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold text-xl"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="space-y-2">
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <span>🛒</span>
                    <span>Ajouter au panier</span>
                  </button>
                  
                  <button
                    onClick={handleBuyNow}
                    className="w-full py-4 bg-white rounded-lg text-white font-bold text-lg hover:bg-gray-200 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 border-2 border-white"
                  >
                    <span>⚡</span>
                    <span>Acheter maintenant</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
