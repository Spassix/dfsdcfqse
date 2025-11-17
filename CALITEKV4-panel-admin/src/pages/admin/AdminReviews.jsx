import React, { useState, useEffect } from 'react'
import { error as logError } from '../../utils/logger'
import { motion } from 'framer-motion'
import { getAll, save } from '../../utils/api'

const AdminReviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'approved', 'pending'

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const data = await getAll('reviews')
      const reviewsList = Array.isArray(data) ? data : []
      // Trier par date (plus récents en premier)
      reviewsList.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0)
        const dateB = new Date(b.createdAt || 0)
        return dateB - dateA
      })
      setReviews(reviewsList)
    } catch (error) {
      logError('Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      const review = reviews.find(r => r.id === id)
      if (!review) return

      await save('reviews', {
        ...review,
        approved: true
      })

      alert('✅ Avis approuvé !')
      loadReviews()
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error)
      alert('❌ Erreur lors de l\'approbation')
    }
  }

  const handleReject = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return

    try {
      const { deleteById } = await import('../../utils/api')
      await deleteById('reviews', id)
      alert('✅ Avis supprimé !')
      loadReviews()
    } catch (error) {
      logError('Erreur')
      alert('❌ Erreur lors de la suppression')
    }
  }

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const filteredReviews = Array.isArray(reviews) ? reviews.filter(review => {
    if (filter === 'approved') return review.approved === true
    if (filter === 'pending') return review.approved !== true
    return true
  }) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">💬 Avis Clients</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            Tous ({Array.isArray(reviews) ? reviews.length : 0})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'approved' ? 'bg-green-600' : 'bg-gray-700'
            }`}
          >
            Approuvés ({Array.isArray(reviews) ? reviews.filter(r => r.approved).length : 0})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'pending' ? 'bg-yellow-600' : 'bg-gray-700'
            }`}
          >
            En attente ({Array.isArray(reviews) ? reviews.filter(r => !r.approved).length : 0})
          </button>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white text-lg">Aucun avis {filter === 'all' ? '' : filter === 'approved' ? 'approuvé' : 'en attente'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredReviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm ${
                review.approved ? 'border-green-500/30' : 'border-yellow-500/30'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{review.author}</h3>
                  <div className="text-yellow-400 text-sm mb-2">
                    {renderStars(review.rating || 5)}
                  </div>
                  {review.createdAt && (
                    <p className="text-xs text-white">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
                <div className={`px-3 py-1 rounded text-xs font-bold ${
                  review.approved 
                    ? 'bg-green-600/20 text-green-400' 
                    : 'bg-yellow-600/20 text-yellow-400'
                }`}>
                  {review.approved ? '✓ Approuvé' : '⏳ En attente'}
                </div>
              </div>

              <p className="text-white mb-4 whitespace-pre-wrap">{review.text}</p>

              {review.image && (
                <div className="mb-4">
                  <img
                    src={review.image}
                    alt="Avis"
                    className="w-full rounded-lg max-h-64 object-cover"
                  />
                </div>
              )}

              <div className="flex gap-2 mt-4">
                {!review.approved && (
                  <button
                    onClick={() => handleApprove(review.id)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    ✓ Approuver
                  </button>
                )}
                <button
                  onClick={() => handleReject(review.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
    </div>
  )
}

export default AdminReviews
