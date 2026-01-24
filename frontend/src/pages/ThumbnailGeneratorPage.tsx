import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Image, Sparkles, Loader, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface ThumbnailIdea {
  visual_element: string
  text_overlay: string
  color_scheme: string
  expression: string
  composition: string
}

interface HistoryItem {
  id: string
  title: string
  topic: string
  ideas: ThumbnailIdea[]
  timestamp: Date
}

export default function ThumbnailGeneratorPage() {
  const [formData, setFormData] = useState({
    videoTitle: '',
    videoTopic: '',
    count: 3
  })
  const [ideas, setIdeas] = useState<ThumbnailIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const handleGenerate = async () => {
    if (!formData.videoTitle || !formData.videoTopic) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    setTimeout(() => {
      const mockIdeas: ThumbnailIdea[] = Array.from({ length: formData.count }, (_, i) => ({
        visual_element: `Close-up of excited face with ${formData.videoTopic} elements in background`,
        text_overlay: `${formData.videoTitle.slice(0, 20)}...`,
        color_scheme: ['Vibrant red and yellow', 'Cool blue and purple', 'Bold orange and black'][i] || 'Vibrant colors',
        expression: ['Shocked expression', 'Excited smile', 'Pointing gesture'][i] || 'Engaging',
        composition: ['Rule of thirds, face on left', 'Center focus with text overlay', 'Split screen design'][i] || 'Balanced'
      }))
      
      setIdeas(mockIdeas)
      
      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        title: formData.videoTitle,
        topic: formData.videoTopic,
        ideas: mockIdeas,
        timestamp: new Date()
      }
      setHistory([newHistoryItem, ...history])
      
      setLoading(false)
      toast.success('Thumbnail ideas generated!')
    }, 1500)
  }

  const loadFromHistory = (item: HistoryItem) => {
    setFormData({
      videoTitle: item.title,
      videoTopic: item.topic,
      count: item.ideas.length
    })
    setIdeas(item.ideas)
    setShowHistory(false)
    toast.success('Loaded from history')
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Thumbnail Ideas</h1>
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
            <h3 className="font-semibold text-gray-900 mb-4">Recent Generations</h3>
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="font-semibold text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {item.topic} • {item.ideas.length} ideas • {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Title *
              </label>
              <input
                type="text"
                value={formData.videoTitle}
                onChange={(e) => setFormData({ ...formData, videoTitle: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, videoTopic: e.target.value })}
                className="input"
                placeholder="e.g., Productivity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Ideas
              </label>
              <input
                type="number"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                className="input"
                min="1"
                max="5"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Ideas</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thumbnail Concepts</h2>
            {ideas.length > 0 ? (
              <div className="space-y-4">
                {ideas.map((idea, index) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                    <div className="font-bold text-lg text-blue-900 mb-3">Concept {index + 1}</div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Visual Element:</span>
                        <p className="text-gray-600 mt-1">{idea.visual_element}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Text Overlay:</span>
                        <p className="text-gray-600 mt-1 font-bold">{idea.text_overlay}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Color Scheme:</span>
                        <p className="text-gray-600 mt-1">{idea.color_scheme}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Expression:</span>
                        <p className="text-gray-600 mt-1">{idea.expression}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Composition:</span>
                        <p className="text-gray-600 mt-1">{idea.composition}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Image className="w-16 h-16 mb-4" />
                <p>Your thumbnail ideas will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
