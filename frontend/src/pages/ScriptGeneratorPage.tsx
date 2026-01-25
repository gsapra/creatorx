import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { FileText, Sparkles, Loader, Clock, Trash2, Download, X, Share2, Copy, Check, RefreshCw, Eye, Code, ChevronDown, ChevronRight, ZoomIn, ZoomOut, FileDown, Printer, List } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePersonas } from '../contexts/PersonaContext'
import { apiUrl } from '../config'
import { ScriptTemplate, SCRIPT_TEMPLATES } from '../components/ScriptTemplates'
import SmartKeyPointsManager, { KeyPoint } from '../components/SmartKeyPointsManager'
import AIModelSelector from '../components/AIModelSelector'
import SmartInputAssistant from '../components/SmartInputAssistant'

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
    keyPoints: KeyPoint[] | string  // Support both old and new format
    scriptFlow: string
    style: string
    audiencePersonaId: string
    scriptPersonaId: string
    ai_model?: string
  }
}

interface ScriptAnalytics {
  wordCount: number
  readTimeMinutes: number
  estimatedSpeakingTime: string
}

interface ScriptSection {
  id: string
  title: string
  timestamp: string
  content: string
  startTime: number // in seconds
  endTime: number // in seconds
}

export default function ScriptGeneratorPage() {
  const { getAudiencePersonas, getScriptPersonas } = usePersonas()
  const [formData, setFormData] = useState({
    topic: '',
    duration: 3,  // Default to 3 minutes (0-10 range)
    tone: 'engaging',
    targetAudience: '',
    keyPoints: [] as KeyPoint[],  // Changed from string to KeyPoint[]
    scriptFlow: '',
    style: '',
    audiencePersonaId: '',
    scriptPersonaId: '',
    ai_model: 'openai'  // Added AI model selection
  })
  const [generatedScript, setGeneratedScript] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptTemplate | null>(null)
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
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted')
  const [streamingEnabled, setStreamingEnabled] = useState(true)  // Enable streaming by default
  const [progressMessage, setProgressMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [fontSize, setFontSize] = useState(16) // Base font size in px
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [scriptSections, setScriptSections] = useState<ScriptSection[]>([])
  const [showNavigation, setShowNavigation] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const scriptContainerRef = useRef<HTMLDivElement>(null)

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
        const response = await fetch(apiUrl('/api/v1/content?content_type=script&limit=50'), {
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
                keyPoints: [],  // Changed from '' to []
                scriptFlow: '',
                style: '',
                audiencePersonaId: item.persona_id?.toString() || '',
                scriptPersonaId: '',
                ai_model: item.meta_data?.ai_model || 'openai'
              }
            }))
            .sort((a: HistoryItem, b: HistoryItem) => b.timestamp.getTime() - a.timestamp.getTime())

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

  // Handle template selection
  const handleTemplateSelect = (template: ScriptTemplate) => {
    const generateId = () => `kp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    setFormData({
      ...formData,
      scriptFlow: template.defaultFlow,
      style: template.style,
      tone: template.tone,
      duration: template.duration.min,
      keyPoints: template.suggestedKeyPoints.map((text) => ({
        id: generateId(),
        text,
        priority: 'should-have' as const
      }))
    })
    setSelectedTemplate(template)
    toast.success(`${template.name} template loaded!`)
  }

  const handleGenerateStreaming = async () => {
    if (!formData.topic) {
      toast.error('Please enter a topic')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please log in to generate scripts')
      window.location.href = '/login'
      return
    }

    setLoading(true)
    setIsStreaming(true)
    setGeneratedScript('')
    setProgressMessage('Initializing...')

    try {
      // Prepare request body
      const requestBody: any = {
        topic: formData.topic,
        duration_minutes: formData.duration,
        ai_model: formData.ai_model
      }

      if (formData.targetAudience?.trim()) {
        requestBody.target_audience = formData.targetAudience.trim()
      }

      if (formData.tone && !formData.scriptPersonaId) {
        requestBody.tone = formData.tone
      }

      if (formData.keyPoints && formData.keyPoints.length > 0) {
        const priorityPoints = formData.keyPoints
          .filter(p => p.priority === 'must-have' || p.priority === 'should-have')
          .map(p => p.text)
          .filter(text => text.trim())

        if (priorityPoints.length > 0) {
          requestBody.key_points = priorityPoints
        }
      }

      if (formData.scriptFlow?.trim()) {
        requestBody.script_flow = formData.scriptFlow.trim()
      }

      if (formData.style && formData.style !== '') {
        requestBody.style = formData.style
      }

      // Prioritize audience persona (more important for script quality)
      // If both are selected, audience takes priority and script tone is used as tone parameter
      if (formData.audiencePersonaId) {
        requestBody.persona_id = parseInt(formData.audiencePersonaId)
      } else if (formData.scriptPersonaId) {
        requestBody.persona_id = parseInt(formData.scriptPersonaId)
      }

      // Connect to streaming endpoint
      const response = await fetch(apiUrl('/api/v1/creator-tools/generate-script-stream'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('Failed to start script generation')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      let accumulatedScript = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'progress') {
                setProgressMessage(data.message)
              } else if (data.type === 'chunk') {
                accumulatedScript += data.content
                setGeneratedScript(accumulatedScript)
              } else if (data.type === 'complete') {
                setGeneratedScript(data.script)
                setCurrentContentId(data.id.toString())
                calculateAnalytics(data.script)

                // Add to history
                const newHistoryItem: HistoryItem = {
                  id: data.id.toString(),
                  topic: formData.topic,
                  script: data.script,
                  timestamp: new Date(),
                  formData: { ...formData }
                }
                setHistory([newHistoryItem, ...history])

                toast.success('Script generated successfully!')
                setProgressMessage('')
              } else if (data.type === 'error') {
                throw new Error(data.message)
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate script')
    } finally {
      setLoading(false)
      setIsStreaming(false)
      setProgressMessage('')
    }
  }

  const handleGenerate = async () => {
    // If streaming is enabled, use streaming endpoint
    if (streamingEnabled) {
      return handleGenerateStreaming()
    }

    // Otherwise use regular endpoint
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
      // Prepare API request with ONLY non-empty fields for better prompt accuracy
      const requestBody: any = {
        topic: formData.topic,
        duration_minutes: formData.duration,
        ai_model: formData.ai_model  // Use selected AI model
      }

      // Only add fields that have meaningful content
      if (formData.targetAudience?.trim()) {
        requestBody.target_audience = formData.targetAudience.trim()
      }

      if (formData.tone && !formData.scriptPersonaId) {
        requestBody.tone = formData.tone
      }

      // Handle new KeyPoint[] format - send only must-have and should-have points
      if (formData.keyPoints && formData.keyPoints.length > 0) {
        const priorityPoints = formData.keyPoints
          .filter(p => p.priority === 'must-have' || p.priority === 'should-have')
          .map(p => p.text)
          .filter(text => text.trim())

        if (priorityPoints.length > 0) {
          requestBody.key_points = priorityPoints
        }
      }
      
      if (formData.scriptFlow?.trim()) {
        requestBody.script_flow = formData.scriptFlow.trim()
      }
      
      if (formData.style && formData.style !== '') {
        requestBody.style = formData.style
      }
      
      // Prioritize audience persona (more important for script quality)
      // If both are selected, audience takes priority and script tone is used as tone parameter
      if (formData.audiencePersonaId) {
        requestBody.persona_id = parseInt(formData.audiencePersonaId)
      } else if (formData.scriptPersonaId) {
        requestBody.persona_id = parseInt(formData.scriptPersonaId)
      }

      // Call the actual API
      const response = await fetch(apiUrl('/api/v1/creator-tools/generate-script'), {
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
        parent_content_id: data.parent_content_id,
        version_number: data.version_number,
        formData: { ...formData }
      }
      
      console.log('[Script Generation] Adding to history:', newHistoryItem)
      setHistory([newHistoryItem, ...history])
      setCurrentContentId(data.id.toString())
      
      toast.success('Script generated successfully!')
    } catch (error) {
      console.error('Script generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate script. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    // Convert old string format to new KeyPoint[] format if needed
    const formDataToLoad = { ...item.formData }

    if (typeof formDataToLoad.keyPoints === 'string') {
      // Old format: convert comma-separated string to KeyPoint[]
      const keyPointsStr = formDataToLoad.keyPoints as string
      formDataToLoad.keyPoints = keyPointsStr
        ? keyPointsStr.split(',').map((text, idx) => ({
            id: `kp-${Date.now()}-${idx}`,
            text: text.trim(),
            priority: 'should-have' as const
          })).filter(kp => kp.text)
        : []
    }

    // Ensure ai_model is set
    if (!formDataToLoad.ai_model) {
      formDataToLoad.ai_model = 'openai'
    }

    setFormData(formDataToLoad as typeof formData)
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
          fetch(apiUrl(`/api/v1/content/${item.id}`), {
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

  const generateShareLink = async (contentId?: string) => {
    const idToShare = contentId || currentContentId
    if (!idToShare) {
      toast.error('Please generate a script first')
      return
    }

    setSharingId(idToShare)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(apiUrl(`/api/v1/content/${idToShare}/share`), {
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
    setSelectedTemplate(null)
    setFormData({
      topic: '',
      duration: 3,  // Default to 3 minutes (0-10 range)
      tone: 'engaging',
      targetAudience: '',
      keyPoints: [],  // Changed from '' to []
      scriptFlow: '',
      style: '',
      audiencePersonaId: '',
      scriptPersonaId: '',
      ai_model: 'openai'
    })
    toast.success('Ready for a new script!')
  }

  const calculateAnalytics = (script: string) => {
    const words = script.trim().split(/\s+/).filter(w => w.length > 0)
    const wordCount = words.length
    const readTimeMinutes = Math.ceil(wordCount / 150) // Average reading speed
    const speakingTimeMinutes = wordCount / 150 // Average speaking speed (don't round yet)

    const minutes = Math.floor(speakingTimeMinutes)
    const seconds = Math.round((speakingTimeMinutes - minutes) * 60)

    setAnalytics({
      wordCount,
      readTimeMinutes,
      estimatedSpeakingTime: `${minutes}:${seconds.toString().padStart(2, '0')}`
    })
  }

  // Parse script into sections based on timestamps
  const parseScriptSections = (script: string) => {
    const sections: ScriptSection[] = []
    const lines = script.split('\n')

    let currentSection: ScriptSection | null = null
    let currentContent: string[] = []

    const timestampRegex = /\[([\w\s\/-]+)\s*-\s*(\d+):(\d+)-(\d+):(\d+)\]/

    lines.forEach((line, idx) => {
      const match = line.match(timestampRegex)

      if (match) {
        // Save previous section
        if (currentSection) {
          const section: ScriptSection = {
            id: currentSection.id,
            title: currentSection.title,
            timestamp: currentSection.timestamp,
            startTime: currentSection.startTime,
            endTime: currentSection.endTime,
            content: currentContent.join('\n').trim()
          }
          sections.push(section)
        }

        // Start new section
        const [, title, startMin, startSec, endMin, endSec] = match
        const startTime = parseInt(startMin) * 60 + parseInt(startSec)
        const endTime = parseInt(endMin) * 60 + parseInt(endSec)

        currentSection = {
          id: `section-${idx}`,
          title: title.trim(),
          timestamp: `${startMin}:${startSec}-${endMin}:${endSec}`,
          startTime,
          endTime,
          content: '' // Will be set later
        }
        currentContent = [] // Don't include the timestamp line
      } else if (currentSection) {
        currentContent.push(line)
      } else {
        // Content before first timestamp
        if (sections.length === 0 && line.trim()) {
          currentContent.push(line)
        }
      }
    })

    // Save last section
    if (currentSection) {
      const finalSection = currentSection as ScriptSection
      sections.push({
        id: finalSection.id,
        title: finalSection.title,
        timestamp: finalSection.timestamp,
        startTime: finalSection.startTime,
        endTime: finalSection.endTime,
        content: currentContent.join('\n').trim()
      })
    } else if (currentContent.length > 0) {
      // No timestamps found, create single section
      sections.push({
        id: 'section-0',
        title: 'Full Script',
        timestamp: '0:00-end',
        content: currentContent.join('\n').trim(),
        startTime: 0,
        endTime: 0
      })
    }

    console.log('[Script Sections] Parsed sections:', sections)
    setScriptSections(sections)
  }

  // Update sections when script changes
  useEffect(() => {
    if (generatedScript) {
      console.log('[Script Sections] Parsing script, length:', generatedScript.length)
      parseScriptSections(generatedScript)
    }
  }, [generatedScript])

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const exportAsText = () => {
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
    toast.success('Script downloaded as TXT!')
  }

  const exportAsSRT = () => {
    if (!generatedScript || scriptSections.length === 0) {
      toast.error('No script sections available for SRT export')
      return
    }

    let srtContent = ''
    scriptSections.forEach((section, idx) => {
      const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
        const s = Math.floor(seconds % 60).toString().padStart(2, '0')
        return `${h}:${m}:${s},000`
      }

      srtContent += `${idx + 1}\n`
      srtContent += `${formatTime(section.startTime)} --> ${formatTime(section.endTime)}\n`
      srtContent += `${section.content.replace(/\[.*?\]/g, '').trim()}\n\n`
    })

    const blob = new Blob([srtContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `script-${formData.topic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.srt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Script exported as SRT subtitles!')
  }

  const printScript = () => {
    if (!generatedScript) return

    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Script - ${formData.topic}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
            .timestamp { background: #f3f4f6; padding: 8px; margin: 10px 0; border-left: 4px solid #6366f1; font-weight: bold; }
            .content { margin: 10px 0 20px 0; }
            .stage-direction { color: #6b7280; font-style: italic; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${formData.topic}</h1>
          <p><strong>Duration:</strong> ${formData.duration} minutes | <strong>Tone:</strong> ${formData.tone}</p>
          <hr />
          <pre style="white-space: pre-wrap; font-family: inherit;">${generatedScript}</pre>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
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

      // Prepare regeneration request with EMPHASIZED feedback and better prompt structure
      const requestBody: any = {
        topic: formData.topic,
        duration_minutes: formData.duration,
        ai_model: 'openai',
        // CRITICAL: Emphasize user feedback in regeneration
        regenerate_feedback: `IMPORTANT USER FEEDBACK - MUST FOLLOW: ${regenerateFeedback}`,
        previous_script: generatedScript,
        parent_content_id: originalParentId || currentContentId,
        version_number: currentVersionNum + 1
      }

      console.log('[Script Regeneration] Request payload:', {
        feedback: regenerateFeedback,
        has_previous_script: !!generatedScript,
        previous_script_length: generatedScript?.length,
        parent_id: originalParentId || currentContentId,
        version: currentVersionNum + 1
      })

      // Only add non-empty fields for better accuracy
      if (formData.targetAudience?.trim()) {
        requestBody.target_audience = formData.targetAudience.trim()
      }

      if (formData.tone && !formData.scriptPersonaId) {
        requestBody.tone = formData.tone
      }

      // Handle new KeyPoint[] format - send only must-have and should-have points
      if (formData.keyPoints && formData.keyPoints.length > 0) {
        const priorityPoints = formData.keyPoints
          .filter(p => p.priority === 'must-have' || p.priority === 'should-have')
          .map(p => p.text)
          .filter(text => text.trim())

        if (priorityPoints.length > 0) {
          requestBody.key_points = priorityPoints
        }
      }
      
      if (formData.scriptFlow?.trim()) {
        requestBody.script_flow = formData.scriptFlow.trim()
      }
      
      if (formData.style && formData.style !== '') {
        requestBody.style = formData.style
      }
      
      // Prioritize audience persona (more important for script quality)
      // If both are selected, audience takes priority and script tone is used as tone parameter
      if (formData.audiencePersonaId) {
        requestBody.persona_id = parseInt(formData.audiencePersonaId)
      } else if (formData.scriptPersonaId) {
        requestBody.persona_id = parseInt(formData.scriptPersonaId)
      }

      const response = await fetch(apiUrl('/api/v1/creator-tools/generate-script'), {
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
        parent_content_id: originalParentId || currentContentId || undefined,
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
            <FileText className="w-8 h-8 text-brand-600" />
            <h1 className="text-3xl font-bold text-gray-900">Script Generator</h1>
          </div>
          <div className="flex items-center space-x-3">
            {generatedScript && (
              <button
                onClick={startNewScript}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-lg transition-colors hover:bg-brand-700 font-medium"
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
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-brand-50 to-pink-50">
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
                        className="group relative hover:bg-gradient-to-r hover:from-brand-50 hover:to-pink-50 transition-all"
                      >
                        <div
                          onClick={() => loadFromHistory(item)}
                          className="p-5 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-100 to-pink-100 rounded-full mb-4">
                  <Clock className="w-8 h-8 text-brand-600" />
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

        {/* Main Content - Single Column Centered */}
        <div className="max-w-4xl mx-auto">
          {/* Input Form */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Script</h2>
              <p className="text-gray-600 text-sm">Fill in the details below to generate a professional video script</p>
            </div>

            {/* Smart Input Assistant - Real-time tips */}
            <SmartInputAssistant
              formData={{
                topic: formData.topic,
                duration: formData.duration,
                keyPoints: formData.keyPoints,
                targetAudience: formData.targetAudience,
                style: formData.style
              }}
            />

            {/* Video Topic */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                What's your video about? *
              </label>
              <p className="text-xs text-gray-600 mb-3">
                💡 Be specific! Better topics lead to better scripts (e.g., "5 Editing Tricks" vs "Video Tips")
              </p>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400"
                placeholder="e.g., How to Start a YouTube Channel in 2026"
              />
            </div>

            {/* Template Selector - Compact Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Choose a Template (Optional)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                📝 Templates provide proven structures that maximize engagement - or start from scratch
              </p>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = SCRIPT_TEMPLATES.find(t => t.id === e.target.value)
                  if (template) {
                    handleTemplateSelect(template)
                  } else {
                    setSelectedTemplate(null)
                    setFormData({
                      ...formData,
                      scriptFlow: '',
                      style: '',
                      keyPoints: []
                    })
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-gray-900 bg-white"
              >
                <option value="">Start from scratch</option>
                <option value="tutorial">📚 Tutorial/How-To - Step-by-step instructional</option>
                <option value="storytelling">📖 Storytelling/Narrative - Engaging story with emotional arc</option>
                <option value="listicle">🔢 List/Countdown - Numbered tips and items</option>
                <option value="product-review">⭐ Product Review - In-depth evaluation</option>
                <option value="vlog">🎥 Vlog/Day-in-Life - Personal behind-the-scenes</option>
                <option value="case-study">📊 Case Study/Results - Data-driven analysis</option>
              </select>
            </div>

            {/* Duration Slider */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Video Duration
              </label>
              <p className="text-xs text-gray-600 mb-3">
                📏 Set your target video length - the script will be optimized for this duration
              </p>
              <div className="text-center mb-2">
                <span className="text-2xl font-bold text-indigo-600">
                  {formData.duration < 1 ? `${Math.round(formData.duration * 60)}s` : `${formData.duration}m`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(formData.duration / 10) * 100}%, #e5e7eb ${(formData.duration / 10) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0s</span>
                <span>5m</span>
                <span>10m</span>
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Who's your target audience? *
              </label>
              <p className="text-xs text-gray-600 mb-3">
                🎯 Define your viewer - use a saved persona or describe them manually
              </p>
              <select
                value={formData.audiencePersonaId || 'custom'}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setFormData({ ...formData, audiencePersonaId: '', targetAudience: '' })
                  } else {
                    // Using a saved persona
                    const persona = getAudiencePersonas().find(p => p.id === e.target.value)
                    setFormData({
                      ...formData,
                      audiencePersonaId: e.target.value,
                      targetAudience: persona?.description || persona?.age_range || ''
                    })
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-gray-900 bg-white"
              >
                <option value="custom">✍️ Custom Audience (enter manually)</option>
                {getAudiencePersonas().length > 0 ? (
                  <optgroup label="👥 Your Audience Personas">
                    {getAudiencePersonas().map(persona => (
                      <option key={persona.id} value={persona.id}>
                        {persona.name} {persona.age_range ? `(${persona.age_range})` : ''}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option disabled>No audience personas yet - create one in Personas page</option>
                )}
              </select>
              {(!formData.audiencePersonaId || formData.audiencePersonaId === 'custom') && (
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400 mt-2"
                  placeholder="e.g., Tech-savvy millennials (25-40) interested in productivity"
                />
              )}
              {formData.audiencePersonaId && formData.audiencePersonaId !== 'custom' && (
                <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs text-indigo-900">
                    <strong>Using Persona:</strong> {getAudiencePersonas().find(p => p.id === formData.audiencePersonaId)?.name}
                  </p>
                </div>
              )}
            </div>

            {/* Script Tone */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Script Tone & Style
              </label>
              <p className="text-xs text-gray-600 mb-3">
                🎭 Choose your delivery style - use a saved persona or select a preset tone
              </p>
              <select
                value={formData.scriptPersonaId || formData.tone || 'preset'}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'preset') {
                    setFormData({ ...formData, scriptPersonaId: '', tone: 'engaging' })
                  } else if (['engaging', 'professional', 'casual', 'educational', 'entertaining'].includes(val)) {
                    setFormData({ ...formData, scriptPersonaId: '', tone: val })
                  } else {
                    // Using a saved persona
                    setFormData({ ...formData, scriptPersonaId: val, tone: '' })
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-gray-900 bg-white"
              >
                <option value="preset">🎯 Preset Tones (choose below)</option>
                {getScriptPersonas().length > 0 ? (
                  <optgroup label="🎭 Your Script Personas">
                    {getScriptPersonas().map(persona => (
                      <option key={persona.id} value={persona.id}>
                        {persona.name} {persona.tone ? `(${persona.tone})` : ''}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option disabled>No script personas yet - create one in Personas page</option>
                )}
              </select>
              {(!formData.scriptPersonaId || formData.scriptPersonaId === 'preset') && (
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-gray-900 bg-white mt-2"
                >
                  <option value="engaging">✨ Engaging & Energetic</option>
                  <option value="professional">💼 Professional & Polished</option>
                  <option value="casual">😊 Casual & Friendly</option>
                  <option value="educational">🎓 Educational & Informative</option>
                  <option value="entertaining">🎭 Entertaining & Fun</option>
                </select>
              )}
              {formData.scriptPersonaId && formData.scriptPersonaId !== 'preset' && (
                <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs text-purple-900">
                    <strong>Using Persona:</strong> {getScriptPersonas().find(p => p.id === formData.scriptPersonaId)?.name}
                  </p>
                </div>
              )}
            </div>

            {/* Smart Key Points Manager - Replace old textarea */}
            <SmartKeyPointsManager
              keyPoints={formData.keyPoints}
              onChange={(points) => setFormData({ ...formData, keyPoints: points })}
              topic={formData.topic}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Script Flow (optional)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                🎬 Choose how your script's story unfolds - the structure guides pacing and engagement
              </p>
              <select
                value={formData.scriptFlow}
                onChange={(e) => setFormData({ ...formData, scriptFlow: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-gray-900 bg-white"
              >
                <option value="">🎯 Auto (AI decides best flow)</option>
                <option value="Hook → Problem → Solution → How it works → Results → CTA">📈 Problem-Solution (Hook → Problem → Solution → Results → CTA)</option>
                <option value="Hook → Introduction → Main Content → Conclusion → CTA">📚 Classic (Hook → Intro → Main Content → Conclusion → CTA)</option>
                <option value="Hook → Story Setup → Conflict → Resolution → Lesson → CTA">📖 Storytelling (Hook → Setup → Conflict → Resolution → Lesson → CTA)</option>
                <option value="Hook → List Introduction → Point 1 → Point 2 → ... → Summary → CTA">🔢 Listicle (Hook → List Intro → Points → Summary → CTA)</option>
                <option value="custom">✍️ Custom Flow (enter your own)</option>
              </select>
              {formData.scriptFlow === 'custom' && (
                <input
                  type="text"
                  value={formData.scriptFlow}
                  onChange={(e) => setFormData({ ...formData, scriptFlow: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all mt-2"
                  placeholder="e.g., Hook → Discovery → Journey → Revelation → Impact → CTA"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Content Style (optional)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                🎥 Select the overall presentation format - matches different video types and platforms
              </p>
              <select
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white"
              >
                <option value="">🎯 Auto (based on topic)</option>
                <option value="educational">🎓 Educational/Tutorial</option>
                <option value="storytelling">📖 Storytelling</option>
                <option value="vlog-style">📹 Vlog Style</option>
                <option value="documentary">🎬 Documentary</option>
                <option value="listicle">📝 Listicle</option>
                <option value="case-study">📊 Case Study</option>
                <option value="interview">🎤 Interview Format</option>
              </select>
            </div>

            {/* AI Model Selector */}
            <AIModelSelector
              selectedModel={formData.ai_model}
              onSelectModel={(model) => setFormData({ ...formData, ai_model: model })}
            />

            {/* Streaming Toggle */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
              <div>
                <div className="text-sm font-semibold text-gray-900">Real-time Streaming</div>
                <div className="text-xs text-gray-600 mt-1">Watch your script being written live</div>
              </div>
              <button
                onClick={() => setStreamingEnabled(!streamingEnabled)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shadow-sm ${
                  streamingEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                    streamingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Progress Message (when streaming) */}
            {isStreaming && progressMessage && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <Loader className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{progressMessage}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>{isStreaming && progressMessage ? progressMessage : 'Generating your script...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Script</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Output - Only show when script exists */}
          {generatedScript && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Enhanced Header with Controls */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Generated Script</h2>

                  {/* Font Size Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                      className="p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      title="Decrease font size"
                    >
                      <ZoomOut className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="text-sm text-gray-600 font-medium min-w-[3rem] text-center">
                      {fontSize}px
                    </span>
                    <button
                      onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                      className="p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      title="Increase font size"
                    >
                      <ZoomIn className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Stats Bar */}
                {analytics && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{analytics.wordCount}</div>
                        <div className="text-xs text-gray-600 font-medium">Words</div>
                      </div>
                      <div className="text-center border-l border-r border-gray-200">
                        <div className="text-2xl font-bold text-purple-600">{analytics.estimatedSpeakingTime}</div>
                        <div className="text-xs text-gray-600 font-medium">Speaking Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-600">{scriptSections.length}</div>
                        <div className="text-xs text-gray-600 font-medium">Sections</div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (analytics.wordCount / (formData.duration * 150)) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-center text-gray-500 mt-1">
                      Target: {formData.duration * 150} words ({formData.duration} min)
                    </div>
                  </div>
                )}
              </div>

              {/* View Controls */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  {/* View Mode Toggle */}
                  <button
                    onClick={() => setViewMode('formatted')}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'formatted'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Formatted</span>
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'raw'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    <span>Raw</span>
                  </button>
                </div>

                {/* Navigation Toggle (only show if sections exist) */}
                {scriptSections.length > 1 && (
                  <button
                    onClick={() => setShowNavigation(!showNavigation)}
                    className="flex items-center space-x-2 px-3 py-2 bg-white hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                  >
                    <List className="w-4 h-4" />
                    <span>{showNavigation ? 'Hide' : 'Show'} Navigation</span>
                  </button>
                )}
              </div>

              {/* Main Content Area with Optional Sidebar */}
              <div className="flex">
                {/* Section Navigation Sidebar */}
                {showNavigation && scriptSections.length > 1 && (
                  <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 max-h-[700px] overflow-y-auto">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                      <List className="w-4 h-4 mr-2" />
                      Script Sections
                    </h3>
                    <div className="space-y-2">
                      {scriptSections.map((section, idx) => (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-white border border-transparent hover:border-indigo-200 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-indigo-600">
                              {idx + 1}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {section.timestamp}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 line-clamp-2">
                            {section.title}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Script Display */}
                <div className="flex-1">
                  {viewMode === 'formatted' ? (
                    <div
                      ref={scriptContainerRef}
                      className="p-6 max-h-[700px] overflow-y-auto"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {scriptSections.length > 1 ? (
                        // Sectioned view with collapsible sections
                        <div className="space-y-4">
                          {scriptSections.map((section, idx) => (
                            <div
                              key={section.id}
                              id={section.id}
                              className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
                            >
                              {/* Section Header */}
                              <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors"
                              >
                                <div className="flex items-center space-x-3">
                                  {collapsedSections.has(section.id) ? (
                                    <ChevronRight className="w-5 h-5 text-indigo-600" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-indigo-600" />
                                  )}
                                  <div className="text-left">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-bold text-indigo-600">
                                        Section {idx + 1}
                                      </span>
                                      <span className="px-2 py-0.5 bg-indigo-200 text-indigo-800 text-xs font-mono rounded-full">
                                        {section.timestamp}
                                      </span>
                                    </div>
                                    <div className="text-base font-semibold text-gray-900 mt-1">
                                      {section.title}
                                    </div>
                                  </div>
                                </div>
                                <Clock className="w-4 h-4 text-gray-400" />
                              </button>

                              {/* Section Content */}
                              {!collapsedSections.has(section.id) && (
                                <div className="p-6 bg-white">
                                  {section.content.trim() ? (
                                    <div className="prose prose-sm max-w-none">
                                      {section.content.split('\n').map((line, pIdx) => {
                                        // Skip empty lines
                                        if (!line.trim()) {
                                          return null
                                        }

                                        // Check for stage directions
                                        if (line.includes('[') && line.includes(']')) {
                                          const parts = line.split(/([\[\]])/)
                                          return (
                                            <p key={pIdx} className="mb-3 leading-relaxed text-gray-800">
                                              {parts.map((part, i) => {
                                                if (part === '[' || part === ']') return null
                                                if (parts[i - 1] === '[') {
                                                  return (
                                                    <span key={i} className="italic text-gray-500 text-sm bg-gray-100 px-2 py-0.5 rounded">
                                                      [{part}]
                                                    </span>
                                                  )
                                                }
                                                return <span key={i}>{part}</span>
                                              })}
                                            </p>
                                          )
                                        }

                                        return (
                                          <p key={pIdx} className="mb-3 text-gray-800 leading-relaxed">
                                            {line}
                                          </p>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 italic text-sm">No content in this section</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Original formatted view for scripts without sections
                        <div className="prose prose-sm max-w-none">
                          {generatedScript.split('\n\n').map((paragraph, idx) => {
                        // Check if it's a heading (starts with # or is ALL CAPS)
                        if (paragraph.startsWith('#')) {
                          const level = paragraph.match(/^#+/)?.[0].length || 1
                          const text = paragraph.replace(/^#+\s*/, '')
                          const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements
                          return (
                            <HeadingTag
                              key={idx}
                              className="font-bold text-purple-900 mt-6 mb-3 first:mt-0"
                              style={{
                                fontSize: level === 1 ? '1.5rem' : level === 2 ? '1.25rem' : '1.1rem'
                              }}
                            >
                              {text}
                            </HeadingTag>
                          )
                        }
                        
                        // Check if it's an all-caps section header
                        if (paragraph === paragraph.toUpperCase() && paragraph.length < 50 && paragraph.length > 3) {
                          return (
                            <h3 key={idx} className="font-bold text-lg text-purple-900 mt-6 mb-3 first:mt-0">
                              {paragraph}
                            </h3>
                          )
                        }
                        
                        // Check if it's a list item
                        if (paragraph.match(/^[-•*]\s/)) {
                          return (
                            <li key={idx} className="ml-4 mb-2 text-gray-700">
                              {paragraph.replace(/^[-•*]\s/, '')}
                            </li>
                          )
                        }
                        
                        // Check if it's a numbered point
                        if (paragraph.match(/^\d+[\.\)]\s/)) {
                          return (
                            <li key={idx} className="ml-4 mb-2 text-gray-700 list-decimal">
                              {paragraph.replace(/^\d+[\.\)]\s/, '')}
                            </li>
                          )
                        }
                        
                        // Check for speaker labels (e.g., "HOST:", "NARRATOR:")
                        if (paragraph.match(/^[A-Z][A-Z\s]+:/)) {
                          const [speaker, ...rest] = paragraph.split(':')
                          return (
                            <p key={idx} className="mb-4 text-gray-700">
                              <span className="font-bold text-brand-700">{speaker}:</span>
                              <span className="ml-2">{rest.join(':')}</span>
                            </p>
                          )
                        }
                        
                        // Check for stage directions [like this]
                        if (paragraph.includes('[') && paragraph.includes(']')) {
                          const parts = paragraph.split(/([\[\]])/)
                          return (
                            <p key={idx} className="mb-4 text-gray-700">
                              {parts.map((part, i) => {
                                if (part === '[') return null
                                if (part === ']') return null
                                if (parts[i - 1] === '[') {
                                  return (
                                    <span key={i} className="italic text-gray-500 text-sm">
                                      [{part}]
                                    </span>
                                  )
                                }
                                return <span key={i}>{part}</span>
                              })}
                            </p>
                          )
                        }
                        
                        // Regular paragraph
                        return (
                          <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                            {paragraph}
                          </p>
                        )
                      })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <pre
                      className="whitespace-pre-wrap bg-gray-50 p-6 max-h-[700px] overflow-y-auto font-mono"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {generatedScript}
                    </pre>
                  )}
                </div>
              </div>

              {/* Action Buttons - Enhanced */}
              <div className="border-t border-gray-200 bg-gray-50 p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 shadow-md"
                    title="Copy script to clipboard"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  {/* Export Dropdown */}
                  <div className="relative export-menu-container">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 shadow-md"
                      title="Export options"
                    >
                      <FileDown className="w-5 h-5" />
                      <span>Export</span>
                    </button>

                    {showExportMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-20">
                        <button
                          onClick={() => {
                            exportAsText()
                            setShowExportMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download as TXT</span>
                        </button>
                        <button
                          onClick={() => {
                            exportAsSRT()
                            setShowExportMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm border-t border-gray-100"
                          disabled={scriptSections.length <= 1}
                        >
                          <FileText className="w-4 h-4" />
                          <span>Export as SRT</span>
                        </button>
                        <button
                          onClick={() => {
                            printScript()
                            setShowExportMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm border-t border-gray-100"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print Script</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => generateShareLink()}
                    disabled={!!sharingId}
                    className="py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md"
                    title="Generate shareable link"
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
                    className="py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 shadow-md"
                    title="Refine script with feedback"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Refine</span>
                  </button>

                  <button
                    onClick={startNewScript}
                    className="py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 shadow-md"
                    title="Start a new script"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>New</span>
                  </button>
                </div>

                {shareToken && (
                  <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Public Share Link Created!</p>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs text-blue-700 break-all block bg-white px-3 py-2 rounded-lg border border-blue-200 flex-1 font-mono">
                            {`${window.location.origin}/shared/${shareToken}`}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/shared/${shareToken}`)
                              toast.success('Link copied!')
                            }}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-brand-100 text-gray-700 hover:text-brand-700 rounded-full transition-colors"
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
