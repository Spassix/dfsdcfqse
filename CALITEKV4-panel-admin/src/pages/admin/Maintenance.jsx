import React, { useState, useEffect } from 'react'
import { error as logError } from '../../utils/logger'
import { motion } from 'framer-motion'
import { getById, save, deleteBlobFile } from '../../utils/api'
import { uploadToR2 } from '../../utils/cloudflare'

const Maintenance = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('🔧 Site en maintenance\n\nNous effectuons actuellement des améliorations.\nNous serons bientôt de retour !')
  const [maintenanceBackgroundImage, setMaintenanceBackgroundImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settingsData = await getById('settings', 'general')
      if (settingsData && settingsData.value) {
        setMaintenanceMode(settingsData.value.maintenanceMode || false)
        setMaintenanceMessage(settingsData.value.maintenanceMessage || '🔧 Site en maintenance\n\nNous effectuons actuellement des améliorations.\nNous serons bientôt de retour !')
        setMaintenanceBackgroundImage(settingsData.value.maintenanceBackgroundImage || '')
      }
    } catch (error) {
      logError('Erreur')
      // Garder les valeurs par défaut si erreur
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Récupérer les settings existants
      let existingSettings = {}
      try {
        const existing = await getById('settings', 'general')
        if (existing && existing.value) {
          existingSettings = existing.value
        }
      } catch (e) {
        // Si n'existe pas encore, continuer avec un objet vide
      }
      
      // Sauvegarder avec la clé 'general' et la valeur complète
      console.log('Saving maintenance settings:', { maintenanceMode, maintenanceMessage, maintenanceBackgroundImage })
      const result = await save('settings', {
        key: 'general',
        value: {
          ...existingSettings,
          maintenanceMode,
          maintenanceMessage,
          maintenanceBackgroundImage
        }
      })
      console.log('Maintenance settings save result:', result)
      
      if (result && result.error) {
        throw new Error(result.error)
      }

      alert('✅ Paramètres de maintenance enregistrés !')
    } catch (error) {
      logError('Erreur')
      alert('❌ Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'))
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      alert('❌ Veuillez sélectionner un fichier image')
      return
    }

    try {
      setUploadingImage(true)
      
      // Supprimer l'ancienne image si elle existe
      if (maintenanceBackgroundImage && maintenanceBackgroundImage.includes('vercel-storage.com')) {
        try {
          await deleteBlobFile(maintenanceBackgroundImage)
        } catch (err) {
          console.warn('Erreur suppression ancienne image:', err)
        }
      }
      
      // Uploader la nouvelle image
      const result = await uploadToR2(file)
      setMaintenanceBackgroundImage(result.url)
      alert('✅ Image uploadée avec succès ! N\'oubliez pas de sauvegarder.')
    } catch (error) {
      console.error('Erreur upload:', error)
      alert('❌ Erreur lors de l\'upload de l\'image: ' + (error.message || 'Erreur inconnue'))
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!confirm('Supprimer l\'image de fond ?')) return

    try {
      if (maintenanceBackgroundImage && maintenanceBackgroundImage.includes('vercel-storage.com')) {
        await deleteBlobFile(maintenanceBackgroundImage)
      }
      setMaintenanceBackgroundImage('')
      alert('✅ Image supprimée ! N\'oubliez pas de sauvegarder.')
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
    <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔧 Mode Maintenance</h1>
          <p className="text-white">Activez le mode maintenance pour effectuer des modifications en toute tranquillité</p>
        </div>

        {/* Avertissement */}
        {maintenanceMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-orange-900/30 border-2 border-orange-500 rounded-xl"
          >
            <div className="flex items-start space-x-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-orange-400 font-bold text-lg mb-1">MODE MAINTENANCE ACTIVÉ</h3>
                <p className="text-orange-300 text-sm">
                  Les visiteurs voient actuellement la page de maintenance. Seul le panel admin est accessible.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Configuration */}
        <div className="neon-border rounded-2xl p-8 bg-slate-900/50 backdrop-blur-sm space-y-6">
          {/* Toggle Maintenance */}
          <div className="flex items-center justify-between p-6 bg-black/30 rounded-xl border border-gray-700/50">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Activer le mode maintenance</h3>
              <p className="text-white text-sm">Le site sera inaccessible aux visiteurs (sauf panel admin)</p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative w-20 h-10 rounded-full transition-colors ${
                maintenanceMode ? 'bg-orange-500' : 'bg-gray-700'
              }`}
            >
              <motion.div
                animate={{ x: maintenanceMode ? 40 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 left-1 w-8 h-8 bg-white rounded-full shadow-lg"
              />
            </button>
          </div>

          {/* Message de maintenance */}
          <div>
            <label className="block text-white font-bold mb-3">📝 Message de maintenance</label>
            <p className="text-white text-sm mb-3">Ce message sera affiché aux visiteurs pendant la maintenance</p>
            <textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white resize-none font-mono"
              placeholder="🔧 Site en maintenance..."
            />
            <p className="text-white text-sm mt-2">💡 Astuce : Utilisez \n pour les sauts de ligne</p>
          </div>

          {/* Image de fond */}
          <div>
            <label className="block text-white font-bold mb-3">🖼️ Image de fond (optionnel)</label>
            <p className="text-white text-sm mb-3">Cette image sera affichée en arrière-plan de la page de maintenance</p>
            
            {maintenanceBackgroundImage ? (
              <div className="space-y-3">
                <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-700">
                  <img 
                    src={maintenanceBackgroundImage} 
                    alt="Image de fond maintenance" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-3">
                  <label className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-center cursor-pointer transition-colors">
                    {uploadingImage ? '⏳ Upload...' : '📤 Changer l\'image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                  <button
                    onClick={handleRemoveImage}
                    className="flex-1 px-4 py-3 bg-red-700 hover:bg-red-600 rounded-lg text-white transition-colors"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <label className="block w-full px-4 py-6 bg-black border-2 border-dashed border-gray-700 rounded-lg text-white text-center cursor-pointer hover:border-white transition-colors">
                {uploadingImage ? '⏳ Upload en cours...' : '📤 Cliquez pour uploader une image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            )}
            <p className="text-white text-sm mt-2">💡 L'image sera affichée en arrière-plan avec un overlay sombre pour la lisibilité</p>
          </div>

          {/* Aperçu */}
          <div>
            <label className="block text-white font-bold mb-3">👁️ Aperçu</label>
            <div 
              className="relative p-8 rounded-xl border-2 border-gray-700/50 text-center overflow-hidden"
              style={{
                backgroundImage: maintenanceBackgroundImage ? `url(${maintenanceBackgroundImage})` : 'none',
                backgroundColor: maintenanceBackgroundImage ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {maintenanceBackgroundImage && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
              )}
              <div className="relative z-10">
                <div className="text-6xl mb-4">🔧</div>
                <div className="text-white text-lg whitespace-pre-line leading-relaxed">
                  {maintenanceMessage}
                </div>
              </div>
            </div>
          </div>

          {/* Bouton Sauvegarder */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-black hover:bg-gray-900 rounded-lg text-white border border-white/20 font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '⏳ Enregistrement...' : '💾 Enregistrer les modifications'}
            </button>
          </div>
        </div>

        {/* Informations */}
        <div className="mt-6 p-6 bg-blue-900/20 border border-blue-700/50 rounded-xl">
          <h3 className="text-blue-400 font-bold mb-2">ℹ️ Informations importantes</h3>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• Le panel admin reste toujours accessible en mode maintenance</li>
            <li>• Les visiteurs verront uniquement la page de maintenance</li>
            <li>• Pensez à désactiver le mode après vos modifications</li>
            <li>• Le message supporte les sauts de ligne avec \n</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Maintenance
