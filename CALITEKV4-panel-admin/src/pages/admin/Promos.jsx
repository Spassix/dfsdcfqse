import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const AdminPromos = () => {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)

  useEffect(() => {
    fetchPromos()
  }, [])

  const fetchPromos = async () => {
    try {
      const response = await fetch('/api/promos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPromos(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Erreur chargement promos:', error)
      setPromos([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce code promo ?')) return

    try {
      const response = await fetch(`/api/promos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      if (response.ok) {
        fetchPromos()
      }
    } catch (error) {
      console.error('Erreur suppression promo:', error)
    }
  }

  const handleDeleteFrappy94 = async () => {
    if (!confirm('Supprimer tous les codes promo FRAPPY94 de l\'ancienne boutique ?')) return

    try {
      const response = await fetch('/api/delete-frappy94-promo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.message || 'Codes promo FRAPPY94 supprimés'}`)
        fetchPromos()
      } else {
        const error = await response.json()
        alert('❌ Erreur : ' + (error.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur suppression FRAPPY94:', error)
      alert('❌ Erreur lors de la suppression')
    }
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Codes Promo
          </h1>
          <p className="text-white">{promos.length} code(s) promo</p>
        </div>
        <div className="flex gap-3">
          {promos.some(p => p.code?.toUpperCase().includes('FRAPPY94') || p.code?.toUpperCase().includes('FRAPPY')) && (
            <button
              onClick={handleDeleteFrappy94}
              className="px-4 py-3 bg-red-600 rounded-lg text-white font-semibold hover:bg-red-700 transition-all"
              title="Supprimer les codes promo FRAPPY94"
            >
              🗑️ Supprimer FRAPPY94
            </button>
          )}
          <button
            onClick={() => {
              setEditingPromo(null)
              setShowModal(true)
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            ➕ Ajouter un code
          </button>
        </div>
      </div>

      <div className="neon-border rounded-2xl overflow-hidden bg-slate-900/50 backdrop-blur-sm">
        {promos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white text-xl mb-4">Aucun code promo</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
            >
              Créer mon premier code
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Réduction</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Statut</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {promos.map((promo) => (
                  <motion.tr
                    key={promo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4">
                      <span className="text-white font-bold text-lg">{promo.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {promo.type === 'percent' ? (
                          <span className="text-green-400 font-bold">-{promo.value}%</span>
                        ) : (
                          <span className="text-green-400 font-bold">-{promo.value || promo.discount}€</span>
                        )}
                        {promo.minAmount > 0 && (
                          <p className="text-white text-xs mt-1">Min: {promo.minAmount}€</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        promo.enabled 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-white'
                      }`}>
                        {promo.enabled ? '✅ Actif' : '❌ Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingPromo(promo)
                            setShowModal(true)
                          }}
                          className="px-3 py-2 bg-gray-700/20 border border-gray-600/50 rounded-lg text-white hover:bg-gray-600/30"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="px-3 py-2 bg-gray-800/20 border border-gray-600/50 rounded-lg text-white hover:bg-gray-700/30"
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
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <PromoModal
            promo={editingPromo}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false)
              fetchPromos()
            }}
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

const PromoModal = ({ promo, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    code: promo?.code || '',
    type: promo?.type || 'fixed',
    value: promo?.value || promo?.discount || '',
    minAmount: promo?.minAmount || '',
    enabled: promo?.enabled !== false
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = promo ? `/api/promos/${promo.id}` : '/api/promos'
      const method = promo ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('✅ Code promo sauvegardé !')
        onSuccess()
      } else {
        const error = await response.json()
        alert('❌ Erreur : ' + (error.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur sauvegarde promo:', error)
      alert('❌ Erreur lors de la sauvegarde')
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
          {promo ? '✏️ Modifier le code' : '➕ Nouveau code promo'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="BIENVENUE10"
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white uppercase transition-colors"
            />
          </div>

          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">Type de réduction</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:border-white mb-3 transition-colors"
            >
              <option value="fixed">Montant fixe (€)</option>
              <option value="percent">Pourcentage (%)</option>
            </select>
          </div>

          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">
              {formData.type === 'percent' ? 'Réduction (%)' : 'Réduction (€)'}
            </label>
            <input
              type="number"
              min="0"
              max={formData.type === 'percent' ? '100' : undefined}
              step={formData.type === 'percent' ? '1' : '0.01'}
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder={formData.type === 'percent' ? '10' : '5.00'}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-white mb-2 text-sm sm:text-base">Montant minimum (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.minAmount}
              onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
              placeholder="0 (pas de minimum)"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
            />
            <p className="text-white text-xs mt-1">Le panier doit atteindre ce montant pour utiliser le code</p>
          </div>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-white">Code actif</span>
          </label>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-sm sm:text-base hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 sm:py-3 bg-gray-800/30 border border-gray-600/50 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-700/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default AdminPromos
