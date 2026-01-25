import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Share2, Sparkles, Loader, Clock, Instagram, Twitter, Youtube, Linkedin, Trash2, X, RefreshCw, Copy, Check, ChevronDown, ChevronUp, Zap, Target, BarChart3, Hash, MessageCircle, TrendingUp, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePersonas } from '../contexts/PersonaContext'
import { apiPost } from '../services/api'
import { apiUrl } from '../config'
import AIModelSelector from '../components/AIModelSelector'

interface CaptionStyle {
  id: string
  name: string
  description: string
  example: string
}

const CAPTION_STYLES: CaptionStyle[] = [
  {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'Narrative-driven with emotional connection',
    example: 'Started from the bottom, now we here...'
  },
  {
    id: 'educational',
    name: 'Educational',
    description: 'Informative with clear value proposition',
    example: 'Here\'s what I learned after 100 days...'
  },
  {
    id: 'promotional',
    name: 'Promotional',
    description: 'Sales-focused with strong CTA',
    example: 'Limited time offer! Get yours today 🔥'
  },
  {
    id: 'engaging',
    name: 'Engaging',
    description: 'Question-based to spark conversation',
    example: 'What would you do in this situation? 🤔'
  },
  {
    id: 'inspirational',
    name: 'Inspirational',
    description: 'Motivational and uplifting',
    example: 'Your only limit is you. Keep pushing! 💪'
  },
  {
    id: 'humorous',
    name: 'Humorous',
    description: 'Fun and lighthearted',
    example: 'POV: You trying to be productive on Monday 😅'
  }
]

interface CaptionWithAnalysis {
  text: string
  analysis: {
    length: number
    wordCount: number
    hashtagCount: number
    emojiCount: number
    hasHook: boolean
    hasCTA: boolean
    engagementScore: number
  }
}

interface HistoryItem {
  id: string
  platform: string
  content: string
  captions: CaptionWithAnalysis[]
  timestamp: Date
  formData: {
    content: string
    platform: string
    includeHashtags: boolean
    includeEmojis: boolean
    tone: string
    captionLength: string
    ctaStyle: string
    audiencePersonaId: string
    ai_model: string
    selectedStyles?: string[]
  }
}

