import React, { useState } from 'react'
import { error as logError } from '../../utils/logger'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AdminProtection from '../../components/admin/AdminProtection'

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Construire l'URL de manière obfusquée
      const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : '/api')
      const loginPath = ['/auth', '/login'].join('')
      const loginUrl = baseUrl + loginPath
      
      // Vérifier que les credentials sont bien remplis
      if (!credentials.username || !credentials.password) {
        setError('Veuillez remplir tous les champs')
        setLoading(false)
        return
      }

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Important pour recevoir les cookies httpOnly
        body: JSON.stringify({
          username: credentials.username.trim(),
          password: credentials.password
        })
      })

      if (!response.ok) {
        // Essayer de récupérer le message d'erreur du serveur
        let errorMessage = 'Erreur de connexion'
        let errorData = null
        
        try {
          errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          
          // Afficher le message détaillé si disponible
          if (errorData.field) {
            errorMessage = `${errorData.field}: ${errorMessage}`
          }
          
          // Si erreur 500 avec détails, afficher les détails en développement
          if (response.status === 500 && errorData.details) {
            errorMessage += ` (${errorData.details})`
          }
        } catch (e) {
          // Si on ne peut pas parser le JSON, utiliser le message par défaut selon le status
          if (response.status === 401) {
            errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect'
          } else if (response.status === 400) {
            errorMessage = 'Données invalides. Vérifiez votre saisie.'
          } else if (response.status === 429) {
            errorMessage = 'Trop de tentatives. Veuillez patienter.'
          } else if (response.status === 423) {
            errorMessage = 'Compte verrouillé. Veuillez patienter.'
          } else if (response.status === 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.'
          }
        }
        
        // Si erreur 500 et que c'est peut-être un problème d'initialisation, essayer d'initialiser
        if (response.status === 500 || response.status === 401) {
          try {
            const initUrl = baseUrl + '/admin-init'
            const initResponse = await fetch(initUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            })
            
            if (initResponse.ok) {
              // Réessayer la connexion après initialisation
              const retryResponse = await fetch(loginUrl, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                  username: credentials.username.trim(),
                  password: credentials.password
                })
              })
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json()
                if (retryData.success) {
                  const { setAuthToken } = await import('../../utils/auth')
                  setAuthToken(retryData.token, retryData.refreshToken, retryData.user)
                  navigate('/admin')
                  return
                }
              }
            }
          } catch (initError) {
            // Ignorer les erreurs d'initialisation
            console.error('Erreur lors de l\'initialisation:', initError)
          }
        }
        
        setError(errorMessage)
        return
      }

      const data = await response.json()

      if (data.success) {
        // Utiliser la fonction utilitaire pour stocker les tokens
        const { setAuthToken } = await import('../../utils/auth')
        setAuthToken(data.token, data.refreshToken, data.user)
        navigate('/admin')
      } else {
        setError(data.error || 'Identifiants invalides')
      }
    } catch (error) {
      logError('Erreur')
      setError('Erreur de connexion au serveur. Vérifiez votre connexion internet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
    <div className="min-h-screen cosmic-bg flex items-center justify-center px-4">
      <AdminProtection />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="neon-border rounded-2xl p-8 bg-slate-900/80 backdrop-blur-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Panel Admin
            </h1>
            <p className="text-white">Connexion administrateur</p>
          </div>

          {/* Error Message */}
          {error ? (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-600/50 rounded-lg text-red-400 text-sm">
              ❌ {error}
            </div>
          ) : null}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white mb-2">Nom d'utilisateur</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-white transition-colors"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Mot de passe</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-800 border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 text-center text-sm text-white">
            <p>Contactez votre administrateur pour obtenir un accès</p>
          </div>
        </div>
      </motion.div>
    </div>
    </div>
  )
}

export default AdminLogin
