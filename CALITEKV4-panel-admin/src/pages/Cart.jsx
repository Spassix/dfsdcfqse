import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import { useCart } from '../contexts/CartContext'
import { getById } from '../utils/api'

const Cart = () => {
  const navigate = useNavigate()
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotal,
    getTotalItems,
    promoCode,
    promoDiscount,
    applyPromoCode,
    removePromoCode
  } = useCart()

  const [step, setStep] = useState(1) // 1: Panier, 2: Service, 3: Info client, 4: Récapitulatif
  const [settings, setSettings] = useState(null)
  const [promoInput, setPromoInput] = useState('')
  const [promoMessage, setPromoMessage] = useState('')
  
  // Formulaire
  const [selectedService, setSelectedService] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [selectedPayment, setSelectedPayment] = useState('')
  const [clientInfo, setClientInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    complement: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const cartSettings = await getById('settings', 'cart')
      if (cartSettings && cartSettings.value) {
        setSettings(cartSettings.value)
      } else {
        // Paramètres par défaut si rien n'est configuré
        setSettings({
          services: [
            { 
              name: 'Livraison', 
              label: '🚚 Livraison', 
              description: 'Livraison à domicile', 
              fee: 5, 
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
              fee: 3, 
              enabled: true,
              slots: ['Envoi sous 24h', 'Envoi sous 48h', 'Envoi express']
            }
          ],
          payments: [
            { label: '💵 Espèces', enabled: true },
            { label: '💳 Carte bancaire', enabled: true },
            { label: '🏦 Virement', enabled: true }
          ],
          alertEnabled: false,
          alertMessage: '',
          promosEnabled: true,
          contactLinks: []
        })
      }
    } catch (error) {
      console.error('Erreur chargement paramètres panier:', error)
      // En cas d'erreur, utiliser les paramètres par défaut
      setSettings({
        services: [
          { 
            name: 'Livraison', 
            label: '🚚 Livraison', 
            description: 'Livraison à domicile', 
            fee: 5, 
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
          }
        ],
        payments: [
          { label: '💵 Espèces', enabled: true },
          { label: '💳 Carte bancaire', enabled: true }
        ],
        alertEnabled: false,
        alertMessage: '',
        promosEnabled: false,
        contactLinks: []
      })
    }
  }

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    
    const result = await applyPromoCode(promoInput)
    setPromoMessage(result.message)
    
    setTimeout(() => setPromoMessage(''), 3000)
  }

  const getServiceFee = () => {
    if (!settings || !selectedService) return 0
    
    const service = settings.services?.find(s => s.name === selectedService)
    return service?.fee || 0
  }

  // Helper pour obtenir les couleurs avec valeurs par défaut
  const getColor = (category, property, defaultValue) => {
    return settings?.colors?.[category]?.[property] || defaultValue
  }

  const generateOrderText = () => {
    const subtotal = getSubtotal()
    const serviceFee = getServiceFee()
    const discount = promoDiscount // Montant fixe en euros
    const total = getTotal(serviceFee)

    let text = `🛒 NOUVELLE COMMANDE\n\n`
    text += `👤 CLIENT:\n`
    text += `Nom: ${clientInfo.firstName} ${clientInfo.lastName}\n`
    text += `Téléphone: ${clientInfo.phone}\n`
    
    if (selectedService !== 'Meetup' && clientInfo.address) {
      text += `Adresse: ${clientInfo.address}\n`
      if (clientInfo.complement) {
        text += `Complément: ${clientInfo.complement}\n`
      }
    }
    
    text += `\n📦 PRODUITS:\n`
    cart.forEach(item => {
      const price = typeof item.variant.price === 'string'
        ? parseFloat(item.variant.price.replace(/[^0-9.]/g, ''))
        : item.variant.price
      text += `- ${item.product.name} (${item.variant.name}) x${item.quantity} = ${(price * item.quantity).toFixed(2)}€\n`
    })
    
    text += `\n💰 TOTAL:\n`
    text += `Sous-total: ${subtotal.toFixed(2)}€\n`
    
    if (promoDiscount > 0) {
      text += `Code promo (${promoCode}): -${discount.toFixed(2)}€\n`
    }
    
    if (serviceFee > 0) {
      text += `Frais (${selectedService}): ${serviceFee.toFixed(2)}€\n`
    }
    
    text += `TOTAL: ${total.toFixed(2)}€\n`
    
    text += `\n🚚 SERVICE: ${selectedService}\n`
    if (selectedSlot) {
      text += `Horaire: ${selectedSlot}\n`
    }
    
    text += `\n💳 PAIEMENT: ${selectedPayment}\n`

    return text
  }


  const handleCopyOrder = () => {
    const text = generateOrderText()
    navigator.clipboard.writeText(text)
    alert('✅ Commande copiée dans le presse-papiers !')
  }

  if (!settings) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  if (cart.length === 0 && step === 1) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Header />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-slate-900/50 border border-gray-700 rounded-xl p-8">
              <p className="text-white text-2xl mb-4">🛒 Votre panier est vide</p>
              <Link to="/products">
                <button className="px-6 py-3 bg-white text-white rounded-lg hover:bg-gray-200 transition-colors font-bold">
                  Continuer mes achats
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <Header />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {['Panier', 'Service', 'Informations', 'Récapitulatif'].map((label, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step > index + 1 ? 'bg-green-500 text-white' :
                    step === index + 1 ? 'bg-white text-white' :
                    'bg-gray-700 text-white'
                  }`}>
                    {step > index + 1 ? '✓' : index + 1}
                  </div>
                  <span className="ml-2 text-white text-sm hidden sm:inline bg-black/80 backdrop-blur-sm px-2 py-1 rounded">{label}</span>
                  {index < 3 && <div className="w-8 h-0.5 bg-gray-700 ml-2" />}
                </div>
              ))}
            </div>
          </div>

          {/* Alert Message */}
          {settings.alertEnabled && settings.alertMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-yellow-900/50 border border-yellow-500/50 rounded-lg"
            >
              <p className="text-yellow-200 text-center">⚠️ {settings.alertMessage}</p>
            </motion.div>
          )}

          {/* ÉTAPE 1 : PANIER */}
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Liste des produits */}
              <div className="lg:col-span-2 space-y-4">
                <h1 className="text-3xl font-bold text-white mb-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">Mon Panier ({getTotalItems()})</h1>
                
                {cart.map((item, index) => {
                  const price = typeof item.variant.price === 'string'
                    ? parseFloat(item.variant.price.replace(/[^0-9.]/g, ''))
                    : item.variant.price

                  return (
                    <motion.div
                      key={`${item.product.id}-${item.variant.name}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-900/50 border border-gray-700 rounded-xl p-4"
                    >
                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                          {item.product.photo ? (
                            <img
                              src={item.product.photo}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              🎁
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block mb-1">{item.product.name}</h3>
                          <p className="text-white text-sm bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block mb-1">{item.variant.name}</p>
                          <p className="text-white font-bold mt-1 bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block">{(price * item.quantity).toFixed(2)}€</p>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-3 mt-3">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.variant.name, item.quantity - 1)}
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold"
                            >
                              -
                            </button>
                            <span className="text-white font-bold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.variant.name, item.quantity + 1)}
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeFromCart(item.product.id, item.variant.name)}
                              className="ml-auto text-red-400 hover:text-red-300 font-bold"
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Résumé */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900/50 border border-gray-700 rounded-xl p-6 sticky top-24">
                  <h2 className="text-xl font-bold text-white mb-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">Résumé</h2>

                  {/* Code promo */}
                  {settings.promosEnabled && (
                    <div className="mb-4">
                      <label className="block text-white mb-2 text-sm">Code promo</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder="CODE"
                          className="flex-1 px-3 py-2 bg-slate-800 border border-gray-700 rounded-lg text-white text-sm"
                        />
                        <button
                          onClick={handleApplyPromo}
                          className="px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                          style={{
                            backgroundColor: getColor('promoButton', 'bg', '#ffffff'),
                            color: getColor('promoButton', 'text', '#000000')
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = getColor('promoButton', 'hoverBg', '#e5e7eb')
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = getColor('promoButton', 'bg', '#ffffff')
                          }}
                        >
                          OK
                        </button>
                      </div>
                      {promoMessage && (
                        <p className={`text-sm mt-2 ${promoMessage.includes('appliqué') ? 'text-green-400' : 'text-red-400'}`}>
                          {promoMessage}
                        </p>
                      )}
                      {promoCode && (
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="text-green-400">✅ {promoCode} (-{promoDiscount}€)</span>
                          <button
                            onClick={removePromoCode}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 text-white mb-4">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span className="font-bold">{getSubtotal().toFixed(2)}€</span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Réduction ({promoCode})</span>
                        <span className="font-bold">-{Number(promoDiscount).toFixed(2)}€</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-3 rounded-lg font-bold transition-colors"
                    style={{
                      backgroundColor: getColor('continueButton', 'bg', '#ffffff'),
                      color: getColor('continueButton', 'text', '#000000')
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = getColor('continueButton', 'hoverBg', '#e5e7eb')
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = getColor('continueButton', 'bg', '#ffffff')
                    }}
                  >
                    Continuer →
                  </button>

                  <button
                    onClick={clearCart}
                    className="w-full mt-2 py-2 text-sm transition-colors"
                    style={{
                      color: getColor('clearCartButton', 'text', '#f87171')
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = getColor('clearCartButton', 'hoverText', '#fca5a5')
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = getColor('clearCartButton', 'text', '#f87171')
                    }}
                  >
                    Vider le panier
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : SERVICE */}
          {step === 2 && (
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold text-white mb-6 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">Choisissez votre service</h1>

              <div className="space-y-4">
                {settings.services?.filter(s => s.enabled).map((service) => (
                  <div
                    key={service.name}
                    onClick={() => {
                      setSelectedService(service.name)
                      setSelectedSlot('') // Réinitialiser le slot quand on change de service
                    }}
                    className="p-6 rounded-xl cursor-pointer border-2 bg-black text-white border-gray-600 select-none"
                    style={{
                      WebkitTapHighlightColor: 'transparent',
                      outline: 'none'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold">{service.label}</h3>
                      <div className="flex items-center gap-2">
                        {service.fee > 0 && (
                          <span className="font-bold">+{service.fee.toFixed(2)}€</span>
                        )}
                        {selectedService === service.name && (
                          <span className="text-2xl text-white">✓</span>
                        )}
                      </div>
                    </div>
                    {service.description && (
                      <p className="text-sm text-white">
                        {service.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Créneaux horaires du service */}
              {selectedService && (() => {
                const service = settings.services?.find(s => s.name === selectedService)
                if (!service) return null
                
                const slots = service.slots || []
                if (slots.length === 0) return null
                
                return (
                  <div className="mt-6">
                    <h3 className="text-white font-bold mb-3 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">⏰ Choisissez un créneau</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {slots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-lg font-bold border-2`}
                          style={selectedSlot === slot ? {
                            backgroundColor: getColor('selectedSlot', 'bg', 'transparent'),
                            color: getColor('selectedSlot', 'text', '#000000'),
                            borderColor: getColor('selectedSlot', 'border', '#000000')
                          } : {
                            backgroundColor: getColor('unselectedSlot', 'bg', '#000000'),
                            color: getColor('unselectedSlot', 'text', '#ffffff'),
                            borderColor: getColor('unselectedSlot', 'border', '#4b5563')
                          }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-lg font-bold transition-colors"
                  style={{
                    backgroundColor: getColor('backButton', 'bg', '#374151'),
                    color: getColor('backButton', 'text', '#ffffff')
                  }}
                  onMouseEnter={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.backgroundColor = getColor('backButton', 'hoverBg', '#4b5563')
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = getColor('backButton', 'bg', '#374151')
                  }}
                >
                  ← Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedService}
                  className="flex-1 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: getColor('continueButton', 'bg', '#ffffff'),
                    color: getColor('continueButton', 'text', '#000000')
                  }}
                  onMouseEnter={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.backgroundColor = getColor('continueButton', 'hoverBg', '#e5e7eb')
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = getColor('continueButton', 'bg', '#ffffff')
                  }}
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : INFORMATIONS CLIENT */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold text-white mb-6 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">Vos informations</h1>

              <div className="bg-slate-900/50 border border-gray-700 rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white mb-2 text-sm bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block">Prénom *</label>
                    <input
                      type="text"
                      value={clientInfo.firstName}
                      onChange={(e) => setClientInfo({ ...clientInfo, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 text-sm bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block">Nom *</label>
                    <input
                      type="text"
                      value={clientInfo.lastName}
                      onChange={(e) => setClientInfo({ ...clientInfo, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white mb-2 text-sm bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block">Téléphone *</label>
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>

                {selectedService !== 'Meetup' && (
                  <>
                    <div>
                      <label className="block text-white mb-2 text-sm bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block">Adresse *</label>
                      <input
                        type="text"
                        value={clientInfo.address}
                        onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-white mb-2 text-sm bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block">Complément d'adresse</label>
                      <input
                        type="text"
                        value={clientInfo.complement}
                        onChange={(e) => setClientInfo({ ...clientInfo, complement: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                  </>
                )}

                {/* Moyen de paiement */}
                <div>
                  <label className="block text-white mb-2 text-sm bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block">Moyen de paiement *</label>
                  <div className="space-y-2">
                    {settings.payments?.filter(p => p.enabled).map((payment) => (
                      <button
                        key={payment.label}
                        onClick={() => setSelectedPayment(payment.label)}
                        className={`w-full p-3 rounded-lg font-bold border-2`}
                        style={selectedPayment === payment.label ? {
                          backgroundColor: getColor('selectedPayment', 'bg', '#ffffff'),
                          color: getColor('selectedPayment', 'text', '#000000'),
                          borderColor: getColor('selectedPayment', 'border', '#ffffff')
                        } : {
                          backgroundColor: getColor('unselectedPayment', 'bg', '#000000'),
                          color: getColor('unselectedPayment', 'text', '#ffffff'),
                          borderColor: getColor('unselectedPayment', 'border', '#4b5563')
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span>{payment.label}</span>
                          {selectedPayment === payment.label && (
                            <span className="text-2xl">✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-lg font-bold transition-colors"
                  style={{
                    backgroundColor: getColor('backButton', 'bg', '#374151'),
                    color: getColor('backButton', 'text', '#ffffff')
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = getColor('backButton', 'hoverBg', '#4b5563')
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = getColor('backButton', 'bg', '#374151')
                  }}
                >
                  ← Retour
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={
                    !clientInfo.firstName ||
                    !clientInfo.lastName ||
                    !clientInfo.phone ||
                    !selectedPayment ||
                    (selectedService !== 'Meetup' && !clientInfo.address)
                  }
                  className="flex-1 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: getColor('continueButton', 'bg', '#ffffff'),
                    color: getColor('continueButton', 'text', '#000000')
                  }}
                  onMouseEnter={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.backgroundColor = getColor('continueButton', 'hoverBg', '#e5e7eb')
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = getColor('continueButton', 'bg', '#ffffff')
                  }}
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : RÉCAPITULATIF */}
          {step === 4 && (
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold text-white mb-6 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">Récapitulatif de votre commande</h1>

              <div className="bg-slate-900/50 border border-gray-700 rounded-xl p-6 space-y-6">
                {/* Client */}
                <div>
                  <h3 className="text-white font-bold mb-2 bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block">👤 Informations client</h3>
                  <p className="text-white bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block mb-1">Nom: {clientInfo.firstName} {clientInfo.lastName}</p>
                  <p className="text-white bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block mb-1">Téléphone: {clientInfo.phone}</p>
                  {selectedService !== 'Meetup' && clientInfo.address && (
                    <>
                      <p className="text-white bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block mb-1">Adresse: {clientInfo.address}</p>
                      {clientInfo.complement && (
                        <p className="text-white bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block mb-1">Complément: {clientInfo.complement}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Produits */}
                <div>
                  <h3 className="text-white font-bold mb-2 bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block">📦 Produits</h3>
                  <div className="space-y-2">
                    {cart.map((item) => {
                      const price = typeof item.variant.price === 'string'
                        ? parseFloat(item.variant.price.replace(/[^0-9.]/g, ''))
                        : item.variant.price

                      return (
                        <div key={`${item.product.id}-${item.variant.name}`} className="flex justify-between text-white bg-black/80 backdrop-blur-sm px-3 py-1 rounded">
                          <span>{item.product.name} ({item.variant.name}) x{item.quantity}</span>
                          <span className="font-bold">{(price * item.quantity).toFixed(2)}€</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Service */}
                <div>
                  <h3 className="text-white font-bold mb-2 bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block">🚚 Service</h3>
                  <p className="text-white bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block mb-1">{selectedService}</p>
                  {selectedSlot && <p className="text-white bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block mb-1">Horaire: {selectedSlot}</p>}
                </div>

                {/* Paiement */}
                <div>
                  <h3 className="text-white font-bold mb-2 bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block">💳 Paiement</h3>
                  <p className="text-white bg-black/80 backdrop-blur-sm px-3 py-1 rounded inline-block">{selectedPayment}</p>
                </div>

                {/* Total */}
                <div className="border-t border-gray-700 pt-4">
                  <div className="space-y-2 text-white">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span className="font-bold">{getSubtotal().toFixed(2)}€</span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Réduction ({promoCode})</span>
                        <span className="font-bold">-{Number(promoDiscount).toFixed(2)}€</span>
                      </div>
                    )}
                    {getServiceFee() > 0 && (
                      <div className="flex justify-between">
                        <span>Frais ({selectedService})</span>
                        <span className="font-bold">{getServiceFee().toFixed(2)}€</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-700">
                      <span>TOTAL</span>
                      <span className="text-green-400">{getTotal(getServiceFee()).toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                {/* Boutons d'envoi */}
                <div className="space-y-3 pt-4">
                  {(settings.contactLinks || [])
                    .filter(link => {
                      // Si aucun service spécifié, afficher pour tous
                      if (!link.services || link.services.length === 0) return true
                      // Sinon, vérifier si le service sélectionné est dans la liste
                      return link.services.includes(selectedService)
                    })
                    .map((link, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const orderText = generateOrderText()
                          const encodedText = encodeURIComponent(orderText)
                          const url = `${link.url}${link.url.includes('?') ? '&' : '?'}text=${encodedText}`
                          window.open(url, '_blank')
                          clearCart()
                          navigate('/products')
                        }}
                        className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: '#000000',
                          color: '#ffffff'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#1a1a1a'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#000000'
                        }}
                      >
                        <span>📱</span>
                        <span>Envoyer via {link.name}</span>
                      </button>
                    ))}

                  <button
                    onClick={handleCopyOrder}
                    className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                    style={{
                      backgroundColor: getColor('copyButton', 'bg', '#374151'),
                      color: getColor('copyButton', 'text', '#ffffff')
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = getColor('copyButton', 'hoverBg', '#4b5563')
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = getColor('copyButton', 'bg', '#374151')
                    }}
                  >
                    <span>📋</span>
                    <span>Copier la commande</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full mt-4 py-3 rounded-lg font-bold transition-colors"
                style={{
                  backgroundColor: getColor('backButton', 'bg', '#374151'),
                  color: getColor('backButton', 'text', '#ffffff')
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = getColor('backButton', 'hoverBg', '#4b5563')
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = getColor('backButton', 'bg', '#374151')
                }}
              >
                ← Retour
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Cart
