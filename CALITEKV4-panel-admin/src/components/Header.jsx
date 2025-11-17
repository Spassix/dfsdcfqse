import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../contexts/CartContext'

const Header = () => {
  const location = useLocation()
  const { getTotalItems } = useCart()
  const totalItems = getTotalItems()

  const navItems = [
    { to: '/', label: 'Accueil', icon: '🏠' },
    { to: '/products', label: 'Produits', icon: '🛍️' },
    { to: '/categories', label: 'Catégories', icon: '📱' },
    { to: '/reviews', label: 'Avis', icon: '💬' },
    { to: '/contact', label: 'Contact', icon: '✉️' }
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-md border-b border-white/10 event-header">
      <nav className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center space-y-1 group"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`text-2xl md:text-3xl transition-all duration-300 ${
                    isActive 
                      ? 'filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                      : 'opacity-70 group-hover:opacity-100'
                  }`}
                >
                  {item.icon}
                </motion.div>
                <span className={`text-xs md:text-sm font-medium transition-all duration-300 ${
                  isActive 
                    ? 'text-white font-bold' 
                    : 'text-white group-hover:text-white'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
          
          {/* Panier */}
          <Link
            to="/cart"
            className="flex flex-col items-center space-y-1 group relative"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`text-2xl md:text-3xl transition-all duration-300 relative ${
                location.pathname === '/cart'
                  ? 'filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                  : 'opacity-70 group-hover:opacity-100'
              }`}
            >
              🛒
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </motion.div>
            <span className={`text-xs md:text-sm font-medium transition-all duration-300 ${
              location.pathname === '/cart'
                ? 'text-white font-bold' 
                : 'text-white group-hover:text-white'
            }`}>
              Panier
            </span>
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default Header