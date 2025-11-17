import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getById, save, deleteBlobFile } from '../../utils/api'
import { uploadToR2 } from '../../utils/cloudflare'

const AdminLoading = () => {
  const [config, setConfig] = useState({
    enabled: true,
    text: 'Chargement...',
    duration: 2000,
    backgroundColor: '#667eea',
    style: 'spinner',
    backgroundType: 'color',
    backgroundImage: '',
    backgroundVideo: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const data = await getById('settings', 'loading')
      if (data && data.value) {
        setConfig({
          enabled: data.value.enabled !== false,
          text: data.value.text || 'Chargement...',
          duration: data.value.duration || 2000,
          backgroundColor: data.value.backgroundColor || '#667eea',
          style: data.value.style || 'spinner',
          backgroundType: data.value.backgroundType || 'color',
          backgroundImage: data.value.backgroundImage || '',
          backgroundVideo: data.value.backgroundVideo || ''
        })
      }
    } catch (error) {
      console.error('Erreur chargement config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await save('settings', {
        id: 'loading',
        key: 'loading',
        value: config
      })
      alert('✅ Configuration sauvegardée avec succès !')
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key, value) => {
    setConfig({ ...config, [key]: value })
    setPreviewKey(prev => prev + 1)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploadingImage(true)
      if (config.backgroundImage && config.backgroundImage.includes('vercel-storage.com')) {
        await deleteBlobFile(config.backgroundImage)
      }
      const result = await uploadToR2(file)
      updateConfig('backgroundImage', result.url)
    } catch (error) {
      console.error('Erreur upload:', error)
      alert('❌ Erreur upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploadingVideo(true)
      if (config.backgroundVideo && config.backgroundVideo.includes('vercel-storage.com')) {
        await deleteBlobFile(config.backgroundVideo)
      }
      const result = await uploadToR2(file)
      updateConfig('backgroundVideo', result.url)
    } catch (error) {
      console.error('Erreur upload:', error)
      alert('❌ Erreur upload vidéo')
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleDeleteImage = async () => {
    if (config.backgroundImage && config.backgroundImage.includes('vercel-storage.com')) {
      await deleteBlobFile(config.backgroundImage)
    }
    updateConfig('backgroundImage', '')
  }

  const handleDeleteVideo = async () => {
    if (config.backgroundVideo && config.backgroundVideo.includes('vercel-storage.com')) {
      await deleteBlobFile(config.backgroundVideo)
    }
    updateConfig('backgroundVideo', '')
  }

  const styles = [
    { value: 'spinner', label: 'Spinner', icon: '🌀' },
    { value: 'progress', label: 'Progression', icon: '📊' },
    { value: 'dots', label: 'Points', icon: '⚫' },
    { value: 'pulse', label: 'Pulsation', icon: '💫' },
    { value: 'wave', label: 'Vague', icon: '🌊' },
    { value: 'orbit', label: 'Orbite', icon: '🪐' },
    { value: 'bars', label: 'Barres', icon: '📊' },
    { value: 'circle', label: 'Cercles', icon: '⭕' },
  ]

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-white">Chargement...</div></div>
  }

  return (
    <div className="min-h-screen bg-black">
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">⏳ Page de Chargement</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <div className="space-y-6">
            {/* Activer */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Activer</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={config.enabled} onChange={(e) => updateConfig('enabled', e.target.checked)} className="sr-only peer" />
                  <div className="w-14 h-7 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Texte */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-gray-700/50">
              <label className="block text-white font-semibold mb-2">Texte</label>
              <input type="text" value={config.text} onChange={(e) => updateConfig('text', e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-gray-700 rounded-lg text-white" />
            </div>

            {/* Style */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-gray-700/50">
              <label className="block text-white font-semibold mb-3">Style</label>
              <div className="grid grid-cols-4 gap-2">
                {styles.map((style) => (
                  <button key={style.value} onClick={() => updateConfig('style', style.value)} className={`p-3 rounded-lg border-2 ${config.style === style.value ? 'border-blue-500 bg-blue-500/20' : 'border-gray-700 bg-slate-900'}`}>
                    <div className="text-xl">{style.icon}</div>
                    <div className="text-white text-xs mt-1">{style.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Durée */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-gray-700/50">
              <label className="block text-white font-semibold mb-2">Durée : {config.duration}ms</label>
              <input type="range" min="1000" max="5000" step="100" value={config.duration} onChange={(e) => updateConfig('duration', parseInt(e.target.value))} className="w-full" />
            </div>

            {/* Type de fond */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-gray-700/50">
              <label className="block text-white font-semibold mb-3">Type de fond</label>
              <div className="grid grid-cols-3 gap-3">
                {['color', 'image', 'video'].map((type) => (
                  <button key={type} onClick={() => updateConfig('backgroundType', type)} className={`p-3 rounded-lg border-2 ${config.backgroundType === type ? 'border-blue-500 bg-blue-500/20' : 'border-gray-700 bg-slate-900'}`}>
                    <div className="text-white text-sm">{type === 'color' ? '🎨 Couleur' : type === 'image' ? '🖼️ Image' : '🎥 Vidéo'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Couleur */}
            {config.backgroundType === 'color' && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-gray-700/50">
                <label className="block text-white font-semibold mb-2">Couleur de fond</label>
                <div className="flex gap-3">
                  <input type="color" value={config.backgroundColor} onChange={(e) => updateConfig('backgroundColor', e.target.value)} className="w-20 h-12 rounded cursor-pointer" />
                  <input type="text" value={config.backgroundColor} onChange={(e) => updateConfig('backgroundColor', e.target.value)} className="flex-1 px-4 py-3 bg-slate-900 border border-gray-700 rounded-lg text-white" />
                </div>
              </div>
            )}

            {/* Image */}
            {config.backgroundType === 'image' && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-gray-700/50">
                <label className="block text-white font-semibold mb-2">Image de fond</label>
                {config.backgroundImage && (
                  <div className="mb-3 relative group">
                    <img src={config.backgroundImage} alt="Fond" className="w-full h-32 object-cover rounded-lg" />
                    <button onClick={handleDeleteImage} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center">×</button>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="w-full px-4 py-2 bg-slate-900 border border-gray-700 rounded-lg text-white file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-700 file:text-white" />
              </div>
            )}

            {/* Vidéo */}
            {config.backgroundType === 'video' && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-gray-700/50">
                <label className="block text-white font-semibold mb-2">Vidéo de fond</label>
                {config.backgroundVideo && (
                  <div className="mb-3 relative group">
                    <video src={config.backgroundVideo} className="w-full h-32 object-cover rounded-lg" muted />
                    <button onClick={handleDeleteVideo} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center">×</button>
                  </div>
                )}
                <input type="file" accept="video/*" onChange={handleVideoUpload} disabled={uploadingVideo} className="w-full px-4 py-2 bg-slate-900 border border-gray-700 rounded-lg text-white file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-700 file:text-white" />
              </div>
            )}

            <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-black hover:bg-gray-900 text-white border border-white/20 font-bold rounded-lg">
              {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </div>

          {/* Aperçu */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-white font-semibold mb-4 text-center">👁️ Aperçu</h3>
              <div className="relative h-96 rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: config.backgroundType === 'color' ? config.backgroundColor : '#000' }}>
                {config.backgroundType === 'image' && config.backgroundImage && <img src={config.backgroundImage} className="absolute inset-0 w-full h-full object-cover" />}
                {config.backgroundType === 'video' && config.backgroundVideo && <video src={config.backgroundVideo} autoPlay loop muted className="absolute inset-0 w-full h-full object-cover" />}
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="text-white text-4xl">⏳</div>
                  <p className="text-white text-lg font-bold">{config.text}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default AdminLoading
