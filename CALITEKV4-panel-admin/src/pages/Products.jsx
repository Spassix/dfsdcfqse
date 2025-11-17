import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedFarm, setSelectedFarm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Récupérer les paramètres d'URL au chargement
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [searchParams])

  useEffect(() => {
    filterProducts()
  }, [searchTerm, selectedCategory, selectedFarm, allProducts])

  const fetchData = async () => {
    try {
      const { getAll, getById } = await import('../utils/api')
      const productsData = await getAll('products')
      const categoriesData = await getAll('categories')
      const farmsData = await getAll('farms')
      
      // Récupérer l'image de fond de la boutique
      try {
        const settingsData = await getById('settings', 'general')
        if (settingsData && settingsData.value && settingsData.value.backgroundImage) {
          setBackgroundImage(settingsData.value.backgroundImage)
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'image de fond:', error)
      }
      
      setAllProducts(productsData)
      setProducts(productsData)
      setCategories(categoriesData)
      setFarms(farmsData)
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = [...allProducts]

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter(product => {
        // Les produits migrés ont le nom directement, les nouveaux ont l'ID
        if (String(product.category) === String(selectedCategory)) return true
        // Chercher par ID si c'est un nombre
        if (!isNaN(product.category)) {
          const cat = categories.find(c => String(c.id) === String(product.category))
          return cat && String(cat.id) === String(selectedCategory)
        }
        // Chercher par nom
        const cat = categories.find(c => c.name === product.category)
        return cat && String(cat.id) === String(selectedCategory)
      })
    }

    // Filtre par farm
    if (selectedFarm) {
      filtered = filtered.filter(product => {
        // Les produits migrés ont le nom directement, les nouveaux ont l'ID
        if (String(product.farm) === String(selectedFarm)) return true
        // Chercher par ID si c'est un nombre
        if (!isNaN(product.farm)) {
          const f = farms.find(fm => String(fm.id) === String(product.farm))
          return f && String(f.id) === String(selectedFarm)
        }
        // Chercher par nom
        const f = farms.find(fm => fm.name === product.farm)
        return f && String(f.id) === String(selectedFarm)
      })
    }

    // Trier pour mettre GAZ SÉLECTION en premier
    filtered.sort((a, b) => {
      // Trouver les noms des farms pour les comparer
      // Les produits migrés ont le nom directement
      let farmA = a.farm
      let farmB = b.farm
      
      // Si c'est un ID (nombre), chercher le nom
      if (!isNaN(a.farm)) {
        farmA = farms.find(f => String(f.id) === String(a.farm))?.name || a.farm
      }
      if (!isNaN(b.farm)) {
        farmB = farms.find(f => String(f.id) === String(b.farm))?.name || b.farm
      }
      
      // Si A est GAZ SÉLECTION et B ne l'est pas, A vient en premier
      if (farmA.includes('GAZ SÉLECTION') && !farmB.includes('GAZ SÉLECTION')) {
        return -1
      }
      // Si B est GAZ SÉLECTION et A ne l'est pas, B vient en premier
      if (farmB.includes('GAZ SÉLECTION') && !farmA.includes('GAZ SÉLECTION')) {
        return 1
      }
      // Sinon, garder l'ordre original
      return 0
    })

    setProducts(filtered)
  }

  // Grouper les produits par farm avec useMemo pour optimiser
  const groupedProductsByFarm = useMemo(() => {
    if (!products || products.length === 0 || !Array.isArray(products)) {
      return []
    }
    
    if (!Array.isArray(farms)) {
      return []
    }
    
    const grouped = {}
    
    products.forEach(product => {
      if (!product) return
      
      const farmId = product.farm ? String(product.farm) : 'sans-farm'
      const farm = farms.find(f => f && String(f.id) === String(product.farm))
      const farmName = farm ? farm.name : 'Sans farm'
      
      if (!grouped[farmId]) {
        grouped[farmId] = {
          id: farmId,
          name: farmName,
          products: []
        }
      }
      
      grouped[farmId].products.push(product)
    })
    
    // Convertir en tableau et trier par ordre spécifique
    const result = Object.values(grouped).filter(group => group && group.products && group.products.length > 0)
    
    // Fonction pour obtenir l'ordre de tri d'une farm
    const getFarmOrder = (farmName) => {
      const name = (farmName || '').toLowerCase()
      // GAZ SÉLECTION en premier
      if (name.includes('gaz sélection') || name.includes('gaz selection')) return 1
      // Cali weed hollandaise en deuxième
      if ((name.includes('cali') || name.includes('weed')) && name.includes('hollandaise')) return 2
      // Autres Cali USA
      if (name.includes('cali') && (name.includes('usa') || name.includes('🇺🇸'))) return 3
      // WEEE Hollandaise
      if (name.includes('weee') || name.includes('hollandaise')) return 4
      return 999 // Autres farms à la fin
    }
    
    return result.sort((a, b) => {
      // Mettre "Sans farm" à la fin
      if (a.id === 'sans-farm') return 1
      if (b.id === 'sans-farm') return -1
      
      const orderA = getFarmOrder(a.name)
      const orderB = getFarmOrder(b.name)
      
      // Si les deux ont un ordre spécifique, utiliser cet ordre
      if (orderA !== 999 && orderB !== 999) {
        return orderA - orderB
      }
      // Si seulement A a un ordre spécifique, A vient en premier
      if (orderA !== 999) return -1
      // Si seulement B a un ordre spécifique, B vient en premier
      if (orderB !== 999) return 1
      // Sinon, trier par nom
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [products, farms])

  // Grouper les produits par catégorie avec useMemo pour optimiser (gardé pour compatibilité)
  const groupedProductsByCategory = useMemo(() => {
    if (!products || products.length === 0 || !Array.isArray(products)) {
      return []
    }
    
    if (!Array.isArray(categories)) {
      return []
    }
    
    const grouped = {}
    
    products.forEach(product => {
      if (!product) return
      
      // Les produits migrés ont le nom directement, les nouveaux ont l'ID
      let categoryId = product.category ? String(product.category) : 'sans-categorie'
      let categoryName = 'Sans catégorie'
      let category = null
      
      if (product.category) {
        // Essayer de trouver par ID si c'est un nombre
        if (!isNaN(product.category)) {
          category = categories.find(c => c && String(c.id) === String(product.category))
          if (category) {
            categoryId = String(category.id)
            categoryName = category.name
          }
        } else {
          // Sinon, c'est déjà un nom (produits migrés)
          categoryName = product.category
          // Essayer de trouver l'ID correspondant
          category = categories.find(c => c && c.name === product.category)
          if (category) {
            categoryId = String(category.id)
          } else {
            // Si pas trouvé, utiliser le nom comme ID
            categoryId = product.category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
          }
        }
      }
      
      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          id: categoryId,
          name: categoryName,
          icon: category?.icon || null,
          products: []
        }
      }
      
      grouped[categoryId].products.push(product)
    })
    
    // Convertir en tableau et trier par ordre spécifique
    const result = Object.values(grouped).filter(group => group && group.products && group.products.length > 0)
    
    // Fonction pour obtenir l'ordre de tri d'une catégorie
    const getCategoryOrder = (categoryName) => {
      const name = (categoryName || '').toUpperCase()
      // Ordre spécifique demandé - vérifier les plus spécifiques en premier
      // 1. 120u premium
      if (name.includes('120U PREMIUM') || (name.includes('120U') && name.includes('PREMIUM'))) return 1
      if (name.includes('120U') || name.includes('120')) return 1
      // 2. 90U TOP 🇲🇦
      if (name.includes('90U TOP') || (name.includes('90U') && name.includes('TOP'))) return 2
      if (name.includes('90U') || (name.includes('90') && name.includes('TOP'))) return 2
      // 3. FRESH FROZEN ❄️🧊
      if (name.includes('FRESH FROZEN') || (name.includes('FRESH') && name.includes('FROZEN'))) return 3
      // 4. Cali USA 🇺🇸
      if (name.includes('CALI USA') || (name.includes('CALI') && name.includes('USA'))) return 4
      // 5. WEED HOLLANDAISE
      if (name.includes('WEED HOLLANDAISE') || (name.includes('WEED') && name.includes('HOLLANDAISE'))) return 5
      // 6. SERINGUE THC 💨 (vérifier avant VAPE pour éviter les conflits)
      if (name.includes('SERINGUE THC') || (name.includes('SERINGUE') && name.includes('THC'))) return 6
      if (name.includes('SERINGUE')) return 6
      // 7. VAPE THC 💨
      if (name.includes('VAPE THC') || (name.includes('VAPE') && name.includes('THC'))) return 7
      return 999 // Autres catégories à la fin
    }
    
    return result.sort((a, b) => {
      // Mettre "Sans catégorie" à la fin
      if (a.id === 'sans-categorie') return 1
      if (b.id === 'sans-categorie') return -1
      
      const orderA = getCategoryOrder(a.name)
      const orderB = getCategoryOrder(b.name)
      
      // Si les deux ont un ordre spécifique, utiliser cet ordre
      if (orderA !== 999 && orderB !== 999) {
        return orderA - orderB
      }
      // Si seulement A a un ordre spécifique, A vient en premier
      if (orderA !== 999) return -1
      // Si seulement B a un ordre spécifique, B vient en premier
      if (orderB !== 999) return 1
      // Sinon, trier par nom
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [products, categories])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedFarm('')
  }

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-theme text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <Header />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 flex flex-col items-center">
            <div className="inline-block bg-black/90 backdrop-blur-xl rounded-full px-16 py-10 border-2 border-white/30 shadow-[0_0_40px_rgba(0,0,0,0.8)] mb-8">
              <h1 className="text-5xl md:text-7xl font-bold mb-3 text-white">
                Notre Boutique
              </h1>
              <p className="text-lg text-gray-300">
                Découvrez notre sélection de produits choisis avec amour
              </p>
            </div>

            {/* Barre de recherche */}
            <div className="max-w-3xl mx-auto w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full px-6 py-4 pr-24 bg-slate-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <span>🔍</span>
                  <span className="hidden md:inline">Filtres</span>
                </button>
              </div>

              {/* Filtres déroulants */}
              {showFilters && (
                <div className="mt-4 p-4 bg-slate-900/50 border border-gray-700 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Filtre catégorie */}
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Catégorie</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                      >
                        <option value="">Toutes les catégories</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtre farm */}
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Farm</label>
                      <select
                        value={selectedFarm}
                        onChange={(e) => setSelectedFarm(e.target.value)}
                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                      >
                        <option value="">Toutes les farms</option>
                        {farms.map((farm) => (
                          <option key={farm.id} value={farm.id}>
                            {farm.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bouton réinitialiser */}
                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>

                  {/* Résumé des filtres */}
                  {(searchTerm || selectedCategory || selectedFarm) && (
                    <div className="mt-3 text-sm text-gray-400">
                      {products.length} produit(s) trouvé(s)
                      {searchTerm && ` pour "${searchTerm}"`}
                      {selectedCategory && ` dans ${selectedCategory}`}
                      {selectedFarm && ` de ${selectedFarm}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Products grouped by Category */}
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-xl">Aucun produit disponible pour le moment</p>
            </div>
          ) : groupedProductsByCategory.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-xl">Aucun produit disponible pour le moment</p>
            </div>
          ) : (
            <div className="space-y-12">
              {groupedProductsByCategory.map((categoryGroup, categoryIndex) => {
                // Afficher le header seulement s'il y a plusieurs catégories ou si aucun filtre de catégorie n'est actif
                const showCategoryHeader = !selectedCategory || groupedProductsByCategory.length > 1
                
                return (
                  <div
                    key={`category-${categoryGroup.id}-${categoryIndex}`}
                    className="category-section"
                  >
                    {/* Category Header - affiché seulement si nécessaire */}
                    {showCategoryHeader && (
                      <div className="mb-8 pb-6 border-b border-gray-700/50 bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 neon-border">
                        <div className="flex items-center gap-4">
                          {backgroundImage ? (
                            <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg">
                              <img 
                                src={backgroundImage} 
                                alt="Boutique"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Erreur de chargement de l\'image de fond:', backgroundImage)
                                  e.target.style.display = 'none'
                                  e.target.parentElement.innerHTML = '<span class="text-4xl md:text-5xl">🏷️</span>'
                                }}
                              />
                            </div>
                          ) : (
                            <div className="text-4xl md:text-5xl flex-shrink-0">
                              {categoryGroup.icon && categoryGroup.icon.includes('http') ? (
                                <img 
                                  src={categoryGroup.icon} 
                                  alt={categoryGroup.name}
                                  className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.parentElement.innerHTML = '<span class="text-4xl md:text-5xl">🏷️</span>'
                                  }}
                                />
                              ) : (
                                <span className="text-white">{categoryGroup.icon || '🏷️'}</span>
                              )}
                            </div>
                          )}
                          <div className="flex-1">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">
                              {categoryGroup.name}
                            </h2>
                            <p className="text-white text-sm md:text-base">
                              {categoryGroup.products.length} produit{categoryGroup.products.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Products Grid for this Category */}
                    {categoryGroup.products && categoryGroup.products.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
                        {categoryGroup.products.map((product, productIndex) => (
                          product && (
                            <ProductCard 
                              key={`product-${product.id}-${productIndex}`}
                              product={product} 
                              index={categoryIndex * 100 + productIndex}
                              categories={categories}
                              farms={farms}
                            />
                          )
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ProductCard = ({ product, index, categories, farms }) => {
  // Trouver les noms de catégorie et farm
  // Les produits migrés ont le nom directement, les nouveaux ont l'ID
  let categoryName = product.category
  let farmName = product.farm
  
  // Essayer de trouver par ID si c'est un nombre
  if (product.category && !isNaN(product.category)) {
    const found = categories.find(c => String(c.id) === String(product.category))
    if (found) categoryName = found.name
  }
  
  if (product.farm && !isNaN(product.farm)) {
    const found = farms.find(f => String(f.id) === String(product.farm))
    if (found) farmName = found.name
  }
  
  // Pour les cartes produits, on affiche TOUJOURS la photo en priorité (pas la vidéo)
  // La vidéo sera visible dans la page de détail du produit
  
  // Fonction pour détecter si c'est une vidéo
  const isVideo = (url) => {
    if (!url) return false
    
    // Vérifier les extensions vidéo
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
  
  // Construire le tableau de médias pour la page de détail (photo puis vidéo)
  const allMedias = []
  
  // Vérifier d'abord dans medias si c'est un tableau
  if (product.medias && Array.isArray(product.medias)) {
    product.medias.forEach(media => {
      if (media && media.trim() && !allMedias.includes(media)) {
        allMedias.push(media)
      }
    })
  }
  
  // Ajouter les médias individuels s'ils ne sont pas déjà dans allMedias
  if (product.photo && product.photo.trim() && !allMedias.includes(product.photo)) {
    allMedias.push(product.photo)
  }
  if (product.image && product.image.trim() && !allMedias.includes(product.image)) {
    allMedias.push(product.image)
  }
  if (product.video && product.video.trim() && !allMedias.includes(product.video)) {
    allMedias.push(product.video)
  }
  
  // Pour la carte produit, chercher d'abord une photo (pas une vidéo)
  let displayImage = null
  
  // 1. Chercher d'abord dans product.photo
  if (product.photo && product.photo.trim() && !isVideo(product.photo)) {
    displayImage = product.photo
  }
  // 2. Sinon chercher dans product.image
  else if (product.image && product.image.trim() && !isVideo(product.image)) {
    displayImage = product.image
  }
  // 3. Sinon chercher dans allMedias (en excluant les vidéos)
  else if (allMedias.length > 0) {
    const photoMedia = allMedias.find(media => media && !isVideo(media))
    if (photoMedia) {
      displayImage = photoMedia
    }
  }
  
  // 4. En dernier recours, prendre n'importe quel média (même vidéo)
  if (!displayImage) {
    displayImage = allMedias[0] || product.photo || product.image || product.video
  }
  
  // Adapter les deux structures : variants (nouvelle) et quantities (ancienne)
  let basePrice = '0€'
  
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    // Structure CALITEK avec grammage, unit, price
    const firstVariant = product.variants[0]
    if (firstVariant.price !== undefined) {
      basePrice = typeof firstVariant.price === 'number' ? `${firstVariant.price}€` : `${firstVariant.price}€`
    } else {
      basePrice = '0€'
    }
  } else if (product.quantities && Array.isArray(product.quantities) && product.quantities.length > 0) {
    // Ancienne structure
    const firstQty = product.quantities[0]
    basePrice = `${firstQty.price || 0}€`
  } else if (product.price) {
    // Fallback
    basePrice = typeof product.price === 'number' ? `${product.price}€` : product.price
  }
  
  // Fonction pour détecter si c'est un iframe Cloudflare Stream
  const isCloudflareStreamIframe = (url) => {
    if (!url) return false
    return url.includes('cloudflarestream.com') && url.includes('iframe')
  }
  
  // Log désactivé pour la sécurité
  
  return (
    <div
      className="neon-border rounded-2xl overflow-hidden bg-slate-900/50 backdrop-blur-sm group cursor-pointer"
    >
      {/* Image ou Vidéo */}
      <Link to={`/products/${product.id}`}>
        <div className="relative h-48 md:h-64 overflow-hidden bg-slate-800">
        {displayImage ? (
          isCloudflareStreamIframe(displayImage) ? (
            <iframe
              src={displayImage}
              className="w-full h-full"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
              style={{ border: 'none' }}
            />
          ) : isVideo(displayImage) ? (
            // Si c'est une vidéo dans la carte, afficher une image de placeholder avec icône vidéo
            <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
              <div className="text-6xl">🎥</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 rounded-full p-4">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 001.7 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => {}}
              onLoad={() => {}}
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🎁
          </div>
        )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-theme-heading mb-2 group-hover:text-gradient transition-all line-clamp-2">
          {product.name}
        </h3>
        <p className="text-theme-secondary text-xs md:text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        {/* Farm seulement (catégorie affichée dans le header de section) */}
        {farmName && (
          <div className="mb-3">
            <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-gray-700/30 border border-gray-600/50 rounded-full text-theme-secondary text-xs">
              🌾 {farmName}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between gap-2">
          {product.variants && product.variants.length > 1 && (
            <p className="text-xs md:text-sm text-theme-secondary">
              {product.variants.length} options
            </p>
          )}
          <Link to={`/products/${product.id}`} className="ml-auto">
            <button className="px-3 py-1.5 md:px-4 md:py-2 bg-black rounded-lg text-white font-semibold hover:bg-gray-800 transition-all text-sm md:text-base">
              Voir
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Products
