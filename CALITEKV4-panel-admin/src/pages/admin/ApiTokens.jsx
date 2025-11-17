import React, { useState, useEffect } from 'react'
import { getAll, deleteById } from '../../utils/api'
import { authenticatedFetch } from '../../utils/auth'
import { error as logError } from '../../utils/logger'
import { motion } from 'framer-motion'

const ApiTokens = () => {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTokenName, setNewTokenName] = useState('')
  const [newToken, setNewToken] = useState(null)
  const [expiresInDays, setExpiresInDays] = useState(90)

  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : '/api')

  useEffect(() => {
    loadTokens()
  }, [])

  const loadTokens = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(`${API_URL}/api-tokens`, {
        method: 'GET'
      })
      
      if (!response.ok) {
        throw new Error('Failed to load tokens')
      }
      
      const data = await response.json()
      setTokens(data.tokens || [])
    } catch (error) {
      logError('Erreur lors du chargement des tokens API')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const createToken = async (e) => {
    e.preventDefault()
    
    if (!newTokenName.trim()) {
      alert('Veuillez entrer un nom pour le token')
      return
    }

    try {
      setCreating(true)
      const response = await authenticatedFetch(`${API_URL}/api-tokens`, {
        method: 'POST',
        body: JSON.stringify({
          name: newTokenName.trim(),
          expiresInDays: parseInt(expiresInDays)
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create token')
      }
      
      const data = await response.json()
      setNewToken(data)
      setNewTokenName('')
      await loadTokens()
    } catch (error) {
      logError('Erreur lors de la création du token')
      console.error(error)
      alert('Erreur lors de la création du token')
    } finally {
      setCreating(false)
    }
  }

  const revokeToken = async (tokenId) => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer ce token ?')) {
      return
    }

    try {
      const response = await authenticatedFetch(`${API_URL}/api-tokens`, {
        method: 'DELETE',
        body: JSON.stringify({ tokenId, action: 'revoke' })
      })
      
      if (!response.ok) {
        throw new Error('Failed to revoke token')
      }
      
      await loadTokens()
    } catch (error) {
      logError('Erreur lors de la révocation du token')
      console.error(error)
      alert('Erreur lors de la révocation du token')
    }
  }

  const deleteToken = async (tokenId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce token ? Cette action est irréversible.')) {
      return
    }

    try {
      const response = await authenticatedFetch(`${API_URL}/api-tokens`, {
        method: 'DELETE',
        body: JSON.stringify({ tokenId, action: 'delete' })
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete token')
      }
      
      await loadTokens()
    } catch (error) {
      logError('Erreur lors de la suppression du token')
      console.error(error)
      alert('Erreur lors de la suppression du token')
    }
  }

  const copyToken = (token) => {
    navigator.clipboard.writeText(token)
    alert('Token copié dans le presse-papier !')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false
    const daysUntilExpiry = (new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7
  }

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            🔑 Tokens d'Authentification
          </h1>
          <p className="text-white">
            Gérez vos tokens d'authentification pour sécuriser vos accès
          </p>
        </div>
      </div>

      {/* Nouveau Token */}
      {newToken && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neon-border rounded-2xl p-6 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/50"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-2">
                ✅ Token créé avec succès !
              </h3>
              <p className="text-yellow-400 text-sm mb-4">
                ⚠️ Ce token ne sera affiché qu'une seule fois. Copiez-le maintenant !
              </p>
            </div>
            <button
              onClick={() => setNewToken(null)}
              className="text-white hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="bg-black/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm">Nom:</span>
              <span className="text-white font-mono">{newToken.name}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm">Expire le:</span>
              <span className="text-white">{formatDate(newToken.expiresAt)}</span>
            </div>
          </div>
          
          <div className="bg-black/70 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm">Token:</span>
              <button
                onClick={() => copyToken(newToken.token)}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                📋 Copier
              </button>
            </div>
            <code className="text-green-400 font-mono text-sm break-all block">
              {newToken.token}
            </code>
          </div>
          
          <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
            <p className="text-blue-300 text-sm mb-2 font-semibold">💡 Comment utiliser ce token :</p>
            <code className="text-blue-200 text-xs block whitespace-pre-wrap">
{`Authorization: Bearer ${newToken.token}

Exemple avec curl:
curl -H "Authorization: Bearer ${newToken.token}" \\
     https://votre-domaine.com/products`}
            </code>
          </div>
        </motion.div>
      )}

      {/* Formulaire de création */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neon-border rounded-2xl p-6 bg-slate-900/80 backdrop-blur-md"
      >
        <h2 className="text-xl font-bold text-white mb-4">Créer un nouveau token</h2>
        <form onSubmit={createToken} className="space-y-4">
          <div>
            <label className="block text-white mb-2">Nom du token</label>
            <input
              type="text"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="Ex: Token pour mon script"
              className="w-full px-4 py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-white transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-white mb-2">Durée de validité (jours)</label>
            <input
              type="number"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              min="1"
              max="365"
              className="w-full px-4 py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-white transition-colors"
            />
            <p className="text-white text-sm mt-1">Entre 1 et 365 jours (défaut: 90)</p>
          </div>
          
          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Création...' : 'Créer le token'}
          </button>
        </form>
      </motion.div>

      {/* Liste des tokens */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neon-border rounded-2xl p-6 bg-slate-900/80 backdrop-blur-md"
      >
        <h2 className="text-xl font-bold text-white mb-4">Mes tokens</h2>
        
        {tokens.length === 0 ? (
          <div className="text-center py-8 text-white">
            <p>Aucun token d'authentification créé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div
                key={token.id}
                className={`p-4 rounded-lg border ${
                  !token.isActive
                    ? 'bg-red-900/20 border-red-500/50'
                    : isExpired(token.expiresAt)
                    ? 'bg-orange-900/20 border-orange-500/50'
                    : isExpiringSoon(token.expiresAt)
                    ? 'bg-yellow-900/20 border-yellow-500/50'
                    : 'bg-slate-800/50 border-gray-700/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-semibold">{token.name}</h3>
                      {!token.isActive && (
                        <span className="px-2 py-1 bg-red-600/30 text-red-400 text-xs rounded">
                          Révoqué
                        </span>
                      )}
                      {isExpired(token.expiresAt) && (
                        <span className="px-2 py-1 bg-orange-600/30 text-orange-400 text-xs rounded">
                          Expiré
                        </span>
                      )}
                      {isExpiringSoon(token.expiresAt) && token.isActive && (
                        <span className="px-2 py-1 bg-yellow-600/30 text-yellow-400 text-xs rounded">
                          Expire bientôt
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-white space-y-1">
                      <p>Créé le: {formatDate(token.createdAt)}</p>
                      <p>Expire le: {formatDate(token.expiresAt)}</p>
                      {token.lastUsedAt && (
                        <p>Dernière utilisation: {formatDate(token.lastUsedAt)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {token.isActive && (
                      <>
                        <button
                          onClick={() => revokeToken(token.id)}
                          className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded hover:bg-yellow-600/30 text-sm"
                        >
                          Révoquer
                        </button>
                        <button
                          onClick={() => deleteToken(token.id)}
                          className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 text-sm"
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
      </div>
    </div>
  )
}

export default ApiTokens
