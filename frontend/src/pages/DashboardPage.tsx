import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { FileText, Type, Image, Share2, TrendingUp, Users, BookOpen, Zap, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiUrl } from '../config'
import toast from 'react-hot-toast'

interface DashboardStats {
  scripts_generated: number
  titles_created: number
  thumbnails_generated: number
  social_captions_created: number
  seo_optimizations: number
  active_personas: number
  brand_connections: number
  total_content: number
}

interface RecentActivity {
  id: number
  type: string
  title: string
  created_at: string
  meta_data: any
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const tools = [
    {
      icon: FileText,
      title: 'Script Generator',
      description: 'AI-powered script writing with customizable personas',
      color: 'purple',
      path: '/dashboard/script'
    },
    {
      icon: Type,
      title: 'Title Generator',
      description: 'Generate CTR-optimized titles that drive clicks',
      color: 'pink',
      path: '/dashboard/titles'
    },
    {
      icon: Image,
      title: 'Thumbnail Ideas',
      description: 'Get creative thumbnail concepts for your videos',
      color: 'blue',
      path: '/dashboard/thumbnails'
    },
    {
      icon: Share2,
      title: 'Social Captions',
      description: 'Create engaging captions for all platforms',
      color: 'green',
      path: '/dashboard/social'
    },
    {
      icon: TrendingUp,
      title: 'SEO Optimizer',
      description: 'Optimize your content for search engines',
      color: 'orange',
      path: '/dashboard/seo'
    },
    {
      icon: Users,
      title: 'My Personas',
      description: 'Manage your audience and script personas',
      color: 'indigo',
      path: '/dashboard/personas'
    },
    {
      icon: Users,
      title: 'Brand Marketplace',
      description: 'Connect with brands for collaborations',
      color: 'red',
      path: '/dashboard/marketplace'
    },
    {
      icon: BookOpen,
      title: 'Learning Center',
      description: 'AI-powered courses for new creators',
      color: 'yellow',
      path: '/dashboard/courses'
    }
  ]

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      try {
        setLoading(true)

        // Fetch stats
        const statsResponse = await fetch(apiUrl('/api/v1/content/stats'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        } else if (statsResponse.status === 401) {
          toast.error('Session expired. Please log in again.')
          navigate('/login')
          return
        }

        // Fetch recent activity (last 10 items across all content types)
        const activityResponse = await fetch(apiUrl('/api/v1/content?limit=10'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (activityResponse.ok) {
          const activityData = await activityResponse.json()
          setRecentActivity(activityData)
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [navigate])

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      purple: 'from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700',
      pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
      red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
    }
    return colors[color] || colors.purple
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'script': return <FileText className="w-4 h-4" />
      case 'title': return <Type className="w-4 h-4" />
      case 'thumbnail_idea': return <Image className="w-4 h-4" />
      case 'social_caption': return <Share2 className="w-4 h-4" />
      case 'seo_content': return <TrendingUp className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'script': return 'Generated script'
      case 'title': return 'Created titles'
      case 'thumbnail_idea': return 'Generated thumbnail ideas'
      case 'social_caption': return 'Created social caption'
      case 'seo_content': return 'Optimized SEO'
      default: return 'Created content'
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-brand-600 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Welcome Back, Creator! 🚀</h1>
          </div>
          <p className="text-lg opacity-90">
            Ready to create amazing content today? Choose a tool below to get started.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            {loading ? (
              <Loader className="w-8 h-8 animate-spin text-brand-600 mb-2" />
            ) : (
              <div className="text-3xl font-bold text-brand-600">{stats?.scripts_generated || 0}</div>
            )}
            <div className="text-gray-600 text-sm mt-1">Scripts Generated</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            {loading ? (
              <Loader className="w-8 h-8 animate-spin text-pink-600 mb-2" />
            ) : (
              <div className="text-3xl font-bold text-pink-600">{stats?.titles_created || 0}</div>
            )}
            <div className="text-gray-600 text-sm mt-1">Titles Created</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            {loading ? (
              <Loader className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            ) : (
              <div className="text-3xl font-bold text-blue-600">{stats?.active_personas || 0}</div>
            )}
            <div className="text-gray-600 text-sm mt-1">Active Personas</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            {loading ? (
              <Loader className="w-8 h-8 animate-spin text-green-600 mb-2" />
            ) : (
              <div className="text-3xl font-bold text-green-600">{stats?.brand_connections || 0}</div>
            )}
            <div className="text-gray-600 text-sm mt-1">Brand Connections</div>
          </div>
        </div>

        {/* Tools Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Creator Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tools.map((tool, index) => {
              const Icon = tool.icon
              return (
                <button
                  key={index}
                  onClick={() => navigate(tool.path)}
                  className="group relative bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 text-left overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${getColorClasses(tool.color)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                      <Icon className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-white transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors">
                      {tool.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-brand-600" />
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 text-brand-600">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{getActivityLabel(activity.type)}</div>
                        <div className="text-sm text-gray-600">
                          {activity.meta_data?.topic ||
                           activity.title?.replace(/^(Script: |Titles for: |Thumbnail Ideas: |SEO Optimized Content)/, '') ||
                           'Untitled'}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{getRelativeTime(activity.created_at)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No recent activity yet. Start creating content!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
