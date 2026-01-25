import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Search, Sparkles, Loader, Clock, CheckCircle, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPost } from '../services/api'
import { apiUrl } from '../config'

interface SEOOptimization {
  seo_title: string
  meta_description: string
  keywords: string[]
  tags: string[]
  improvements: string[]
  seo_score?: number
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Load history from backend
  useEffect(() => {
    const loadHistory = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setHistory([])
        return
      }

      try {
        const response = await fetch(apiUrl('/api/v1/content?content_type=seo_content&limit=50'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const backendContent = await response.json()
          const backendHistory: HistoryItem[] = backendContent
            .filter((item: any) => item.content_text && item.meta_data)
            .map((item: any) => ({
              id: item.id.toString(),
              content: item.content_text,
              optimization: {
                seo_title: item.meta_data?.meta_title || 'Untitled',
                meta_description: item.meta_data?.meta_description || '',
                keywords: item.meta_data?.suggested_keywords || [],
                tags: [],
                improvements: [],
                seo_score: item.meta_data?.seo_score || 0
              },
              timestamp: new Date(item.created_at)
            }))
            .sort((a: HistoryItem, b: HistoryItem) => b.timestamp.getTime() - a.timestamp.getTime())

          setHistory(backendHistory)
        }
      } catch (error) {
        console.error('[SEO History] Failed to fetch from backend:', error)
      }
    }

    loadHistory()
  }, [])

  const handleOptimize = async () => {
    if (!formData.content) {
      toast.error('Please provide content to optimize')
      return
    }

    setLoading(true)

    try {
      // Target keywords are required by the backend
      const keywords = formData.targetKeywords?.trim()
        ? formData.targetKeywords.split(',').map(k => k.trim()).filter(k => k)
        : []

      if (keywords.length === 0) {
        toast.error('Please enter at least one target keyword')
        setLoading(false)
        return
      }

      const requestBody: any = {
        content: formData.content,
        target_keywords: keywords,
        ai_model: 'vertex' // Using Vertex AI as default per CLAUDE.md
      }

      const response = await apiPost('/api/v1/creator-tools/optimize-seo', requestBody)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Handle FastAPI validation error format
        if (Array.isArray(errorData.detail)) {
          const errorMsg = errorData.detail.map((err: any) => err.msg).join(', ')
          throw new Error(errorMsg || 'Failed to optimize SEO')
        }
        throw new Error(errorData.detail || 'Failed to optimize SEO')
      }

      const data = await response.json()

      // Backend returns the SEO data directly in the response
      const seoData: SEOOptimization = {
        seo_title: data.meta_title || formData.content.slice(0, 60),
        meta_description: data.meta_description || '',
        keywords: data.suggested_keywords || keywords,
        tags: [],
        improvements: []
      }

      setOptimization(seoData)

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: data.id?.toString() || Date.now().toString(),
        content: formData.content,
        optimization: seoData,
        timestamp: new Date()
      }
      setHistory([newHistoryItem, ...history])

      toast.success('SEO optimization complete!')
    } catch (error) {
      console.error('SEO optimization error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to optimize SEO'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
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

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(id)

    try {
      const token = localStorage.getItem('token')
      if (token) {
        const response = await fetch(apiUrl(`/api/v1/content/${id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok && response.status !== 404) {
          throw new Error('Failed to delete from server')
        }
      }

      const newHistory = history.filter(item => item.id !== id)
      setHistory(newHistory)
      toast.success('SEO optimization deleted')
    } catch (error) {
      console.error('Failed to delete history item:', error)
      toast.error('Failed to delete SEO optimization')
    } finally {
      setDeletingId(null)
      setDeleteConfirm(null)
    }
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

        {showHistory && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {history.length > 0 ? (
              <>
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
                  <h3 className="font-bold text-gray-900 text-lg">SEO Optimization History</h3>
                  <p className="text-sm text-gray-600 mt-1">{history.length} saved optimizations</p>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="divide-y divide-gray-100">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="group relative hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all"
                      >
                        <div
                          onClick={() => loadFromHistory(item)}
                          className="p-5 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors mb-2 line-clamp-1">
                                {item.optimization.seo_title}
                              </h4>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                                {item.optimization.seo_score !== undefined && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">
                                    SEO Score: {item.optimization.seo_score}/100
                                  </span>
                                )}
                                <span className="px-2 py-1 bg-gray-100 rounded-full">
                                  🔑 {item.optimization.keywords.length} keywords
                                </span>
                              </div>
                              <div className="text-xs text-gray-700 line-clamp-1 mb-2">
                                {item.optimization.meta_description}
                              </div>
                              <div className="text-xs text-gray-500">
                                📅 {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirm(item.id)
                              }}
                              disabled={deletingId === item.id}
                              className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete SEO optimization"
                            >
                              {deletingId === item.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Delete confirmation */}
                        {deleteConfirm === item.id && (
                          <div className="absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-10">
                            <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 max-w-sm mx-4">
                              <p className="text-sm font-medium text-gray-900 mb-3">Delete this SEO optimization?</p>
                              <p className="text-xs text-gray-600 mb-4">This action cannot be undone.</p>
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => deleteHistoryItem(item.id, e)}
                                  className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteConfirm(null)
                                  }}
                                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full mb-4">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No SEO history yet</h3>
                <p className="text-sm text-gray-600">Optimize your first content to see it here</p>
              </div>
            )}
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
              className="w-full py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
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
