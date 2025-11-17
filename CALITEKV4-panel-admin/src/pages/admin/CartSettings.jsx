import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getById, save } from '../../utils/api'

const AdminCartSettings = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    // Services de livraison avec créneaux individuels
    services: [
      { 
        name: 'Livraison', 
        label: '🚚 Livraison', 
        description: 'Livraison à domicile', 
        fee: 0, 
        enabled: true,
        slots: ['9h-12h', '12h-15h', '15h-18h', '18h-21h']
      },
      { 
        name: 'Meetup', 
        label: '🤝 Meetup', 
        description: 'Rendez-vous en personne', 
        fee: 0, 
        enabled: true,
        slots: ['10h', '14h', '16h', '20h']
      },
      { 
        name: 'Envoi', 
        label: '📦 Envoi postal', 
        description: 'Envoi par la poste', 
        fee: 0, 
        enabled: true,
        slots: ['Envoi sous 24h', 'Envoi sous 48h', 'Envoi express']
      }
    ],
    // Moyens de paiement (ajoutables/supprimables)
    payments: [
      { label: '💵 Espèces', enabled: true },
      { label: '💳 Carte bancaire', enabled: true },
      { label: '🏦 Virement', enabled: true },
      { label: '₿ Crypto', enabled: false }
    ],
    // Alertes
    alertEnabled: false,
    alertMessage: '',
    // Codes promo
    promosEnabled: true,
    // Liens de contact (personnalisables)
    contactLinks: [
      { name: 'WhatsApp', url: '', services: [] },
      { name: 'Telegram', url: '', services: [] }
    ],
    // Personnalisation des couleurs
    colors: {
      // Bouton "Continuer" principal
      continueButton: {
        bg: '#ffffff',
        text: '#000000',
        hoverBg: '#e5e7eb'
      },
      // Bouton "Retour"
      backButton: {
        bg: '#374151',
        text: '#ffffff',
        hoverBg: '#4b5563'
      },
      // Bouton "Vider le panier"
      clearCartButton: {
        text: '#f87171',
        hoverText: '#fca5a5'
      },
      // Bouton "OK" code promo
      promoButton: {
        bg: '#ffffff',
        text: '#000000',
        hoverBg: '#e5e7eb'
      },
      // Service sélectionné
      selectedService: {
        bg: 'transparent',
        text: '#000000',
        border: '#000000'
      },
      // Service non sélectionné
      unselectedService: {
        bg: 'rgba(15, 23, 42, 0.5)',
        text: '#ffffff',
        border: '#4b5563'
      },
      // Créneau horaire sélectionné
      selectedSlot: {
        bg: 'transparent',
        text: '#000000',
        border: '#000000'
      },
      // Créneau horaire non sélectionné
      unselectedSlot: {
        bg: 'rgba(15, 23, 42, 0.5)',
        text: '#ffffff',
        border: '#4b5563'
      },
      // Paiement sélectionné
      selectedPayment: {
        bgFrom: '#ffffff',
        bgTo: '#f3f4f6',
        text: '#000000',
        border: '#ffffff'
      },
      // Paiement non sélectionné
      unselectedPayment: {
        bg: '#1e293b',
        text: '#ffffff',
        border: '#374151'
      },
      // Bouton "Envoyer via"
      sendButton: {
        bgFrom: '#9333ea',
        bgTo: '#2563eb',
        hoverFrom: '#7e22ce',
        hoverTo: '#1d4ed8',
        text: '#ffffff'
      },
      // Bouton "Copier la commande"
      copyButton: {
        bg: '#374151',
        text: '#ffffff',
        hoverBg: '#4b5563'
      }
    }
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      console.log('[CartSettings] Chargement des paramètres du panier...')
      const data = await getById('settings', 'cart')
      console.log('[CartSettings] Données reçues:', data)
      if (data && data.value && Object.keys(data.value).length > 0) {
        // Fusionner avec les valeurs par défaut pour s'assurer que tout est présent
        setSettings(prev => ({
          ...prev,
          ...data.value,
          // S'assurer que les services ont toujours la structure complète
          services: data.value.services && Array.isArray(data.value.services) && data.value.services.length > 0 
            ? data.value.services.map(service => ({
                name: service.name || '',
                label: service.label || '',
                description: service.description || '',
                fee: service.fee !== undefined ? service.fee : 0,
                enabled: service.enabled !== undefined ? service.enabled : true,
                slots: service.slots && Array.isArray(service.slots) ? service.slots : []
              }))
            : prev.services,
          // S'assurer que les paiements sont présents
          payments: data.value.payments && Array.isArray(data.value.payments) && data.value.payments.length > 0 
            ? data.value.payments 
            : prev.payments,
          // S'assurer que les liens de contact sont présents
          contactLinks: data.value.contactLinks && Array.isArray(data.value.contactLinks) && data.value.contactLinks.length > 0
            ? data.value.contactLinks
            : prev.contactLinks,
          // Préserver les autres valeurs
          alertEnabled: data.value.alertEnabled !== undefined ? data.value.alertEnabled : prev.alertEnabled,
          alertMessage: data.value.alertMessage || prev.alertMessage,
          promosEnabled: data.value.promosEnabled !== undefined ? data.value.promosEnabled : prev.promosEnabled,
          // Fusionner les couleurs avec les valeurs par défaut
          colors: data.value.colors ? { ...prev.colors, ...data.value.colors } : prev.colors
        }))
      } else {
        // Si pas de données ou données vides, utiliser les valeurs par défaut
        console.log('Aucune configuration trouvée, utilisation des valeurs par défaut')
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error)
      // En cas d'erreur, garder les valeurs par défaut (déjà dans le state initial)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await save('settings', {
        key: 'cart',
        value: settings,
        updatedAt: new Date().toISOString()
      })
      alert('✅ Paramètres du panier sauvegardés !')
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // Services
  const updateService = (index, field, value) => {
    const newServices = [...settings.services]
    newServices[index][field] = value
    setSettings({ ...settings, services: newServices })
  }

  const addServiceSlot = (serviceIndex) => {
    const service = settings.services[serviceIndex]
    const newSlot = prompt(`Nouveau créneau pour ${service.label} (ex: 9h-12h)`)
    if (newSlot) {
      const newServices = [...settings.services]
      newServices[serviceIndex].slots = [...(newServices[serviceIndex].slots || []), newSlot]
      setSettings({ ...settings, services: newServices })
    }
  }

  const removeServiceSlot = (serviceIndex, slotIndex) => {
    const newServices = [...settings.services]
    newServices[serviceIndex].slots = newServices[serviceIndex].slots.filter((_, i) => i !== slotIndex)
    setSettings({ ...settings, services: newServices })
  }


  // Paiements
  const updatePayment = (index, field, value) => {
    const newPayments = [...settings.payments]
    newPayments[index][field] = value
    setSettings({ ...settings, payments: newPayments })
  }

  const addPayment = () => {
    const label = prompt('Nouveau moyen de paiement (avec emoji si souhaité)')
    if (label) {
      setSettings({ 
        ...settings, 
        payments: [...settings.payments, { label, enabled: true }] 
      })
    }
  }

  const removePayment = (index) => {
    if (confirm('Supprimer ce moyen de paiement ?')) {
      setSettings({ 
        ...settings, 
        payments: settings.payments.filter((_, i) => i !== index) 
      })
    }
  }

  // Mise à jour des couleurs
  const updateColor = (category, property, value) => {
    setSettings({
      ...settings,
      colors: {
        ...settings.colors,
        [category]: {
          ...settings.colors[category],
          [property]: value
        }
      }
    })
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Paramètres du Panier
          </h1>
          <p className="text-white">Configurez les services, paiements et horaires</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
        >
          {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Services */}
        <div className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">🚚 Services de livraison</h2>
          <div className="space-y-6">
            {settings.services.map((service, serviceIndex) => (
              <div key={serviceIndex} className="bg-slate-800/50 p-4 rounded-lg space-y-4">
                {/* Informations du service */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-white mb-2 text-sm">Label</label>
                    <input
                      type="text"
                      value={service.label}
                      onChange={(e) => updateService(serviceIndex, 'label', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-gray-700/30 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm">Description</label>
                    <input
                      type="text"
                      value={service.description}
                      onChange={(e) => updateService(serviceIndex, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-gray-700/30 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm">Frais (€)</label>
                    <input
                      type="number"
                      value={service.fee}
                      onChange={(e) => updateService(serviceIndex, 'fee', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-gray-700/30 rounded text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={service.enabled}
                        onChange={(e) => updateService(serviceIndex, 'enabled', e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-white">Activé</span>
                    </label>
                  </div>
                </div>

                {/* Créneaux horaires */}
                <div className="border-t border-gray-700/50 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white">⏰ Créneaux horaires</label>
                    <button
                      onClick={() => addServiceSlot(serviceIndex)}
                      className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                    >
                      + Ajouter
                    </button>
                  </div>

                  {/* Affichage des créneaux horaires */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(service.slots || []).map((slot, slotIndex) => (
                      <div key={slotIndex} className="bg-slate-900/50 p-2 rounded flex items-center justify-between">
                        <span className="text-white text-sm">{slot}</span>
                        <button
                          onClick={() => removeServiceSlot(serviceIndex, slotIndex)}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Moyens de paiement */}
        <div className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">💳 Moyens de paiement</h2>
            <button
              onClick={addPayment}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
            >
              + Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {settings.payments.map((payment, index) => (
              <div key={index} className="bg-slate-800/50 p-4 rounded-lg flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={payment.label}
                    onChange={(e) => updatePayment(index, 'label', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-gray-700/30 rounded text-white"
                  />
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payment.enabled}
                    onChange={(e) => updatePayment(index, 'enabled', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-white">Activé</span>
                </label>
                <button
                  onClick={() => removePayment(index)}
                  className="px-3 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes */}
        <div className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">⚠️ Message d'alerte</h2>
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.alertEnabled}
                onChange={(e) => setSettings({ ...settings, alertEnabled: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-white font-bold">Afficher un message d'alerte</span>
            </label>
            {settings.alertEnabled && (
              <textarea
                value={settings.alertMessage}
                onChange={(e) => setSettings({ ...settings, alertMessage: e.target.value })}
                placeholder="Message d'alerte à afficher sur la page panier..."
                rows="3"
                className="w-full px-4 py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white resize-none"
              />
            )}
          </div>
        </div>

        {/* Codes promo */}
        <div className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">🎟️ Codes promo</h2>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.promosEnabled}
              onChange={(e) => setSettings({ ...settings, promosEnabled: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-white font-bold">Activer les codes promo</span>
          </label>
          <p className="text-white text-sm mt-2">
            Gérez vos codes promo dans la page "Codes Promo" du menu
          </p>
        </div>

        {/* Personnalisation des couleurs */}
        <div className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">🎨 Personnalisation des couleurs</h2>
          <p className="text-white text-sm mb-6">Personnalisez 100% les couleurs de tous les boutons et textes du panier</p>
          
          <div className="space-y-6">
            {/* Bouton Continuer */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Bouton "Continuer"</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm">Fond</label>
                  <input
                    type="color"
                    value={settings.colors?.continueButton?.bg || '#ffffff'}
                    onChange={(e) => updateColor('continueButton', 'bg', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Texte</label>
                  <input
                    type="color"
                    value={settings.colors?.continueButton?.text || '#000000'}
                    onChange={(e) => updateColor('continueButton', 'text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Fond au survol</label>
                  <input
                    type="color"
                    value={settings.colors?.continueButton?.hoverBg || '#e5e7eb'}
                    onChange={(e) => updateColor('continueButton', 'hoverBg', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Bouton Retour */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Bouton "Retour"</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm">Fond</label>
                  <input
                    type="color"
                    value={settings.colors?.backButton?.bg || '#374151'}
                    onChange={(e) => updateColor('backButton', 'bg', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Texte</label>
                  <input
                    type="color"
                    value={settings.colors?.backButton?.text || '#ffffff'}
                    onChange={(e) => updateColor('backButton', 'text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Fond au survol</label>
                  <input
                    type="color"
                    value={settings.colors?.backButton?.hoverBg || '#4b5563'}
                    onChange={(e) => updateColor('backButton', 'hoverBg', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Bouton Vider le panier */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Bouton "Vider le panier"</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm">Texte</label>
                  <input
                    type="color"
                    value={settings.colors?.clearCartButton?.text || '#f87171'}
                    onChange={(e) => updateColor('clearCartButton', 'text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Texte au survol</label>
                  <input
                    type="color"
                    value={settings.colors?.clearCartButton?.hoverText || '#fca5a5'}
                    onChange={(e) => updateColor('clearCartButton', 'hoverText', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Bouton OK code promo */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Bouton "OK" code promo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm">Fond</label>
                  <input
                    type="color"
                    value={settings.colors?.promoButton?.bg || '#ffffff'}
                    onChange={(e) => updateColor('promoButton', 'bg', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Texte</label>
                  <input
                    type="color"
                    value={settings.colors?.promoButton?.text || '#000000'}
                    onChange={(e) => updateColor('promoButton', 'text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Fond au survol</label>
                  <input
                    type="color"
                    value={settings.colors?.promoButton?.hoverBg || '#e5e7eb'}
                    onChange={(e) => updateColor('promoButton', 'hoverBg', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Service sélectionné */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Service sélectionné</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm">Fond</label>
                  <input
                    type="text"
                    value={settings.colors?.selectedService?.bg || 'transparent'}
                    onChange={(e) => updateColor('selectedService', 'bg', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-gray-700/30 rounded text-white"
                    placeholder="transparent ou #hex"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Texte</label>
                  <input
                    type="color"
                    value={settings.colors?.selectedService?.text || '#000000'}
                    onChange={(e) => updateColor('selectedService', 'text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Bordure</label>
                  <input
                    type="color"
                    value={settings.colors?.selectedService?.border || '#000000'}
                    onChange={(e) => updateColor('selectedService', 'border', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Service non sélectionné */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Service non sélectionné</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm">Fond</label>
                  <input
                    type="text"
                    value={settings.colors?.unselectedService?.bg || 'rgba(15, 23, 42, 0.5)'}
                    onChange={(e) => updateColor('unselectedService', 'bg', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-gray-700/30 rounded text-white"
                    placeholder="rgba ou #hex"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Texte</label>
                  <input
                    type="color"
                    value={settings.colors?.unselectedService?.text || '#ffffff'}
                    onChange={(e) => updateColor('unselectedService', 'text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Bordure</label>
                  <input
                    type="color"
                    value={settings.colors?.unselectedService?.border || '#4b5563'}
                    onChange={(e) => updateColor('unselectedService', 'border', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Créneau horaire sélectionné */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Créneau horaire sélectionné</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm">Fond</label>
                  <input
                    type="text"
                    value={settings.colors?.selectedSlot?.bg || 'transparent'}
                    onChange={(e) => updateColor('selectedSlot', 'bg', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-gray-700/30 rounded text-white"
                    placeholder="transparent ou #hex"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Texte</label>
                  <input
                    type="color"
                    value={settings.colors?.selectedSlot?.text || '#000000'}
                    onChange={(e) => updateColor('selectedSlot', 'text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Bordure</label>
                  <input
                    type="color"
                    value={settings.colors?.selectedSlot?.border || '#000000'}
                    onChange={(e) => updateColor('selectedSlot', 'border', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Créneau horaire non sélectionné */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Créneau horaire non sélectionné</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm">Fond</label>
                  <input
                    type="text"
                    value={settings.colors?.unselectedSlot?.bg || 'rgba(15, 23, 42, 0.5)'}
                    onChange={(e) => updateColor('unselectedSlot', 'bg', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-gray-700/30 rounded text-white"
                    placeholder="rgba ou #hex"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Texte</label>
                  <input
                    type="color"
                    value={settings.colors?.unselectedSlot?.text || '#ffffff'}
                    onChange={(e) => updateColor('unselectedSlot', 'text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Bordure</label>
                  <input
                    type="color"
                    value={settings.colors?.unselectedSlot?.border || '#4b5563'}
                    onChange={(e) => updateColor('unselectedSlot', 'border', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Paiement sélectionné */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Paiement sélectionné</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm">Fond début (gradient)</label>
                  <input
                    type="color"
                    value={settings.colors?.selectedPayment?.bgFrom || '#ffffff'}
                    onChange={(e) => updateColor('selectedPayment', 'bgFrom', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Fond fin (gradient)</label>
                  <input
                    type="color"
                    value={settings.colors?.selectedPayment?.bgTo || '#f3f4f6'}
                    onChange={(e) => updateColor('selectedPayment', 'bgTo', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Texte</label>
                  <input
                    type="color"
                    value={settings.colors?.selectedPayment?.text || '#000000'}
                    onChange={(e) => updateColor('selectedPayment', 'text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Bordure</label>
                  <input
                    type="color"
                    value={settings.colors?.selectedPayment?.border || '#ffffff'}
                    onChange={(e) => updateColor('selectedPayment', 'border', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Paiement non sélectionné */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Paiement non sélectionné</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm">Fond</label>
                  <input
                    type="color"
                    value={settings.colors?.unselectedPayment?.bg || '#1e293b'}
                    onChange={(e) => updateColor('unselectedPayment', 'bg', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Texte</label>
                  <input
                    type="color"
                    value={settings.colors?.unselectedPayment?.text || '#ffffff'}
                    onChange={(e) => updateColor('unselectedPayment', 'text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Bordure</label>
                  <input
                    type="color"
                    value={settings.colors?.unselectedPayment?.border || '#374151'}
                    onChange={(e) => updateColor('unselectedPayment', 'border', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Bouton Envoyer via */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Bouton "Envoyer via"</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm">Fond début</label>
                  <input
                    type="color"
                    value={settings.colors?.sendButton?.bgFrom || '#9333ea'}
                    onChange={(e) => updateColor('sendButton', 'bgFrom', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Fond fin</label>
                  <input
                    type="color"
                    value={settings.colors?.sendButton?.bgTo || '#2563eb'}
                    onChange={(e) => updateColor('sendButton', 'bgTo', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Fond début (hover)</label>
                  <input
                    type="color"
                    value={settings.colors?.sendButton?.hoverFrom || '#7e22ce'}
                    onChange={(e) => updateColor('sendButton', 'hoverFrom', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Fond fin (hover)</label>
                  <input
                    type="color"
                    value={settings.colors?.sendButton?.hoverTo || '#1d4ed8'}
                    onChange={(e) => updateColor('sendButton', 'hoverTo', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Texte</label>
                  <input
                    type="color"
                    value={settings.colors?.sendButton?.text || '#ffffff'}
                    onChange={(e) => updateColor('sendButton', 'text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Bouton Copier */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Bouton "Copier la commande"</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white mb-2 text-sm">Fond</label>
                  <input
                    type="color"
                    value={settings.colors?.copyButton?.bg || '#374151'}
                    onChange={(e) => updateColor('copyButton', 'bg', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Texte</label>
                  <input
                    type="color"
                    value={settings.colors?.copyButton?.text || '#ffffff'}
                    onChange={(e) => updateColor('copyButton', 'text', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 text-sm">Fond au survol</label>
                  <input
                    type="color"
                    value={settings.colors?.copyButton?.hoverBg || '#4b5563'}
                    onChange={(e) => updateColor('copyButton', 'hoverBg', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liens de contact */}
        <div className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">📱 Liens de contact</h2>
            <button
              onClick={() => {
                const name = prompt('Nom du lien (ex: WhatsApp, Instagram, Contact)')
                if (name) {
                  setSettings({
                    ...settings,
                    contactLinks: [...(settings.contactLinks || []), { name, url: '', services: [] }]
                  })
                }
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
            >
              + Ajouter un lien
            </button>
          </div>
          
          <div className="space-y-4">
            {(settings.contactLinks || []).map((link, index) => (
              <div key={index} className="bg-slate-800/50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white mb-2 text-sm">Nom</label>
                    <input
                      type="text"
                      value={link.name}
                      onChange={(e) => {
                        const newLinks = [...settings.contactLinks]
                        newLinks[index].name = e.target.value
                        setSettings({ ...settings, contactLinks: newLinks })
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-gray-700/30 rounded text-white"
                      placeholder="WhatsApp"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm">URL</label>
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...settings.contactLinks]
                        newLinks[index].url = e.target.value
                        setSettings({ ...settings, contactLinks: newLinks })
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-gray-700/30 rounded text-white"
                      placeholder="https://wa.me/33612345678"
                    />
                  </div>
                </div>

                {/* Services associés */}
                <div>
                  <label className="block text-white mb-2 text-sm">
                    Disponible pour les services (laisse vide pour tous)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {settings.services.map((service, serviceIdx) => (
                      <label
                        key={serviceIdx}
                        className="flex items-center space-x-2 bg-slate-900/50 px-3 py-2 rounded cursor-pointer hover:bg-slate-900"
                      >
                        <input
                          type="checkbox"
                          checked={(link.services || []).includes(service.name)}
                          onChange={(e) => {
                            const newLinks = [...settings.contactLinks]
                            if (e.target.checked) {
                              newLinks[index].services = [...(newLinks[index].services || []), service.name]
                            } else {
                              newLinks[index].services = (newLinks[index].services || []).filter(s => s !== service.name)
                            }
                            setSettings({ ...settings, contactLinks: newLinks })
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-white text-sm">{service.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bouton supprimer */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer le lien "${link.name}" ?`)) {
                        setSettings({
                          ...settings,
                          contactLinks: settings.contactLinks.filter((_, i) => i !== index)
                        })
                      }
                    }}
                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
            
            {(!settings.contactLinks || settings.contactLinks.length === 0) && (
              <p className="text-white text-center py-4">
                Aucun lien configuré. Clique sur "+ Ajouter un lien" pour commencer.
              </p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default AdminCartSettings
