import { Sparkles, Video, Image, Type, TrendingUp, Users, Zap, Star, ArrowRight, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="border-b bg-white/70 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="relative">
                <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
                <Sparkles className="w-8 h-8 text-purple-400 absolute top-0 left-0 animate-ping" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">CreatorX</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-5 py-2 text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6 animate-bounce">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-semibold">AI-Powered Creator Tools</span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Create. Connect. Grow.
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
            The all-in-one platform built for creators. Generate scripts, optimize titles, 
            connect with brands, and scale your content creation journey with AI.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
            <button 
              onClick={() => navigate('/signup')}
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-2xl flex items-center space-x-2"
            >
              <span>Start Creating Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => alert('Demo video coming soon!')}
              className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-800 rounded-full text-lg font-semibold hover:bg-white transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 border-2 border-gray-200"
            >
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-4xl font-bold text-purple-600">10K+</div>
              <div className="text-gray-600 text-sm">Active Creators</div>
            </div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-4xl font-bold text-pink-600">50K+</div>
              <div className="text-gray-600 text-sm">Content Generated</div>
            </div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-4xl font-bold text-orange-600">500+</div>
              <div className="text-gray-600 text-sm">Brand Partners</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 text-purple-600 mb-4">
            <Star className="w-6 h-6 fill-current" />
            <span className="text-sm font-semibold uppercase tracking-wide">Features</span>
            <Star className="w-6 h-6 fill-current" />
          </div>
          <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to <span className="text-purple-600">Succeed</span>
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional-grade AI tools designed specifically for content creators
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Video className="w-8 h-8 text-primary-600" />}
            title="Script Generation"
            description="AI-powered script writing with customizable personas for any content type"
          />
          <FeatureCard
            icon={<Type className="w-8 h-8 text-primary-600" />}
            title="Title Optimization"
            description="Generate click-worthy titles optimized for maximum CTR"
          />
          <FeatureCard
            icon={<Image className="w-8 h-8 text-primary-600" />}
            title="Thumbnail Ideas"
            description="Get creative thumbnail concepts that drive views"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8 text-primary-600" />}
            title="SEO Optimization"
            description="Optimize your content for search engines automatically"
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8 text-primary-600" />}
            title="Social Captions"
            description="Generate engaging captions for all social platforms"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-primary-600" />}
            title="Brand Connections"
            description="Connect with brands and grow your creator business"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 z-10">
          <h3 className="text-4xl md:text-5xl font-bold mb-6 animate-pulse">Ready to Transform Your Content?</h3>
          <p className="text-xl md:text-2xl mb-10 opacity-95">
            Join thousands of creators who are already using CreatorX to scale their content
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => navigate('/signup')}
              className="group bg-white text-purple-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl flex items-center space-x-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all transform hover:scale-105"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 CreatorX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-purple-200 cursor-pointer">
      <div className="mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">{icon}</div>
      <h4 className="text-xl font-semibold mb-2 group-hover:text-purple-600 transition-colors">{title}</h4>
      <p className="text-gray-600">{description}</p>
      <div className="mt-4 text-purple-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
        <span>Learn more</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  )
}
