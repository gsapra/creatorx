import { useState } from 'react'
import { Plus, X, FileText, Type, Image, Share2, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { platform } from '../../utils/platform'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

interface QuickAction {
  icon: React.ElementType
  label: string
  color: string
  path: string
}

const quickActions: QuickAction[] = [
  { icon: FileText, label: 'Script', color: 'bg-purple-500', path: '/dashboard/script' },
  { icon: Type, label: 'Titles', color: 'bg-pink-500', path: '/dashboard/titles' },
  { icon: Image, label: 'Thumbnail', color: 'bg-blue-500', path: '/dashboard/thumbnails' },
  { icon: Share2, label: 'Social', color: 'bg-green-500', path: '/dashboard/social' },
  { icon: TrendingUp, label: 'SEO', color: 'bg-orange-500', path: '/dashboard/seo' },
]

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleToggle = async () => {
    if (platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light })
    }
    setIsOpen(!isOpen)
  }

  const handleActionClick = async (path: string) => {
    if (platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Medium })
    }
    setIsOpen(false)
    navigate(path)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Quick Actions Menu */}
      <div
        className={`absolute bottom-20 right-0 flex flex-col gap-3 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <button
              key={action.path}
              onClick={() => handleActionClick(action.path)}
              className={`group flex items-center gap-3 transition-all duration-300`}
              style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
            >
              {/* Label */}
              <span className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                {action.label}
              </span>

              {/* Action Button */}
              <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={handleToggle}
        className={`
          w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-600
          text-white shadow-2xl hover:shadow-brand-500/50
          flex items-center justify-center
          transition-all duration-300 hover:scale-110 active:scale-95
          ${isOpen ? 'rotate-45' : 'rotate-0'}
        `}
      >
        {isOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
      </button>
    </div>
  )
}
