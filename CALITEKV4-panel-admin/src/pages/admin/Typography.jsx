import React, { useState, useEffect } from 'react'
import { error as logError } from '../../utils/logger'
import { motion } from 'framer-motion'
import { getAll, getById, save } from '../../utils/api'

const fonts = [
  { name: 'Playfair Display', value: 'Playfair Display', preview: 'Notre Boutique', style: 'serif', description: 'Élégant et luxueux' },
  { name: 'Montserrat', value: 'Montserrat', preview: 'Notre Boutique', style: 'sans-serif', description: 'Moderne et propre' },
  { name: 'Bebas Neue', value: 'Bebas Neue', preview: 'NOTRE BOUTIQUE', style: 'sans-serif', description: 'Bold et impactant' },
  { name: 'Raleway', value: 'Raleway', preview: 'Notre Boutique', style: 'sans-serif', description: 'Élégant et moderne' },
  { name: 'Oswald', value: 'Oswald', preview: 'NOTRE BOUTIQUE', style: 'sans-serif', description: 'Puissant et structuré' },
  { name: 'Merriweather', value: 'Merriweather', preview: 'Notre Boutique', style: 'serif', description: 'Classique et lisible' },
  { name: 'Cinzel', value: 'Cinzel', preview: 'Notre Boutique', style: 'serif', description: 'Antique et raffiné' },
  { name: 'Great Vibes', value: 'Great Vibes', preview: 'Notre Boutique', style: 'cursive', description: 'Script élégant' },
  { name: 'Righteous', value: 'Righteous', preview: 'Notre Boutique', style: 'sans-serif', description: 'Fun et dynamique' },
  { name: 'Abril Fatface', value: 'Abril Fatface', preview: 'Notre Boutique', style: 'serif', description: 'Dramatique et bold' }
]

const AdminTypography = () => {
  const [settings, setSettings] = useState({ titleFont: 'Playfair Display' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getById('settings', 'typography')
      if (data && data.value && data.value.titleFont) {
        setSettings({ ...settings, titleFont: data.value.titleFont })
      } else {
        // Essayer l'ancien format pour compatibilité
        const allData = await getAll('settings')
        if (allData && allData.titleFont) {
          setSettings({ ...settings, titleFont: allData.titleFont })
        }
      }
    } catch (error) {
      logError('Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleFontSelect = async (fontValue) => {
    setSaving(true)
    try {
      setSettings({ ...settings, titleFont: fontValue })
      
      // Appliquer immédiatement dans le navigateur
      document.documentElement.style.setProperty('--title-font', `'${fontValue}'`)
      
      // Sauvegarder via l'API Vercel
      console.log('Saving typography:', { titleFont: fontValue })
      const result = await save('settings', {
        key: 'typography',
        value: {
          titleFont: fontValue
        }
      })
      console.log('Typography save result:', result)
      
      if (result && result.error) {
        throw new Error(result.error)
      }
      
      setTimeout(() => {
        setSaving(false)
        alert('✅ Police enregistrée avec succès ! Actualisez la page pour voir le changement partout.')
      }, 500)
    } catch (error) {
      logError('Erreur')
      setSaving(false)
      alert('❌ Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'))
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
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
          Typographie
        </h1>
        <p className="text-white text-sm sm:text-base">
          Choisissez la police d'écriture pour les grands titres
        </p>
      </div>

      {/* Aperçu actuel */}
      <div className="mb-8 p-6 border border-gray-700 rounded-xl bg-slate-900/50">
        <h3 className="text-white font-semibold mb-4">Police actuelle</h3>
        <div 
          className="text-4xl md:text-6xl font-bold text-white text-center py-8"
          style={{ fontFamily: settings.titleFont }}
        >
          Notre Boutique
        </div>
        <p className="text-center text-white mt-2">{settings.titleFont}</p>
      </div>

      {/* Grille de polices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fonts.map((font) => (
          <motion.div
            key={font.value}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleFontSelect(font.value)}
            className={`
              cursor-pointer border-2 rounded-xl p-6 transition-all
              ${settings.titleFont === font.value 
                ? 'border-white bg-white/10' 
                : 'border-gray-700 bg-slate-900/50 hover:border-gray-500'
              }
            `}
          >
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-1">{font.name}</h4>
              <p className="text-white text-xs">{font.description}</p>
            </div>
            
            <div 
              className="text-3xl font-bold text-white text-center py-6 border border-gray-800 rounded-lg bg-black/30"
              style={{ fontFamily: font.value }}
            >
              {font.preview}
            </div>
            
            {settings.titleFont === font.value && (
              <div className="mt-3 text-center">
                <span className="text-white text-sm">✓ Sélectionné</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {saving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-gray-700 rounded-xl p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">Enregistrement...</p>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default AdminTypography
