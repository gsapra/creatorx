import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { FileText, Type, Image, Share2, TrendingUp, Users, BookOpen, Zap, Loader, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiUrl } from '../config'
import toast from 'react-hot-toast'
import GlassCard from '../components/modern/GlassCard'
import FloatingActionButton from '../components/modern/FloatingActionButton'
import BottomNavigation from '../components/modern/BottomNavigation'
import SkeletonLoader from '../components/modern/SkeletonLoader'
import PullToRefresh from '../components/modern/PullToRefresh'
import EmptyState from '../components/modern/EmptyState'

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
    },
    {
      icon: Wallet,
      title: 'My Wallet',
      description: 'Manage payments and earnings',
      color: 'emerald',
      path: '/dashboard/wallet'
    }
  ]

  // Load dashboard data function
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

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      purple: 'from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700',
      pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
      red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
      emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
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

  const handleRefresh = async () => {
    await loadDashboardData()
  }

  return (
    <DashboardLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-8 pb-24">
          {/* Welcome Section with Glassmorphism */}
          <GlassCard className="p-8 bg-gradient-to-br from-brand-600 to-purple-600 border-none">
            <div className="flex items-center space-x-3 mb-4 animate-float">
              <div className="relative">
                <Zap className="w-10 h-10 text-white" />
                <Zap className="w-10 h-10 text-yellow-300 absolute top-0 left-0 animate-ping" />
              </div>
              <h1 className="text-3xl font-bold text-white">Welcome Back, Creator! 🚀</h1>
            </div>
            <p className="text-lg text-white/90">
              Ready to create amazing content today? Choose a tool below to get started.
            </p>
          </GlassCard>

          {/* Quick Stats with Glass Effect */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <SkeletonLoader variant="stat" count={4} />
            ) : (
              <>
                <GlassCard className="p-6 group hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-4xl font-bold bg-gradient-to-br from-brand-600 to-purple-600 bg-clip-text text-transparent">
                      {stats?.scripts_generated || 0}
                    </div>
                    <FileText className="w-8 h-8 text-brand-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-gray-600 text-sm font-medium">Scripts</div>
                </GlassCard>

                <GlassCard className="p-6 group hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-4xl font-bold bg-gradient-to-br from-pink-600 to-rose-600 bg-clip-text text-transparent">
                      {stats?.titles_created || 0}
                    </div>
                    <Type className="w-8 h-8 text-pink-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-gray-600 text-sm font-medium">Titles</div>
                </GlassCard>

                <GlassCard className="p-6 group hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-4xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {stats?.social_captions_created || 0}
                    </div>
                    <Share2 className="w-8 h-8 text-green-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-gray-600 text-sm font-medium">Captions</div>
                </GlassCard>

                <GlassCard className="p-6 group hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-4xl font-bold bg-gradient-to-br from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {stats?.seo_optimizations || 0}
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-gray-600 text-sm font-medium">SEO</div>
                </GlassCard>
              </>
            )}
          </div>

          {/* Tools Grid with Modern Cards */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              Your Creator Tools
              <span className="text-sm font-normal text-gray-500">({tools.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tools.map((tool, index) => {
                const Icon = tool.icon
                return (
                  <GlassCard
                    key={index}
                    onClick={() => navigate(tool.path)}
                    className="group p-6 overflow-hidden cursor-pointer animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${getColorClasses(tool.color)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-all group-hover:scale-110 group-hover:rotate-6 duration-300">
                        <Icon className="w-7 h-7 text-gray-700 group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-white transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </div>

          {/* Recent Activity with Modern Design */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            {loading ? (
              <SkeletonLoader variant="list" />
            ) : recentActivity.length > 0 ? (
              <GlassCard className="divide-y divide-gray-100">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-white/50 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                            {getActivityLabel(activity.type)}
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {activity.meta_data?.topic ||
                             activity.title?.replace(/^(Script: |Titles for: |Thumbnail Ideas: |SEO Optimized Content)/, '') ||
                             'Untitled'}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">{getRelativeTime(activity.created_at)}</div>
                    </div>
                  </div>
                ))}
              </GlassCard>
            ) : (
              <GlassCard>
                <EmptyState
                  icon={FileText}
                  title="No Activity Yet"
                  description="Start creating amazing content to see your activity here!"
                  action={{
                    label: 'Create Now',
                    onClick: () => navigate('/dashboard/script'),
                  }}
                />
              </GlassCard>
            )}
          </div>
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton />

        {/* Bottom Navigation (Mobile Only) */}
        <BottomNavigation />
      </PullToRefresh>
    </DashboardLayout>
  )
}
