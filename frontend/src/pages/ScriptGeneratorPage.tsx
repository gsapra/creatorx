import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { FileText, Sparkles, Loader, Clock, Trash2, Download, X, Share2, Copy, Check, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePersonas } from '../contexts/PersonaContext'

interface HistoryItem {
  id: string
  topic: string
  script: string
  timestamp: Date
  share_token?: string
  is_public?: boolean
  parent_content_id?: string
  version_number?: number
  regeneration_feedback?: string
  formData: {
    topic: string
    duration: number
    tone: string
    targetAudience: string
    keyPoints: string
    scriptFlow: string
    style: string
    audiencePersonaId: string
    scriptPersonaId: string
  }
}

interface ScriptAnalytics {
  wordCount: number
  readTimeMinutes: number
  estimatedSpeakingTime: string
}

export default function ScriptGeneratorPage() {
  const { getAudiencePersonas, getScriptPersonas } = usePersonas()
  const [formData, setFormData] = useState({
    topic: '',
    duration: 10,
    tone: 'engaging',
    targetAudience: '',
    keyPoints: '',
    scriptFlow: '',
    style: '',
    audiencePersonaId: '',
    scriptPersonaId: ''
  })
  const [generatedScript, setGeneratedScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [clearAllConfirm, setClearAllConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [currentContentId, setCurrentContentId] = useState<string | null>(null)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [sharingId, setSharingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [regenerateFeedback, setRegenerateFeedback] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [analytics, setAnalytics] = useState<ScriptAnalytics | null>(null)

  // Helper to get user-specific localStorage key
  const getUserStorageKey = () => {
    const token = localStorage.getItem('token')
    if (!token) return null
    // Extract user info from token (simple base64 decode)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return `scriptHistory_${payload.sub || payload.user_id}`
    } catch {
      return 'scriptHistory_default'
    }
  }

  // Load history from backend (primary source of truth)
  useEffect(() => {
    const loadHistory = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setHistory([])
        return
      }

      console.log('[Script History] Loading history...')
      
      try {
        const response = await fetch('http://localhost:8000/api/v1/content?content_type=script&limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const backendContent = await response.json()
          console.log('[Script History] Backend response:', backendContent.length, 'items')
          const backendHistory: HistoryItem[] = backendContent
            .filter((item: any) => item.content_text)
            .map((item: any) => ({
              id: item.id.toString(),
              topic: item.meta_data?.topic || item.title?.replace('Script: ', '') || 'Untitled Script',
              script: item.content_text,
              timestamp: new Date(item.created_at),
              share_token: item.share_token,
              is_public: item.is_public,
              parent_content_id: item.meta_data?.parent_content_id,
              version_number: item.meta_data?.version_number || 1,
              regeneration_feedback: item.meta_data?.regeneration_feedback,
              formData: {
                topic: item.meta_data?.topic || '',
                duration: item.meta_data?.duration_minutes || 10,
                tone: item.meta_data?.tone || 'engaging',
                targetAudience: item.meta_data?.target_audience || '',
                keyPoints: '',
                scriptFlow: '',
                style: '',
                audiencePersonaId: item.persona_id?.toString() || '',
                scriptPersonaId: ''
              }
            }))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

          setHistory(backendHistory)
          
          // Cache in user-specific localStorage for quick access
          const storageKey = getUserStorageKey()
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(backendHistory))
          }
        } else if (response.status === 401) {
          console.log('[Script History] Unauthorized, clearing history')
          setHistory([])
        } else {
          console.error('[Script History] Backend request failed:', response.status)
          // Try to load from cache
          const storageKey = getUserStorageKey()
          if (storageKey) {
            const cached = localStorage.getItem(storageKey)
            if (cached) {
              const parsed = JSON.parse(cached).map((item: any) => ({
                ...item,
                timestamp: new Date(item.timestamp)
              }))
              setHistory(parsed)
            }
          }
        }
      } catch (error) {
        console.error('[Script History] Failed to fetch from backend:', error)
        // Try to load from cache
        const storageKey = getUserStorageKey()
        if (storageKey) {
          try {
            const cached = localStorage.getItem(storageKey)
            if (cached) {
              const parsed = JSON.parse(cached).map((item: any) => ({
                ...item,
                timestamp: new Date(item.timestamp)
              }))
              setHistory(parsed)
            }
          } catch (e) {
            console.error('[Script History] Failed to load cache:', e)
          }
        }
      }
    }

    loadHistory()
  }, [])

  // Save history to user-specific localStorage whenever it changes
  useEffect(() => {
    const storageKey = getUserStorageKey()
    if (storageKey && history.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(history))
    }
  }, [history])

  const handleGenerate = async () => {
    if (!formData.topic) {
      toast.error('Please enter a topic')
      return
    }

    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please log in to generate scripts')
      window.location.href = '/login'
      return
    }

    setLoading(true)

    try {
      // Prepare API request
      const requestBody = {
        topic: formData.topic,
        duration_minutes: formData.duration,
        tone: formData.tone,
        target_audience: formData.targetAudience,
        key_points: formData.keyPoints ? formData.keyPoints.split(',').map(p => p.trim()).filter(p => p) : [],
        script_flow: formData.scriptFlow || null,
        style: formData.style || null,
        persona_id: formData.scriptPersonaId ? parseInt(formData.scriptPersonaId) : (formData.audiencePersonaId ? parseInt(formData.audiencePersonaId) : null),
        ai_model: 'openai'
      }

      // Call the actual API
      const response = await fetch('http://localhost:8000/api/v1/creator-tools/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.status === 401) {
        toast.error('Your session has expired. Please log in again.')
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || 'Failed to generate script')
      }

      const data = await response.json()
      console.log('[Script Generation] Success! Backend response:', data)
      
      // Handle different possible response structures
      const generatedScript = data.content_text || data.script || data.content || ''
      
      if (!generatedScript) {
        console.error('[Script Generation] No script content in response:', data)
        throw new Error('Script generation returned empty content')
      }
      
      setGeneratedScript(generatedScript)
      
      // Calculate analytics
      calculateAnalytics(generatedScript)
      
      // Add to history with proper backend ID
      const newHistoryItem: HistoryItem = {
        id: data.id.toString(),
        topic: formData.topic,
        script: generatedScript,
        timestamp: new Date(),
        share_token: data.share_token,
        is_public: data.is_public,
        versions: [],
        formData: { ...formData }
      }
      
      console.log('[Script Generation] Adding to history:', newHistoryItem)
      setHistory([newHistoryItem, ...history])
      setCurrentContentId(data.id.toString())
      setScriptVersions([])
      
      toast.success('Script generated successfully!')
    } catch (error) {
      console.error('Script generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate script. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    setFormData(item.formData)
    setGeneratedScript(item.script)
    setCurrentContentId(item.id)
    setShareToken(item.is_public ? item.share_token || null : null)
    setShowHistory(false)
    toast.success('Loaded from history')
  }

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(id)
    
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // Delete from backend
        const response = await fetch(`http://localhost:8000/api/v1/content/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok && response.status !== 404) {
          throw new Error('Failed to delete from server')
        }
      }

      // Update local state
      const newHistory = history.filter(item => item.id !== id)
      setHistory(newHistory)
      
      // Update localStorage
      const storageKey = getUserStorageKey()
      if (storageKey) {
        if (newHistory.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(newHistory))
        } else {
          localStorage.removeItem(storageKey)
        }
      }
      
      toast.success('Script deleted')
    } catch (error) {
      console.error('Failed to delete history item:', error)
      toast.error('Failed to delete script')
    } finally {
      setDeletingId(null)
      setDeleteConfirm(null)
    }
  }

  const clearAllHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // Delete all script content from backend
        const deletePromises = history.map(item => 
          fetch(`http://localhost:8000/api/v1/content/${item.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).catch(err => console.error('Failed to delete item:', item.id, err))
        )
        
        await Promise.all(deletePromises)
      }

      // Clear local state and storage
      setHistory([])
      const storageKey = getUserStorageKey()
      if (storageKey) {
        localStorage.removeItem(storageKey)
      }
      
      toast.success('All history cleared')
    } catch (error) {
      console.error('Failed to clear history:', error)
      toast.error('Failed to clear all history')
    } finally {
      setClearAllConfirm(false)
    }
  }

  const downloadScript = () => {
    if (!generatedScript) return
    
    const blob = new Blob([generatedScript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `script-${formData.topic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Script downloaded!')
  }

  const generateShareLink = async (contentId?: string) => {
    const idToShare = contentId || currentContentId
    if (!idToShare) {
      toast.error('Please generate a script first')
      return
    }

    setSharingId(idToShare)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/v1/content/${idToShare}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to generate share link')

      const data = await response.json()
      const shareUrl = `${window.location.origin}/shared/${data.share_token}`
      
      setShareToken(data.share_token)
      
      // Update history item
      setHistory(prev => prev.map(item => 
        item.id === idToShare 
          ? { ...item, share_token: data.share_token, is_public: true }
          : item
      ))

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard!')
    } catch (error) {
      console.error('Failed to generate share link:', error)
      toast.error('Failed to generate share link')
    } finally {
      setSharingId(null)
    }
  }

  const copyToClipboard = async () => {
    if (!generatedScript) return
    
    try {
      await navigator.clipboard.writeText(generatedScript)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const startNewScript = () => {
    setGeneratedScript('')
    setCurrentContentId(null)
    setShareToken(null)
    setAnalytics(null)
    setFormData({
      topic: '',
      duration: 10,
      tone: 'engaging',
      targetAudience: '',
      keyPoints: '',
      scriptFlow: '',
      style: '',
      audiencePersonaId: '',
      scriptPersonaId: ''
    })
    toast.success('Ready for a new script!')
  }

  const calculateAnalytics = (script: string) => {
    const words = script.trim().split(/\s+/).filter(w => w.length > 0)
    const wordCount = words.length
    const readTimeMinutes = Math.ceil(wordCount / 150) // Average reading speed
    const speakingTimeMinutes = Math.ceil(wordCount / 150) // Average speaking speed
    
    const minutes = Math.floor(speakingTimeMinutes)
    const seconds = Math.round((speakingTimeMinutes - minutes) * 60)
    
    setAnalytics({
      wordCount,
      readTimeMinutes,
      estimatedSpeakingTime: `${minutes}:${seconds.toString().padStart(2, '0')}`
    })
  }

  const regenerateWithFeedback = async () => {
    if (!regenerateFeedback.trim()) {
      toast.error('Please provide feedback for regeneration')
      return
    }

    if (!generatedScript) {
      toast.error('No script to regenerate')
      return
    }

    setRegenerating(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in')
        return
      }

      // Get current version number from the currently loaded script
      const currentItem = history.find(h => h.id === currentContentId)
      const currentVersionNum = currentItem?.version_number || 1
      const originalParentId = currentItem?.parent_content_id || currentContentId

      // Prepare regeneration request with version tracking
      const requestBody = {
        topic: formData.topic,
        duration_minutes: formData.duration,
        tone: formData.tone,
        target_audience: formData.targetAudience,
        key_points: formData.keyPoints ? formData.keyPoints.split(',').map(p => p.trim()).filter(p => p) : [],
        script_flow: formData.scriptFlow || null,
        style: formData.style || null,
        persona_id: formData.scriptPersonaId ? parseInt(formData.scriptPersonaId) : (formData.audiencePersonaId ? parseInt(formData.audiencePersonaId) : null),
        ai_model: 'openai',
        regenerate_feedback: regenerateFeedback,
        previous_script: generatedScript,
        parent_content_id: originalParentId || currentContentId,
        version_number: currentVersionNum + 1
      }

      const response = await fetch('http://localhost:8000/api/v1/creator-tools/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate script')
      }

      const data = await response.json()
      const newScript = data.content_text || data.script || data.content || ''
      
      setGeneratedScript(newScript)
      calculateAnalytics(newScript)
      
      // Add regenerated script as new history item
      const newHistoryItem: HistoryItem = {
        id: data.id.toString(),
        topic: formData.topic,
        script: newScript,
        timestamp: new Date(),
        share_token: data.share_token,
        is_public: data.is_public,
        parent_content_id: originalParentId || currentContentId,
        version_number: currentVersionNum + 1,
        regeneration_feedback: regenerateFeedback,
        formData: { ...formData }
      }
      
      setHistory([newHistoryItem, ...history])
      setCurrentContentId(data.id.toString())
      setShareToken(null) // Clear share token since it's a new version
      setRegenerateFeedback('')
      setShowRegenerateModal(false)
      
      toast.success(`Refined script created! (v${currentVersionNum + 1})`)
    } catch (error) {
      console.error('Regeneration error:', error)
      toast.error('Failed to regenerate script')
    } finally {
      setRegenerating(false)
    }
  }



  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Script Generator</h1>
          </div>
          <div className="flex items-center space-x-3">
            {generatedScript && (
              <button
                onClick={startNewScript}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg transition-colors hover:from-purple-700 hover:to-pink-700 font-medium"
              >
                <Sparkles className="w-5 h-5" />
                <span>New Script</span>
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
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Script History</h3>
                    <p className="text-sm text-gray-600 mt-1">{history.length} saved scripts</p>
                  </div>
                  <button
                    onClick={() => setClearAllConfirm(true)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  <div className="divide-y divide-gray-100">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="group relative hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all"
                      >
                        <div
                          onClick={() => loadFromHistory(item)}
                          className="p-5 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                  {item.topic}
                                </h4>
                                {item.version_number && item.version_number > 1 && (
                                  <span className="px-2 py-0.5 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 text-xs font-semibold rounded-full">
                                    v{item.version_number}
                                  </span>
                                )}
                              </div>
                              {item.regeneration_feedback && (
                                <div className="text-xs text-gray-600 mb-2 italic">
                                  ↻ {item.regeneration_feedback}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                <span className="px-2 py-1 bg-gray-100 rounded-full">
                                  ⏱️ {item.formData.duration} min
                                </span>
                                <span className="px-2 py-1 bg-gray-100 rounded-full">
                                  🎭 {item.formData.tone}
                                </span>
                                {item.formData.targetAudience && (
                                  <span className="px-2 py-1 bg-gray-100 rounded-full">
                                    👥 {item.formData.targetAudience}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                📅 {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                              </div>
                              {item.is_public && item.share_token && (
                                <div className="mt-2 flex items-center space-x-1 text-xs text-blue-600">
                                  <Share2 className="w-3 h-3" />
                                  <span>Publicly shared</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col space-y-2">
                              {item.is_public && item.share_token ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(`${window.location.origin}/shared/${item.share_token}`)
                                    toast.success('Share link copied!')
                                  }}
                                  className="flex-shrink-0 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Copy share link"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    generateShareLink(item.id)
                                  }}
                                  disabled={sharingId === item.id}
                                  className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Generate share link"
                                >
                                  {sharingId === item.id ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Share2 className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteConfirm(item.id)
                                }}
                                disabled={deletingId === item.id}
                                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete script"
                              >
                                {deletingId === item.id ? (
                                  <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Delete confirmation for individual item */}
                        {deleteConfirm === item.id && (
                          <div className="absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-10">
                            <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 max-w-sm mx-4">
                              <p className="text-sm font-medium text-gray-900 mb-3">Delete this script?</p>
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No script history yet</h3>
                <p className="text-sm text-gray-600">Generate your first script to see it here</p>
              </div>
            )}
          </div>
        )}

        {/* Clear all confirmation modal */}
        {clearAllConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Clear All History?</h3>
                <button
                  onClick={() => setClearAllConfirm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                This will permanently delete all {history.length} saved scripts from your history. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={clearAllHistory}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setClearAllConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Script Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Topic *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="input"
                placeholder="e.g., How to Start a YouTube Channel in 2026"
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
                <option value="">No persona (use manual input)</option>
                {getAudiencePersonas().map(persona => (
                  <option key={persona.id} value={persona.id}>{persona.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Select a persona or enter manually below</p>
            </div>

            {!formData.audiencePersonaId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience (Manual)
                </label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="input"
                  placeholder="e.g., Beginner content creators"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Script Style Persona
              </label>
              <select
                value={formData.scriptPersonaId}
                onChange={(e) => setFormData({ ...formData, scriptPersonaId: e.target.value })}
                className="input"
              >
                <option value="">No persona (use manual tone)</option>
                {getScriptPersonas().map(persona => (
                  <option key={persona.id} value={persona.id}>{persona.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Select a script style or choose tone manually</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="input"
                min="1"
                max="60"
              />
            </div>

            {!formData.scriptPersonaId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone (Manual)
                </label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="input"
                >
                  <option value="engaging">Engaging</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="educational">Educational</option>
                  <option value="entertaining">Entertaining</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Points (comma-separated)
              </label>
              <textarea
                value={formData.keyPoints}
                onChange={(e) => setFormData({ ...formData, keyPoints: e.target.value })}
                className="input min-h-[100px]"
                placeholder="Equipment needed, Content strategy, Monetization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Script Flow/Structure (optional)
              </label>
              <input
                type="text"
                value={formData.scriptFlow}
                onChange={(e) => setFormData({ ...formData, scriptFlow: e.target.value })}
                className="input"
                placeholder="e.g., Hook → Problem → Solution → How it works → Results → CTA"
              />
              <p className="text-xs text-gray-500 mt-1">Define the narrative flow for your script</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Style (optional)
              </label>
              <select
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                className="input"
              >
                <option value="">Auto (based on topic)</option>
                <option value="educational">Educational/Tutorial</option>
                <option value="storytelling">Storytelling</option>
                <option value="vlog-style">Vlog Style</option>
                <option value="documentary">Documentary</option>
                <option value="listicle">Listicle</option>
                <option value="case-study">Case Study</option>
                <option value="interview">Interview Format</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Choose the overall presentation style</p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Script</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Output */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Script</h2>

            {generatedScript ? (
              <div className="space-y-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-[600px] overflow-y-auto">
                  {generatedScript}
                </pre>
                
                {/* Quick Stats */}
                {analytics && (
                  <div className="flex items-center justify-center gap-6 py-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-purple-600">{analytics.wordCount}</span>
                      <span>words</span>
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-600">{analytics.estimatedSpeakingTime}</span>
                      <span>min speaking</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={downloadScript}
                    className="py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => generateShareLink()}
                    disabled={!!sharingId}
                    className="py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {sharingId ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Share2 className="w-5 h-5" />
                    )}
                    <span>Share</span>
                  </button>
                  <button
                    onClick={() => setShowRegenerateModal(true)}
                    className="py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Refine</span>
                  </button>
                </div>

                {shareToken && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Share2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-900 mb-1">Public Share Link</p>
                        <code className="text-xs text-blue-700 break-all block bg-white px-2 py-1 rounded">
                          {`${window.location.origin}/shared/${shareToken}`}
                        </code>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FileText className="w-16 h-16 mb-4" />
                <p>Your generated script will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Regenerate with Feedback Modal */}
        {showRegenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-900">Refine Your Script</h3>
                </div>
                <button
                  onClick={() => setShowRegenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Tell the AI how to improve your script. Be specific about what you want changed.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback / Instructions
                </label>
                <textarea
                  value={regenerateFeedback}
                  onChange={(e) => setRegenerateFeedback(e.target.value)}
                  className="input min-h-[120px]"
                  placeholder="e.g., Make it shorter and more energetic, Add more humor, Focus more on the benefits, Make the intro more catchy..."
                />
              </div>

              {/* Quick feedback suggestions */}
              <div className="mb-6">
                <p className="text-xs text-gray-600 mb-2">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Make it shorter',
                    'Add more humor',
                    'More professional tone',
                    'Simplify the language',
                    'Add more examples',
                    'Stronger call-to-action',
                    'More engaging intro',
                    'Add statistics/facts'
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setRegenerateFeedback(suggestion)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full transition-colors"
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
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {regenerating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Regenerate Script</span>
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
