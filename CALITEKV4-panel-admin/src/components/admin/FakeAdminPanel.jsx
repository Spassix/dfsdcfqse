/**
 * Panel Admin - Dashboard principal
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const FakeAdminPanel = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [fakeData, setFakeData] = useState([])

  useEffect(() => {
    // Simuler un chargement
    setTimeout(() => {
      setLoading(false)
      // Générer des données factices
      setFakeData([
        { id: 1, name: 'Produit Exemple 1', price: '29.99€', status: 'Actif' },
        { id: 2, name: 'Produit Exemple 2', price: '39.99€', status: 'Actif' },
        { id: 3, name: 'Produit Exemple 3', price: '19.99€', status: 'Inactif' },
      ])
    }, 1000)
  }, [])

  const handleFakeAction = (action) => {
    // Simuler une action mais ne rien faire de réel
    alert('Action en cours de traitement...')
    // Ne rien faire réellement
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Panel Admin
          </h1>
          <p className="text-white">Gestion de la boutique</p>
        </div>

        {/* Fake Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm">
            <div className="text-white text-sm mb-2">Produits</div>
            <div className="text-3xl font-bold text-white">{fakeData.length}</div>
          </div>
          <div className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm">
            <div className="text-white text-sm mb-2">Catégories</div>
            <div className="text-3xl font-bold text-white">5</div>
          </div>
          <div className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm">
            <div className="text-white text-sm mb-2">Commandes</div>
            <div className="text-3xl font-bold text-white">12</div>
          </div>
          <div className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm">
            <div className="text-white text-sm mb-2">Revenus</div>
            <div className="text-3xl font-bold text-white">1,234€</div>
          </div>
        </div>

        {/* Fake Products List */}
        <div className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Produits</h2>
            <button
              onClick={() => handleFakeAction('add')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
            >
              + Ajouter
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {fakeData.map((item) => (
                <div
                  key={item.id}
                  className="neon-border rounded-lg p-4 bg-slate-800/30 backdrop-blur-sm flex justify-between items-center hover:bg-slate-800/50 transition-colors"
                >
                  <div>
                    <div className="text-white font-semibold">{item.name}</div>
                    <div className="text-white text-sm">{item.price}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFakeAction('edit')}
                      className="px-3 py-1 bg-blue-600/80 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleFakeAction('delete')}
                      className="px-3 py-1 bg-red-600/80 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Fake Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleFakeAction('settings')}
            className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm text-white hover:bg-slate-900/70 transition-all transform hover:scale-105"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-semibold">Paramètres</div>
          </button>
          <button
            onClick={() => handleFakeAction('users')}
            className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm text-white hover:bg-slate-900/70 transition-all transform hover:scale-105"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-semibold">Utilisateurs</div>
          </button>
          <button
            onClick={() => handleFakeAction('reports')}
            className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm text-white hover:bg-slate-900/70 transition-all transform hover:scale-105"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold">Rapports</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default FakeAdminPanel
