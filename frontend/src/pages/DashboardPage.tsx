import DashboardLayout from '../components/DashboardLayout'
import { FileText, Type, Image, Share2, TrendingUp, Users, BookOpen, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const navigate = useNavigate()

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

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
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
            <div className="text-3xl font-bold text-purple-600">24</div>
            <div className="text-gray-600 text-sm mt-1">Scripts Generated</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-3xl font-bold text-pink-600">156</div>
            <div className="text-gray-600 text-sm mt-1">Titles Created</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-3xl font-bold text-blue-600">5</div>
            <div className="text-gray-600 text-sm mt-1">Active Personas</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-3xl font-bold text-green-600">12</div>
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
            {[
              { action: 'Generated script', item: 'Top 10 Travel Destinations 2026', time: '2 hours ago' },
              { action: 'Created titles', item: 'Tech Review Video', time: '5 hours ago' },
              { action: 'Optimized SEO', item: 'How to Start a YouTube Channel', time: '1 day ago' },
            ].map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{activity.action}</div>
                    <div className="text-sm text-gray-600">{activity.item}</div>
                  </div>
                  <div className="text-sm text-gray-500">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
