import React, { useState, useEffect } from 'react'
import { error as logError } from '../../utils/logger'
import { motion } from 'framer-motion'
import { getById, save, deleteBlobFile } from '../../utils/api'
import { uploadToR2 } from '../../utils/cloudflare'

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    shopName: '',
    heroTitle: '',
    heroSubtitle: '',
    backgroundImage: ''
  })
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const data = await getById('settings', 'general')
      if (data && data.value && typeof data.value === 'object' && Object.keys(data.value).length > 0) {
        // Charger les valeurs existantes
        setSettings({
          shopName: data.value.shopName || '',
          heroTitle: data.value.heroTitle || '',
          heroSubtitle: data.value.heroSubtitle || '',
          backgroundImage: data.value.backgroundImage || '',
          ...data.value
        })
      } else {
        // Si pas de données, garder les valeurs vides (déjà dans le state initial)
        console.log('Aucune configuration générale trouvée')
      }
      
      const sectionsData = await getById('settings', 'sections')
      if (sectionsData && sectionsData.value && sectionsData.value.sections && Array.isArray(sectionsData.value.sections) && sectionsData.value.sections.length > 0) {
        setSections(sectionsData.value.sections)
      } else if (sectionsData && sectionsData.sections && Array.isArray(sectionsData.sections) && sectionsData.sections.length > 0) {
        // Support de l'ancien format
        setSections(sectionsData.sections)
      } else {
        // Si aucune section n'est configurée, garder vide
        setSections([])
      }
    } catch (error) {
      logError('Erreur')
      // En cas d'erreur, garder les valeurs vides (déjà dans le state initial)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Récupérer les settings existants pour préserver les autres propriétés
      let existingGeneral = {}
      try {
        const existing = await getById('settings', 'general')
        if (existing && existing.value) {
          existingGeneral = existing.value
        }
      } catch (e) {
        // Si n'existe pas encore, continuer avec un objet vide
      }
      
      // Nettoyer les valeurs vides avant de sauvegarder
      const cleanedSettings = Object.fromEntries(
        Object.entries(settings).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      )
      
      console.log('Saving general settings:', { ...existingGeneral, ...cleanedSettings })
      const generalResult = await save('settings', {
        key: 'general',
        value: {
          ...existingGeneral,
          ...cleanedSettings,
          updatedAt: new Date().toISOString()
        }
      })
      console.log('General settings save result:', generalResult)
      
      // Ne sauvegarder les sections que si elles existent et ne sont pas vides
      let sectionsResult = null
      if (sections && Array.isArray(sections) && sections.length > 0) {
        console.log('Saving sections:', sections)
        sectionsResult = await save('settings', {
          key: 'sections',
          value: {
            sections: sections,
            updatedAt: new Date().toISOString()
          }
        })
      } else {
        // Si les sections sont vides, supprimer la configuration existante
        try {
          const existingSections = await getById('settings', 'sections')
          if (existingSections) {
            // Supprimer la clé sections si elle existe mais est vide
            await save('settings', {
              key: 'sections',
              value: {
                sections: [],
                updatedAt: new Date().toISOString()
              }
            })
          }
        } catch (e) {
          // Ignorer si la clé n'existe pas
        }
      }
      console.log('Sections save result:', sectionsResult)
      
      if ((generalResult && generalResult.error) || (sectionsResult && sectionsResult.error)) {
        throw new Error(generalResult?.error || sectionsResult?.error || 'Erreur lors de la sauvegarde')
      }
      
      alert('✅ Paramètres sauvegardés avec succès !')
    } catch (error) {
      logError('Erreur')
      alert('❌ Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'))
    } finally {
      setSaving(false)
    }
  }

  const addSection = () => {
    setSections([...sections, { icon: '📦', title: '', content: '' }])
  }

  const removeSection = (index) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== index))
    }
  }

  const updateSection = (index, field, value) => {
    const newSections = [...sections]
    newSections[index][field] = value
    setSections(newSections)
  }

  const handleBackgroundUpload = async (file) => {
    if (!file) return
    
    setUploadingBg(true)
    try {
      // Supprimer l'ancienne image si elle existe
      if (settings.backgroundImage && settings.backgroundImage.includes('vercel-storage.com')) {
        await deleteBlobFile(settings.backgroundImage)
      }
      
      const result = await uploadToR2(file)
      setSettings({ ...settings, backgroundImage: result.url })
      alert('Image de fond uploadée avec succès !')
    } catch (error) {
      logError('Erreur')
      alert('Erreur lors de l\'upload de l\'image de fond.')
    } finally {
      setUploadingBg(false)
    }
  }

  const handleSectionImageUpload = async (file, index) => {
    if (!file) return
    
    try {
      // Supprimer l'ancienne image si elle existe
      const currentIcon = sections[index]?.icon
      if (currentIcon && currentIcon.includes('vercel-storage.com')) {
        await deleteBlobFile(currentIcon)
      }
      
      const result = await uploadToR2(file)
      updateSection(index, 'icon', result.url)
    } catch (error) {
      logError('Erreur')
      alert('Erreur lors de l\'upload de l\'image')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
          ⚙️ Configuration
        </h1>
        <p className="text-white text-sm sm:text-base">Paramètres généraux de la boutique</p>
      </div>

      <div className="max-w-2xl w-full">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Nom de la boutique */}
          <div className="neon-border rounded-xl p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">🏪 Nom de la boutique</h3>
            <input
              type="text"
              value={settings.shopName}
              onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
              placeholder="AVEC Amour"
            />
          </div>

          {/* Image de fond */}
          <div className="neon-border rounded-xl p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">🖼️ Image de fond du site</h3>
            
            {settings.backgroundImage && (
              <div className="mb-4 relative group">
                <div className="w-full h-40 rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                  <img 
                    src={settings.backgroundImage} 
                    alt="Fond actuel" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Erreur de chargement de l\'image:', settings.backgroundImage)
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (settings.backgroundImage && settings.backgroundImage.includes('vercel-storage.com')) {
                      await deleteBlobFile(settings.backgroundImage)
                    }
                    setSettings({ ...settings, backgroundImage: '' })
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <p className="text-white text-xs mt-2">Image de fond actuelle</p>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleBackgroundUpload(e.target.files[0])}
              disabled={uploadingBg}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-700 file:text-white file:text-sm file:cursor-pointer"
            />
            {uploadingBg && <p className="text-white text-sm mt-2">Upload en cours...</p>}
            <p className="text-white text-xs mt-2">Cette image sera utilisée comme fond pour toutes les pages (boutique et admin)</p>
          </div>

          {/* Textes page d'accueil */}
          <div className="border border-gray-700 rounded-xl p-6 bg-black/50">
            <h3 className="text-xl font-bold text-white mb-4">🏠 Textes de la page d'accueil</h3>
            <p className="text-white text-sm mb-4">Le texte s'affichera avec un fond pour être bien visible</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2 text-sm">Titre principal (grand texte)</label>
                <input
                  type="text"
                  value={settings.heroTitle}
                  onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 transition-colors"
                  placeholder="OG LEGACY"
                />
              </div>

              <div>
                <label className="block text-white mb-2 text-sm">Sous-titre / Phrase d'accroche</label>
                <textarea
                  value={settings.heroSubtitle}
                  onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 transition-colors resize-none"
                  placeholder="Votre meilleur café à Paris"
                />
              </div>
            </div>
          </div>

          {/* Sections page d'accueil */}
          <div className="border border-gray-700 rounded-xl p-6 bg-black/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">📋 Sections de la page d'accueil</h3>
              <button
                type="button"
                onClick={addSection}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
              >
                + Ajouter une section
              </button>
            </div>
            
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-4 bg-black/30">
                  <div className="flex items-start space-x-3">
                    {/* Image ou Emoji */}
                    <div className="flex-shrink-0">
                      {section.icon && section.icon.startsWith('http') ? (
                        <div className="relative group">
                          <img 
                            src={section.icon} 
                            alt="Section icon" 
                            className="w-16 h-16 object-cover rounded border border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const currentIcon = sections[index]?.icon
                              if (currentIcon && currentIcon.includes('vercel-storage.com')) {
                                await deleteBlobFile(currentIcon)
                              }
                              updateSection(index, 'icon', '')
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={section.icon}
                          onChange={(e) => updateSection(index, 'icon', e.target.value)}
                          className="w-16 h-16 px-3 py-2 bg-black border border-gray-700 rounded text-white text-center text-2xl focus:outline-none focus:border-gray-500"
                          placeholder="📦"
                          maxLength="2"
                        />
                      )}
                      {/* Bouton upload image */}
                      <label className="block mt-2 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSectionImageUpload(e.target.files[0], index)}
                          className="hidden"
                        />
                        <div className="text-xs text-white hover:text-white text-center border border-gray-700 rounded px-2 py-1 hover:bg-gray-700 transition-colors">
                          📷 Image
                        </div>
                      </label>
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white focus:outline-none focus:border-gray-500"
                        placeholder="Titre de la section"
                      />
                      <textarea
                        value={section.content}
                        onChange={(e) => updateSection(index, 'content', e.target.value)}
                        rows="2"
                        className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white focus:outline-none focus:border-gray-500 resize-none text-sm"
                        placeholder="Contenu de la section"
                      />
                    </div>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="px-3 py-2 bg-red-900/20 text-white rounded hover:bg-red-900/30"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bouton sauvegarder */}
          <button
            type="submit"
            disabled={saving || uploadingBg}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminSettings
