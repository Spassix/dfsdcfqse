import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getById, save, deleteBlobFile } from '../../utils/api'
import { uploadToR2 } from '../../utils/cloudflare'
import { error as logError } from '../../utils/logger'

const AdminAgeVerification = () => {
  const [config, setConfig] = useState({
    enabled: false,
    text: 'Vous devez être majeur pour accéder à ce site',
    image: '',
    backgroundType: 'theme'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const data = await getById('settings', 'ageVerification')
      if (data && data.value) {
        setConfig({
          enabled: data.value.enabled !== false,
          text: data.value.text || 'Vous devez être majeur pour accéder à ce site',
          image: data.value.image || '',
          backgroundType: data.value.backgroundType || 'theme'
        })
      }
    } catch (error) {
      logError('Erreur lors du chargement de la configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await save('settings', {
        id: 'ageVerification',
        key: 'ageVerification',
        value: config
      })
      alert('✅ Configuration sauvegardée avec succès !')
    } catch (error) {
      logError('Erreur lors de la sauvegarde')
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploadingImage(true)
      
      // Supprimer l'ancienne image si elle existe
      if (config.image && config.image.includes('vercel-storage.com')) {
        await deleteBlobFile(config.image)
      }
      
      const result = await uploadToR2(file)
      setConfig({ ...config, image: result.url })
    } catch (error) {
      logError('Erreur lors de l\'upload de l\'image')
      alert('❌ Erreur lors de l\'upload de l\'image')
    } finally {
      setUploadingImage(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 text-center"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            🔞 Vérification d'Âge (+18)
          </h1>
          <p className="text-white text-sm sm:text-base">Configurez la vérification d'âge pour les visiteurs</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neon-border rounded-xl p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm space-y-6"
        >
          {/* Activer/Désactiver */}
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div>
              <h3 className="text-white font-semibold mb-1">Activer la vérification d'âge</h3>
              <p className="text-white text-sm">Afficher une page de vérification avant l'accès au site</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Texte */}
          <div>
            <label className="block text-white font-semibold mb-2">Texte de vérification</label>
            <input
              type="text"
              value={config.text}
              onChange={(e) => setConfig({ ...config, text: e.target.value })}
              placeholder="Vous devez être majeur pour accéder à ce site"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Type de fond */}
          <div>
            <label className="block text-white font-semibold mb-3">Type de fond</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { value: 'theme', label: '🎨 Thème boutique', icon: '🎨' },
                { value: 'image', label: '🖼️ Image', icon: '🖼️' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setConfig({ ...config, backgroundType: type.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    config.backgroundType === type.value
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-700 bg-slate-800/50 hover:border-gray-600'
                  }`}
                >
                  <div className="text-xl mb-1">{type.icon}</div>
                  <div className="text-white text-xs">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Image */}
          {config.backgroundType === 'image' && (
            <div>
              <label className="block text-white font-semibold mb-2">Image de fond</label>
              {config.image && (
                <div className="mb-3 relative group">
                  <div className="w-full h-32 sm:h-40 rounded-lg overflow-hidden bg-slate-800 border border-gray-700/30">
                    <img 
                      src={config.image} 
                      alt="Aperçu fond" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (config.image && config.image.includes('vercel-storage.com')) {
                        await deleteBlobFile(config.image)
                      }
                      setConfig({ ...config, image: '' })
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20 text-sm sm:text-base"
                    title="Supprimer l'image"
                  >
                    ×
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="w-full px-4 py-2 bg-slate-800 border border-gray-700/30 rounded-lg focus:outline-none focus:border-white file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-700 file:text-white file:text-xs file:cursor-pointer disabled:opacity-50"
              />
            </div>
          )}

          {/* Bouton sauvegarder */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 sm:px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

    </div>
export default AdminAgeVerification
