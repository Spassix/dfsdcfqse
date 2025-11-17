import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0) // toujours montant en euros

  // Charger le panier
  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) {
      try {
        setCart(JSON.parse(saved))
      } catch (e) {
        console.error('Erreur chargement panier:', e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  // -----------------------------
  // CART FUNCTIONS
  // -----------------------------

  const addToCart = (product, variant, quantity = 1) => {
    setCart(prev => {
      const i = prev.findIndex(
        item => item.product.id === product.id && item.variant.name === variant.name
      )

      if (i > -1) {
        const updated = [...prev]
        updated[i].quantity += quantity
        return updated
      }

      return [...prev, { product, variant, quantity }]
    })
  }

  const removeFromCart = (productId, variantName) => {
    setCart(prev =>
      prev.filter(item =>
        !(item.product.id === productId && item.variant.name === variantName)
      )
    )
  }

  const updateQuantity = (productId, variantName, quantity) => {
    if (quantity <= 0) return removeFromCart(productId, variantName)

    setCart(prev =>
      prev.map(item =>
        item.product.id === productId && item.variant.name === variantName
          ? { ...item, quantity }
          : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
    setPromoCode('')
    setPromoDiscount(0)
  }

  // -----------------------------
  // PRICES
  // -----------------------------

  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = typeof item.variant.price === 'string'
        ? parseFloat(item.variant.price.replace(/[^0-9.]/g, ''))
        : item.variant.price
      return total + price * item.quantity
    }, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((t, item) => t + item.quantity, 0)
  }

  const getTotal = (serviceFee = 0) => {
    const subtotal = getSubtotal()
    return Math.max(0, subtotal - promoDiscount + serviceFee)
  }

  // -----------------------------
  // PROMOS (NOUVEAU FORMAT)
  // -----------------------------

  const applyPromoCode = async (code) => {
    try {
      const { getAll } = await import('../utils/api')
      const promos = await getAll('promos')

      if (!Array.isArray(promos)) {
        return { success: false, message: "Aucun code promo disponible" }
      }

      const promo = promos.find(p =>
        p.code?.toLowerCase() === code.toLowerCase() && p.enabled !== false
      )

      if (!promo) {
        return { success: false, message: "Code promo invalide" }
      }

      const subtotal = getSubtotal()

      // Vérifier minAmount
      const min = Number(promo.minAmount) || 0
      if (subtotal < min) {
        return {
          success: false,
          message: `Montant minimum : ${min}€ (actuellement ${subtotal.toFixed(2)}€)`
        }
      }

      // APPLY REDUCTION
      let discount = 0

      // Gérer les deux formats : nouveau (type + value) et ancien (discount)
      if (promo.type === 'percent') {
        // Réduction en pourcentage
        discount = (subtotal * (Number(promo.value) || 0)) / 100
      } else if (promo.type === 'fixed' || promo.value !== undefined) {
        // Réduction fixe (nouveau format)
        discount = Number(promo.value) || 0
      } else if (promo.discount !== undefined) {
        // Ancien format avec discount direct
        discount = Number(promo.discount) || 0
      } else {
        // Aucun format valide trouvé
        return { success: false, message: "Format de code promo invalide" }
      }

      // Empêcher discount > subtotal
      discount = Math.min(discount, subtotal)

      setPromoCode(promo.code)
      setPromoDiscount(discount)

      return {
        success: true,
        message: `Code promo appliqué : -${discount.toFixed(2)}€`,
        discount
      }

    } catch (err) {
      console.error("ERR promo:", err)
      return { success: false, message: "Erreur serveur promo" }
    }
  }

  const removePromoCode = () => {
    setPromoCode('')
    setPromoDiscount(0)
  }

  // -----------------------------
  const value = {
    cart,
    addToCart,
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
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
