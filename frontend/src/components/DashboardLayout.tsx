import { ReactNode } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
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
  X
} from 'lucide-react'
import { useState } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
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
    // Clear any auth tokens here
    navigate('/')
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
                className="lg:hidden text-gray-600 hover:text-purple-600"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Link to="/dashboard" className="flex items-center space-x-2">
                <Sparkles className="w-8 h-8 text-purple-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  CreatorX
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-purple-600 transition-colors">
                <Settings className="w-6 h-6" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
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
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out`}
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
                      ? 'bg-purple-50 text-purple-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
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
