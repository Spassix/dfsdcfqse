import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAll, save, deleteById, deleteBlobFile } from '../../utils/api'
import { uploadToR2 } from '../../utils/cloudflare'
import { error as logError } from '../../utils/logger'

const AdminCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await getAll('categories')
      console.log('[Categories] Données reçues:', data)
      const categoriesList = Array.isArray(data) ? data : []
      console.log(`[Categories] ${categoriesList.length} catégories chargées`)
      setCategories(categoriesList)
    } catch (error) {
      console.error('[Categories] Erreur:', error)
      logError('Error fetching categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return

    try {
      await deleteById('categories', id)
      fetchCategories()
    } catch (error) {
      logError('Error deleting category')
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingCategory(null)
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Gestion des Catégories
          </h1>
          <p className="text-white text-sm sm:text-base">{categories.length} catégorie(s) au total</p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-black hover:bg-gray-900 rounded-lg text-white border border-white/20 font-semibold text-sm sm:text-base transition-all flex items-center justify-center space-x-2"
        >
          <span>➕</span>
          <span className="whitespace-nowrap">Ajouter une catégorie</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(categories) && categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neon-border rounded-2xl p-6 bg-slate-900/50 backdrop-blur-sm"
          >
            {category.icon && category.icon.startsWith('http') ? (
              <div className="w-full h-32 mb-4 rounded-lg overflow-hidden bg-slate-800">
                <img src={category.icon} alt={category.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="text-5xl mb-4 text-center">{category.icon}</div>
            )}
            <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
            <p className="text-white text-sm mb-4">{category.description}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(category)}
                className="flex-1 px-3 py-2 bg-gray-700/20 border border-gray-600/50 rounded-lg text-white hover:bg-gray-600/30 transition-colors text-sm"
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="flex-1 px-3 py-2 bg-gray-800/20 border border-gray-600/50 rounded-lg text-white hover:bg-gray-700/30 transition-colors text-sm"
              >
                🗑️ Supprimer
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <CategoryModal
            category={editingCategory}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false)
              fetchCategories()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const CategoryModal = ({ category, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    icon: category?.icon || '🎁',
    description: category?.description || ''
  })
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleImageUpload = async (file) => {
    setUploadingImage(true)
    try {
      // Supprimer l'ancienne image si elle existe
      if (formData.icon && formData.icon.includes('vercel-storage.com')) {
        await deleteBlobFile(formData.icon)
      }
      
      const result = await uploadToR2(file)
      setFormData({ ...formData, icon: result.url })
    } catch (error) {
      logError('Error uploading image')
      alert('Erreur lors de l\'upload de l\'image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.name.trim()) {
      alert('Le nom de la catégorie est requis')
      return
    }
    
    setLoading(true)

    try {
      const categoryData = {
        name: formData.name.trim(),
        icon: formData.icon || '🎁',
        description: formData.description || '',
        updatedAt: new Date().toISOString()
      }

      // Si c'est une modification, inclure l'ID existant
      if (category?.id) {
        categoryData.id = category.id
      } else {
        // Pour une nouvelle catégorie, ne pas générer l'ID - le serveur le fera
        categoryData.createdAt = new Date().toISOString()
      }

      // Logs désactivés pour la sécurité
      const result = await save('categories', categoryData)
      
      if (result && result.error) {
        throw new Error(result.error)
      }
      
      onSuccess()
    } catch (error) {
      logError('Error saving category')
      alert('Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'))
    } finally {
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
        className="neon-border rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 bg-slate-900 w-full max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">
          {category ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Nom de la catégorie"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">Icône / Image</label>
            {formData.icon && formData.icon.startsWith('http') ? (
              <div className="mb-3 relative group">
                <img src={formData.icon} alt="Aperçu" className="w-full h-32 sm:h-40 object-cover rounded" />
                <button
                  type="button"
                  onClick={async () => {
                    if (formData.icon && formData.icon.includes('vercel-storage.com')) {
                      await deleteBlobFile(formData.icon)
                    }
                    setFormData({ ...formData, icon: '🎁' })
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity text-sm sm:text-base"
                >
                  ×
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                required
                maxLength="2"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-2xl sm:text-3xl text-center focus:outline-none focus:border-white transition-colors mb-3"
                placeholder="🎁"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageUpload(e.target.files[0])
                }
              }}
              disabled={uploadingImage}
              className="w-full px-3 sm:px-4 py-2 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-white file:mr-2 file:py-1 file:px-2 sm:file:px-3 file:rounded file:border-0 file:bg-gray-700 file:text-white file:text-xs file:cursor-pointer disabled:opacity-50"
            />
            {uploadingImage && <p className="text-white text-xs sm:text-sm mt-2">Upload en cours...</p>}
            <p className="text-white text-xs mt-2">Entrez un emoji ou uploadez une image</p>
          </div>

          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows="3"
              placeholder="Description de la catégorie"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white transition-colors resize-none"
            ></textarea>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 py-2.5 sm:py-3 bg-black hover:bg-gray-900 rounded-lg text-white border border-white/20 font-semibold text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadingImage}
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

export default AdminCategories
