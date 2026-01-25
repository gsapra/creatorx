import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Type, Sparkles, Loader, Clock, Trash2, X, TrendingUp, Target, Zap, RefreshCw, Copy, Check, AlertCircle, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePersonas } from '../contexts/PersonaContext'
import { apiPost } from '../services/api'
import { apiUrl } from '../config'
import AIModelSelector from '../components/AIModelSelector'

interface TitleFormula {
  id: string
  name: string
  description: string
  example: string
  category: string
}

const TITLE_FORMULAS: TitleFormula[] = [
  {
    id: 'curiosity-gap',
    name: 'Curiosity Gap',
    description: 'Creates intrigue by revealing surprising results',
    example: 'I Tried [Action] for [Time] and [Unexpected Result]',
    category: 'engagement'
  },
  {
    id: 'numbered-list',
    name: 'Numbered List',
    description: 'Clear value proposition with specific count',
    example: '[Number] [Things] That [Benefit/Result]',
    category: 'clarity'
  },
  {
    id: 'how-to',
    name: 'How-To Formula',
    description: 'Direct instruction with time/cost qualifier',
    example: 'How [Audience] Can [Result] in [Time/Cost]',
    category: 'educational'
  },
  {
    id: 'controversial',
    name: 'Controversial Take',
    description: 'Bold statement that challenges common beliefs',
    example: 'Why [Popular Thing] is Actually [Opposite Opinion]',
    category: 'engagement'
  },
  {
    id: 'transformation',
    name: 'Before/After',
    description: 'Shows dramatic change or growth',
    example: 'From [Starting Point] to [Result] in [Time]',
    category: 'results'
  },
  {
    id: 'listicle-shock',
    name: 'Listicle + Shock',
    description: 'List with unexpected revelation',
    example: '[Number] [Things] That [Outcome] (#X Will Shock You)',
    category: 'engagement'
  }
]

interface HistoryItem {
  id: string
  topic: string
  titles: TitleWithScore[]
  timestamp: Date
  formData: {
    topic: string
    keywords: string
    count: number
    audiencePersonaId: string
    ai_model?: string
    selectedFormulas?: string[]
    tone?: string
    platform?: string
  }
}

interface TitleWithScore {
  text: string
  score: number
  analysis: {
    length: number
    hasNumber: boolean
    hasPowerWords: boolean
    hasEmotionalTrigger: boolean
    keywordMatch: boolean
  }
}

