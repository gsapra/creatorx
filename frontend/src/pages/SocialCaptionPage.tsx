import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Share2, Sparkles, Loader, Clock, Instagram, Twitter, Youtube, Linkedin } from 'lucide-react'
import toast from 'react-hot-toast'

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
    setTimeout(() => {
      const mockCaption = formData.platform === 'instagram' 
        ? `✨ ${formData.content}\n\nDouble tap if you agree! 💯\n\n${formData.includeHashtags ? '#content #creator #socialmedia #digitalmarketing #contentcreator' : ''}`
        : formData.platform === 'twitter'
        ? `${formData.includeEmojis ? '🚀 ' : ''}${formData.content}\n\n${formData.includeHashtags ? '#ContentCreation #SocialMedia' : ''}`
        : formData.platform === 'youtube'
        ? `${formData.content}\n\n👉 Don't forget to LIKE, COMMENT, and SUBSCRIBE!\n\n${formData.includeHashtags ? '#YouTube #ContentCreator' : ''}`
        : `Excited to share: ${formData.content}\n\nThoughts? Let me know in the comments!\n\n${formData.includeHashtags ? '#Professional #ContentCreation' : ''}`
      
      setCaption(mockCaption)
      
      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        platform: formData.platform,
        content: formData.content,
        caption: mockCaption,
        timestamp: new Date()
      }
      setHistory([newHistoryItem, ...history])
      
      setLoading(false)
      toast.success('Caption generated!')
    }, 1500)
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

        {showHistory && history.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Captions</h3>
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                      {item.platform}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-2">{item.caption}</div>
                </div>
              ))}
            </div>
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
              className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
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
