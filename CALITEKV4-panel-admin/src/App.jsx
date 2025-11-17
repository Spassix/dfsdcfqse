import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Categories from './pages/Categories'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Contact from './pages/Contact'
import AdminLogin from './pages/admin/Login'
import AdminProducts from './pages/admin/Products'
import AdminCategories from './pages/admin/Categories'
import AdminSocials from './pages/admin/Socials'
import AdminSettings from './pages/admin/Settings'
import AdminFarms from './pages/admin/Farms'
import AdminTypography from './pages/admin/Typography'
import AdminMaintenance from './pages/admin/Maintenance'
import AdminColors from './pages/admin/Colors'
import AdminCartSettings from './pages/admin/CartSettings'
import AdminPromos from './pages/admin/Promos'
import AdminReviews from './pages/admin/AdminReviews'
import AdminEvents from './pages/admin/Events'
import AdminLoading from './pages/admin/Loading'
import ApiTokens from './pages/admin/ApiTokens'
import Reviews from './pages/Reviews'
import TelegramPanel from './pages/admin/TelegramPanel'
import AdminLayout from './components/admin/AdminLayout'
import DynamicBackground from './components/DynamicBackground'
import MaintenanceMode from './components/MaintenanceMode'
import MobileOnly from './components/MobileOnly'
import EventTheme from './components/EventTheme'
import ColorTheme from './components/ColorTheme'
import LoadingScreen from './components/LoadingScreen'
import { CartProvider } from './contexts/CartContext'
import { enableProtection } from './utils/protection'
import { checkAdminBranch } from './utils/admin-branch-check'

// Routes publiques avec LoadingScreen configurable
const PublicRoutes = () => {
  const [showLoading, setShowLoading] = useState(true)

  return (
    <>
      {/* Charger DynamicBackground immédiatement pour que l'image s'affiche dès le début */}
      <DynamicBackground />
      {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} />}
      {!showLoading && (
        <>
          <MobileOnly>
            <MaintenanceMode>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/reviews" element={<Reviews />} />
              </Routes>
            </MaintenanceMode>
          </MobileOnly>
        </>
      )}
    </>
  )
}

// Composant interne pour utiliser useNavigate
const AdminRouteProtectionInner = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null) // null = vérification en cours
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const verifyBranch = async () => {
      try {
        const authorized = await checkAdminBranch()
        setIsAuthorized(authorized)
        
        // Si pas autorisé, rediriger immédiatement vers l'accueil sans message
        if (!authorized) {
          navigate('/', { replace: true })
          return
        }
      } catch (error) {
        // En cas d'erreur, rediriger aussi vers l'accueil
        navigate('/', { replace: true })
        return
      } finally {
        setIsLoading(false)
      }
    }
    
    verifyBranch()
  }, [navigate])

  // Pendant le chargement ou si pas autorisé, ne rien afficher (redirection en cours)
  if (isLoading || !isAuthorized) {
    return null
  }

  return children
}

// Composant de protection pour les routes admin (uniquement sur la branche admin-panel)
const AdminRouteProtection = ({ children }) => {
  return <AdminRouteProtectionInner>{children}</AdminRouteProtectionInner>
}

function App() {
  // Charger le nom de la boutique pour le titre du navigateur
  useEffect(() => {
    const updateTitle = async () => {
      try {
        const { getById } = await import('./utils/api')
        const settings = await getById('settings', 'general')
        if (settings && settings.value && settings.value.shopName) {
          document.title = `${settings.value.shopName} - Boutique`
        }
      } catch (error) {
        console.error('Error loading shop name:', error)
      }
    }
    setTimeout(updateTitle, 1000)
  }, [])

  // Police par défaut
  useEffect(() => {
    document.documentElement.style.setProperty('--title-font', "'Playfair Display'")
  }, [])

  // Activer la protection contre le vol de contenu (uniquement sur les routes publiques)
  useEffect(() => {
    const location = window.location.pathname
    if (!location.startsWith('/admin')) {
      enableProtection()
    }
  }, [])

  return (
    <Router>
      <CartProvider>
        <ColorTheme>
          <EventTheme>
            <Routes>
              {/* Route Telegram - Redirige vers la boutique */}
              <Route path="/admin/telegram" element={<TelegramPanel />} />
              
              {/* Admin Routes - Vérification de branche : si pas admin-panel, rediriger */}
              <Route 
                path="/admin/*" 
                element={
                  <AdminRouteProtection>
                    <Routes>
                      <Route path="login" element={<AdminLogin />} />
                      <Route path="" element={<AdminLayout />}>
                        <Route index element={<Navigate to="/admin/settings" replace />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="socials" element={<AdminSocials />} />
                        <Route path="farms" element={<AdminFarms />} />
                        <Route path="typography" element={<AdminTypography />} />
                        <Route path="maintenance" element={<AdminMaintenance />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="colors" element={<AdminColors />} />
                        <Route path="cart-settings" element={<AdminCartSettings />} />
                        <Route path="promos" element={<AdminPromos />} />
                        <Route path="reviews" element={<AdminReviews />} />
                        <Route path="events" element={<AdminEvents />} />
                        <Route path="loading" element={<AdminLoading />} />
                        <Route path="api-tokens" element={<ApiTokens />} />
                      </Route>
                    </Routes>
                  </AdminRouteProtection>
                }
              />
              
              {/* Public Routes - AVEC LoadingScreen configurable */}
              <Route path="*" element={<PublicRoutes />} />
            </Routes>
          </EventTheme>
        </ColorTheme>
      </CartProvider>
    </Router>
  )
}

export default App
