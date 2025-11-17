import React, { useState, useEffect } from 'react'
import { error as logError } from '../../utils/logger'
import { motion, AnimatePresence } from 'framer-motion'
import { getAll, save, deleteById } from '../../utils/api'

const SocialModal = ({ social, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: social?.name || '',
    icon: social?.icon || '🌐',
    description: social?.description || '',
    url: social?.url || ''
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFormData({
      name: social?.name || '',
      icon: social?.icon || '🌐',
      description: social?.description || '',
      url: social?.url || ''
    })
  }, [social])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert("Le nom est requis")
      return
    }

    setLoading(true)

    try {
      const data = {
        ...formData,
        name: formData.name.trim(),
        updatedAt: new Date().toISOString()
      }

      if (social?.id) data.id = social.id
      else data.createdAt = new Date().toISOString()

      const result = await save("socials", data)

      if (result?.error) throw new Error(result.error)

      onSuccess()
    } catch (err) {
      alert("Erreur: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="
          neon-border 
          rounded-xl 
          p-6 
          bg-slate-900 
          w-full max-w-md 
          max-h-[80vh] 
          overflow-y-auto 
          mt-10
        "
      >
        <h2 className="text-3xl font-bold text-white mb-6">
          {social ? "Modifier le réseau social" : "Ajouter un réseau social"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="text-white mb-1 block">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-gray-700/40 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="text-white mb-1 block">Icône (emoji)</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              maxLength={2}
              className="w-full px-4 py-3 bg-slate-800 border border-gray-700/40 rounded-lg text-white text-3xl text-center"
            />
          </div>

          <div>
            <label className="text-white mb-1 block">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-gray-700/40 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="text-white mb-1 block">URL / Lien</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-gray-700/40 rounded-lg text-white"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold"
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 rounded-lg text-white font-semibold"
            >
              Annuler
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

const AdminSocials = () => {
  const [socials, setSocials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    fetchSocials()
  }, [])

  const fetchSocials = async () => {
    try {
      const data = await getAll("socials")
      setSocials(Array.isArray(data) ? data : [])
    } catch {
      setSocials([])
      logError("Erreur récupération socials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black p-6">

      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white">Gestion des Réseaux Sociaux</h1>
          <p className="text-white">{socials.length} réseau(x)</p>
        </div>

        <button
          onClick={() => {
            setEditing(null)
            setShowModal(true)
          }}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold"
        >
          ➕ Ajouter
        </button>
      </div>

      <div className="space-y-4">
        {socials.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="neon-border p-6 rounded-xl bg-slate-900/50 flex justify-between"
          >
            <div className="flex gap-4 flex-1">
              <span className="text-4xl">{s.icon}</span>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{s.name}</h3>
                <p className="text-white">{s.description}</p>
                <a className="text-blue-400 underline" href={s.url} target="_blank">
                  {s.url}
                </a>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-gray-700 rounded-lg text-white"
                onClick={() => {
                  setEditing(s)
                  setShowModal(true)
                }}
              >
                ✏️
              </button>

              <button
                className="px-4 py-2 bg-gray-800 rounded-lg text-white"
                onClick={() => deleteById("socials", s.id).then(fetchSocials)}
              >
                🗑️
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <SocialModal
            social={editing}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false)
              fetchSocials()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminSocials
