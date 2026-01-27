import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { Capacitor } from '@capacitor/core'
import { PersonaProvider } from './contexts/PersonaContext'
import { usePWA } from './hooks/usePWA'
import { useNativeFeatures } from './hooks/useNativeFeatures'
import { useDeepLinks } from './hooks/useDeepLinks'
import { usePushNotifications } from './hooks/usePushNotifications'
import { useAnalytics } from './hooks/useAnalytics'
import ProtectedRoute from './components/ProtectedRoute'
import NetworkStatus from './components/NetworkStatus'
import { getPlatformFont } from './utils/platformStyles'

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ScriptGeneratorPage = lazy(() => import('./pages/ScriptGeneratorPage'))
const TitleGeneratorPage = lazy(() => import('./pages/TitleGeneratorPage'))
const ThumbnailGeneratorPage = lazy(() => import('./pages/ThumbnailGeneratorPage'))
const SocialCaptionPage = lazy(() => import('./pages/SocialCaptionPage'))
const SEOOptimizerPage = lazy(() => import('./pages/SEOOptimizerPage'))
const PersonasPage = lazy(() => import('./pages/PersonasPage'))
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const SharedScriptPage = lazy(() => import('./pages/SharedScriptPage'))
const WalletPage = lazy(() => import('./pages/WalletPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage'))
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'))
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'))

// Use HashRouter for mobile (file:// protocol), BrowserRouter for web
const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter

// Optimize React Query for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Inner component that uses Router hooks
function AppContent() {
  // Initialize deep linking (mobile only) - needs useNavigate from Router
  useDeepLinks()

  // Initialize analytics tracking - needs useLocation from Router
  useAnalytics()

  // Apply platform-specific font to body
  useEffect(() => {
    const fontClass = getPlatformFont()
    document.body.classList.add(fontClass)

    return () => {
      document.body.classList.remove(fontClass)
    }
  }, [])

  return (
    <>
      <NetworkStatus />
      <div className="min-h-screen">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/shared/:shareToken" element={<SharedScriptPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/refund" element={<RefundPolicyPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/script" element={<ProtectedRoute><ScriptGeneratorPage /></ProtectedRoute>} />
            <Route path="/dashboard/titles" element={<ProtectedRoute><TitleGeneratorPage /></ProtectedRoute>} />
            <Route path="/dashboard/thumbnails" element={<ProtectedRoute><ThumbnailGeneratorPage /></ProtectedRoute>} />
            <Route path="/dashboard/social" element={<ProtectedRoute><SocialCaptionPage /></ProtectedRoute>} />
            <Route path="/dashboard/seo" element={<ProtectedRoute><SEOOptimizerPage /></ProtectedRoute>} />
            <Route path="/dashboard/personas" element={<ProtectedRoute><PersonasPage /></ProtectedRoute>} />
            <Route path="/dashboard/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
            <Route path="/dashboard/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
            <Route path="/dashboard/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" />
      </div>
    </>
  )
}

function App() {
  // Initialize PWA functionality (web only) - doesn't need Router
  usePWA()

  // Initialize native features (mobile only) - doesn't need Router
  useNativeFeatures()

  // Initialize push notifications (mobile only) - doesn't need Router
  usePushNotifications()

  return (
    <QueryClientProvider client={queryClient}>
      <PersonaProvider>
        <Router>
          <AppContent />
        </Router>
      </PersonaProvider>
    </QueryClientProvider>
  )
}

export default App
