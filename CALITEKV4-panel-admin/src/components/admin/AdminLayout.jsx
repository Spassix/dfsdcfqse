import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import AdminProtection from './AdminProtection'

const AdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userRole, setUserRole] = useState('admin') // Par défaut admin

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken')
      
      if (!token) {
        navigate('/admin/login')
        return
      }

      // Récupérer le rôle de l'utilisateur
      const role = localStorage.getItem('adminRole') || 'admin'
      setUserRole(role)

      // Vérifier le token côté serveur pour plus de sécurité
      try {
        // Le token sera vérifié automatiquement par les routes API
        // Ici on fait juste une vérification basique côté client
        setIsAuthenticated(true)
      } catch (error) {
        // Token invalide, rediriger vers login
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        localStorage.removeItem('adminUserId')
        localStorage.removeItem('adminRole')
        navigate('/admin/login')
      }
    }
    
    checkAuth()
  }, [navigate])

  // Pages réservées aux admins uniquement
  const adminOnlyPages = [
    '/admin/socials',
    '/admin/typography',
    '/admin/maintenance',
    '/admin/settings',
    '/admin/colors',
    '/admin/reviews',
    '/admin/events',
    '/admin/loading',
    '/admin/cart-settings',
    '/admin/promos'
  ]

  // Vérifier si la page actuelle est réservée aux admins
  const isAdminOnlyPage = adminOnlyPages.includes(location.pathname)

  // Rediriger les modérateurs qui tentent d'accéder à une page admin
  useEffect(() => {
    if (isAuthenticated && userRole === 'moderator' && isAdminOnlyPage) {
      navigate('/admin')
    }
  }, [isAuthenticated, userRole, isAdminOnlyPage, navigate, location.pathname])

  const handleLogout = async () => {
    // Utiliser la fonction utilitaire pour nettoyer l'authentification
    const { clearAuth } = await import('../../utils/auth')
    clearAuth()
    navigate('/admin/login')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <AdminProtection />
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-3 bg-black backdrop-blur-md border border-white/20 rounded-lg text-white shadow-lg"
        aria-label="Toggle menu"
      >
        <span className="text-2xl">{sidebarOpen ? '✕' : '☰'}</span>
      </button>

      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-72 sm:w-80 bg-black backdrop-blur-md border-r border-white/20 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-4 sm:p-6 flex flex-col h-full">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Panel Admin
            </h1>
            <p className="text-white text-xs sm:text-sm">Gestion de la boutique</p>
            {userRole && (
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                  userRole === 'admin' 
                    ? 'bg-purple-600/30 text-purple-400 border border-purple-600/50' 
                    : 'bg-blue-600/30 text-blue-400 border border-blue-600/50'
                }`}>
                  {userRole === 'admin' ? '👑 Administrateur' : '🛡️ Modérateur'}
                </span>
              </div>
            )}
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto pb-4">
            <NavItem 
              to="/admin/products" 
              icon="📦" 
              active={location.pathname === '/admin/products'}
              onNavigate={() => setSidebarOpen(false)}
            >
              Produits
            </NavItem>
            <NavItem 
              to="/admin/categories" 
              icon="🏷️" 
              active={location.pathname === '/admin/categories'}
              onNavigate={() => setSidebarOpen(false)}
            >
              Catégories
            </NavItem>
            <NavItem 
              to="/admin/farms" 
              icon="🌾" 
              active={location.pathname === '/admin/farms'}
              onNavigate={() => setSidebarOpen(false)}
            >
              Farms
            </NavItem>
            {/* Pages réservées aux admins uniquement */}
            {userRole === 'admin' && (
              <>
                <NavItem 
                  to="/admin/socials" 
                  icon="🌐" 
                  active={location.pathname === '/admin/socials'}
                  onNavigate={() => setSidebarOpen(false)}
                >
                  Réseaux Sociaux
                </NavItem>
                <NavItem 
                  to="/admin/typography" 
                  icon="✍️" 
                  active={location.pathname === '/admin/typography'}
                  onNavigate={() => setSidebarOpen(false)}
                >
                  Typographie
                </NavItem>
                <NavItem 
                  to="/admin/maintenance" 
                  icon="🔧" 
                  active={location.pathname === '/admin/maintenance'}
                  onNavigate={() => setSidebarOpen(false)}
                >
                  Maintenance
                </NavItem>
                <NavItem 
                  to="/admin/settings" 
                  icon="⚙️" 
                  active={location.pathname === '/admin/settings'}
                  onNavigate={() => setSidebarOpen(false)}
                >
                  Configuration
                </NavItem>
                <NavItem 
                  to="/admin/colors" 
                  icon="🎨" 
                  active={location.pathname === '/admin/colors'}
                  onNavigate={() => setSidebarOpen(false)}
                >
                  Couleurs
                </NavItem>
                <NavItem 
                  to="/admin/cart-settings" 
                  icon="🛒" 
                  active={location.pathname === '/admin/cart-settings'}
                  onNavigate={() => setSidebarOpen(false)}
                >
                  Panier
                </NavItem>
                <NavItem 
                  to="/admin/promos" 
                  icon="🎟️" 
                  active={location.pathname === '/admin/promos'}
                  onNavigate={() => setSidebarOpen(false)}
                >
                  Codes Promo
                </NavItem>
                <NavItem 
                  to="/admin/reviews" 
                  icon="💬" 
                  active={location.pathname === '/admin/reviews'}
                  onNavigate={() => setSidebarOpen(false)}
                >
                  Avis
                </NavItem>
                <NavItem 
                  to="/admin/events" 
                  icon="🎉" 
                  active={location.pathname === '/admin/events'}
                  onNavigate={() => setSidebarOpen(false)}
                >
                  Événements
                </NavItem>
                <NavItem 
                  to="/admin/loading" 
                  icon="⏳" 
                  active={location.pathname === '/admin/loading'}
                  onNavigate={() => setSidebarOpen(false)}
                >
                  Chargement
                </NavItem>
              </>
            )}
          </nav>
        </div>

        <div className="mt-auto pt-4 border-t border-white/20 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-black border border-white/20 rounded-lg text-white hover:bg-black/80 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <span>🚪</span>
            <span>Déconnexion</span>
          </button>
          
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="block w-full py-2.5 px-4 bg-black border border-white/20 rounded-lg text-white hover:bg-black/80 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <span>🌐</span>
            <span>Voir le site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 xl:ml-80 w-full min-h-screen p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24 lg:pt-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

const NavItem = ({ to, icon, children, active, onNavigate }) => (
  <Link 
    to={to}
    onClick={onNavigate}
  >
    <motion.div
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
        active
          ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-white/50 text-white shadow-lg'
          : 'text-white hover:text-white hover:bg-black/50'
      }`}
    >
      <span className="text-lg sm:text-xl flex-shrink-0">{icon}</span>
      <span className="font-medium truncate">{children}</span>
    </motion.div>
  </Link>
)

export default AdminLayout
