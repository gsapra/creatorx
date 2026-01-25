import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import ThumbnailImageViewer from '../components/ThumbnailImageViewer'
import AdvancedThumbnailForm from '../components/AdvancedThumbnailForm'
import { Image, Sparkles, Loader, Clock, Trash2, Grid3x3, Palette, TrendingUp, Zap, RefreshCw, X } from 'lucide-react'
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
}

interface HistoryItem {
  id: string
  title: string
  topic: string
  templates: ThumbnailTemplate[]
  timestamp: Date
}

const STYLE_OPTIONS = [
  { value: 'modern', label: 'Modern', description: 'Clean geometric shapes, bright gradients' },
  { value: 'bold', label: 'Bold', description: 'High contrast, large text, dramatic colors' },
  { value: 'minimalist', label: 'Minimalist', description: 'Simple, elegant, few elements' },
  { value: 'dramatic', label: 'Dramatic', description: 'Dark backgrounds, cinematic look' },
  { value: 'gaming', label: 'Gaming', description: 'Neon colors, futuristic, high energy' },
  { value: 'vlog', label: 'Vlog', description: 'Casual, friendly, warm colors' }
]

export default function ThumbnailGeneratorPage() {
  const [formData, setFormData] = useState({
    videoTitle: '',
    videoTopic: '',
    count: 3,
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
    target_platform: 'youtube'
  })
  const [templates, setTemplates] = useState<ThumbnailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ThumbnailTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<any[]>([])
  const [showRefineModal, setShowRefineModal] = useState(false)
  const [refineFeedback, setRefineFeedback] = useState('')
  const [refining, setRefining] = useState(false)

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
              templates: item.meta_data?.templates || [],
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

  const handleGenerate = async () => {
    if (!formData.videoTitle || !formData.videoTopic) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      // Separate uploaded images into use vs reference
      const imagesToUse = uploadedImages.filter(img => !img.isReference)
      const referenceImages = uploadedImages.filter(img => img.isReference)

      const requestBody = {
        video_title: formData.videoTitle,
        video_topic: formData.videoTopic,
        count: parseInt(formData.count.toString(), 10),
        style: formData.style,
        ai_model: 'openai',
        persona_id: null,
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
        target_platform: formData.target_platform,
        // Image data
        custom_images: imagesToUse.length > 0 ? imagesToUse.map(img => ({
          id: img.id,
          url: img.url,
          base64_data: img.base64_data,
          width: img.width,
          height: img.height
        })) : null,
        reference_images: referenceImages.length > 0 ? referenceImages.map(img => ({
          id: img.id,
          url: img.url,
          base64_data: img.base64_data,
          width: img.width,
          height: img.height
        })) : null,
        use_uploaded_image: imagesToUse.length > 0
      }

      console.log('[Thumbnail Generation] Advanced Request with images:', {
        ...requestBody,
        custom_images: imagesToUse.length,
        reference_images: referenceImages.length
      })
      const response = await apiPost('/api/v1/creator-tools/generate-thumbnail-ideas', requestBody)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to generate thumbnails')
      }

      const data = await response.json()
      // Handle both new format (thumbnails) and old format (templates with layers)
      let generatedTemplates = data.meta_data?.templates || data.thumbnails || []

      // Convert to new format if needed
      generatedTemplates = generatedTemplates.map((t: any) => ({
        id: t.id,
        title: t.title || formData.videoTitle,
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
        uploaded_layers: t.uploaded_layers || [] // Pass through uploaded layers
      }))

      setTemplates(generatedTemplates)
      if (generatedTemplates.length > 0) {
        setSelectedTemplate(generatedTemplates[0])
      }

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: data.id?.toString() || Date.now().toString(),
        title: formData.videoTitle || 'Untitled',
        topic: formData.videoTopic || '',
        templates: generatedTemplates,
        timestamp: new Date()
      }
      setHistory([newHistoryItem, ...history])

      toast.success('Thumbnails generated! Click to edit.')
    } catch (error) {
      console.error('Thumbnail generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate thumbnails'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    setFormData({
      videoTitle: item.title,
      videoTopic: item.topic,
      count: item.templates.length,
      style: item.templates[0]?.style || 'bold',
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
      target_platform: 'youtube'
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
      // Separate uploaded images into use vs reference
      const imagesToUse = uploadedImages.filter(img => !img.isReference)
      const referenceImages = uploadedImages.filter(img => img.isReference)

      const requestBody = {
        video_title: formData.videoTitle,
        video_topic: formData.videoTopic,
        count: 1, // Only refine 1 image
        style: formData.style,
        ai_model: 'openai',
        persona_id: null,
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
        // Image data
        custom_images: imagesToUse.length > 0 ? imagesToUse.map(img => ({
          id: img.id,
          url: img.url,
          base64_data: img.base64_data,
          width: img.width,
          height: img.height
        })) : null,
        reference_images: referenceImages.length > 0 ? referenceImages.map(img => ({
          id: img.id,
          url: img.url,
          base64_data: img.base64_data,
          width: img.width,
          height: img.height
        })) : null,
        use_uploaded_image: imagesToUse.length > 0,
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
      refinedTemplates = refinedTemplates.map((t: any) => ({
        id: t.id,
        title: t.title || formData.videoTitle,
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
        uploaded_layers: t.uploaded_layers || [] // Preserve uploaded layers
      }))

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
      toast.success('Thumbnails deleted')
    } catch (error) {
      console.error('Failed to delete history item:', error)
      toast.error('Failed to delete thumbnails')
    } finally {
      setDeletingId(null)
      setDeleteConfirm(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Thumbnail Creator</h1>
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
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <h3 className="font-bold text-gray-900 text-lg">Thumbnail History</h3>
                  <p className="text-sm text-gray-600 mt-1">{history.length} saved thumbnail sets</p>
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
                                <span className="px-2 py-1 bg-gray-100 rounded-full">
                                  🎨 {item.templates.length} templates
                                </span>
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
                              title="Delete thumbnails"
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
                              <p className="text-sm font-medium text-gray-900 mb-3">Delete these thumbnails?</p>
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
                <p className="text-sm text-gray-600">Generate your first thumbnails to see them here</p>
              </div>
            )}
          </div>
        )}

        {!selectedTemplate ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <AdvancedThumbnailForm
              formData={formData}
              onChange={setFormData}
              onGenerate={handleGenerate}
              loading={loading}
              uploadedImages={uploadedImages}
              onImagesChange={setUploadedImages}
            />

            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thumbnail Templates</h2>
              {templates.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {templates.map((template, index) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className="group relative rounded-xl border-2 border-gray-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-2xl overflow-hidden"
                    >
                      {/* Thumbnail Image */}
                      <div className="relative aspect-video bg-gray-900">
                        <img
                          src={template.base64_data || template.image_url}
                          alt={template.title || `Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg">
                            View & Download
                          </button>
                        </div>

                        {/* CTR Score Badge */}
                        {template.ctr_score && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs font-bold shadow-lg">
                            <TrendingUp className="w-3 h-3" />
                            {template.ctr_score.toFixed(0)}% CTR
                          </div>
                        )}

                        {/* Variation Badge */}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white rounded-full text-xs font-semibold">
                          #{index + 1}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="p-3 bg-white">
                        <div className="flex flex-wrap gap-1.5">
                          {template.emotion && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium capitalize">
                              {template.emotion}
                            </span>
                          )}
                          {template.color_scheme && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                              {template.color_scheme}
                            </span>
                          )}
                          {template.optimized_for_mobile && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              📱 Mobile
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Grid3x3 className="w-16 h-16 mb-4" />
                  <p>Your thumbnail templates will appear here</p>
                  <p className="text-sm mt-2">Generate thumbnails to start editing</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.title}</h2>
                <p className="text-sm text-gray-600 mt-1">AI-Generated Thumbnail • Variation #{templates.findIndex(t => t.id === selectedTemplate.id) + 1}</p>
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
                  <p className="text-sm font-semibold text-blue-900 mb-2">💡 Refinement Examples:</p>
                  <div className="space-y-1.5 text-sm text-blue-800">
                    <button
                      onClick={() => setRefineFeedback('Make the text much larger and more bold with a strong outline')}
                      className="block w-full text-left hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                      disabled={refining}
                    >
                      • Make the text much larger and more bold
                    </button>
                    <button
                      onClick={() => setRefineFeedback('Change background to vibrant red and yellow colors')}
                      className="block w-full text-left hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                      disabled={refining}
                    >
                      • Change to vibrant red and yellow colors
                    </button>
                    <button
                      onClick={() => setRefineFeedback('Add a more shocked and surprised facial expression')}
                      className="block w-full text-left hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                      disabled={refining}
                    >
                      • Add more shocked expression
                    </button>
                    <button
                      onClick={() => setRefineFeedback('Make the overall design more dramatic and eye-catching')}
                      className="block w-full text-left hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                      disabled={refining}
                    >
                      • Make more dramatic and eye-catching
                    </button>
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