export default function TitleGeneratorPage() {
  const { getAudiencePersonas } = usePersonas()
  const [formData, setFormData] = useState({
    topic: '',
    keywords: '',
    count: 10,
    audiencePersonaId: '',
    ai_model: 'openai',
    selectedFormulas: [] as string[],
    tone: 'engaging',
    platform: 'youtube'
  })
  const [titles, setTitles] = useState<TitleWithScore[]>([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showFormulas, setShowFormulas] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [suggestingKeywords, setSuggestingKeywords] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [regenerateFeedback, setRegenerateFeedback] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Analyze title quality - MUST BE DEFINED BEFORE useEffect
  const analyzeTitleQuality = (title: string, keywords: string[] = []) => {
    const length = title.length
    const hasNumber = /\d+/.test(title)
    const powerWords = ['secret', 'proven', 'ultimate', 'best', 'insane', 'shocking', 'guaranteed', 'simple', 'easy', 'fast']
    const hasPowerWords = powerWords.some(word => title.toLowerCase().includes(word))
    const emotionalWords = ['amazing', 'incredible', 'devastating', 'shocking', 'life-changing', 'mindblowing']
    const hasEmotionalTrigger = emotionalWords.some(word => title.toLowerCase().includes(word))
    const keywordMatch = keywords.length > 0 ? keywords.some(kw => title.toLowerCase().includes(kw.toLowerCase())) : false

    // Calculate score (0-100)
    let score = 50 // Base score
    if (length >= 40 && length <= 70) score += 20 // Optimal length
    else if (length > 70) score -= 15 // Too long
    if (hasNumber) score += 10
    if (hasPowerWords) score += 10
    if (hasEmotionalTrigger) score += 5
    if (keywordMatch) score += 10
    if (title.includes('|') || title.includes(':')) score += 5 // Structure

    return {
      score: Math.min(100, Math.max(0, score)),
      analysis: {
        length,
        hasNumber,
        hasPowerWords,
        hasEmotionalTrigger,
        keywordMatch
      }
    }
  }

  // Load history from backend
  useEffect(() => {
    const loadHistory = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setHistory([])
        return
      }

      try {
        const response = await fetch(apiUrl('/api/v1/content?content_type=title&limit=50'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const backendContent = await response.json()
          const backendHistory: HistoryItem[] = backendContent
            .filter((item: any) => item.content_text && item.meta_data?.titles)
            .map((item: any) => ({
              id: item.id.toString(),
              topic: item.meta_data?.topic || item.title?.replace('Titles for: ', '') || 'Untitled',
              titles: (item.meta_data?.titles || []).map((t: string) => ({
                text: t,
                ...analyzeTitleQuality(t, item.meta_data?.keywords || [])
              })),
              timestamp: new Date(item.created_at),
              formData: {
                topic: item.meta_data?.topic || '',
                keywords: item.meta_data?.keywords?.join(', ') || '',
                count: item.meta_data?.count || 10,
                audiencePersonaId: item.persona_id?.toString() || '',
                ai_model: item.meta_data?.ai_model || 'openai'
              }
            }))
            .sort((a: HistoryItem, b: HistoryItem) => b.timestamp.getTime() - a.timestamp.getTime())

          setHistory(backendHistory)
        }
      } catch (error) {
        console.error('[Title History] Failed to fetch from backend:', error)
      }
    }

    loadHistory()
  }, [])

  const suggestKeywords = async () => {
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic first')
      return
    }

    setSuggestingKeywords(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(apiUrl('/api/v1/creator-tools/generate-titles'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          video_topic: formData.topic,
          count: 3,
          ai_model: 'openai'
        })
      })

      if (response.ok) {
        const data = await response.json()
        const generatedTitles = data.meta_data?.titles || []

        // Extract common words from generated titles (excluding stop words)
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be', 'this', 'that', 'these', 'those', 'how', 'what', 'when', 'where', 'why', 'who']
        const words = generatedTitles.join(' ')
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length > 3 && !stopWords.includes(w))

        const wordFreq: { [key: string]: number } = {}
        words.forEach((w: string) => {
          wordFreq[w] = (wordFreq[w] || 0) + 1
        })

        const topKeywords = Object.entries(wordFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([word]) => word)

        setFormData({ ...formData, keywords: topKeywords.join(', ') })
        toast.success('Keywords suggested!')
      }
    } catch (error) {
      console.error('Keyword suggestion error:', error)
      toast.error('Failed to suggest keywords')
    } finally {
      setSuggestingKeywords(false)
    }
  }

  const handleGenerate = async () => {
    if (!formData.topic) {
      toast.error('Please enter a topic')
      return
    }

    setLoading(true)

    try {
      const requestBody: any = {
        video_topic: formData.topic,
        count: formData.count,
        ai_model: formData.ai_model
      }

      // Add keywords if provided
      if (formData.keywords?.trim()) {
        requestBody.keywords = formData.keywords.split(',').map(k => k.trim()).filter(k => k)
      }

      // Add persona if selected
      if (formData.audiencePersonaId) {
        requestBody.persona_id = parseInt(formData.audiencePersonaId)
      }

      // Add formula hints if selected
      if (formData.selectedFormulas && formData.selectedFormulas.length > 0) {
        const formulaExamples = formData.selectedFormulas
          .map(id => TITLE_FORMULAS.find(f => f.id === id)?.example)
          .filter(Boolean)
        requestBody.formula_hints = formulaExamples
      }

      // Add tone and platform context
      requestBody.tone = formData.tone || 'engaging'
      requestBody.platform = formData.platform || 'youtube'

      const response = await apiPost('/api/v1/creator-tools/generate-titles', requestBody)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (Array.isArray(errorData.detail)) {
          const errorMsg = errorData.detail.map((err: any) => err.msg).join(', ')
          throw new Error(errorMsg || 'Failed to generate titles')
        }
        throw new Error(errorData.detail || 'Failed to generate titles')
      }

      const data = await response.json()
      const generatedTitles = data.meta_data?.titles || []
      const keywords = formData.keywords.split(',').map(k => k.trim()).filter(k => k)

      // Analyze each title
      const titlesWithScores = generatedTitles.map((t: string) => ({
        text: t,
        ...analyzeTitleQuality(t, keywords)
      }))

      setTitles(titlesWithScores)

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: data.id?.toString() || Date.now().toString(),
        topic: formData.topic,
        titles: titlesWithScores,
        timestamp: new Date(),
        formData: { ...formData }
      }
      setHistory([newHistoryItem, ...history])

      toast.success('Titles generated successfully!')
    } catch (error) {
      console.error('Title generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate titles'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const regenerateTitles = async () => {
    if (!regenerateFeedback.trim()) {
      toast.error('Please provide feedback for regeneration')
      return
    }

    setRegenerating(true)

    try {
      const requestBody: any = {
        video_topic: `${formData.topic}\n\nUSER FEEDBACK: ${regenerateFeedback}`,
        count: formData.count,
        ai_model: formData.ai_model,
        temperature: 0.9 // Higher temperature for more variation
      }

      if (formData.keywords?.trim()) {
        requestBody.keywords = formData.keywords.split(',').map(k => k.trim()).filter(k => k)
      }

      if (formData.audiencePersonaId) {
        requestBody.persona_id = parseInt(formData.audiencePersonaId)
      }

      const response = await apiPost('/api/v1/creator-tools/generate-titles', requestBody)

      if (!response.ok) {
        throw new Error('Failed to regenerate titles')
      }

      const data = await response.json()
      const generatedTitles = data.meta_data?.titles || []
      const keywords = formData.keywords.split(',').map(k => k.trim()).filter(k => k)

      const titlesWithScores = generatedTitles.map((t: string) => ({
        text: t,
        ...analyzeTitleQuality(t, keywords)
      }))

      setTitles(titlesWithScores)
      setShowRegenerateModal(false)
      setRegenerateFeedback('')

      toast.success('Titles regenerated!')
    } catch (error) {
      console.error('Regeneration error:', error)
      toast.error('Failed to regenerate titles')
    } finally {
      setRegenerating(false)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    // Ensure all fields have defaults for backward compatibility
    setFormData({
      ...item.formData,
      ai_model: item.formData.ai_model || 'vertex',
      selectedFormulas: item.formData.selectedFormulas || [],
      tone: item.formData.tone || 'engaging',
      platform: item.formData.platform || 'youtube'
    })
    setTitles(item.titles)
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
      toast.success('Titles deleted')
    } catch (error) {
      console.error('Failed to delete history item:', error)
      toast.error('Failed to delete titles')
    } finally {
      setDeletingId(null)
      setDeleteConfirm(null)
    }
  }

  const copyTitle = (title: string, index: number) => {
    navigator.clipboard.writeText(title)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
    toast.success('Copied!')
  }

  const copyAllTitles = () => {
    const allTitles = titles.map(t => t.text).join('\n')
    navigator.clipboard.writeText(allTitles)
    toast.success('All titles copied!')
  }

  const toggleFormula = (formulaId: string) => {
    const current = formData.selectedFormulas || []
    const updated = current.includes(formulaId)
      ? current.filter(id => id !== formulaId)
      : [...current, formulaId]
    setFormData({ ...formData, selectedFormulas: updated })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getLengthColor = (length: number) => {
    if (length <= 60) return 'text-green-600'
    if (length <= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Type className="w-8 h-8 text-pink-600" />
            <h1 className="text-3xl font-bold text-gray-900">Title Generator</h1>
          </div>
          <div className="flex items-center space-x-3">
            {titles.length > 0 && (
              <button
                onClick={() => setTitles([])}
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
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
                  <h3 className="font-bold text-gray-900 text-lg">Title History</h3>
                  <p className="text-sm text-gray-600 mt-1">{history.length} saved title sets</p>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="divide-y divide-gray-100">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="group relative hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all"
                      >
                        <div
                          onClick={() => loadFromHistory(item)}
                          className="p-5 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="font-semibold text-gray-900 group-hover:text-pink-700 transition-colors mb-2">
                                {item.topic}
                              </h4>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                                <span className="px-2 py-1 bg-gray-100 rounded-full">
                                  {item.titles.length} titles
                                </span>
                                {item.titles.length > 0 && item.titles[0]?.score !== undefined && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                    Avg Score: {Math.round(item.titles.reduce((sum, t) => sum + (t.score || 0), 0) / item.titles.length)}
                                  </span>
                                )}
                                {item.formData.keywords && (
                                  <span className="px-2 py-1 bg-gray-100 rounded-full">
                                    🔑 {item.formData.keywords}
                                  </span>
                                )}
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
                              title="Delete titles"
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
                              <p className="text-sm font-medium text-gray-900 mb-3">Delete these titles?</p>
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mb-4">
                  <Clock className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No title history yet</h3>
                <p className="text-sm text-gray-600">Generate your first titles to see them here</p>
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
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                <Type className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Viral Titles</h2>
              <p className="text-gray-600 text-sm">Generate high-CTR titles optimized for maximum engagement</p>
            </div>

            {/* Video Topic */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                What's your video about? *
              </label>
              <p className="text-xs text-gray-600 mb-3">
                💡 Be specific! Better topics lead to better titles
              </p>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400"
                placeholder="e.g., How to Edit Videos 10x Faster"
              />
            </div>

            {/* Target Audience Persona */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Who's your target audience?
              </label>
              <p className="text-xs text-gray-600 mb-3">
                🎯 Use a saved persona for audience-specific titles
              </p>
              <select
                value={formData.audiencePersonaId}
                onChange={(e) => setFormData({ ...formData, audiencePersonaId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0 transition-colors text-gray-900 bg-white"
              >
                <option value="">General audience (no persona)</option>
                {getAudiencePersonas().map(persona => (
                  <option key={persona.id} value={persona.id}>{persona.name}</option>
                ))}
              </select>
            </div>

            {/* Keywords with Smart Suggestions */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Target Keywords (optional)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                🔑 Add keywords for SEO optimization
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="e.g., video editing, productivity, tutorials"
                />
                <button
                  onClick={suggestKeywords}
                  disabled={suggestingKeywords || !formData.topic}
                  className="px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-medium hover:from-pink-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  {suggestingKeywords ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">Suggest</span>
                </button>
              </div>
            </div>

            {/* Title Formulas (Collapsible) */}
            <div>
              <button
                onClick={() => setShowFormulas(!showFormulas)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border-2 border-pink-100 hover:border-pink-200 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-pink-600" />
                  <span className="font-semibold text-gray-900">Title Formulas (Optional)</span>
                  {formData.selectedFormulas && formData.selectedFormulas.length > 0 && (
                    <span className="px-2 py-0.5 bg-pink-600 text-white text-xs rounded-full">
                      {formData.selectedFormulas.length} selected
                    </span>
                  )}
                </div>
                {showFormulas ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {showFormulas && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TITLE_FORMULAS.map(formula => (
                    <div
                      key={formula.id}
                      onClick={() => toggleFormula(formula.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.selectedFormulas?.includes(formula.id)
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{formula.name}</h4>
                        {formData.selectedFormulas?.includes(formula.id) && (
                          <Check className="w-4 h-4 text-pink-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{formula.description}</p>
                      <p className="text-xs text-pink-700 italic">{formula.example}</p>
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
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition-colors text-gray-900 bg-white"
                    >
                      <option value="engaging">✨ Engaging & Energetic</option>
                      <option value="professional">💼 Professional & Polished</option>
                      <option value="casual">😊 Casual & Friendly</option>
                      <option value="educational">🎓 Educational & Informative</option>
                      <option value="clickbait">🔥 Clickbait (High CTR)</option>
                    </select>
                  </div>

                  {/* Platform */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Platform
                    </label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-0 transition-colors text-gray-900 bg-white"
                    >
                      <option value="youtube">📺 YouTube</option>
                      <option value="blog">📝 Blog Post</option>
                      <option value="social">📱 Social Media</option>
                      <option value="podcast">🎙️ Podcast</option>
                    </select>
                  </div>

                  {/* Number of Titles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Titles: {formData.count}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={formData.count}
                      onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${((formData.count - 5) / 15) * 100}%, #e5e7eb ${((formData.count - 5) / 15) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5</span>
                      <span>20</span>
                    </div>
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
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating titles...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Titles</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Titles */}
          {titles.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Generated Titles</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyAllTitles}
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
              <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">
                    {Math.round(titles.reduce((sum, t) => sum + t.score, 0) / titles.length)}
                  </div>
                  <div className="text-xs text-gray-600">Avg Quality Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {titles.filter(t => t.score >= 80).length}
                  </div>
                  <div className="text-xs text-gray-600">Excellent Titles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(titles.reduce((sum, t) => sum + t.analysis.length, 0) / titles.length)}
                  </div>
                  <div className="text-xs text-gray-600">Avg Characters</div>
                </div>
              </div>

              {/* Titles List */}
              <div className="space-y-3">
                {titles
                  .sort((a, b) => b.score - a.score)
                  .map((title, index) => (
                    <div
                      key={index}
                      className="group p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border-2 border-gray-200 hover:border-pink-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 pr-4">
                          <div className="font-semibold text-gray-900 mb-2">{title.text}</div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className={`px-2 py-1 rounded-full font-medium ${getScoreColor(title.score)}`}>
                              Score: {title.score}/100
                            </span>
                            <span className={`px-2 py-1 bg-gray-100 rounded-full ${getLengthColor(title.analysis.length)}`}>
                              {title.analysis.length} chars
                            </span>
                            {title.analysis.hasNumber && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                ✓ Number
                              </span>
                            )}
                            {title.analysis.hasPowerWords && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                ✓ Power Words
                              </span>
                            )}
                            {title.analysis.hasEmotionalTrigger && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                ✓ Emotional
                              </span>
                            )}
                            {title.analysis.keywordMatch && (
                              <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full">
                                ✓ Keywords
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => copyTitle(title.text, index)}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Character limit warning */}
                      {title.analysis.length > 70 && (
                        <div className="flex items-start space-x-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>Title may be truncated on mobile ({title.analysis.length - 70} chars over limit)</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* CTR Tips */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Tips for Higher CTR</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Keep titles under 60 characters for best mobile display</li>
                      <li>• Use numbers and power words to grab attention</li>
                      <li>• Create curiosity gaps without clickbait</li>
                      <li>• Test multiple titles with your audience</li>
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
                  <RefreshCw className="w-5 h-5 text-pink-600" />
                  <h3 className="text-lg font-bold text-gray-900">Refine Your Titles</h3>
                </div>
                <button
                  onClick={() => setShowRegenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Tell the AI how to improve your titles. Be specific about what you want changed.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback / Instructions
                </label>
                <textarea
                  value={regenerateFeedback}
                  onChange={(e) => setRegenerateFeedback(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0 transition-colors min-h-[120px]"
                  placeholder="e.g., Make titles shorter, Add more curiosity gaps, Focus on specific benefits, Less clickbait-y..."
                />
              </div>

              {/* Quick feedback suggestions */}
              <div className="mb-6">
                <p className="text-xs text-gray-600 mb-2">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Make them shorter',
                    'More specific numbers',
                    'Less clickbait',
                    'More professional',
                    'Add curiosity gaps',
                    'Include year (2026)',
                    'Focus on benefits',
                    'More urgent tone'
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setRegenerateFeedback(suggestion)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-pink-100 text-gray-700 hover:text-pink-700 rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={regenerateTitles}
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
                      <span>Regenerate Titles</span>
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
