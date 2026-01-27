import { Sparkles, Video, Image, Type, TrendingUp, Users, Zap, Star, ArrowRight, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../components/modern/GlassCard'
import PlatformButton from '../components/PlatformButton'
import PlatformText from '../components/PlatformText'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 overflow-hidden relative">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '4s' }} />
      {/* Header with Glassmorphism */}
      <header className="border-b border-white/20 bg-white/70 backdrop-blur-2xl sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative">
                <div className="absolute inset-0 bg-brand-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <Sparkles className="w-8 h-8 text-brand-600 animate-pulse relative z-10" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-600 via-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                CreatorX
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <PlatformButton
                variant="ghost"
                onClick={() => navigate('/login')}
              >
                Sign In
              </PlatformButton>
              <PlatformButton
                variant="primary"
                onClick={() => navigate('/signup')}
              >
                Get Started
              </PlatformButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-500/20 to-purple-500/20 backdrop-blur-sm border border-white/30 text-brand-700 px-5 py-2.5 rounded-full mb-8 animate-bounce shadow-lg">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-semibold">AI-Powered Creator Tools</span>
          </div>
          
          <PlatformText
            as="h2"
            size="2xl"
            weight="bold"
            className="text-6xl md:text-7xl mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-brand-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Create. Connect. Grow.
            </span>
          </PlatformText>

          <PlatformText
            size="xl"
            className="text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            The all-in-one platform built for creators. Generate scripts, optimize titles,
            connect with brands, and scale your content creation journey with AI.
          </PlatformText>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
            <PlatformButton
              size="lg"
              variant="primary"
              onClick={() => navigate('/signup')}
              className="group flex items-center space-x-2"
            >
              <span>Start Creating Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </PlatformButton>
            <PlatformButton
              size="lg"
              variant="secondary"
              onClick={() => alert('Demo video coming soon!')}
              className="group flex items-center space-x-2"
            >
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Watch Demo</span>
            </PlatformButton>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-4xl font-bold text-brand-600">✓</div>
              <div className="text-gray-600 text-sm">AI-Powered</div>
            </div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-4xl font-bold text-pink-600">✓</div>
              <div className="text-gray-600 text-sm">Multi-Platform</div>
            </div>
            <div className="transform hover:scale-110 transition-transform">
              <div className="text-4xl font-bold text-orange-600">✓</div>
              <div className="text-gray-600 text-sm">Easy to Use</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid with Glass Cards */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 text-brand-600 mb-4">
            <Star className="w-6 h-6 fill-current animate-pulse" />
            <span className="text-sm font-semibold uppercase tracking-wide">Features</span>
            <Star className="w-6 h-6 fill-current animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">Succeed</span>
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional-grade AI tools designed specifically for content creators
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Video className="w-8 h-8 text-brand-600" />}
            title="Script Generation"
            description="AI-powered script writing with customizable personas for any content type"
            gradient="from-brand-500 to-purple-600"
          />
          <FeatureCard
            icon={<Type className="w-8 h-8 text-pink-600" />}
            title="Title Optimization"
            description="Generate click-worthy titles optimized for maximum CTR"
            gradient="from-pink-500 to-rose-600"
          />
          <FeatureCard
            icon={<Image className="w-8 h-8 text-blue-600" />}
            title="Thumbnail Ideas"
            description="Get creative thumbnail concepts that drive views"
            gradient="from-blue-500 to-cyan-600"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8 text-orange-600" />}
            title="SEO Optimization"
            description="Optimize your content for search engines automatically"
            gradient="from-orange-500 to-amber-600"
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8 text-purple-600" />}
            title="Social Captions"
            description="Generate engaging captions for all social platforms"
            gradient="from-purple-500 to-violet-600"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-green-600" />}
            title="Brand Connections"
            description="Connect with brands and grow your creator business"
            gradient="from-green-500 to-emerald-600"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-brand-600 via-pink-600 to-orange-500 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 z-10">
          <h3 className="text-4xl md:text-5xl font-bold mb-6 animate-pulse">Ready to Transform Your Content?</h3>
          <p className="text-xl md:text-2xl mb-10 opacity-95">
            Join thousands of creators who are already using CreatorX to scale their content
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => navigate('/signup')}
              className="group bg-white text-brand-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl flex items-center space-x-2"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-6 h-6 text-brand-400" />
                <h3 className="text-lg font-bold">CreatorX</h3>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered content creation platform for creators
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">
                    Sign In
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/signup')} className="hover:text-white transition-colors">
                    Get Started
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/refund')} className="hover:text-white transition-colors">
                    Refund Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/disclaimer')} className="hover:text-white transition-colors">
                    Disclaimer
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <button onClick={() => navigate('/contact')} className="hover:text-white transition-colors">
                    Contact Us
                  </button>
                </li>
                <li>
                  <a href="tel:9899262916" className="hover:text-white transition-colors">
                    Phone: 9899262916
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 CreatorX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <GlassCard className="group p-6 cursor-pointer">
      <div className="relative">
        {/* Gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl`} />

        {/* Content */}
        <div className="relative">
          <div className={`mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
            <div className="text-white">{icon}</div>
          </div>
          <h4 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-brand-600 group-hover:to-purple-600 transition-all">
            {title}
          </h4>
          <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
            {description}
          </p>
          <div className="mt-4 text-brand-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
            <span>Learn more</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
