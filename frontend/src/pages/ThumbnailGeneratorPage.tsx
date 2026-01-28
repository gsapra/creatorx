import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import ThumbnailImageViewer from '../components/ThumbnailImageViewer'
import { Image, Sparkles, Loader, Clock, Trash2, TrendingUp, RefreshCw, X, Check, ChevronDown, ChevronUp, Target, BarChart3, Lightbulb, Upload, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPost } from '../services/api'
import { apiUrl } from '../config'

interface ThumbnailTemplate {
  id: string
  title: string
  image_url: string
  base64_data?: string
  prompt?: string
  emotion?: string
  color_scheme?: string
  layout?: string
  ctr_score?: number
  optimized_for_mobile?: boolean
  platform?: string
  variation?: number
  uploaded_layers?: Array<{
    id: string
    url?: string
    base64_data: string
    width: number
    height: number
  }>
  // Legacy fields for backward compatibility
  name?: string
  description?: string
  style?: string
  qualityScore?: number // New: Overall quality score
}

interface ThumbnailStyle {
  id: string
  name: string
  description: string
  example: string
  category: string
  presets: {
    emotion: string
    color_scheme: string
    font_style: string
    layout_preference: string
  }
}

const THUMBNAIL_STYLES: ThumbnailStyle[] = [
  {
    id: 'viral-shock',
    name: 'Viral Shock',
    description: 'High contrast, shocked expressions, bold text',
    example: 'Perfect for reaction and surprise videos',
    category: 'engagement',
    presets: {
      emotion: 'shocking',
      color_scheme: 'high-contrast',
      font_style: 'extra-bold',
      layout_preference: 'face-dominant'
    }
  },
  {
    id: 'professional-clean',
    name: 'Professional Clean',
    description: 'Minimalist design, clear typography, elegant colors',
    example: 'Best for tutorials and educational content',
    category: 'professional',
    presets: {
      emotion: 'confident',
      color_scheme: 'professional',
      font_style: 'clean',
      layout_preference: 'rule-of-thirds'
    }
  },
  {
    id: 'gaming-energy',
    name: 'Gaming Energy',
    description: 'Neon colors, dynamic poses, high energy',
    example: 'Gaming, tech, and entertainment content',
    category: 'gaming',
    presets: {
      emotion: 'exciting',
      color_scheme: 'neon',
      font_style: 'bold',
      layout_preference: 'dynamic'
    }
  },
  {
    id: 'vlog-friendly',
    name: 'Vlog Friendly',
    description: 'Warm colors, approachable, casual feel',
    example: 'Daily vlogs and lifestyle content',
    category: 'casual',
    presets: {
      emotion: 'happy',
      color_scheme: 'warm',
      font_style: 'friendly',
      layout_preference: 'centered'
    }
  },
  {
    id: 'dramatic-cinematic',
    name: 'Dramatic Cinematic',
    description: 'Dark backgrounds, dramatic lighting, movie-like',
    example: 'Storytelling and cinematic content',
    category: 'cinematic',
    presets: {
      emotion: 'intense',
      color_scheme: 'dark',
      font_style: 'bold',
      layout_preference: 'cinematic'
    }
  },
  {
    id: 'curiosity-gap',
    name: 'Curiosity Gap',
    description: 'Mystery elements, question marks, intriguing setup',
    example: 'Mystery, investigation, and reveal videos',
    category: 'engagement',
    presets: {
      emotion: 'curious',
      color_scheme: 'mysterious',
      font_style: 'bold',
      layout_preference: 'rule-of-thirds'
    }
  }
]

interface HistoryItem {
  id: string
  title: string
  topic: string
  templates: ThumbnailTemplate[]
  timestamp: Date
}

// const STYLE_OPTIONS = [
//   { value: 'modern', label: 'Modern', description: 'Clean geometric shapes, bright gradients' },
//   { value: 'bold', label: 'Bold', description: 'High contrast, large text, dramatic colors' },
//   { value: 'minimalist', label: 'Minimalist', description: 'Simple, elegant, few elements' },
//   { value: 'dramatic', label: 'Dramatic', description: 'Dark backgrounds, cinematic look' },
//   { value: 'gaming', label: 'Gaming', description: 'Neon colors, futuristic, high energy' },
//   { value: 'vlog', label: 'Vlog', description: 'Casual, friendly, warm colors' }
// ]

