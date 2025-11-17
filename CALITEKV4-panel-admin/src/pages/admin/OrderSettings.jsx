import React, { useState, useEffect } from 'react'
import { error as logError } from '../../utils/logger'
import { motion } from 'framer-motion'
import { getById, save } from '../../utils/api'

const AdminOrderSettings = () => {
  const [settings, setSettings] = useState({
    orderLink: '',
    orderButtonText: 'Commander'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getById('settings', 'order')
      if (data && data.value) {
        setSettings({
          orderLink: data.value.orderLink || '',
          orderButtonText: data.value.orderButtonText || 'Commander'
        })
      }
    } catch (error) {
      logError('Erreur')
      // Si la clé n'existe pas encore, garder les valeurs par défaut
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Sauvegarder via l'API Vercel
      await save('settings', {
        key: 'order',
        value: {
          orderLink: settings.orderLink,
          orderButtonText: settings.orderButtonText
        }
      })
      
      alert('✅ Paramètres de commande enregistrés avec succès !')
    } catch (error) {
      logError('Erreur')
      alert('❌ Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'))
    } finally {
      setSaving(false)
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
          Paramètres de Commande
        </h1>
        <p className="text-white text-sm sm:text-base">
          Configurez le lien et le texte du bouton de commande
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Lien de commande */}
        <div className="border border-gray-700 rounded-xl p-6 bg-slate-900/50">
          <h3 className="text-xl font-bold text-white mb-4">🔗 Lien de Commande</h3>
          <div>
            <label className="block text-white mb-2 text-sm">
              Lien externe (WhatsApp, Telegram, formulaire, etc.)
            </label>
            <input
              type="url"
              value={settings.orderLink}
              onChange={(e) => setSettings({ ...settings, orderLink: e.target.value })}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 transition-colors"
              placeholder="https://wa.me/123456789"
            />
            <p className="text-white text-xs mt-2">
              Exemple WhatsApp : https://wa.me/33123456789<br/>
              Exemple lien : https://example.com/contact
            </p>
          </div>
        </div>

        {/* Texte du bouton */}
        <div className="border border-gray-700 rounded-xl p-6 bg-slate-900/50">
          <h3 className="text-xl font-bold text-white mb-4">💬 Texte du Bouton</h3>
          <div>
            <label className="block text-white mb-2 text-sm">
              Texte affiché sur le bouton de commande
            </label>
            <input
              type="text"
              value={settings.orderButtonText}
              onChange={(e) => setSettings({ ...settings, orderButtonText: e.target.value })}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 transition-colors"
              placeholder="Commander"
              maxLength="30"
            />
            <p className="text-white text-xs mt-2">
              Maximum 30 caractères
            </p>
          </div>
        </div>

        {/* Aperçu */}
        <div className="border border-gray-700 rounded-xl p-6 bg-slate-900/50">
          <h3 className="text-xl font-bold text-white mb-4">👁️ Aperçu</h3>
          <div className="flex items-center justify-center py-8">
            <button
              type="button"
              className="px-8 py-4 bg-black hover:bg-gray-900 rounded-lg text-white border border-white/20 font-bold text-lg transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <span>💬</span>
              <span>{settings.orderButtonText || 'Commander'}</span>
            </button>
          </div>
        </div>

        {/* Bouton Sauvegarder */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : '💾 Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}

    </div>
export default AdminOrderSettings