export default function SocialCaptionPage() {
  const { getScriptPersonas } = usePersonas()
  const [formData, setFormData] = useState({
    content: '',
    platform: 'instagram',
    includeHashtags: true,
    includeEmojis: true,
    tone: 'engaging',
    captionLength: 'medium',
    ctaStyle: 'soft',
    audiencePersonaId: '',
    ai_model: 'openai',
    selectedStyles: [] as string[],
    variationCount: 3
  })
  const [captions, setCaptions] = useState<CaptionWithAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showStyles, setShowStyles] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [suggestingContent, setSuggestingContent] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [regenerateFeedback, setRegenerateFeedback] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Load history from backend
  useEffect(() => {
    const loadHistory = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setHistory([])
        return
      }

      try {
        const response = await fetch(apiUrl('/api/v1/content?content_type=social_caption&limit=50'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const backendContent = await response.json()

          // Group captions by content_description and timestamp (within 5 seconds)
          const groupedCaptions: { [key: string]: any[] } = {}

          backendContent.forEach((item: any) => {
            if (!item.content_text) return

            const key = `${item.meta_data?.content_description || 'untitled'}_${Math.floor(new Date(item.created_at).getTime() / 5000)}`
            if (!groupedCaptions[key]) {
              groupedCaptions[key] = []
            }
            groupedCaptions[key].push(item)
          })

          // Convert grouped captions to history items
          const backendHistory: HistoryItem[] = Object.values(groupedCaptions).map((group: any[]) => {
            const firstItem = group[0]
            const allCaptions = group.map(item => item.content_text).filter(Boolean)

            return {
              id: firstItem.id.toString(),
              platform: firstItem.meta_data?.platform || 'instagram',
              content: firstItem.meta_data?.content_description || firstItem.title || 'Untitled',
              captions: allCaptions.map((c: string) => ({
                text: c,
                ...analyzeCaption(c, firstItem.meta_data?.platform || 'instagram')
              })),
              timestamp: new Date(firstItem.created_at),
              formData: {
                content: firstItem.meta_data?.content_description || '',
                platform: firstItem.meta_data?.platform || 'instagram',
                includeHashtags: firstItem.meta_data?.include_hashtags !== false,
                includeEmojis: firstItem.meta_data?.include_emojis !== false,
                tone: firstItem.meta_data?.tone || 'engaging',
                captionLength: firstItem.meta_data?.caption_length || 'medium',
                ctaStyle: firstItem.meta_data?.cta_style || 'soft',
                audiencePersonaId: firstItem.persona_id?.toString() || '',
                ai_model: firstItem.meta_data?.ai_model || 'openai',
                selectedStyles: firstItem.meta_data?.selected_styles || []
              }
            }
          }).sort((a: HistoryItem, b: HistoryItem) => b.timestamp.getTime() - a.timestamp.getTime())

          setHistory(backendHistory)
        }
      } catch (error) {
        console.error('[Social Caption History] Failed to fetch from backend:', error)
      }
    }

    loadHistory()
  }, [])

  // Analyze caption quality
  const analyzeCaption = (caption: string, platform: string) => {
    const length = caption.length
    const wordCount = caption.split(/\s+/).length
    const hashtagCount = (caption.match(/#\w+/g) || []).length
    const emojiCount = (caption.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]/gu) || []).length

    // Check for hook (first line has question, exclamation, or strong opener)
    const firstLine = caption.split('\n')[0] || ''
    const hasHook = /[?!]/.test(firstLine) || firstLine.length < 50

    // Check for CTA (call-to-action phrases)
    const ctaPhrases = ['click', 'link in bio', 'comment', 'share', 'tag', 'follow', 'check out', 'learn more', 'sign up', 'get', 'buy', 'shop', 'download']
    const hasCTA = ctaPhrases.some(phrase => caption.toLowerCase().includes(phrase))

    // Calculate engagement score
    let score = 50 // Base score

    // Platform-specific length optimization
    const platformLimits: { [key: string]: number } = {
      'twitter': 280,
      'instagram': 2200,
      'linkedin': 3000,
      'youtube': 5000
    }
    const idealLength = platformLimits[platform] || 2200
    if (length >= idealLength * 0.3 && length <= idealLength * 0.7) score += 15

    if (hasHook) score += 10
    if (hasCTA) score += 10
    if (hashtagCount >= 3 && hashtagCount <= 10) score += 10
    if (emojiCount >= 2 && emojiCount <= 8) score += 5
    if (wordCount >= 15 && wordCount <= 100) score += 10

    return {
      analysis: {
        length,
        wordCount,
        hashtagCount,
        emojiCount,
        hasHook,
        hasCTA,
        engagementScore: Math.min(100, Math.max(0, score))
      }
    }
  }

  const platforms = [
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'pink', charLimit: 2200 },
    { value: 'twitter', label: 'Twitter', icon: Twitter, color: 'blue', charLimit: 280 },
    { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'red', charLimit: 5000 },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'blue', charLimit: 3000 }
  ]

  const suggestContent = async () => {
    if (!formData.platform) {
      toast.error('Please select a platform first')
      return
    }

    setSuggestingContent(true)
    try {
      const suggestions = [
        'Behind-the-scenes look at creating content',
        'Tutorial on improving productivity with AI tools',
        'Product review and unboxing experience',
        'Day in the life vlog showing creative process',
        'Tips and tricks for content creators',
        'Comparison between different tools/methods',
        'Transformation story from beginner to expert',
        'Common mistakes and how to avoid them'
      ]

      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
      setFormData({ ...formData, content: randomSuggestion })
      toast.success('Content idea suggested!')
    } catch (error) {
      console.error('Content suggestion error:', error)
      toast.error('Failed to suggest content')
    } finally {
      setSuggestingContent(false)
    }
  }

  const handleGenerate = async () => {
    if (!formData.content) {
      toast.error('Please describe your content')
      return
    }

    setLoading(true)

    try {
      // Generate multiple variations
      const generatedCaptions: string[] = []

      for (let i = 0; i < formData.variationCount; i++) {
        const requestBody: any = {
          content_description: formData.content,
          platform: formData.platform,
          include_hashtags: formData.includeHashtags,
          include_emojis: formData.includeEmojis,
          ai_model: formData.ai_model,
          temperature: 0.7 + (i * 0.1) // Increase temperature for variation
        }

        // Add persona if selected
        if (formData.audiencePersonaId) {
          requestBody.persona_id = parseInt(formData.audiencePersonaId)
        }

        // Add style hints if selected
        if (formData.selectedStyles.length > 0) {
          const styleHints = formData.selectedStyles
            .map(id => CAPTION_STYLES.find(s => s.id === id)?.description)
            .filter(Boolean)
          requestBody.style_hints = styleHints.join(', ')
        }

        // Add advanced options
        requestBody.tone = formData.tone
        requestBody.caption_length = formData.captionLength
        requestBody.cta_style = formData.ctaStyle

        const response = await apiPost('/api/v1/creator-tools/generate-social-caption', requestBody)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          if (Array.isArray(errorData.detail)) {
            const errorMsg = errorData.detail.map((err: any) => err.msg).join(', ')
            throw new Error(errorMsg || 'Failed to generate caption')
          }
          throw new Error(errorData.detail || 'Failed to generate caption')
        }

        const data = await response.json()
        generatedCaptions.push(data.content_text || '')
      }

      // Analyze each caption
      const captionsWithAnalysis = generatedCaptions.map(c => ({
        text: c,
        ...analyzeCaption(c, formData.platform)
      }))

      setCaptions(captionsWithAnalysis)

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        platform: formData.platform,
        content: formData.content,
        captions: captionsWithAnalysis,
        timestamp: new Date(),
        formData: { ...formData }
      }
      setHistory([newHistoryItem, ...history])

      toast.success(`${formData.variationCount} captions generated!`)
    } catch (error) {
      console.error('Caption generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate captions'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const regenerateCaptions = async () => {
    if (!regenerateFeedback.trim()) {
      toast.error('Please provide feedback for regeneration')
      return
    }

    setRegenerating(true)

    try {
      const generatedCaptions: string[] = []

      for (let i = 0; i < formData.variationCount; i++) {
        const requestBody: any = {
          content_description: `${formData.content}\n\nUSER FEEDBACK: ${regenerateFeedback}`,
          platform: formData.platform,
          include_hashtags: formData.includeHashtags,
          include_emojis: formData.includeEmojis,
          ai_model: formData.ai_model,
          temperature: 0.8 + (i * 0.1)
        }

        if (formData.audiencePersonaId) {
          requestBody.persona_id = parseInt(formData.audiencePersonaId)
        }

        const response = await apiPost('/api/v1/creator-tools/generate-social-caption', requestBody)

        if (!response.ok) {
          throw new Error('Failed to regenerate caption')
        }

        const data = await response.json()
        generatedCaptions.push(data.content_text || '')
      }

      const captionsWithAnalysis = generatedCaptions.map(c => ({
        text: c,
        ...analyzeCaption(c, formData.platform)
      }))

      setCaptions(captionsWithAnalysis)
      setShowRegenerateModal(false)
      setRegenerateFeedback('')

      toast.success('Captions regenerated!')
    } catch (error) {
      console.error('Regeneration error:', error)
      toast.error('Failed to regenerate captions')
    } finally {
      setRegenerating(false)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    setFormData(item.formData)
    setCaptions(item.captions)
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
      toast.success('Caption deleted')
    } catch (error) {
      console.error('Failed to delete history item:', error)
      toast.error('Failed to delete caption')
    } finally {
      setDeletingId(null)
      setDeleteConfirm(null)
    }
  }

  const getPlatformIcon = (platform: string) => {
    const platformData = platforms.find(p => p.value === platform)
    if (!platformData) return <Share2 className="w-4 h-4" />
    const Icon = platformData.icon
    return <Icon className="w-4 h-4" />
  }

  const copyCaption = (caption: string, index: number) => {
    navigator.clipboard.writeText(caption)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
    toast.success('Copied!')
  }

  const copyAllCaptions = () => {
    const allCaptions = captions.map((c, i) => `Caption ${i + 1}:\n${c.text}`).join('\n\n---\n\n')
    navigator.clipboard.writeText(allCaptions)
    toast.success('All captions copied!')
  }

  const toggleStyle = (styleId: string) => {
    const current = formData.selectedStyles
    const updated = current.includes(styleId)
      ? current.filter(id => id !== styleId)
      : [...current, styleId]
    setFormData({ ...formData, selectedStyles: updated })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getPlatformLimit = () => {
    return platforms.find(p => p.value === formData.platform)?.charLimit || 2200
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Share2 className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Social Media Captions</h1>
          </div>
          <div className="flex items-center space-x-3">
            {captions.length > 0 && (
              <button
                onClick={() => setCaptions([])}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-lg transition-colors hover:bg-brand-700 font-medium"
              >
                <Sparkles className="w-5 h-5" />
                <span>New Set</span>
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
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                  <h3 className="font-bold text-gray-900 text-lg">Caption History</h3>
                  <p className="text-sm text-gray-600 mt-1">{history.length} saved captions</p>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="divide-y divide-gray-100">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="group relative hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all"
                      >
                        <div
                          onClick={() => loadFromHistory(item)}
                          className="p-5 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors mb-2">
                                {item.content}
                              </h4>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                  {getPlatformIcon(item.platform)}
                                  <span className="font-semibold capitalize">{item.platform}</span>
                                </div>
                                <span className="px-2 py-1 bg-gray-100 rounded-full">
                                  {item.captions.length} variations
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                  Avg Score: {Math.round(item.captions.reduce((sum, c) => sum + c.analysis.engagementScore, 0) / item.captions.length)}
                                </span>
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
                              title="Delete caption"
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
                              <p className="text-sm font-medium text-gray-900 mb-3">Delete this caption?</p>
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No caption history yet</h3>
                <p className="text-sm text-gray-600">Generate your first caption to see it here</p>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Input Form */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
                <Share2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Engaging Captions</h2>
              <p className="text-gray-600 text-sm">Generate platform-optimized captions that drive engagement</p>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Choose Platform *
              </label>
              <p className="text-xs text-gray-600 mb-3">
                📱 Each platform has unique best practices and character limits
              </p>
              <div className="grid grid-cols-4 gap-3">
                {platforms.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <button
                      key={platform.value}
                      onClick={() => setFormData({ ...formData, platform: platform.value })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.platform === platform.value
                          ? 'border-green-600 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <Icon className="w-7 h-7 mx-auto mb-2" />
                      <div className="text-xs font-semibold">{platform.label}</div>
                      <div className="text-[10px] text-gray-500 mt-1">{platform.charLimit} chars</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                What's your content about? *
              </label>
              <p className="text-xs text-gray-600 mb-3">
                💡 Be descriptive! Better descriptions lead to better captions
              </p>
              <div className="flex gap-2 mb-2">
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400 min-h-[100px] resize-none"
                  placeholder="e.g., Behind-the-scenes look at my creative process for making videos"
                />
              </div>
              <button
                onClick={suggestContent}
                disabled={suggestingContent}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center space-x-1"
              >
                {suggestingContent ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Getting inspiration...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Suggest Content Idea</span>
                  </>
                )}
              </button>
            </div>

            {/* Brand Voice Persona */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Brand Voice (optional)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                🎭 Use a saved persona for consistent brand voice
              </p>
              <select
                value={formData.audiencePersonaId}
                onChange={(e) => setFormData({ ...formData, audiencePersonaId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors text-gray-900 bg-white"
              >
                <option value="">General voice (no persona)</option>
                {getScriptPersonas().map(persona => (
                  <option key={persona.id} value={persona.id}>{persona.name}</option>
                ))}
              </select>
            </div>

            {/* Caption Styles (Collapsible) */}
            <div>
              <button
                onClick={() => setShowStyles(!showStyles)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-100 hover:border-green-200 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-900">Caption Styles (Optional)</span>
                  {formData.selectedStyles.length > 0 && (
                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                      {formData.selectedStyles.length} selected
                    </span>
                  )}
                </div>
                {showStyles ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {showStyles && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CAPTION_STYLES.map(style => (
                    <div
                      key={style.id}
                      onClick={() => toggleStyle(style.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.selectedStyles.includes(style.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{style.name}</h4>
                        {formData.selectedStyles.includes(style.id) && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{style.description}</p>
                      <p className="text-xs text-green-700 italic">{style.example}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Advanced Options (Collapsible) */}
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
                  {/* Tone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tone
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-gray-900 bg-white"
                    >
                      <option value="engaging">✨ Engaging & Conversational</option>
                      <option value="professional">💼 Professional & Polished</option>
                      <option value="casual">😊 Casual & Friendly</option>
                      <option value="inspiring">🚀 Inspiring & Motivational</option>
                      <option value="humorous">😂 Humorous & Fun</option>
                      <option value="educational">🎓 Educational & Informative</option>
                    </select>
                  </div>

                  {/* Caption Length */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caption Length
                    </label>
                    <select
                      value={formData.captionLength}
                      onChange={(e) => setFormData({ ...formData, captionLength: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-gray-900 bg-white"
                    >
                      <option value="short">📏 Short (1-2 sentences)</option>
                      <option value="medium">📐 Medium (3-5 sentences)</option>
                      <option value="long">📏 Long (6+ sentences)</option>
                    </select>
                  </div>

                  {/* CTA Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Call-to-Action Style
                    </label>
                    <select
                      value={formData.ctaStyle}
                      onChange={(e) => setFormData({ ...formData, ctaStyle: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 transition-colors text-gray-900 bg-white"
                    >
                      <option value="none">🚫 No CTA</option>
                      <option value="soft">💬 Soft CTA (question/engagement)</option>
                      <option value="medium">👉 Medium CTA (link in bio, comment)</option>
                      <option value="strong">🔥 Strong CTA (buy, sign up, download)</option>
                    </select>
                  </div>

                  {/* Number of Variations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Variations: {formData.variationCount}
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="5"
                      value={formData.variationCount}
                      onChange={(e) => setFormData({ ...formData, variationCount: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${((formData.variationCount - 3) / 2) * 100}%, #e5e7eb ${((formData.variationCount - 3) / 2) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>3</span>
                      <span>5</span>
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.includeHashtags}
                        onChange={(e) => setFormData({ ...formData, includeHashtags: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Include hashtags</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.includeEmojis}
                        onChange={(e) => setFormData({ ...formData, includeEmojis: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Include emojis</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* AI Model Selector */}
            <AIModelSelector
              selectedModel={formData.ai_model}
              onSelectModel={(model) => setFormData({ ...formData, ai_model: model })}
            />

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating captions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Captions</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Captions */}
          {captions.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Generated Captions</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyAllCaptions}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy All</span>
                  </button>
                  <button
                    onClick={() => setShowRegenerateModal(true)}
                    className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refine</span>
                  </button>
                </div>
              </div>

              {/* Quality Summary */}
              <div className="grid grid-cols-4 gap-3 mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(captions.reduce((sum, c) => sum + c.analysis.engagementScore, 0) / captions.length)}
                  </div>
                  <div className="text-xs text-gray-600">Avg Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {Math.round(captions.reduce((sum, c) => sum + c.analysis.hashtagCount, 0) / captions.length)}
                  </div>
                  <div className="text-xs text-gray-600">Avg Hashtags</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(captions.reduce((sum, c) => sum + c.analysis.wordCount, 0) / captions.length)}
                  </div>
                  <div className="text-xs text-gray-600">Avg Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {captions.filter(c => c.analysis.hasCTA).length}
                  </div>
                  <div className="text-xs text-gray-600">With CTA</div>
                </div>
              </div>

              {/* Captions List */}
              <div className="space-y-4">
                {captions
                  .sort((a, b) => b.analysis.engagementScore - a.analysis.engagementScore)
                  .map((caption, index) => (
                    <div
                      key={index}
                      className="group p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(caption.analysis.engagementScore)}`}>
                            Score: {caption.analysis.engagementScore}/100
                          </span>
                        </div>
                        <button
                          onClick={() => copyCaption(caption.text, index)}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      <div className="text-gray-900 mb-3 whitespace-pre-wrap leading-relaxed">
                        {caption.text}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-100 rounded-full flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{caption.analysis.length} chars / {caption.analysis.wordCount} words</span>
                        </span>
                        {caption.analysis.hashtagCount > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center space-x-1">
                            <Hash className="w-3 h-3" />
                            <span>{caption.analysis.hashtagCount} hashtags</span>
                          </span>
                        )}
                        {caption.analysis.hasHook && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            ✓ Hook
                          </span>
                        )}
                        {caption.analysis.hasCTA && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            ✓ CTA
                          </span>
                        )}
                        {caption.analysis.emojiCount > 0 && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                            {caption.analysis.emojiCount} emojis
                          </span>
                        )}
                      </div>

                      {/* Character limit warning */}
                      {caption.analysis.length > getPlatformLimit() && (
                        <div className="flex items-start space-x-2 mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Caption exceeds {formData.platform} character limit ({caption.analysis.length - getPlatformLimit()} chars over)</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Engagement Tips */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Tips for Higher Engagement</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Start with a hook to grab attention in the first line</li>
                      <li>• Use 3-5 relevant hashtags for discoverability</li>
                      <li>• Include a clear call-to-action to drive engagement</li>
                      <li>• Test multiple captions with your audience</li>
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
                  <RefreshCw className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">Refine Your Captions</h3>
                </div>
                <button
                  onClick={() => setShowRegenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Tell the AI how to improve your captions. Be specific about what you want changed.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback / Instructions
                </label>
                <textarea
                  value={regenerateFeedback}
                  onChange={(e) => setRegenerateFeedback(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors min-h-[120px]"
                  placeholder="e.g., Make them shorter, Add more emojis, More casual tone, Include specific keywords..."
                />
              </div>

              {/* Quick feedback suggestions */}
              <div className="mb-6">
                <p className="text-xs text-gray-600 mb-2">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Make them shorter',
                    'More emojis',
                    'Less hashtags',
                    'More professional',
                    'Add strong CTA',
                    'More casual',
                    'Include question',
                    'More engaging'
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setRegenerateFeedback(suggestion)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={regenerateCaptions}
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
                      <span>Regenerate Captions</span>
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
