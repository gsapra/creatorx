import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Search, Sparkles, Loader, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface SEOOptimization {
  seo_title: string
  meta_description: string
  keywords: string[]
  tags: string[]
  improvements: string[]
}

interface HistoryItem {
  id: string
  content: string
  optimization: SEOOptimization
  timestamp: Date
}

export default function SEOOptimizerPage() {
  const [formData, setFormData] = useState({
    content: '',
    targetKeywords: ''
  })
  const [optimization, setOptimization] = useState<SEOOptimization | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const handleOptimize = async () => {
    if (!formData.content) {
      toast.error('Please provide content to optimize')
      return
    }

    setLoading(true)
    setTimeout(() => {
      const mockOptimization: SEOOptimization = {
        seo_title: `${formData.content.slice(0, 50)} | Expert Guide 2026`,
        meta_description: `Discover everything about ${formData.content}. Complete guide with tips, strategies, and best practices. Learn from experts today!`,
        keywords: formData.targetKeywords 
          ? formData.targetKeywords.split(',').map(k => k.trim())
          : ['content creation', 'digital marketing', 'SEO optimization', 'social media'],
        tags: ['tutorial', 'guide', 'tips', 'howto', 'educational'],
        improvements: [
          'Add focus keyword in the first paragraph',
          'Include internal links to related content',
          'Optimize images with alt text',
          'Add FAQ section for featured snippets',
          'Use header tags (H2, H3) properly'
        ]
      }
      
      setOptimization(mockOptimization)
      
      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        content: formData.content,
        optimization: mockOptimization,
        timestamp: new Date()
      }
      setHistory([newHistoryItem, ...history])
      
      setLoading(false)
      toast.success('SEO optimization complete!')
    }, 1500)
  }

  const loadFromHistory = (item: HistoryItem) => {
    setFormData({
      content: item.content,
      targetKeywords: item.optimization.keywords.join(', ')
    })
    setOptimization(item.optimization)
    setShowHistory(false)
    toast.success('Loaded from history')
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Search className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">SEO Optimizer</h1>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Clock className="w-5 h-5" />
            <span>History ({history.length})</span>
          </button>
        </div>

        {showHistory && history.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Optimizations</h3>
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                >
                  <div className="font-semibold text-gray-900 line-clamp-1">
                    {item.optimization.seo_title}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {item.optimization.keywords.length} keywords • {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content/Title *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input min-h-[120px]"
                placeholder="Enter your content title or description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={formData.targetKeywords}
                onChange={(e) => setFormData({ ...formData, targetKeywords: e.target.value })}
                className="input"
                placeholder="e.g., content creation, video editing"
              />
            </div>

            <button
              onClick={handleOptimize}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Optimize SEO</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">SEO Recommendations</h2>
            {optimization ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">SEO Title</h3>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    {optimization.seo_title}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {optimization.seo_title.length} characters (optimal: 50-60)
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Meta Description</h3>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    {optimization.meta_description}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {optimization.meta_description.length} characters (optimal: 150-160)
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {optimization.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Suggested Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {optimization.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Improvement Suggestions</h3>
                  <div className="space-y-2">
                    {optimization.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      const copyText = `SEO Title: ${optimization.seo_title}\n\nMeta Description: ${optimization.meta_description}\n\nKeywords: ${optimization.keywords.join(', ')}`
                      navigator.clipboard.writeText(copyText)
                      toast.success('Copied to clipboard!')
                    }}
                    className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                  >
                    Copy All
                  </button>
                  <button
                    onClick={() => toast.success('Saved!')}
                    className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Search className="w-16 h-16 mb-4" />
                <p>Your SEO optimization will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
