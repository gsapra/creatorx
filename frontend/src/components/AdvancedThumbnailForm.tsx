import { ChevronDown, ChevronUp, Sparkles, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import ImageUploader from './ImageUploader'

interface UploadedImage {
  id: string
  filename: string
  url: string
  base64_data: string
  width: number
  height: number
  size: number
  isReference: boolean
}

interface AdvancedFormData {
  videoTitle: string
  videoTopic: string
  count: number
  style: string
  emotion: string
  include_face: boolean
  face_expression: string
  color_scheme: string
  use_gradient: boolean
  font_style: string
  text_emphasis: string
  include_emoji: boolean
  layout_preference: string
  text_position: string
  optimize_for_mobile: boolean
  include_arrow: boolean
  include_circle: boolean
  target_platform: string
}

interface AdvancedThumbnailFormProps {
  formData: AdvancedFormData
  onChange: (data: AdvancedFormData) => void
  onGenerate: () => void
  loading: boolean
  uploadedImages?: UploadedImage[]
  onImagesChange?: (images: UploadedImage[]) => void
}

export default function AdvancedThumbnailForm({
  formData,
  onChange,
  onGenerate,
  loading,
  uploadedImages = [],
  onImagesChange
}: AdvancedThumbnailFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)

  const updateField = (field: keyof AdvancedFormData, value: any) => {
    onChange({ ...formData, [field]: value })
  }

  const EMOTIONS = [
    { value: 'shocking', label: '😱 Shocking', description: 'Wide-eyed shock, high contrast' },
    { value: 'curious', label: '🤔 Curious', description: 'Intriguing, mysterious' },
    { value: 'exciting', label: '🎉 Exciting', description: 'Energetic, dynamic' },
    { value: 'inspiring', label: '✨ Inspiring', description: 'Motivational, aspirational' },
    { value: 'educational', label: '📚 Educational', description: 'Clear, informative' },
    { value: 'entertaining', label: '😄 Entertaining', description: 'Fun, playful' }
  ]

  const COLOR_SCHEMES = [
    { value: 'vibrant', label: 'Vibrant', colors: ['#FF0000', '#FFFF00', '#00FF00'] },
    { value: 'pastel', label: 'Pastel', colors: ['#FFE5E5', '#FFD3E0', '#E8DFF5'] },
    { value: 'dark', label: 'Dark', colors: ['#000000', '#1A1A2E', '#2D3142'] },
    { value: 'neon', label: 'Neon', colors: ['#00F0FF', '#FF00FF', '#00FF85'] },
    { value: 'monochrome', label: 'Monochrome', colors: ['#FFFFFF', '#000000', '#888888'] },
    { value: 'complementary', label: 'Complementary', colors: ['#0066CC', '#FF9900', '#FFFFFF'] }
  ]

  const STYLES = [
    { value: 'modern', label: 'Modern' },
    { value: 'bold', label: 'Bold' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'dramatic', label: 'Dramatic' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'vlog', label: 'Vlog' }
  ]

  const LAYOUTS = [
    { value: 'centered', label: 'Centered' },
    { value: 'split', label: 'Split Screen' },
    { value: 'rule-of-thirds', label: 'Rule of Thirds' },
    { value: 'asymmetric', label: 'Asymmetric' }
  ]

  const FACE_EXPRESSIONS = [
    { value: 'shocked', label: '😱 Shocked' },
    { value: 'happy', label: '😄 Happy' },
    { value: 'serious', label: '😐 Serious' },
    { value: 'curious', label: '🤔 Curious' },
    { value: 'excited', label: '🤩 Excited' }
  ]

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Thumbnail Settings</h2>
        <span className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full font-semibold">
          PRO MODE
        </span>
      </div>

      {/* Basic Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Title *
        </label>
        <input
          type="text"
          value={formData.videoTitle}
          onChange={(e) => updateField('videoTitle', e.target.value)}
          className="input"
          placeholder="e.g., 10 Life-Changing Productivity Tips"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Topic *
        </label>
        <input
          type="text"
          value={formData.videoTopic}
          onChange={(e) => updateField('videoTopic', e.target.value)}
          className="input"
          placeholder="e.g., Productivity"
        />
      </div>

      {/* Emotion Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Emotion
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EMOTIONS.map(emotion => (
            <button
              key={emotion.value}
              onClick={() => updateField('emotion', emotion.value)}
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
          {COLOR_SCHEMES.map(scheme => (
            <button
              key={scheme.value}
              onClick={() => updateField('color_scheme', scheme.value)}
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
            onChange={(e) => updateField('include_face', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium">Include Face/Person</span>
        </label>

        <label className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
          <input
            type="checkbox"
            checked={formData.include_emoji}
            onChange={(e) => updateField('include_emoji', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium">Include Emoji</span>
        </label>

        <label className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
          <input
            type="checkbox"
            checked={formData.include_arrow}
            onChange={(e) => updateField('include_arrow', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium">Add Arrow</span>
        </label>

        <label className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
          <input
            type="checkbox"
            checked={formData.include_circle}
            onChange={(e) => updateField('include_circle', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium">Add Circle Highlight</span>
        </label>
      </div>

      {/* Image Upload Toggle */}
      <button
        onClick={() => setShowImageUpload(!showImageUpload)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-sm text-purple-900">
            Upload Your Images {uploadedImages.length > 0 && `(${uploadedImages.length})`}
          </span>
        </div>
        {showImageUpload ? <ChevronUp className="w-5 h-5 text-purple-600" /> : <ChevronDown className="w-5 h-5 text-purple-600" />}
      </button>

      {showImageUpload && onImagesChange && (
        <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50/30">
          <ImageUploader
            onImagesChange={onImagesChange}
            maxImages={5}
          />
        </div>
      )}

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="font-semibold text-sm">Advanced Options</span>
        {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Face Expression */}
          {formData.include_face && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Face Expression
              </label>
              <select
                value={formData.face_expression}
                onChange={(e) => updateField('face_expression', e.target.value)}
                className="input"
              >
                {FACE_EXPRESSIONS.map(expr => (
                  <option key={expr.value} value={expr.value}>{expr.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Style & Layout */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <select
                value={formData.style}
                onChange={(e) => updateField('style', e.target.value)}
                className="input"
              >
                {STYLES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layout
              </label>
              <select
                value={formData.layout_preference}
                onChange={(e) => updateField('layout_preference', e.target.value)}
                className="input"
              >
                {LAYOUTS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Text Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Position
              </label>
              <select
                value={formData.text_position}
                onChange={(e) => updateField('text_position', e.target.value)}
                className="input"
              >
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
                <option value="side">Side</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Style
              </label>
              <select
                value={formData.font_style}
                onChange={(e) => updateField('font_style', e.target.value)}
                className="input"
              >
                <option value="bold">Bold (Impact)</option>
                <option value="clean">Clean (Helvetica)</option>
                <option value="modern">Modern (Verdana)</option>
                <option value="retro">Retro (Courier)</option>
              </select>
            </div>
          </div>

          {/* Platform & Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Platform
              </label>
              <select
                value={formData.target_platform}
                onChange={(e) => updateField('target_platform', e.target.value)}
                className="input"
              >
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">Twitter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Variants
              </label>
              <input
                type="number"
                value={formData.count}
                onChange={(e) => updateField('count', parseInt(e.target.value))}
                className="input"
                min="1"
                max="5"
              />
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.use_gradient}
                onChange={(e) => updateField('use_gradient', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Use Gradient Backgrounds</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.optimize_for_mobile}
                onChange={(e) => updateField('optimize_for_mobile', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Optimize for Mobile (Recommended)</span>
            </label>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={loading || !formData.videoTitle || !formData.videoTopic}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Generating AI Thumbnails...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate {formData.count} Advanced Thumbnails</span>
          </>
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        AI-powered generation with CTR optimization and emotion targeting
      </p>
    </div>
  )
}
