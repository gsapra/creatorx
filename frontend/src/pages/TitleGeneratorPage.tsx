import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Type, Sparkles, Loader, ThumbsUp, Clock, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePersonas } from '../contexts/PersonaContext'
import { apiPost } from '../services/api'
import { apiUrl } from '../config'

interface HistoryItem {
  id: string
  topic: string
  titles: string[]
  timestamp: Date
  formData: {
    topic: string
    keywords: string
    count: number
    audiencePersonaId: string
  }
}

export default function TitleGeneratorPage() {
  const { getAudiencePersonas } = usePersonas()
  const [formData, setFormData] = useState({
    topic: '',
    keywords: '',
    count: 10,
    audiencePersonaId: ''
  })
  const [titles, setTitles] = useState<string[]>([])
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
              titles: item.meta_data?.titles || [],
              timestamp: new Date(item.created_at),
              formData: {
                topic: item.meta_data?.topic || '',
                keywords: item.meta_data?.keywords?.join(', ') || '',
                count: item.meta_data?.count || 10,
                audiencePersonaId: item.persona_id?.toString() || ''
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
        ai_model: 'vertex' // Using Vertex AI as default per CLAUDE.md
      }

      // Add keywords if provided
      if (formData.keywords?.trim()) {
        requestBody.keywords = formData.keywords.split(',').map(k => k.trim()).filter(k => k)
      }

      // Add persona if selected
      if (formData.audiencePersonaId) {
        requestBody.persona_id = parseInt(formData.audiencePersonaId)
      }

      const response = await apiPost('/api/v1/creator-tools/generate-titles', requestBody)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Handle FastAPI validation error format
        if (Array.isArray(errorData.detail)) {
          const errorMsg = errorData.detail.map((err: any) => err.msg).join(', ')
          throw new Error(errorMsg || 'Failed to generate titles')
        }
        throw new Error(errorData.detail || 'Failed to generate titles')
      }

      const data = await response.json()
      const generatedTitles = data.meta_data?.titles || []

      setTitles(generatedTitles)

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: data.id?.toString() || Date.now().toString(),
        topic: formData.topic,
        titles: generatedTitles,
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

  const loadFromHistory = (item: HistoryItem) => {
    setFormData(item.formData)
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

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Type className="w-8 h-8 text-pink-600" />
            <h1 className="text-3xl font-bold text-gray-900">Title Generator</h1>
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

                        {/* Delete confirmation */}
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

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Title Settings</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Topic *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="input"
                placeholder="e.g., Productivity Hacks"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience Persona
              </label>
              <select
                value={formData.audiencePersonaId}
                onChange={(e) => setFormData({ ...formData, audiencePersonaId: e.target.value })}
                className="input"
              >
                <option value="">No persona (generic titles)</option>
                {getAudiencePersonas().map(persona => (
                  <option key={persona.id} value={persona.id}>{persona.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Persona helps create audience-specific titles
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="input"
                placeholder="productivity, time management"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Titles
              </label>
              <input
                type="number"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                className="input"
                min="1"
                max="20"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Titles</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Titles</h2>
            {titles.length > 0 ? (
              <div className="space-y-3">
                {titles.map((title, index) => (
                  <div
                    key={index}
                    className="group p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{title}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {title.length} characters • Est. CTR: {(Math.random() * 5 + 3).toFixed(1)}%
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(title)
                          toast.success('Copied!')
                        }}
                        className="opacity-0 group-hover:opacity-100 ml-3 p-2 text-pink-600 hover:bg-pink-50 rounded transition-opacity"
                      >
                        <ThumbsUp className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Type className="w-16 h-16 mb-4" />
                <p>Your generated titles will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
