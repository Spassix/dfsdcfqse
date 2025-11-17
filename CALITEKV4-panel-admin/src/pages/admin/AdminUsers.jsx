import React, { useState, useEffect } from 'react'
import { error as logError } from '../../utils/logger'
import { motion } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : '/api')

// Fonction helper pour obtenir les headers avec authentification
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  }
  const token = localStorage.getItem('adminToken')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [formData, setFormData] = useState({ username: '', password: '', role: 'moderator' })
  const [currentUserRole, setCurrentUserRole] = useState('admin')

  useEffect(() => {
    // Récupérer le rôle de l'utilisateur connecté
    const role = localStorage.getItem('adminRole') || 'admin'
    setCurrentUserRole(role)
    
    // Rediriger les modérateurs vers le dashboard
    if (role !== 'admin') {
      window.location.href = '/admin'
      return
    }
    
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/admin-users`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          // Non authentifié, rediriger vers login
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
          localStorage.removeItem('adminUserId')
          window.location.href = '/admin/login'
          return
        }
        throw new Error(`Erreur ${response.status}`)
      }
      
      const data = await response.json()
      // Vérifier que data est un tableau avant de l'utiliser
      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        console.error('Réponse API invalide:', data)
        setUsers([])
      }
    } catch (error) {
      logError('Erreur lors du chargement des utilisateurs:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      alert('Veuillez remplir tous les champs')
      return
    }

    if (formData.password.length < 4) {
      alert('Le mot de passe doit contenir au moins 4 caractères')
      return
    }

    try {
      const response = await fetch(`${API_URL}/admin-users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
          localStorage.removeItem('adminUserId')
          localStorage.removeItem('adminRole')
          window.location.href = '/admin/login'
          return
        }
        // Essayer de parser le JSON, sinon utiliser le texte
        let errorData
        try {
          const text = await response.text()
          try {
            errorData = JSON.parse(text)
          } catch {
            errorData = { error: text || `Erreur ${response.status}` }
          }
        } catch {
          errorData = { error: `Erreur ${response.status}` }
        }
        alert(`❌ Erreur: ${errorData.error || errorData.message || `Erreur ${response.status}`}`)
        return
      }

      // Parser la réponse JSON
      let result
      try {
        const text = await response.text()
        try {
          result = JSON.parse(text)
        } catch {
          result = { success: false, error: 'Réponse invalide du serveur' }
        }
      } catch (error) {
        result = { success: false, error: 'Erreur lors de la lecture de la réponse' }
      }

      if (result.success) {
        alert('✅ Utilisateur créé avec succès !')
        setShowAddModal(false)
        setFormData({ username: '', password: '', role: 'moderator' })
        loadUsers()
      } else {
        alert(`❌ Erreur: ${result.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      logError('Erreur lors de la création:', error)
      alert('❌ Erreur lors de la création')
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    
    if (!formData.username) {
      alert('Le nom d\'utilisateur est requis')
      return
    }

    // PROTECTION : Empêcher la modification du compte admin principal
    const defaultUsernames = ['admin', 'admin_4c1dd9ac']
    const isMainAdmin = currentUser && (defaultUsernames.includes(currentUser.username) || (currentUser.role === 'admin' && currentUser.username?.startsWith('admin_')))
    
    if (isMainAdmin && formData.password) {
      alert('❌ Le mot de passe du compte admin principal ne peut pas être modifié. Il est géré par les variables d\'environnement Vercel (DEFAULT_ADMIN_PASSWORD).')
      return
    }

    if (formData.password && formData.password.length < 4) {
      alert('Le mot de passe doit contenir au moins 4 caractères')
      return
    }

    try {
      const updateData = { 
        username: formData.username,
        role: formData.role || 'moderator' // Inclure le rôle dans la mise à jour
      }
      
      // PROTECTION : Ne pas envoyer le mot de passe pour le compte admin principal
      if (formData.password && !isMainAdmin) {
        updateData.password = formData.password
      } else if (isMainAdmin && formData.password) {
        // Ne pas inclure le mot de passe dans la requête pour le compte admin principal
        delete updateData.password
      }

      const response = await fetch(`${API_URL}/admin-users/${currentUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
          localStorage.removeItem('adminUserId')
          localStorage.removeItem('adminRole')
          window.location.href = '/admin/login'
          return
        }
        // Essayer de parser le JSON, sinon utiliser le texte
        let errorData
        try {
          const text = await response.text()
          try {
            errorData = JSON.parse(text)
          } catch {
            errorData = { error: text || `Erreur ${response.status}` }
          }
        } catch {
          errorData = { error: `Erreur ${response.status}` }
        }
        alert(`❌ Erreur: ${errorData.error || errorData.message || `Erreur ${response.status}`}`)
        return
      }

      // Parser la réponse JSON
      let result
      try {
        const text = await response.text()
        try {
          result = JSON.parse(text)
        } catch {
          result = { success: false, error: 'Réponse invalide du serveur' }
        }
      } catch (error) {
        result = { success: false, error: 'Erreur lors de la lecture de la réponse' }
      }

      if (result.success) {
        alert('✅ Utilisateur modifié avec succès !')
        setShowEditModal(false)
        setCurrentUser(null)
        setFormData({ username: '', password: '', role: 'moderator' })
        loadUsers()
      } else {
        alert(`❌ Erreur: ${result.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      logError('Erreur lors de la modification:', error)
      alert('❌ Erreur lors de la modification')
    }
  }

  const handleDelete = async (user) => {
    // PROTECTION : Empêcher la suppression du compte admin principal
    // Le username exact sera vérifié côté serveur, mais on bloque aussi côté client
    const defaultUsernames = ['admin', 'admin_4c1dd9ac'] // Liste des usernames possibles pour l'admin principal
    if (defaultUsernames.includes(user.username) || user.role === 'admin' && user.username?.startsWith('admin_')) {
      alert('❌ Impossible de supprimer le compte admin principal. Ce compte est protégé et géré par les variables d\'environnement Vercel.')
      return
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ?`)) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/admin-users/${user.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
          localStorage.removeItem('adminUserId')
          localStorage.removeItem('adminRole')
          window.location.href = '/admin/login'
          return
        }
        // Essayer de parser le JSON, sinon utiliser le texte
        let errorData
        try {
          const text = await response.text()
          try {
            errorData = JSON.parse(text)
          } catch {
            errorData = { error: text || `Erreur ${response.status}` }
          }
        } catch {
          errorData = { error: `Erreur ${response.status}` }
        }
        alert(`❌ Erreur: ${errorData.error || errorData.message || `Erreur ${response.status}`}`)
        return
      }

      // Parser la réponse JSON
      let result
      try {
        const text = await response.text()
        try {
          result = JSON.parse(text)
        } catch {
          result = { success: false, error: 'Réponse invalide du serveur' }
        }
      } catch (error) {
        result = { success: false, error: 'Erreur lors de la lecture de la réponse' }
      }

      if (result.success) {
        alert('✅ Utilisateur supprimé avec succès !')
        loadUsers()
      } else {
        alert(`❌ Erreur: ${result.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      logError('Erreur lors de la suppression:', error)
      alert('❌ Erreur lors de la suppression')
    }
  }

  const openEditModal = (user) => {
    setCurrentUser(user)
    setFormData({ username: user.username, password: '', role: user.role || 'moderator' })
    setShowEditModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
    <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">👥 Utilisateurs Admin</h1>
            <p className="text-white">Gérez les comptes administrateurs</p>
          </div>
          <div className="text-white text-sm bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
            <p className="font-semibold mb-2">ℹ️ Information</p>
            <p>Les utilisateurs admin sont créés via les variables d'environnement Vercel.</p>
            <p className="mt-1 text-xs">Format: DEFAULT_ADMIN_USERNAME_1, DEFAULT_ADMIN_PASSWORD_1, DEFAULT_ADMIN_USERNAME_2, DEFAULT_ADMIN_PASSWORD_2, etc.</p>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="space-y-4">
          <p className="text-white">{Array.isArray(users) ? users.length : 0} utilisateur(s) au total</p>
          
          {Array.isArray(users) && users.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neon-border rounded-xl p-6 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between"
            >
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  👤 {user.username}
                  {user.username === 'admin' && (
                    <span className="ml-2 px-2 py-1 bg-yellow-600/30 text-yellow-400 text-xs rounded border border-yellow-600/50">
                      🔒 Admin par défaut
                    </span>
                  )}
                  {user.role === 'admin' && user.username !== 'admin' && (
                    <span className="ml-2 px-2 py-1 bg-purple-600/30 text-purple-400 text-xs rounded border border-purple-600/50">
                      👑 Administrateur
                    </span>
                  )}
                  {user.role === 'moderator' && (
                    <span className="ml-2 px-2 py-1 bg-blue-600/30 text-blue-400 text-xs rounded border border-blue-600/50">
                      🛡️ Modérateur
                    </span>
                  )}
                </h3>
                <p className="text-white text-sm">
                  Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              
              {currentUserRole === 'admin' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => openEditModal(user)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    disabled={user.username === 'admin'}
                    className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                      user.username === 'admin'
                        ? 'bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                    title={user.username === 'admin' ? 'L\'admin par défaut ne peut pas être supprimé' : 'Supprimer'}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Modal Ajouter - DÉSACTIVÉ - Les admins sont créés via variables d'environnement */}
        {false && showAddModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" style={{ zIndex: 100 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 admin-modal rounded-2xl p-8 max-w-md w-full border-2 border-white/30 shadow-2xl"
              style={{ zIndex: 101 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6" style={{ color: '#ffffff !important' }}>➕ Ajouter un utilisateur</h2>
              
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-semibold" style={{ color: '#ffffff !important' }}>Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-white"
                    placeholder="ex: john"
                    required
                    style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold" style={{ color: '#ffffff !important' }}>Mot de passe</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-white"
                    placeholder="Minimum 4 caractères"
                    required
                    style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold" style={{ color: '#ffffff !important' }}>Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-white [&>option]:text-white [&>option]:bg-white"
                    required
                  >
                    <option value="moderator">🛡️ Modérateur</option>
                    <option value="admin">👑 Administrateur</option>
                  </select>
                  <p className="text-white text-sm mt-1" style={{ color: '#d1d5db !important' }}>
                    Le modérateur ne peut pas gérer les utilisateurs admin
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setFormData({ username: '', password: '', role: 'moderator' })
                    }}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Modifier */}
        {showEditModal && currentUser && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" style={{ zIndex: 100 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 admin-modal rounded-2xl p-8 max-w-md w-full border-2 border-white/30 shadow-2xl"
              style={{ zIndex: 101 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6" style={{ color: '#ffffff !important' }}>✏️ Modifier l'utilisateur</h2>
              
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-semibold" style={{ color: '#ffffff !important' }}>Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-white"
                    required
                    style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}
                  />
                </div>

                {/* PROTECTION : Désactiver le champ mot de passe pour le compte admin principal */}
                {(() => {
                  const defaultUsernames = ['admin', 'admin_4c1dd9ac']
                  const isMainAdmin = currentUser && (defaultUsernames.includes(currentUser.username) || (currentUser.role === 'admin' && currentUser.username?.startsWith('admin_')))
                  
                  if (isMainAdmin) {
                    return (
                      <div>
                        <label className="block text-white mb-2 font-semibold" style={{ color: '#ffffff !important' }}>Mot de passe</label>
                        <input
                          type="password"
                          value="••••••••"
                          disabled
                          className="w-full px-4 py-3 bg-slate-800/50 border-2 border-gray-600 rounded-lg text-white cursor-not-allowed"
                          style={{ color: '#6b7280 !important', backgroundColor: '#1e293b80 !important' }}
                        />
                        <p className="text-yellow-400 text-sm mt-1">
                          ⚠️ Le mot de passe du compte admin principal est géré par les variables d'environnement Vercel (DEFAULT_ADMIN_PASSWORD) et ne peut pas être modifié ici.
                        </p>
                      </div>
                    )
                  }
                  
                  return (
                    <div>
                      <label className="block text-white mb-2 font-semibold" style={{ color: '#ffffff !important' }}>Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-white"
                        placeholder="Laisser vide pour ne pas modifier"
                        style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}
                      />
                      <p className="text-white text-sm mt-1" style={{ color: '#d1d5db !important' }}>Laissez vide pour conserver l'ancien mot de passe</p>
                    </div>
                  )
                })()}

                {/* Seuls les admins peuvent modifier le rôle */}
                {currentUserRole === 'admin' && (() => {
                  const defaultUsernames = ['admin', 'admin_4c1dd9ac']
                  const isMainAdmin = currentUser && (defaultUsernames.includes(currentUser.username) || (currentUser.role === 'admin' && currentUser.username?.startsWith('admin_')))
                  
                  if (isMainAdmin) {
                    return (
                      <div>
                        <label className="block text-white mb-2 font-semibold" style={{ color: '#ffffff !important' }}>Rôle</label>
                        <input
                          type="text"
                          value="👑 Administrateur (Protégé)"
                          disabled
                          className="w-full px-4 py-3 bg-slate-800/50 border-2 border-gray-600 rounded-lg text-white cursor-not-allowed"
                          style={{ color: '#6b7280 !important', backgroundColor: '#1e293b80 !important' }}
                        />
                        <p className="text-yellow-400 text-sm mt-1">
                          ⚠️ Le rôle du compte admin principal ne peut pas être modifié.
                        </p>
                      </div>
                    )
                  }
                  
                  return (
                    <div>
                      <label className="block text-white mb-2 font-semibold" style={{ color: '#ffffff !important' }}>Rôle</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-white [&>option]:text-white [&>option]:bg-white"
                        required
                      >
                        <option value="moderator">🛡️ Modérateur</option>
                        <option value="admin">👑 Administrateur</option>
                      </select>
                    </div>
                  )
                })()}
                {currentUserRole !== 'admin' && (
                  <div>
                    <label className="block text-white mb-2 font-semibold" style={{ color: '#ffffff !important' }}>Rôle</label>
                    <input
                      type="text"
                      value={formData.role === 'admin' ? '👑 Administrateur' : '🛡️ Modérateur'}
                      disabled
                      className="w-full px-4 py-3 bg-slate-800/50 border-2 border-gray-600 rounded-lg text-white cursor-not-allowed"
                      style={{ color: '#9ca3af !important', backgroundColor: '#1e293b80 !important' }}
                    />
                    <p className="text-white text-xs mt-1">Seuls les administrateurs peuvent modifier le rôle</p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setCurrentUser(null)
                      setFormData({ username: '', password: '' })
                    }}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
