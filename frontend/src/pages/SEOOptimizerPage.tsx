import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Search, Sparkles, Loader, Clock, Trash2, X, Target, TrendingUp, Copy, Check, RefreshCw, ChevronDown, ChevronUp, BarChart3, FileText, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePersonas } from '../contexts/PersonaContext'
import { apiPost } from '../services/api'
import { apiUrl } from '../config'
import AIModelSelector from '../components/AIModelSelector'

interface SEOTemplate {
  id: string
  name: string
  description: string
  contentType: string
  icon: string
}

const SEO_TEMPLATES: SEOTemplate[] = [
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Long-form article with educational focus',
    contentType: 'blog',
    icon: '📝'
  },
  {
    id: 'video',
    name: 'Video Content',
    description: 'YouTube or social media video optimization',
    contentType: 'video',
    icon: '🎥'
  },
  {
    id: 'product',
    name: 'Product Page',
    description: 'E-commerce product listing optimization',
    contentType: 'product',
    icon: '🛍️'
  },
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Conversion-focused page optimization',
    contentType: 'landing',
    icon: '🎯'
  },
  {
    id: 'how-to',
    name: 'Tutorial/Guide',
    description: 'Step-by-step instructional content',
    contentType: 'tutorial',
    icon: '📚'
  },
  {
    id: 'news',
    name: 'News Article',
    description: 'Timely, newsworthy content',
    contentType: 'news',
    icon: '📰'
  }
]

// Real backend response structure
interface SEOOptimization {
  meta_title: string
  meta_description: string
  suggested_keywords: string[]
  seo_score: number
  optimized_content: string
}

interface HistoryItem {
  id: string
  content: string
  optimization: SEOOptimization
  timestamp: Date
  formData: {
    content: string
    targetKeywords: string
    contentType: string
    platform: string
    industry?: string
    audiencePersonaId: string
    ai_model?: string
  }
}

