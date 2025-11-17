import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAll, save, deleteById } from '../../utils/api'
import { error as logError } from '../../utils/logger'

const AdminFarms = () => {
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFarm, setEditingFarm] = useState(null)

  useEffect(() => {
    fetchFarms()
  }, [])

  const fetchFarms = async () => {
    try {
      setLoading(true)
      const data = await getAll('farms')
      console.log('[Farms] Données reçues:', data)
      if (Array.isArray(data)) {
        console.log(`[Farms] ${data.length} farms chargées`)
        setFarms(data)
      } else {
        console.error('[Farms] Les données ne sont pas un tableau:', data)
        logError('Erreur')
        setFarms([])
      }
    } catch (error) {
      console.error('[Farms] Erreur:', error)
      logError('Erreur')
      setFarms([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette farm ?')) return

    try {
      await deleteById('farms', id)
      fetchFarms()
    } catch (error) {
      logError('Erreur')
    }
  }

  const handleEdit = (farm) => {
    setEditingFarm(farm)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingFarm(null)
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
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Gestion des Farms
          </h1>
          <p className="text-white text-sm sm:text-base">{farms.length} farm(s) au total</p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-2"
        >
          <span>➕</span>
          <span className="whitespace-nowrap">Ajouter une farm</span>
        </button>
      </div>

      {/* Farms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.isArray(farms) && farms.map((farm) => (
          <motion.div
            key={farm.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-gray-700 rounded-xl p-4 bg-black/50 hover:bg-black/70 transition-colors"
          >
            <h3 className="text-lg font-bold text-white mb-3">🌾 {farm.name}</h3>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(farm)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors text-sm"
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => handleDelete(farm.id)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors text-sm"
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
          <FarmModal
            farm={editingFarm}
            onClose={() => setShowModal(false)}
            onSuccess={async () => {
              setShowModal(false)
              // Attendre un peu avant de recharger pour s'assurer que la sauvegarde est terminée
              await new Promise(resolve => setTimeout(resolve, 100))
              await fetchFarms()
            }}
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

const FarmModal = ({ farm, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: farm?.name || '',
    description: farm?.description || '',
    image: farm?.image || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.name.trim()) {
      alert('Le nom de la farm est requis')
      return
    }
    
    setLoading(true)

    try {
      const farmData = {
        name: formData.name.trim(),
        image: formData.image || null,
        description: formData.description || null
      }

      // Si c'est une modification, inclure l'ID existant
      if (farm?.id) {
        farmData.id = farm.id
      }

      // Logs désactivés pour la sécurité
      const response = await save('farms', farmData)
      
      if (response && response.error) {
        throw new Error(response.error)
      }
      
      if (!response || (!response.success && !response.id)) {
        throw new Error('Réponse invalide du serveur')
      }
      
      onSuccess()
    } catch (error) {
      logError('Error saving farm')
      
      let errorMessage = error.message || 'Erreur lors de la sauvegarde'
      
      // Messages d'erreur plus clairs
      if (errorMessage.includes('401')) {
        errorMessage = 'Erreur d\'authentification. Vérifiez que l\'API est accessible.'
      } else if (errorMessage.includes('403')) {
        errorMessage = 'Accès refusé. Vérifiez les permissions.'
      } else if (errorMessage.includes('404')) {
        errorMessage = 'Endpoint non trouvé. Vérifiez la configuration de l\'API.'
      } else if (errorMessage.includes('500')) {
        errorMessage = 'Erreur serveur. Vérifiez les logs du serveur.'
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        errorMessage = 'Erreur réseau. Vérifiez votre connexion et que l\'API est accessible.'
      }
      
      alert(`Erreur: ${errorMessage}`)
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
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
          {farm ? '✏️ Modifier la farm' : '➕ Ajouter une farm'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">Nom de la farm</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ex: Farm du Nord"
              disabled={loading}
              autoFocus
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          {formData.description !== undefined && (
          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la farm (optionnel)"
              disabled={loading}
              rows="3"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !formData.name?.trim()}
              className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold text-sm sm:text-base hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 sm:py-3 bg-gray-800/30 border border-gray-600/50 rounded-lg text-white text-sm sm:text-base font-semibold hover:bg-gray-700/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default AdminFarms
