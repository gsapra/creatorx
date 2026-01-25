import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Share2, Sparkles, Loader, Clock, Instagram, Twitter, Youtube, Linkedin, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPost } from '../services/api'
import { apiUrl } from '../config'

interface HistoryItem {
  id: string
  platform: string
  content: string
  caption: string
  timestamp: Date
}

export default function SocialCaptionPage() {
  const [formData, setFormData] = useState({
    content: '',
    platform: 'instagram',
    includeHashtags: true,
    includeEmojis: true
  })
  const [caption, setCaption] = useState('')
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
        const response = await fetch(apiUrl('/api/v1/content?content_type=social_caption&limit=50'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const backendContent = await response.json()
          const backendHistory: HistoryItem[] = backendContent
            .filter((item: any) => item.content_text)
            .map((item: any) => ({
              id: item.id.toString(),
              platform: item.meta_data?.platform || 'instagram',
              content: item.meta_data?.content_description || item.title || 'Untitled',
              caption: item.content_text,
              timestamp: new Date(item.created_at)
            }))
            .sort((a: HistoryItem, b: HistoryItem) => b.timestamp.getTime() - a.timestamp.getTime())

          setHistory(backendHistory)
        }
      } catch (error) {
        console.error('[Social Caption History] Failed to fetch from backend:', error)
      }
    }

    loadHistory()
  }, [])

  const platforms = [
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'pink' },
    { value: 'twitter', label: 'Twitter', icon: Twitter, color: 'blue' },
    { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'red' },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'blue' }
  ]

  const handleGenerate = async () => {
    if (!formData.content) {
      toast.error('Please describe your content')
      return
    }

    setLoading(true)

    try {
      const requestBody = {
        content_description: formData.content,
        platform: formData.platform,
        include_hashtags: formData.includeHashtags,
        include_emojis: formData.includeEmojis,
        ai_model: 'vertex' // Using Vertex AI as default per CLAUDE.md
      }

      const response = await apiPost('/api/v1/creator-tools/generate-social-caption', requestBody)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // Handle FastAPI validation error format
        if (Array.isArray(errorData.detail)) {
          const errorMsg = errorData.detail.map((err: any) => err.msg).join(', ')
          throw new Error(errorMsg || 'Failed to generate caption')
        }
        throw new Error(errorData.detail || 'Failed to generate caption')
      }

      const data = await response.json()
      const generatedCaption = data.content_text || ''

      setCaption(generatedCaption)

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: data.id?.toString() || Date.now().toString(),
        platform: formData.platform,
        content: formData.content,
        caption: generatedCaption,
        timestamp: new Date()
      }
      setHistory([newHistoryItem, ...history])

      toast.success('Caption generated!')
    } catch (error) {
      console.error('Caption generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate caption'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    setFormData({
      ...formData,
      content: item.content,
      platform: item.platform
    })
    setCaption(item.caption)
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

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Share2 className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Social Media Captions</h1>
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
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-1">
                                  {getPlatformIcon(item.platform)}
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded capitalize">
                                    {item.platform}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-700 line-clamp-2 mb-2">
                                {item.caption}
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

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Caption Settings</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Platform *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {platforms.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <button
                      key={platform.value}
                      onClick={() => setFormData({ ...formData, platform: platform.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.platform === platform.value
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-xs font-semibold">{platform.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Description *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input min-h-[120px]"
                placeholder="Describe your content, video, or post..."
              />
            </div>

            <div className="space-y-3">
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
                  <span>Generate Caption</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Caption</h2>
            {caption ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[200px] whitespace-pre-wrap">
                  {caption}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(caption)
                      toast.success('Copied to clipboard!')
                    }}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Copy Caption
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
                <Share2 className="w-16 h-16 mb-4" />
                <p>Your generated caption will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
