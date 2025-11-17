import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Header from '../components/Header'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [productCounts, setProductCounts] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { getAll } = await import('../utils/api')
        
        // Charger les catégories
        const cats = await getAll('categories')
        setCategories(cats)
        
        // Charger les produits et compter par catégorie
        const products = await getAll('products')
        const counts = {}
        
        products.forEach(product => {
          if (!product || !product.category) return
          
          let categoryId = null
          
          // Les produits migrés ont le nom directement, les nouveaux ont l'ID
          if (!isNaN(product.category)) {
            // C'est un ID numérique
            categoryId = String(product.category)
          } else {
            // C'est un nom, chercher l'ID correspondant
            const foundCategory = cats.find(c => c && c.name === product.category)
            if (foundCategory) {
              categoryId = String(foundCategory.id)
            } else {
              // Si pas trouvé, utiliser le nom comme clé
              categoryId = product.category
            }
          }
          
          if (categoryId) {
            counts[categoryId] = (counts[categoryId] || 0) + 1
          }
        })
        
        console.log('Categories - Products by category:', counts)
        console.log('Categories - Categories:', cats)
        setProductCounts(counts)
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const gradients = [
    'from-white to-gray-200',
    'from-gray-200 to-white',
    'from-gray-300 to-gray-400',
    'from-gray-400 to-gray-500',
    'from-gray-500 to-gray-600',
    'from-white to-gray-300'
  ]

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
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12 flex justify-center"
          >
            <div className="inline-block bg-black/90 backdrop-blur-xl rounded-full px-16 py-10 border-2 border-white/30 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              <h1 className="text-5xl md:text-7xl font-bold mb-3 text-white">
                Nos Catégories
              </h1>
              <p className="text-lg text-gray-300">
                Explorez nos différentes catégories de produits choisis avec amour
              </p>
            </div>
          </motion.div>

          {/* Categories Grid */}
          {categories.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-theme-secondary text-xl">Aucune catégorie disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
              {categories.map((category, index) => (
                <CategoryCard 
                  key={category.id} 
                  category={category} 
                  index={index}
                  count={productCounts[String(category.id)] || 0}
                  gradient={gradients[index % gradients.length]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const CategoryCard = ({ category, index, count, gradient }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -10 }}
      className="neon-border rounded-2xl overflow-hidden bg-slate-900/50 backdrop-blur-sm group cursor-pointer"
    >
      <Link to={`/products?category=${category.id}`} className="block">
        {/* Icon/Image Section */}
        <div className={`relative h-40 md:h-48 flex items-center justify-center ${category.icon && category.icon.startsWith('http') ? 'bg-slate-800' : `bg-gradient-to-br ${gradient}`} overflow-hidden`}>
          {category.icon && category.icon.startsWith('http') ? (
            <img 
              src={category.icon} 
              alt={category.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <motion.div
              whileHover={{ scale: 1.2, rotate: 10 }}
              className="text-8xl filter drop-shadow-2xl"
            >
              {category.icon}
            </motion.div>
          )}
          
          {/* Count Badge */}
          <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 md:px-3">
            <span className="text-theme-heading font-bold text-xs md:text-sm">{count} produit{count !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 md:p-6">
          <h3 className="text-lg md:text-2xl font-bold text-theme-heading mb-2 group-hover:text-gradient transition-all line-clamp-2">
            {category.name}
          </h3>
          <p className="text-theme-secondary group-hover:text-theme transition-colors text-sm md:text-base line-clamp-2">
            {category.description}
          </p>
          
          <div className="mt-3 md:mt-4 flex items-center text-theme-heading font-semibold group-hover:translate-x-2 transition-transform text-sm md:text-base">
            <span>Voir les produits</span>
            <svg className="w-4 h-4 md:w-5 md:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default Categories
