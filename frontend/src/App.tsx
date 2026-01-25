import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { PersonaProvider } from './contexts/PersonaContext'
import { usePWA } from './hooks/usePWA'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import ScriptGeneratorPage from './pages/ScriptGeneratorPage'
import TitleGeneratorPage from './pages/TitleGeneratorPage'
import ThumbnailGeneratorPage from './pages/ThumbnailGeneratorPage'
import SocialCaptionPage from './pages/SocialCaptionPage'
import SEOOptimizerPage from './pages/SEOOptimizerPage'
import PersonasPage from './pages/PersonasPage'
import MarketplacePage from './pages/MarketplacePage'
import CoursesPage from './pages/CoursesPage'
import SharedScriptPage from './pages/SharedScriptPage'

const queryClient = new QueryClient()

function App() {
  // Initialize PWA functionality
  usePWA()

  return (
    <QueryClientProvider client={queryClient}>
      <PersonaProvider>
        <Router>
          <div className="min-h-screen">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/shared/:shareToken" element={<SharedScriptPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/dashboard/script" element={<ProtectedRoute><ScriptGeneratorPage /></ProtectedRoute>} />
              <Route path="/dashboard/titles" element={<ProtectedRoute><TitleGeneratorPage /></ProtectedRoute>} />
              <Route path="/dashboard/thumbnails" element={<ProtectedRoute><ThumbnailGeneratorPage /></ProtectedRoute>} />
              <Route path="/dashboard/social" element={<ProtectedRoute><SocialCaptionPage /></ProtectedRoute>} />
              <Route path="/dashboard/seo" element={<ProtectedRoute><SEOOptimizerPage /></ProtectedRoute>} />
              <Route path="/dashboard/personas" element={<ProtectedRoute><PersonasPage /></ProtectedRoute>} />
              <Route path="/dashboard/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
              <Route path="/dashboard/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </PersonaProvider>
    </QueryClientProvider>
  )
}

export default App
