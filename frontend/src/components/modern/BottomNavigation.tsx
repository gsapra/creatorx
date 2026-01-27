import { Home, Sparkles, Users, BookOpen, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { platform } from '../../utils/platform'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

interface NavItem {
  icon: React.ElementType
  label: string
  path: string
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Sparkles, label: 'Create', path: '/dashboard/script' },
  { icon: Users, label: 'Personas', path: '/dashboard/personas' },
  { icon: BookOpen, label: 'Learn', path: '/dashboard/courses' },
  { icon: User, label: 'Profile', path: '/profile' },
]

export default function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  // Only show on mobile/native platforms
  if (!platform.isNative()) {
    return null
  }

  const handleNavClick = async (path: string) => {
    if (platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light })
    }
    navigate(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-40 pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 relative transition-all duration-200 active:scale-95"
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-brand-500 to-purple-600 rounded-full" />
              )}

              {/* Icon */}
              <div className={`
                transition-all duration-200
                ${isActive ? 'text-brand-600 scale-110' : 'text-gray-500'}
              `}>
                <Icon className="w-6 h-6" />
              </div>

              {/* Label */}
              <span className={`
                text-xs font-medium transition-all duration-200
                ${isActive ? 'text-brand-600' : 'text-gray-500'}
              `}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
