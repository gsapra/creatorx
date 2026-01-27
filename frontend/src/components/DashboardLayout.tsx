import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Home,
  FileText,
  Type,
  Image,
  Share2,
  TrendingUp,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/dashboard/script', icon: FileText, label: 'Script Generator' },
    { path: '/dashboard/titles', icon: Type, label: 'Title Generator' },
    { path: '/dashboard/thumbnails', icon: Image, label: 'Thumbnail Ideas' },
    { path: '/dashboard/social', icon: Share2, label: 'Social Captions' },
    { path: '/dashboard/seo', icon: TrendingUp, label: 'SEO Optimizer' },
    { path: '/dashboard/personas', icon: Users, label: 'My Personas' },
    { path: '/dashboard/marketplace', icon: Users, label: 'Brand Marketplace' },
    { path: '/dashboard/courses', icon: BookOpen, label: 'Learning Center' },
  ]

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-neutral-600 hover:text-brand-600 transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Link to="/dashboard" className="flex items-center space-x-2">
                <Sparkles className="w-8 h-8 text-brand-600" />
                <h1 className="text-2xl font-bold text-brand-600">
                  CreatorX
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard/wallet')}
                className="p-2 text-neutral-600 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50"
              >
                <Wallet className="w-6 h-6" />
              </button>
              <button
                onClick={() => navigate('/dashboard/settings')}
                className="p-2 text-neutral-600 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"
              >
                <Settings className="w-6 h-6" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-neutral-600 hover:text-error transition-colors rounded-lg hover:bg-error/5"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-neutral-200 shadow-elevation-2 transition-transform duration-300 ease-in-out`}
        >
          <nav className="h-full overflow-y-auto p-4 space-y-2 mt-16 lg:mt-0">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-elevation-1'
                      : 'text-neutral-700 hover:bg-neutral-50 hover:text-brand-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
