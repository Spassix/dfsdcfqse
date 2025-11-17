import React from 'react'
import { error as logError } from '../../utils/logger'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-black">
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          Dashboard
        </h1>
        <p className="text-white">Bienvenue dans le panel d'administration</p>
      </motion.div>

      {/* Navigation rapide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/products">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/70 transition-all cursor-pointer"
          >
            <div className="text-5xl mb-3">📦</div>
            <h3 className="text-white font-bold text-lg">Produits</h3>
            <p className="text-white text-sm">Gérer vos produits</p>
          </motion.div>
        </Link>

        <Link to="/admin/categories">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/70 transition-all cursor-pointer"
          >
            <div className="text-5xl mb-3">📁</div>
            <h3 className="text-white font-bold text-lg">Catégories</h3>
            <p className="text-white text-sm">Organiser vos catégories</p>
          </motion.div>
        </Link>

        <Link to="/admin/farms">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/70 transition-all cursor-pointer"
          >
            <div className="text-5xl mb-3">🌾</div>
            <h3 className="text-white font-bold text-lg">Farms</h3>
            <p className="text-white text-sm">Gérer vos farms</p>
          </motion.div>
        </Link>

        <Link to="/admin/settings">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/70 transition-all cursor-pointer"
          >
            <div className="text-5xl mb-3">⚙️</div>
            <h3 className="text-white font-bold text-lg">Configuration</h3>
            <p className="text-white text-sm">Paramètres généraux</p>
          </motion.div>
        </Link>

        <Link to="/admin/events">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/70 transition-all cursor-pointer"
          >
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-white font-bold text-lg">Événements</h3>
            <p className="text-white text-sm">Noël, Pâques, etc.</p>
          </motion.div>
        </Link>
      </div>
    </div>
  )
}

    </div>
export default Dashboard