export default function ThumbnailGeneratorPage() {
  const [formData, setFormData] = useState({
    thumbnailPrompt: '', // Combined field for title and description
    count: 1, // Fixed to 1 variant only
    style: 'bold',
    emotion: 'exciting',
    include_face: true,
    face_expression: 'excited',
    color_scheme: 'vibrant',
    use_gradient: false,
    font_style: 'bold',
    text_emphasis: 'statement',
    include_emoji: false,
    layout_preference: 'rule-of-thirds',
    text_position: 'center',
    optimize_for_mobile: true,
    include_arrow: false,
    include_circle: false,
    target_platform: 'youtube',
    image_model: 'gpt-image-1.5'  // Default: GPT-Image 1.5 (fastest with best text rendering)
  })
  const [templates, setTemplates] = useState<ThumbnailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ThumbnailTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showRefineModal, setShowRefineModal] = useState(false)
  const [refineFeedback, setRefineFeedback] = useState('')
  const [refining, setRefining] = useState(false)
  const [showStyles, setShowStyles] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedStylePreset, setSelectedStylePreset] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<Array<{file: File, preview: string}>>([])

  // Model display names
  const MODEL_NAMES = {
    'gpt-image-1.5': 'Smart Editor',
    'dall-e-3': 'Creative Artist',
    'imagen-3.0-generate-001': 'Photo Master'
  }

  // Calculate quality score for thumbnails
  const calculateQualityScore = (template: ThumbnailTemplate): number => {
    let score = 60 // Base score

    // CTR score contribution (40% weight)
    if (template.ctr_score) {
      score += (template.ctr_score / 100) * 40
    }

    // Mobile optimization (10% weight)
    if (template.optimized_for_mobile) {
      score += 10
    }

    // Has emotion (10% weight)
    if (template.emotion) {
      score += 10
    }

    // Has color scheme (10% weight)
    if (template.color_scheme) {
      score += 10
    }

    // Prompt quality - longer prompts tend to be more detailed (10% weight)
    if (template.prompt && template.prompt.length > 100) {
      score += 10
    }

    return Math.min(100, Math.round(score))
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
        const response = await fetch(apiUrl('/api/v1/content?content_type=thumbnail_idea&limit=50'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const backendContent = await response.json()
          const backendHistory: HistoryItem[] = backendContent
            .filter((item: any) => item.meta_data?.templates)
            .map((item: any) => ({
              id: item.id.toString(),
              title: item.meta_data?.video_title || 'Untitled',
              topic: item.meta_data?.video_topic || '',
              templates: (item.meta_data?.templates || []).map((t: any) => ({
                ...t,
                qualityScore: calculateQualityScore(t)
              })),
              timestamp: new Date(item.created_at)
            }))
            .sort((a: HistoryItem, b: HistoryItem) => b.timestamp.getTime() - a.timestamp.getTime())

          setHistory(backendHistory)
        }
      } catch (error) {
        console.error('[Thumbnail History] Failed to fetch from backend:', error)
      }
    }

    loadHistory()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Check if user is using GPT-Image 1.5
    if (formData.image_model !== 'gpt-image-1.5') {
      toast.error('Image upload only supported for Smart Editor')
      return
    }

    // Check max 2 images
    if (uploadedImages.length + files.length > 2) {
      toast.error('Maximum 2 images allowed')
      return
    }

    const newImages = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        continue
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`)
        continue
      }

      // Create preview
      const preview = URL.createObjectURL(file)
      newImages.push({ file, preview })
    }

    setUploadedImages([...uploadedImages, ...newImages].slice(0, 2))
    toast.success(`${newImages.length} image(s) uploaded`)
  }

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index)
    URL.revokeObjectURL(uploadedImages[index].preview)
    setUploadedImages(newImages)
    toast.success('Image removed')
  }

  const applyStylePreset = (styleId: string) => {
    const style = THUMBNAIL_STYLES.find(s => s.id === styleId)
    if (!style) return

    setFormData({
      ...formData,
      emotion: style.presets.emotion,
      color_scheme: style.presets.color_scheme,
      font_style: style.presets.font_style,
      layout_preference: style.presets.layout_preference,
      style: styleId
    })
    setSelectedStylePreset(styleId)
    toast.success(`${style.name} style applied!`)
  }

  const handleGenerate = async () => {
    if (!formData.thumbnailPrompt.trim()) {
      toast.error('Please enter a description for your thumbnail')
      return
    }

    setLoading(true)

    try {
      // Convert uploaded images to base64 if present
      let customImages: Array<{id: string, base64_data: string}> = []
      if (uploadedImages.length > 0) {
        toast.loading('Analyzing your uploaded images...', { id: 'image-analysis' })
        customImages = await Promise.all(
          uploadedImages.map(async (img, idx) => {
            return new Promise<{id: string, base64_data: string}>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                resolve({
                  id: `uploaded_${idx}`,
                  base64_data: reader.result as string
                })
              }
              reader.readAsDataURL(img.file)
            })
          })
        )
        toast.success('Images analyzed! Generating thumbnail...', { id: 'image-analysis' })
      }

      const requestBody = {
        thumbnail_prompt: formData.thumbnailPrompt,
        count: parseInt(formData.count.toString(), 10),
        style: formData.style,
        ai_model: 'openai', // Text model
        image_model: formData.image_model, // Image generation model
        persona_id: null,
        custom_images: customImages.length > 0 ? customImages : null,
        // Advanced parameters
        emotion: formData.emotion,
        include_face: formData.include_face,
        face_expression: formData.face_expression,
        color_scheme: formData.color_scheme,
        use_gradient: formData.use_gradient,
        font_style: formData.font_style,
        text_emphasis: formData.text_emphasis,
        include_emoji: formData.include_emoji,
        layout_preference: formData.layout_preference,
        text_position: formData.text_position,
        optimize_for_mobile: formData.optimize_for_mobile,
        include_arrow: formData.include_arrow,
        include_circle: formData.include_circle,
        target_platform: formData.target_platform
      }

      console.log('[Thumbnail Generation] Advanced Request:', requestBody)
      const response = await apiPost('/api/v1/creator-tools/generate-thumbnail-ideas', requestBody)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to generate thumbnails')
      }

      const data = await response.json()
      // Handle both new format (thumbnails) and old format (templates with layers)
      let generatedTemplates = data.meta_data?.templates || data.thumbnails || []

      // Convert to new format if needed and add quality scores
      generatedTemplates = generatedTemplates.map((t: any) => {
        const template = {
          id: t.id,
          title: t.title || formData.thumbnailPrompt.substring(0, 50),
          image_url: t.image_url || '',
          base64_data: t.base64_data || '',
          prompt: t.prompt || '',
          emotion: t.emotion || formData.emotion,
          color_scheme: t.color_scheme || formData.color_scheme,
          layout: t.layout || formData.layout_preference,
          ctr_score: t.ctr_score,
          optimized_for_mobile: t.optimized_for_mobile || formData.optimize_for_mobile,
          platform: t.platform || formData.target_platform,
          variation: t.variation,
          uploaded_layers: t.uploaded_layers || []
        }
        return {
          ...template,
          qualityScore: calculateQualityScore(template)
        }
      })

      setTemplates(generatedTemplates)
      if (generatedTemplates.length > 0) {
        setSelectedTemplate(generatedTemplates[0])
      }

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: data.id?.toString() || Date.now().toString(),
        title: formData.thumbnailPrompt.substring(0, 50) || 'Untitled',
        topic: formData.thumbnailPrompt.substring(50, 150) || '',
        templates: generatedTemplates,
        timestamp: new Date()
      }
      setHistory([newHistoryItem, ...history])

      toast.success('Thumbnail generated successfully!')
    } catch (error) {
      console.error('Thumbnail generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate thumbnail'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    setFormData({
      thumbnailPrompt: `${item.title}. ${item.topic}`,
      count: 1, // Fixed to 1 variant
      style: item.templates[0]?.style || 'bold',
      emotion: item.templates[0]?.emotion || 'exciting',
      include_face: true,
      face_expression: 'excited',
      color_scheme: item.templates[0]?.color_scheme || 'vibrant',
      use_gradient: false,
      font_style: 'bold',
      text_emphasis: 'statement',
      include_emoji: false,
      layout_preference: item.templates[0]?.layout || 'rule-of-thirds',
      text_position: 'center',
      optimize_for_mobile: true,
      include_arrow: false,
      include_circle: false,
      target_platform: 'youtube',
      image_model: 'gpt-image-1.5'  // Default to GPT-Image 1.5 for history items
    })
    setTemplates(item.templates)
    if (item.templates.length > 0) {
      setSelectedTemplate(item.templates[0])
    }
    setShowHistory(false)
    toast.success('Loaded from history')
  }

  const handleRefine = async () => {
    if (!refineFeedback.trim()) {
      toast.error('Please enter refinement feedback')
      return
    }

    if (!selectedTemplate) {
      toast.error('No thumbnail selected')
      return
    }

    setRefining(true)

    try {
      // Convert uploaded images to base64 if present
      const customImages = await Promise.all(
        uploadedImages.map(async (img, idx) => {
          return new Promise<{id: string, base64_data: string}>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve({
                id: `uploaded_${idx}`,
                base64_data: reader.result as string
              })
            }
            reader.readAsDataURL(img.file)
          })
        })
      )

      const requestBody = {
        thumbnail_prompt: formData.thumbnailPrompt,
        count: 1, // Only refine 1 image
        style: formData.style,
        ai_model: 'openai', // Text model
        image_model: formData.image_model, // Image generation model
        persona_id: null,
        custom_images: customImages.length > 0 ? customImages : null,
        // Pass all the same parameters
        emotion: formData.emotion,
        include_face: formData.include_face,
        face_expression: formData.face_expression,
        color_scheme: formData.color_scheme,
        use_gradient: formData.use_gradient,
        font_style: formData.font_style,
        text_emphasis: formData.text_emphasis,
        include_emoji: formData.include_emoji,
        layout_preference: formData.layout_preference,
        text_position: formData.text_position,
        optimize_for_mobile: formData.optimize_for_mobile,
        include_arrow: formData.include_arrow,
        include_circle: formData.include_circle,
        target_platform: formData.target_platform,
        // Refinement feedback
        refinement_feedback: refineFeedback,
        previous_prompt: selectedTemplate.prompt || ''
      }

      console.log('[Thumbnail Refinement] Request:', { feedback: refineFeedback })
      const response = await apiPost('/api/v1/creator-tools/generate-thumbnail-ideas', requestBody)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to refine thumbnail')
      }

      const data = await response.json()
      let refinedTemplates = data.meta_data?.templates || data.thumbnails || []

      // Convert to new format if needed
      refinedTemplates = refinedTemplates.map((t: any) => {
        const template = {
          id: t.id,
          title: t.title || formData.thumbnailPrompt.substring(0, 50),
          image_url: t.image_url || '',
          base64_data: t.base64_data || '',
          prompt: t.prompt || '',
          emotion: t.emotion || formData.emotion,
          color_scheme: t.color_scheme || formData.color_scheme,
          layout: t.layout || formData.layout_preference,
          ctr_score: t.ctr_score,
          optimized_for_mobile: t.optimized_for_mobile || formData.optimize_for_mobile,
          platform: t.platform || formData.target_platform,
          variation: t.variation,
          uploaded_layers: t.uploaded_layers || []
        }
        return {
          ...template,
          qualityScore: calculateQualityScore(template)
        }
      })

      if (refinedTemplates.length > 0) {
        // Replace the selected template with the refined one
        const currentIndex = templates.findIndex(t => t.id === selectedTemplate.id)
        const newTemplates = [...templates]
        newTemplates[currentIndex] = refinedTemplates[0]
        setTemplates(newTemplates)
        setSelectedTemplate(refinedTemplates[0])

        toast.success('Thumbnail refined successfully!')
        setShowRefineModal(false)
        setRefineFeedback('')
      }
    } catch (error) {
      console.error('Thumbnail refinement error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to refine thumbnail'
      toast.error(errorMessage)
    } finally {
      setRefining(false)
    }
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
      toast.success('Thumbnail deleted')
    } catch (error) {
      console.error('Failed to delete history item:', error)
      toast.error('Failed to delete thumbnail')
    } finally {
      setDeletingId(null)
      setDeleteConfirm(null)
    }
  }

  const getQualityScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-orange-600 bg-orange-100'
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Thumbnail Creator</h1>
          </div>
          <div className="flex items-center space-x-3">
            {templates.length > 0 && (
              <button
                onClick={() => {
                  setTemplates([])
                  setSelectedTemplate(null)
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-lg transition-colors hover:bg-brand-700 font-medium"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate New</span>
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
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <h3 className="font-bold text-gray-900 text-lg">Thumbnail History</h3>
                  <p className="text-sm text-gray-600 mt-1">{history.length} saved thumbnails</p>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="divide-y divide-gray-100">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="group relative hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all"
                      >
                        <div
                          onClick={() => loadFromHistory(item)}
                          className="p-5 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors mb-2">
                                {item.title}
                              </h4>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                                {item.templates.length > 0 && item.templates[0]?.qualityScore && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                    Quality: {item.templates[0].qualityScore}/100
                                  </span>
                                )}
                                {item.templates.length > 0 && item.templates[0]?.ctr_score && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                    CTR: {item.templates[0].ctr_score}%
                                  </span>
                                )}
                                <span className="px-2 py-1 bg-gray-100 rounded-full">
                                  📝 {item.topic}
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
                              title="Delete thumbnail"
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
                              <p className="text-sm font-medium text-gray-900 mb-3">Delete this thumbnail?</p>
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full mb-4">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No thumbnail history yet</h3>
                <p className="text-sm text-gray-600">Generate your first thumbnail to see it here</p>
              </div>
            )}
          </div>
        )}

        {!selectedTemplate ? (
          <div className="max-w-5xl mx-auto">
            {/* Input Form */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl mb-4 shadow-lg">
                  <Image className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Create Eye-Catching Thumbnails</h2>
              </div>

              {/* Image Model Selector */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200 mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  🎨 AI Model Selection
                </label>
                <select
                  value={formData.image_model}
                  onChange={(e) => {
                    setFormData({ ...formData, image_model: e.target.value })
                    // Clear uploaded images if switching away from GPT-Image 1.5
                    if (e.target.value !== 'gpt-image-1.5' && uploadedImages.length > 0) {
                      setUploadedImages([])
                      toast('Images cleared - only Smart Editor supports uploads')
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-0 transition-colors text-gray-900 bg-white font-medium"
                >
                  <option value="gpt-image-1.5">⚡ Smart Editor - Best for text & image editing</option>
                  <option value="dall-e-3">🎨 Creative Artist - Artistic & dreamy visuals</option>
                  <option value="imagen-3.0-generate-001">📸 Photo Master - Photorealism & detail</option>
                </select>

                {/* Dynamic recommendations based on selected model */}
                <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                  {formData.image_model === 'gpt-image-1.5' && (
                    <div className="text-xs space-y-2">
                      <p className="font-semibold text-purple-900 flex items-center gap-2">
                        ⚡ Smart Editor
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">Precise text rendering</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">4x faster generation</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">Image upload support</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">Transparent backgrounds</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">Natively multimodal</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-blue-600">📐</span>
                          <span className="text-gray-700">1536x1024 (3:2)</span>
                        </div>
                      </div>
                      <p className="text-blue-700 font-medium mt-2">👆 Upload your images below to incorporate them!</p>
                    </div>
                  )}
                  {formData.image_model === 'dall-e-3' && (
                    <div className="text-xs space-y-2">
                      <p className="font-semibold text-purple-900">🎨 Creative Artist</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">Artistic & dreamy</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">Creative interpretation</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">Vibrant colors</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">Dramatic effects</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-red-600">✗</span>
                          <span className="text-gray-500">No image upload</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-blue-600">📐</span>
                          <span className="text-gray-700">1792x1024 (16:9)</span>
                        </div>
                      </div>
                      <p className="text-green-700 font-medium mt-2">✨ Best for stylized, eye-catching designs</p>
                    </div>
                  )}
                  {formData.image_model === 'imagen-3.0-generate-001' && (
                    <div className="text-xs space-y-2">
                      <p className="font-semibold text-purple-900">📸 Photo Master</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">Photorealistic</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">High fidelity detail</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">Realistic lighting</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">Natural textures</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-red-600">✗</span>
                          <span className="text-gray-500">No image upload</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-blue-600">📐</span>
                          <span className="text-gray-700">Flexible ratio</span>
                        </div>
                      </div>
                      <p className="text-green-700 font-medium mt-2">📸 Best for realistic, professional look</p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-600 mt-3 text-center font-medium">
                  💡 <strong>With images?</strong> Smart Editor | <strong>Artistic?</strong> Creative Artist | <strong>Realistic?</strong> Photo Master
                </p>
              </div>

              {/* Image Upload Section - Only for GPT-Image 1.5 */}
              {formData.image_model === 'gpt-image-1.5' && (
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Upload Images (Optional - Max 2)
                  </label>

                  {/* Upload Button */}
                  {uploadedImages.length < 2 && (
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-blue-300 border-dashed rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                      <Upload className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Click to upload image ({uploadedImages.length}/2)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* Uploaded Images Preview */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img.preview}
                            alt={`Upload ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-blue-200"
                          />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                            Image {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-blue-700 mt-2">
                    💡 Uploaded images will be intelligently incorporated into your thumbnail design
                  </p>
                </div>
              )}

              {/* Thumbnail Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Thumbnail Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.thumbnailPrompt}
                  onChange={(e) => setFormData({ ...formData, thumbnailPrompt: e.target.value })}
                  placeholder="Describe your video and the text for the thumbnail. Example: Video about testing 100 productivity apps. Title text: 'I Tested 100 Apps - Here's The BEST One'. Show excited person with laptop and app icons."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400 min-h-[120px] resize-y"
                />
              </div>

              {/* Thumbnail Style Presets (Collapsible) */}
              <div>
                <button
                  onClick={() => setShowStyles(!showStyles)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Thumbnail Styles (Optional)</span>
                    {selectedStylePreset && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        {THUMBNAIL_STYLES.find(s => s.id === selectedStylePreset)?.name}
                      </span>
                    )}
                  </div>
                  {showStyles ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {showStyles && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {THUMBNAIL_STYLES.map(style => (
                      <div
                        key={style.id}
                        onClick={() => applyStylePreset(style.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedStylePreset === style.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm">{style.name}</h4>
                          {selectedStylePreset === style.id && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{style.description}</p>
                        <p className="text-xs text-blue-700 italic">{style.example}</p>
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
                  <div className="mt-4 space-y-4 p-4 border-2 border-gray-200 rounded-xl">
                    {/* Emotion Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Emotion
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'shocking', label: '😱 Shocking', description: 'Wide-eyed shock, high contrast' },
                          { value: 'curious', label: '🤔 Curious', description: 'Intriguing, mysterious' },
                          { value: 'exciting', label: '🎉 Exciting', description: 'Energetic, dynamic' },
                          { value: 'inspiring', label: '✨ Inspiring', description: 'Motivational, aspirational' },
                          { value: 'educational', label: '📚 Educational', description: 'Clear, informative' },
                          { value: 'entertaining', label: '😄 Entertaining', description: 'Fun, playful' }
                        ].map(emotion => (
                          <button
                            key={emotion.value}
                            onClick={() => setFormData({ ...formData, emotion: emotion.value })}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              formData.emotion === emotion.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-semibold text-sm">{emotion.label}</div>
                            <div className="text-xs text-gray-600">{emotion.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Scheme */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color Scheme
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'vibrant', label: 'Vibrant', colors: ['#FF0000', '#FFFF00', '#00FF00'] },
                          { value: 'pastel', label: 'Pastel', colors: ['#FFE5E5', '#FFD3E0', '#E8DFF5'] },
                          { value: 'dark', label: 'Dark', colors: ['#000000', '#1A1A2E', '#2D3142'] },
                          { value: 'neon', label: 'Neon', colors: ['#00F0FF', '#FF00FF', '#00FF85'] },
                          { value: 'monochrome', label: 'Monochrome', colors: ['#FFFFFF', '#000000', '#888888'] },
                          { value: 'complementary', label: 'Complementary', colors: ['#0066CC', '#FF9900', '#FFFFFF'] }
                        ].map(scheme => (
                          <button
                            key={scheme.value}
                            onClick={() => setFormData({ ...formData, color_scheme: scheme.value })}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              formData.color_scheme === scheme.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-sm font-medium mb-2">{scheme.label}</div>
                            <div className="flex gap-1">
                              {scheme.colors.map((color, i) => (
                                <div
                                  key={i}
                                  className="w-6 h-6 rounded"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Options */}
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                        <input
                          type="checkbox"
                          checked={formData.include_face}
                          onChange={(e) => setFormData({ ...formData, include_face: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">Include Face/Person</span>
                      </label>

                      <label className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                        <input
                          type="checkbox"
                          checked={formData.include_emoji}
                          onChange={(e) => setFormData({ ...formData, include_emoji: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">Include Emoji</span>
                      </label>

                      <label className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                        <input
                          type="checkbox"
                          checked={formData.include_arrow}
                          onChange={(e) => setFormData({ ...formData, include_arrow: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">Add Arrow</span>
                      </label>

                      <label className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                        <input
                          type="checkbox"
                          checked={formData.include_circle}
                          onChange={(e) => setFormData({ ...formData, include_circle: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">Add Circle Highlight</span>
                      </label>
                    </div>

                    {/* Face Expression */}
                    {formData.include_face && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Face Expression
                        </label>
                        <select
                          value={formData.face_expression}
                          onChange={(e) => setFormData({ ...formData, face_expression: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0"
                        >
                          <option value="shocked">😱 Shocked</option>
                          <option value="happy">😄 Happy</option>
                          <option value="serious">😐 Serious</option>
                          <option value="curious">🤔 Curious</option>
                          <option value="excited">🤩 Excited</option>
                        </select>
                      </div>
                    )}

                    {/* Layout & Text Options */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Layout
                        </label>
                        <select
                          value={formData.layout_preference}
                          onChange={(e) => setFormData({ ...formData, layout_preference: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0"
                        >
                          <option value="centered">Centered</option>
                          <option value="split">Split Screen</option>
                          <option value="rule-of-thirds">Rule of Thirds</option>
                          <option value="asymmetric">Asymmetric</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Style
                        </label>
                        <select
                          value={formData.font_style}
                          onChange={(e) => setFormData({ ...formData, font_style: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0"
                        >
                          <option value="bold">Bold (Impact)</option>
                          <option value="clean">Clean (Helvetica)</option>
                          <option value="modern">Modern (Verdana)</option>
                          <option value="retro">Retro (Courier)</option>
                        </select>
                      </div>
                    </div>

                    {/* Additional Options */}
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.use_gradient}
                          onChange={(e) => setFormData({ ...formData, use_gradient: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Use Gradient Backgrounds</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.optimize_for_mobile}
                          onChange={(e) => setFormData({ ...formData, optimize_for_mobile: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Optimize for Mobile (Recommended)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Generating thumbnail...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Thumbnail</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Thumbnail */}
            {templates.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Generated Thumbnail</h2>
                </div>

                {/* Quality Summary */}
                {templates[0] && (
                  <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {templates[0].qualityScore || 0}
                      </div>
                      <div className="text-xs text-gray-600">Quality Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-600">
                        {templates[0].ctr_score ? `${templates[0].ctr_score}%` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600">CTR Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {templates[0].optimized_for_mobile ? '✓' : '✗'}
                      </div>
                      <div className="text-xs text-gray-600">Mobile Optimized</div>
                    </div>
                  </div>
                )}

                {/* Thumbnail Display */}
                {templates[0] && (
                  <div
                    onClick={() => setSelectedTemplate(templates[0])}
                    className="group relative rounded-xl border-2 border-gray-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-2xl overflow-hidden"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-video bg-gray-900">
                      <img
                        src={templates[0].base64_data || templates[0].image_url}
                        alt={templates[0].title || 'Generated Thumbnail'}
                        className="w-full h-full object-cover"
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold shadow-lg">
                          View & Edit
                        </button>
                      </div>

                      {/* Quality Score Badge */}
                      {templates[0].qualityScore && (
                        <div className={`absolute top-2 left-2 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${getQualityScoreColor(templates[0].qualityScore)}`}>
                          <BarChart3 className="w-3 h-3" />
                          {templates[0].qualityScore}/100
                        </div>
                      )}

                      {/* CTR Score Badge */}
                      {templates[0].ctr_score && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs font-bold shadow-lg">
                          <TrendingUp className="w-3 h-3" />
                          {templates[0].ctr_score.toFixed(0)}% CTR
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="p-4 bg-white">
                      <div className="flex flex-wrap gap-2">
                        {templates[0].emotion && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">
                            {templates[0].emotion}
                          </span>
                        )}
                        {templates[0].color_scheme && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                            {templates[0].color_scheme}
                          </span>
                        )}
                        {templates[0].optimized_for_mobile && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            📱 Mobile Optimized
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CTR Tips */}
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">Tips for Better Thumbnails</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Use contrasting colors to make text stand out</li>
                        <li>• Include faces with clear expressions when relevant</li>
                        <li>• Keep text large and readable on mobile devices</li>
                        <li>• Test multiple variations to see what works best</li>
                        <li>• Use arrows and circles sparingly to draw attention</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  AI-Generated Thumbnail • Variation #{templates.findIndex(t => t.id === selectedTemplate.id) + 1}
                  {selectedTemplate.qualityScore && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getQualityScoreColor(selectedTemplate.qualityScore)}`}>
                      Quality: {selectedTemplate.qualityScore}/100
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRefineModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg transition-all hover:from-purple-700 hover:to-pink-700 text-sm font-semibold flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refine This
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold"
                >
                  Back to All
                </button>
              </div>
            </div>
            <ThumbnailImageViewer thumbnail={selectedTemplate} />
          </div>
        )}

        {/* Refine Modal */}
        {showRefineModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-6 h-6" />
                    <div>
                      <h3 className="text-xl font-bold">Refine Thumbnail</h3>
                      <p className="text-sm text-purple-100 mt-1">Tell us what you'd like to improve</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowRefineModal(false)
                      setRefineFeedback('')
                    }}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Current Thumbnail Preview */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Thumbnail
                  </label>
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                    <img
                      src={selectedTemplate?.base64_data || selectedTemplate?.image_url}
                      alt="Current thumbnail"
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                {/* Refinement Feedback Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    What would you like to change? *
                  </label>
                  <textarea
                    value={refineFeedback}
                    onChange={(e) => setRefineFeedback(e.target.value)}
                    placeholder="Examples:&#10;• Make the text larger and bolder&#10;• Change the background to blue&#10;• Add more excitement to the expression&#10;• Make the colors more vibrant&#10;• Position the face on the left side&#10;• Add a shocked expression"
                    className="w-full h-40 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                    disabled={refining}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Be specific about what you want to improve. The AI will regenerate the thumbnail based on your feedback.
                  </p>
                </div>

                {/* Example Refinements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">💡 Quick Refinement Suggestions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Make text much larger and bolder',
                      'Change to vibrant red/yellow colors',
                      'Add more shocked expression',
                      'Make more dramatic and eye-catching',
                      'Simplify the design',
                      'Add neon glow effects',
                      'Make face more prominent',
                      'Increase color saturation'
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setRefineFeedback(suggestion)}
                        className="text-left text-xs bg-white hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors border border-blue-200"
                        disabled={refining}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleRefine}
                    disabled={refining || !refineFeedback.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {refining ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Refining Thumbnail...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Refine Thumbnail
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowRefineModal(false)
                      setRefineFeedback('')
                    }}
                    disabled={refining}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>

                {/* Cost Notice */}
                <p className="text-xs text-center text-gray-500">
                  Refinement will generate 1 new thumbnail based on your feedback (~30 seconds)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