export default function SEOOptimizerPage() {
  const { getAudiencePersonas } = usePersonas()
  const [formData, setFormData] = useState({
    content: '',
    targetKeywords: '',
    contentType: 'blog',
    platform: 'google',
    industry: '',
    audiencePersonaId: '',
    ai_model: 'openai'
  })
  const [optimization, setOptimization] = useState<SEOOptimization | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [suggestingKeywords, setSuggestingKeywords] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [regenerateFeedback, setRegenerateFeedback] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

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
                meta_title: item.meta_data?.meta_title || 'Untitled',
                meta_description: item.meta_data?.meta_description || '',
                suggested_keywords: item.meta_data?.suggested_keywords || [],
                seo_score: item.meta_data?.seo_score || 0,
                optimized_content: item.meta_data?.optimized_content || item.content_text
              },
              timestamp: new Date(item.created_at),
              formData: {
                content: item.content_text,
                targetKeywords: item.meta_data?.target_keywords?.join(', ') || '',
                contentType: item.meta_data?.content_type || 'blog',
                platform: item.meta_data?.platform || 'google',
                audiencePersonaId: item.persona_id?.toString() || '',
                ai_model: item.meta_data?.ai_model || 'openai',
                industry: item.meta_data?.industry || ''
              }
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

  const suggestKeywords = async () => {
    if (!formData.content.trim()) {
      toast.error('Please enter content first')
      return
    }

    setSuggestingKeywords(true)
    try {
      // Extract keywords from content using simple frequency analysis
      const words = formData.content
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)

      const stopWords = ['the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'been', 'they', 'what', 'about', 'which', 'when', 'make', 'like', 'time', 'just', 'know', 'take', 'into', 'your', 'some', 'could', 'them', 'than', 'then', 'now', 'look', 'only', 'come', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most']

      const wordFreq: { [key: string]: number } = {}
      words.forEach(w => {
        if (!stopWords.includes(w)) {
          wordFreq[w] = (wordFreq[w] || 0) + 1
        }
      })

      const topKeywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word]) => word)

      setFormData({ ...formData, targetKeywords: topKeywords.join(', ') })
      toast.success('Keywords extracted from your content!')
    } catch (error) {
      console.error('Keyword suggestion error:', error)
      toast.error('Failed to suggest keywords')
    } finally {
      setSuggestingKeywords(false)
    }
  }

  const handleOptimize = async () => {
    if (!formData.content) {
      toast.error('Please provide content to optimize')
      return
    }

    setLoading(true)

    try {
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
        ai_model: formData.ai_model
      }

      // Add content type context
      if (formData.contentType) {
        requestBody.content_type = formData.contentType
      }

      // Add industry context
      if (formData.industry?.trim()) {
        requestBody.industry = formData.industry
      }

      // Add persona if selected
      if (formData.audiencePersonaId) {
        requestBody.persona_id = parseInt(formData.audiencePersonaId)
      }

      const response = await apiPost('/api/v1/creator-tools/optimize-seo', requestBody)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (Array.isArray(errorData.detail)) {
          const errorMsg = errorData.detail.map((err: any) => err.msg).join(', ')
          throw new Error(errorMsg || 'Failed to optimize SEO')
        }
        throw new Error(errorData.detail || 'Failed to optimize SEO')
      }

      const data = await response.json()

      // Use only real backend data
      const seoData: SEOOptimization = {
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        suggested_keywords: data.suggested_keywords || [],
        seo_score: data.seo_score || 0,
        optimized_content: data.optimized_content || formData.content
      }

      setOptimization(seoData)

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: data.id?.toString() || Date.now().toString(),
        content: formData.content,
        optimization: seoData,
        timestamp: new Date(),
        formData: { ...formData }
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

  const regenerateWithFeedback = async () => {
    if (!regenerateFeedback.trim()) {
      toast.error('Please provide feedback for regeneration')
      return
    }

    setRegenerating(true)

    try {
      const keywords = formData.targetKeywords?.trim()
        ? formData.targetKeywords.split(',').map(k => k.trim()).filter(k => k)
        : []

      const requestBody: any = {
        content: `${formData.content}\n\nUSER FEEDBACK FOR SEO OPTIMIZATION: ${regenerateFeedback}`,
        target_keywords: keywords,
        ai_model: formData.ai_model,
        content_type: formData.contentType
      }

      if (formData.audiencePersonaId) {
        requestBody.persona_id = parseInt(formData.audiencePersonaId)
      }

      const response = await apiPost('/api/v1/creator-tools/optimize-seo', requestBody)

      if (!response.ok) {
        throw new Error('Failed to regenerate SEO')
      }

      const data = await response.json()

      const seoData: SEOOptimization = {
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        suggested_keywords: data.suggested_keywords || [],
        seo_score: data.seo_score || 0,
        optimized_content: data.optimized_content || formData.content
      }

      setOptimization(seoData)
      setShowRegenerateModal(false)
      setRegenerateFeedback('')

      toast.success('SEO regenerated!')
    } catch (error) {
      console.error('Regeneration error:', error)
      toast.error('Failed to regenerate SEO')
    } finally {
      setRegenerating(false)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    // Ensure all required fields have defaults for backward compatibility
    setFormData({
      content: item.formData.content || '',
      targetKeywords: item.formData.targetKeywords || '',
      contentType: item.formData.contentType || 'blog',
      platform: item.formData.platform || 'google',
      industry: item.formData.industry || '',
      audiencePersonaId: item.formData.audiencePersonaId || '',
      ai_model: item.formData.ai_model || 'openai'
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItem(label)
    setTimeout(() => setCopiedItem(null), 2000)
    toast.success(`${label} copied!`)
  }

  const copyAllSEO = () => {
    if (!optimization) return

    const allText = `
SEO Title: ${optimization.meta_title}

Meta Description: ${optimization.meta_description}

Keywords: ${optimization.suggested_keywords.join(', ')}

SEO Score: ${optimization.seo_score}/100

Optimized Content:
${optimization.optimized_content}
    `.trim()

    navigator.clipboard.writeText(allText)
    toast.success('All SEO data copied!')
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    if (score >= 50) return 'Needs Work'
    return 'Poor'
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Search className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">SEO Optimizer</h1>
          </div>
          <div className="flex items-center space-x-3">
            {optimization && (
              <button
                onClick={() => {
                  setOptimization(null)
                  setFormData({ ...formData, content: '', targetKeywords: '' })
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-lg transition-colors hover:bg-brand-700 font-medium"
              >
                <Sparkles className="w-5 h-5" />
                <span>New Optimization</span>
              </button>
            )}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Clock className="w-5 h-5" />
              <span>History ({history.length})</span>
            </button>
          </div>
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
                                {item.optimization.meta_title}
                              </h4>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                                <span className={`px-2 py-1 rounded-full font-semibold ${getScoreColor(item.optimization.seo_score)}`}>
                                  SEO: {item.optimization.seo_score}/100
                                </span>
                                <span className="px-2 py-1 bg-gray-100 rounded-full">
                                  🔑 {item.optimization.suggested_keywords.length} keywords
                                </span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                  {item.formData.contentType}
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

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          {/* Input Form */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl mb-4 shadow-lg">
                <Search className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Optimize for Search Engines</h2>
              <p className="text-gray-600 text-sm">Generate SEO-optimized metadata with AI-powered insights</p>
            </div>

            {/* SEO Templates */}
            <div>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-100 hover:border-orange-200 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-900">Content Type Templates</span>
                  {formData.contentType && (
                    <span className="px-2 py-0.5 bg-orange-600 text-white text-xs rounded-full">
                      {SEO_TEMPLATES.find(t => t.contentType === formData.contentType)?.name}
                    </span>
                  )}
                </div>
                {showTemplates ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {showTemplates && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SEO_TEMPLATES.map(template => (
                    <div
                      key={template.id}
                      onClick={() => {
                        setFormData({ ...formData, contentType: template.contentType })
                        setShowTemplates(false)
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.contentType === template.contentType
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{template.icon}</span>
                          <h4 className="font-semibold text-gray-900 text-sm">{template.name}</h4>
                        </div>
                        {formData.contentType === template.contentType && (
                          <Check className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{template.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Your Content or Title <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400 min-h-[140px]"
                placeholder="Enter your article title, video description, or page content. Example: A comprehensive guide to video editing for beginners, covering all the essential tools and techniques..."
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {formData.content.length} characters • {formData.content.split(/\s+/).filter(w => w).length} words
                </span>
              </div>
            </div>

            {/* Target Keywords with AI Suggestions */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Target Keywords <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.targetKeywords}
                  onChange={(e) => setFormData({ ...formData, targetKeywords: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="e.g., video editing, premiere pro, tutorials"
                />
                <button
                  onClick={suggestKeywords}
                  disabled={suggestingKeywords || !formData.content}
                  className="px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-medium hover:from-orange-700 hover:to-amber-700 transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  {suggestingKeywords ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">Extract</span>
                </button>
              </div>
            </div>

            {/* Target Audience Persona */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Target Audience (Optional)
              </label>
              <select
                value={formData.audiencePersonaId}
                onChange={(e) => setFormData({ ...formData, audiencePersonaId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors text-gray-900 bg-white"
              >
                <option value="">General audience (no persona)</option>
                {getAudiencePersonas().map(persona => (
                  <option key={persona.id} value={persona.id}>{persona.name}</option>
                ))}
              </select>
            </div>

            {/* Advanced Options */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">Advanced Options</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  {/* Platform */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Platform
                    </label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-0 transition-colors text-gray-900 bg-white"
                    >
                      <option value="google">🔍 Google Search</option>
                      <option value="youtube">📺 YouTube</option>
                      <option value="social">📱 Social Media</option>
                      <option value="amazon">🛍️ Amazon/E-commerce</option>
                    </select>
                  </div>

                  {/* Industry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry/Niche (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400"
                      placeholder="e.g., Tech, Finance, Health, Education"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AI Model Selector */}
            <AIModelSelector
              selectedModel={formData.ai_model}
              onSelectModel={(model) => setFormData({ ...formData, ai_model: model })}
            />

            {/* Optimize Button */}
            <button
              onClick={handleOptimize}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-amber-700 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Optimizing SEO...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Optimize SEO</span>
                </>
              )}
            </button>
          </div>

          {/* SEO Results */}
          {optimization && (
            <div className="space-y-6">
              {/* Score Overview */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">SEO Performance</h3>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-5xl font-bold mb-2 ${getScoreColor(optimization.seo_score)} inline-block px-6 py-4 rounded-xl`}>
                      {Math.round(optimization.seo_score)}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">SEO Score</div>
                    <div className="text-xs text-gray-500 mt-1">{getScoreLabel(optimization.seo_score)}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowRegenerateModal(true)}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refine</span>
                </button>
                <button
                  onClick={copyAllSEO}
                  className="px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {/* Main SEO Data */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* SEO Title */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <span>SEO Title</span>
                    </h3>
                    <button
                      onClick={() => copyToClipboard(optimization.meta_title, 'SEO Title')}
                      className="text-gray-400 hover:text-orange-600 transition-colors"
                    >
                      {copiedItem === 'SEO Title' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 mb-2">
                    {optimization.meta_title}
                  </div>
                  <div className={`text-xs ${
                    optimization.meta_title.length >= 50 && optimization.meta_title.length <= 60
                      ? 'text-green-600'
                      : optimization.meta_title.length < 50 || optimization.meta_title.length > 70
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {optimization.meta_title.length} characters (optimal: 50-60)
                  </div>
                </div>

                {/* Meta Description */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <span>Meta Description</span>
                    </h3>
                    <button
                      onClick={() => copyToClipboard(optimization.meta_description, 'Meta Description')}
                      className="text-gray-400 hover:text-orange-600 transition-colors"
                    >
                      {copiedItem === 'Meta Description' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 mb-2 text-sm">
                    {optimization.meta_description}
                  </div>
                  <div className={`text-xs ${
                    optimization.meta_description.length >= 150 && optimization.meta_description.length <= 160
                      ? 'text-green-600'
                      : optimization.meta_description.length < 150 || optimization.meta_description.length > 170
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {optimization.meta_description.length} characters (optimal: 150-160)
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                    <Target className="w-4 h-4 text-orange-600" />
                    <span>Suggested Keywords ({optimization.suggested_keywords.length})</span>
                  </h3>
                  <button
                    onClick={() => copyToClipboard(optimization.suggested_keywords.join(', '), 'Keywords')}
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    {copiedItem === 'Keywords' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {optimization.suggested_keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Optimized Content */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span>Optimized Content</span>
                  </h3>
                  <button
                    onClick={() => copyToClipboard(optimization.optimized_content, 'Optimized Content')}
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    {copiedItem === 'Optimized Content' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                    {optimization.optimized_content}
                  </pre>
                </div>
              </div>

              {/* SEO Tips */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">SEO Best Practices</h4>
                    <ul className="text-sm text-blue-800 space-y-1.5">
                      <li>• Include your primary keyword naturally in the first 100 words</li>
                      <li>• Use descriptive, keyword-rich headings (H1, H2, H3)</li>
                      <li>• Optimize images with alt text containing relevant keywords</li>
                      <li>• Add internal and external links to authoritative sources</li>
                      <li>• Ensure mobile-friendliness and fast page load speed</li>
                      <li>• Update content regularly to keep it fresh and relevant</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Regenerate with Feedback Modal */}
        {showRegenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-900">Refine Your SEO</h3>
                </div>
                <button
                  onClick={() => setShowRegenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Tell the AI how to improve your SEO optimization. Be specific about what needs adjustment.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback / Instructions
                </label>
                <textarea
                  value={regenerateFeedback}
                  onChange={(e) => setRegenerateFeedback(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors min-h-[120px]"
                  placeholder="e.g., Make the title more compelling, Include more specific keywords, Shorter meta description, More action-oriented language..."
                />
              </div>

              {/* Quick feedback suggestions */}
              <div className="mb-6">
                <p className="text-xs text-gray-600 mb-2">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'More specific keywords',
                    'Shorter title',
                    'More compelling description',
                    'Include numbers',
                    'Add urgency',
                    'Focus on benefits',
                    'Less technical jargon',
                    'More action-oriented'
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setRegenerateFeedback(suggestion)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={regenerateWithFeedback}
                  disabled={regenerating || !regenerateFeedback.trim()}
                  className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {regenerating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Regenerate SEO</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRegenerateModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
