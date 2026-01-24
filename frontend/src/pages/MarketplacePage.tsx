import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Store, Search, Filter, Users, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface Creator {
  id: string
  name: string
  niche: string
  followers: string
  engagement: string
  platforms: string[]
  rates: string
  image: string
}

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNiche, setSelectedNiche] = useState('all')

  const creators: Creator[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      niche: 'Tech & Productivity',
      followers: '250K',
      engagement: '4.8%',
      platforms: ['YouTube', 'Instagram', 'Twitter'],
      rates: '$500-2000',
      image: '👩‍💻'
    },
    {
      id: '2',
      name: 'Mike Chen',
      niche: 'Fitness & Wellness',
      followers: '180K',
      engagement: '5.2%',
      platforms: ['YouTube', 'TikTok'],
      rates: '$300-1500',
      image: '💪'
    },
    {
      id: '3',
      name: 'Emma Davis',
      niche: 'Fashion & Lifestyle',
      followers: '420K',
      engagement: '6.1%',
      platforms: ['Instagram', 'TikTok', 'YouTube'],
      rates: '$800-3000',
      image: '👗'
    },
    {
      id: '4',
      name: 'Alex Thompson',
      niche: 'Gaming & Entertainment',
      followers: '500K',
      engagement: '7.5%',
      platforms: ['Twitch', 'YouTube', 'Twitter'],
      rates: '$1000-4000',
      image: '🎮'
    },
    {
      id: '5',
      name: 'Lisa Rodriguez',
      niche: 'Food & Cooking',
      followers: '320K',
      engagement: '5.8%',
      platforms: ['Instagram', 'YouTube', 'TikTok'],
      rates: '$600-2500',
      image: '👩‍🍳'
    },
    {
      id: '6',
      name: 'David Kim',
      niche: 'Business & Finance',
      followers: '280K',
      engagement: '4.3%',
      platforms: ['LinkedIn', 'YouTube', 'Twitter'],
      rates: '$700-2800',
      image: '💼'
    }
  ]

  const niches = ['all', 'Tech & Productivity', 'Fitness & Wellness', 'Fashion & Lifestyle', 'Gaming & Entertainment', 'Food & Cooking', 'Business & Finance']

  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.niche.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesNiche = selectedNiche === 'all' || creator.niche === selectedNiche
    return matchesSearch && matchesNiche
  })

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <Store className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Brand Marketplace</h1>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Connect with Top Creators</h2>
          <p className="text-red-50">Find the perfect influencer for your brand campaigns</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Search creators by name or niche..."
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none bg-white"
              >
                {niches.map(niche => (
                  <option key={niche} value={niche}>
                    {niche === 'all' ? 'All Niches' : niche}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => (
            <div
              key={creator.id}
              className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-red-400 transition-all shadow-sm hover:shadow-lg"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="text-5xl">{creator.image}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{creator.name}</h3>
                  <p className="text-sm text-gray-600">{creator.niche}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">Followers</span>
                  </div>
                  <span className="font-semibold text-gray-900">{creator.followers}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">Engagement</span>
                  </div>
                  <span className="font-semibold text-green-600">{creator.engagement}</span>
                </div>

                <div>
                  <p className="text-sm text-gray-700 mb-2">Platforms:</p>
                  <div className="flex flex-wrap gap-2">
                    {creator.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-semibold"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Collaboration Rate</p>
                  <p className="font-bold text-red-600">{creator.rates}</p>
                </div>
              </div>

              <button
                onClick={() => toast.success(`Connection request sent to ${creator.name}!`)}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all transform hover:scale-105"
              >
                Connect
              </button>
            </div>
          ))}
        </div>

        {filteredCreators.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No creators found matching your criteria</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
