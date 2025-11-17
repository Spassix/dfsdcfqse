import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import { getAll } from '../utils/api'
import { uploadToR2 } from '../utils/cloudflare'

const Reviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    author: '',
    text: '',
    rating: 5,
    image: null
  })
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const data = await getAll('reviews')
      // Filtrer seulement les avis approuvés
      const approvedReviews = Array.isArray(data) 
        ? data.filter(review => review && review.approved === true)
        : []
      setReviews(approvedReviews)
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, image: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.author.trim() || !formData.text.trim()) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      setSubmitting(true)
      
      let imageUrl = ''
      if (formData.image) {
        const uploadResult = await uploadToR2(formData.image)
        imageUrl = uploadResult.url
      }

      const { save } = await import('../utils/api')
      await save('reviews', {
        author: formData.author.trim(),
        text: formData.text.trim(),
        rating: formData.rating,
        image: imageUrl,
        approved: false, // En attente d'approbation
        createdAt: new Date().toISOString()
      })

      alert('✅ Votre avis a été envoyé ! Il sera publié après validation par l\'administrateur.')
      setFormData({ author: '', text: '', rating: 5, image: null })
      setImagePreview(null)
      setShowForm(false)
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
      alert('❌ Erreur lors de l\'envoi de votre avis. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <Header />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">💬 Avis Clients</h1>
            <p className="text-white text-lg">Partagez votre expérience avec nous</p>
          </motion.div>

          {/* Bouton pour ajouter un avis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all"
            >
              {showForm ? '✕ Annuler' : '+ Ajouter un avis'}
            </button>
          </motion.div>

          {/* Formulaire d'ajout d'avis */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm mb-12"
            >
              <h2 className="text-2xl font-bold mb-6">Votre avis</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Votre nom *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-gray-700/30 rounded-lg focus:outline-none focus:border-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Note (1-5 étoiles) *</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-800 border border-gray-700/30 rounded-lg focus:outline-none focus:border-white"
                  >
                    <option value={5}>5 ⭐⭐⭐⭐⭐</option>
                    <option value={4}>4 ⭐⭐⭐⭐☆</option>
                    <option value={3}>3 ⭐⭐⭐☆☆</option>
                    <option value={2}>2 ⭐⭐☆☆☆</option>
                    <option value={1}>1 ⭐☆☆☆☆</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Votre avis *</label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    rows="5"
                    className="w-full px-4 py-2 bg-slate-800 border border-gray-700/30 rounded-lg focus:outline-none focus:border-white resize-none"
                    placeholder="Partagez votre expérience..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Photo (optionnel)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-gray-700/30 rounded-lg focus:outline-none focus:border-white"
                  />
                  {imagePreview && (
                    <div className="mt-4">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="max-w-xs rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  {submitting ? '⏳ Envoi...' : '📤 Envoyer mon avis'}
                </button>
              </form>
            </motion.div>
          )}

          {/* Liste des avis */}
          {reviews.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white text-lg">Aucun avis pour le moment. Soyez le premier à partager votre expérience !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">{review.author}</h3>
                    <div className="text-yellow-400 text-sm">
                      {renderStars(review.rating || 5)}
                    </div>
                  </div>
                  
                  <p className="text-white mb-4 whitespace-pre-wrap">{review.text}</p>
                  
                  {review.image && (
                    <div className="mb-4">
                      <img
                        src={review.image}
                        alt="Avis"
                        className="w-full rounded-lg"
                      />
                    </div>
                  )}
                  
                  {review.createdAt && (
                    <p className="text-xs text-white">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reviews
