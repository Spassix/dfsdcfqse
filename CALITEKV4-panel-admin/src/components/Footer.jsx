import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const Footer = () => {
  const location = useLocation()

  const navItems = [
    { to: '/', label: 'Accueil', icon: '🏠' },
    { to: '/products', label: 'Produits', icon: '🛍️' },
    { to: '/categories', label: 'Catégories', icon: '📱' },
    { to: '/contact', label: 'Contact', icon: '✉️' }
  ]

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-md border-t border-white/10">
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
                  className={`text-3xl transition-all duration-300 ${
                    isActive 
                      ? 'filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                      : 'opacity-70 group-hover:opacity-100'
                  }`}
                >
                  {item.icon}
                </motion.div>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  isActive 
                    ? 'text-white font-bold' 
                    : 'text-white group-hover:text-white'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </footer>
  )
}

export default Footer
