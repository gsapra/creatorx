import { Download, Share2, Sparkles, Edit3 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import ThumbnailLayerEditor from './ThumbnailLayerEditor'

interface ThumbnailImageViewerProps {
  thumbnail: {
    id: string
    title: string
    image_url: string
    base64_data?: string
    prompt?: string
    emotion?: string
    color_scheme?: string
    layout?: string
    ctr_score?: number
    variation?: number
    uploaded_layers?: Array<{
      id: string
      url?: string
      base64_data: string
      width: number
      height: number
    }>
  }
}

export default function ThumbnailImageViewer({ thumbnail }: ThumbnailImageViewerProps) {
  const [editMode, setEditMode] = useState(false)

  const downloadImage = async () => {
    try {
      const imageData = thumbnail.base64_data || thumbnail.image_url

      if (imageData.startsWith('data:')) {
        // Base64 data
        const link = document.createElement('a')
        link.href = imageData
        link.download = `thumbnail-${thumbnail.id}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // URL
        const response = await fetch(imageData)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `thumbnail-${thumbnail.id}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }

      toast.success('Thumbnail downloaded!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download thumbnail')
    }
  }

  const shareImage = async () => {
    if (navigator.share) {
      try {
        const imageData = thumbnail.base64_data || thumbnail.image_url

        if (imageData.startsWith('data:')) {
          // Convert base64 to blob
          const response = await fetch(imageData)
          const blob = await response.blob()
          const file = new File([blob], `thumbnail-${thumbnail.id}.png`, { type: 'image/png' })

          await navigator.share({
            title: thumbnail.title,
            text: 'Check out this AI-generated thumbnail!',
            files: [file]
          })
        } else {
          await navigator.share({
            title: thumbnail.title,
            text: 'Check out this AI-generated thumbnail!',
            url: imageData
          })
        }
        toast.success('Thumbnail shared!')
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share error:', error)
          toast.error('Failed to share thumbnail')
        }
      }
    } else {
      toast.error('Sharing not supported on this device')
    }
  }

  if (editMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl">
          <div>
            <h3 className="font-bold text-lg">Edit Mode</h3>
            <p className="text-sm text-blue-100">Add text, images, and shapes to customize your thumbnail</p>
          </div>
          <button
            onClick={() => setEditMode(false)}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Back to View
          </button>
        </div>
        <ThumbnailLayerEditor
          baseImageUrl={thumbnail.base64_data || thumbnail.image_url}
          uploadedLayers={thumbnail.uploaded_layers}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Image Display */}
      <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-gray-200 bg-gray-900">
        <img
          src={thumbnail.base64_data || thumbnail.image_url}
          alt={thumbnail.title}
          className="w-full h-auto"
          style={{ aspectRatio: '16/9' }}
        />

        {/* CTR Score Overlay */}
        {thumbnail.ctr_score && (
          <div className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold shadow-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {thumbnail.ctr_score.toFixed(0)}% Predicted CTR
          </div>
        )}

        {/* Variation Badge */}
        {thumbnail.variation && (
          <div className="absolute top-4 left-4 px-3 py-1 bg-black bg-opacity-70 text-white rounded-full text-sm font-semibold">
            Variation #{thumbnail.variation}
          </div>
        )}
      </div>

      {/* Thumbnail Metadata */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="text-xs text-purple-600 font-semibold uppercase mb-1">Emotion</div>
          <div className="text-lg font-bold text-purple-900 capitalize">{thumbnail.emotion || 'N/A'}</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-600 font-semibold uppercase mb-1">Color Scheme</div>
          <div className="text-lg font-bold text-blue-900 capitalize">{thumbnail.color_scheme || 'N/A'}</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="text-xs text-green-600 font-semibold uppercase mb-1">Layout</div>
          <div className="text-lg font-bold text-green-900 capitalize">{thumbnail.layout?.replace(/-/g, ' ') || 'N/A'}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={downloadImage}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
        >
          <Download className="w-5 h-5" />
          Download HD
        </button>

        <button
          onClick={() => setEditMode(true)}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg"
        >
          <Edit3 className="w-5 h-5" />
          Edit & Add Layers
        </button>

        <button
          onClick={shareImage}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
        >
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>


      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm space-y-2">
          <p className="font-semibold text-blue-900">💡 Pro Tips:</p>
          <ul className="text-blue-800 space-y-1 ml-4 list-disc">
            <li>Click "Edit & Add Layers" to add custom text or images</li>
            <li>Download in HD quality (1792x1024) perfect for YouTube</li>
            <li>Test different emotions and color schemes for best CTR</li>
            <li>A/B test multiple variations to see what performs best</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
