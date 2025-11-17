import React, { useState, useEffect } from 'react'
import { error as logError } from '../../utils/logger'
import { motion } from 'framer-motion'
import { getById, save } from '../../utils/api.js'

const Colors = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [colors, setColors] = useState({
    textPrimary: '#ffffff', // Texte principal (blanc par défaut)
    textSecondary: '#9ca3af', // Texte secondaire (gris par défaut)
    textHeading: '#ffffff', // Titres (blanc par défaut)
    backgroundColor: '#000000', // Fond (noir par défaut)
    cardBackground: '#1e293b', // Fond des cartes (slate-800 par défaut)
    borderColor: '#334155', // Couleur des bordures
    buttonText: '#ffffff', // Texte des boutons
    buttonBackground: '#3b82f6', // Fond des boutons
    linkColor: '#60a5fa', // Couleur des liens
    accentColor: '#ffffff' // Couleur d'accent
  })

  useEffect(() => {
    loadColors()
  }, [])

  const loadColors = async () => {
    try {
      setLoading(true)
      const data = await getById('settings', 'colors')
      
      if (data && data.value) {
        setColors({
          ...colors,
          ...data.value
        })
      }
    } catch (error) {
      logError('Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      console.log('💾 Sauvegarde des couleurs:', colors)
      
      const result = await save('settings', {
        key: 'colors',
        value: colors
      })
      
      console.log('✅ Résultat sauvegarde:', result)
      
      // Appliquer les couleurs immédiatement
      applyColors(colors)
      
      alert('✅ Couleurs sauvegardées avec succès!')
    } catch (error) {
      logError('Erreur')
      alert('❌ Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'))
    } finally {
      setSaving(false)
    }
  }

  const applyColors = (colorSettings) => {
    const root = document.documentElement
    const body = document.body
    
    // Appliquer les variables CSS
    root.style.setProperty('--color-text-primary', colorSettings.textPrimary)
    root.style.setProperty('--color-text-secondary', colorSettings.textSecondary)
    root.style.setProperty('--color-text-heading', colorSettings.textHeading)
    root.style.setProperty('--color-background', colorSettings.backgroundColor)
    root.style.setProperty('--color-card-background', colorSettings.cardBackground)
    root.style.setProperty('--color-border', colorSettings.borderColor)
    root.style.setProperty('--color-button-text', colorSettings.buttonText)
    root.style.setProperty('--color-button-background', colorSettings.buttonBackground)
    root.style.setProperty('--color-link', colorSettings.linkColor)
    root.style.setProperty('--color-accent', colorSettings.accentColor)
    
    // Appliquer directement sur le body aussi
    body.style.setProperty('--color-text-primary', colorSettings.textPrimary)
    body.style.setProperty('--color-text-secondary', colorSettings.textSecondary)
    body.style.setProperty('--color-text-heading', colorSettings.textHeading)
    body.style.setProperty('--color-background', colorSettings.backgroundColor)
    
    console.log('🎨 Couleurs appliquées:', colorSettings)
  }

  const handleColorChange = (key, value) => {
    setColors(prev => ({
      ...prev,
      [key]: value
    }))
    // Prévisualisation immédiate
    const updatedColors = { ...colors, [key]: value }
    applyColors(updatedColors)
  }

  const resetToDefault = () => {
    const defaultColors = {
      textPrimary: '#ffffff',
      textSecondary: '#9ca3af',
      textHeading: '#ffffff',
      backgroundColor: '#000000',
      cardBackground: '#1e293b',
      borderColor: '#334155',
      buttonText: '#ffffff',
      buttonBackground: '#3b82f6',
      linkColor: '#60a5fa',
      accentColor: '#ffffff'
    }
    setColors(defaultColors)
    applyColors(defaultColors)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  const colorPresets = [
    { name: 'Noir & Blanc', textPrimary: '#ffffff', backgroundColor: '#000000', cardBackground: '#1e293b' },
    { name: 'Blanc & Noir', textPrimary: '#000000', backgroundColor: '#ffffff', cardBackground: '#f3f4f6' },
    { name: 'Sombre', textPrimary: '#e5e7eb', backgroundColor: '#111827', cardBackground: '#1f2937' },
    { name: 'Clair', textPrimary: '#1f2937', backgroundColor: '#f9fafb', cardBackground: '#ffffff' }
  ]

  return (
    <div className="min-h-screen bg-black">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🎨 Couleurs</h1>
        <div className="flex gap-2">
          <button
            onClick={resetToDefault}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-black hover:bg-gray-900 text-white border border-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Présélections</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  const newColors = {
                    ...colors,
                    textPrimary: preset.textPrimary,
                    backgroundColor: preset.backgroundColor,
                    cardBackground: preset.cardBackground,
                    textSecondary: preset.textPrimary === '#ffffff' ? '#9ca3af' : '#6b7280',
                    textHeading: preset.textPrimary
                  }
                  setColors(newColors)
                  applyColors(newColors)
                }}
                className="p-4 rounded-lg border-2 border-slate-600 hover:border-blue-500 transition-colors text-left"
                style={{
                  backgroundColor: preset.cardBackground,
                  color: preset.textPrimary
                }}
              >
                <div className="font-semibold">{preset.name}</div>
                <div className="text-xs mt-1 opacity-75">Aperçu</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Texte Principal */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Texte Principal
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colors.textPrimary}
                onChange={(e) => handleColorChange('textPrimary', e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colors.textPrimary}
                onChange={(e) => handleColorChange('textPrimary', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Texte Secondaire */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Texte Secondaire
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colors.textSecondary}
                onChange={(e) => handleColorChange('textSecondary', e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colors.textSecondary}
                onChange={(e) => handleColorChange('textSecondary', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600"
                placeholder="#9ca3af"
              />
            </div>
          </div>

          {/* Titres */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Titres
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colors.textHeading}
                onChange={(e) => handleColorChange('textHeading', e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colors.textHeading}
                onChange={(e) => handleColorChange('textHeading', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Fond Principal */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Fond Principal
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colors.backgroundColor}
                onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colors.backgroundColor}
                onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Fond des Cartes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Fond des Cartes
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colors.cardBackground}
                onChange={(e) => handleColorChange('cardBackground', e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colors.cardBackground}
                onChange={(e) => handleColorChange('cardBackground', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600"
                placeholder="#1e293b"
              />
            </div>
          </div>

          {/* Bordures */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Bordures
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colors.borderColor}
                onChange={(e) => handleColorChange('borderColor', e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colors.borderColor}
                onChange={(e) => handleColorChange('borderColor', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600"
                placeholder="#334155"
              />
            </div>
          </div>

          {/* Texte des Boutons */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Texte des Boutons
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colors.buttonText}
                onChange={(e) => handleColorChange('buttonText', e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colors.buttonText}
                onChange={(e) => handleColorChange('buttonText', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Fond des Boutons */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Fond des Boutons
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colors.buttonBackground}
                onChange={(e) => handleColorChange('buttonBackground', e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colors.buttonBackground}
                onChange={(e) => handleColorChange('buttonBackground', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600"
                placeholder="#3b82f6"
              />
            </div>
          </div>

          {/* Liens */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Couleur des Liens
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colors.linkColor}
                onChange={(e) => handleColorChange('linkColor', e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colors.linkColor}
                onChange={(e) => handleColorChange('linkColor', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600"
                placeholder="#60a5fa"
              />
            </div>
          </div>

          {/* Couleur d'Accent */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Couleur d'Accent
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colors.accentColor}
                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={colors.accentColor}
                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 rounded border border-slate-600"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
    </div>
  )
}

export default Colors
