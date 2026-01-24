import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Type, Sparkles, Loader, ThumbsUp, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePersonas } from '../contexts/PersonaContext'

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
  const { getAudiencePersonas, personas } = usePersonas()
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

  const handleGenerate = async () => {
    if (!formData.topic) {
      toast.error('Please enter a topic')
      return
    }

    setLoading(true)

    // Get selected persona for context
    const audiencePersona = personas.find(p => p.id === formData.audiencePersonaId)
    
    // Build persona-aware titles
    setTimeout(() => {
      const baseWords = audiencePersona?.interests?.split(',')[0].trim() || formData.topic
      const painPoint = audiencePersona?.pain_points?.split(',')[0].trim() || 'Common Mistakes'
      const languageLevel = audiencePersona?.language_level || 'Intermediate'
      
      const mockTitles = [
        `${formData.topic} - The ULTIMATE Guide for ${audiencePersona?.name || 'Beginners'} [2026]`,
        `How ${audiencePersona ? audiencePersona.name : 'I'} Master ${formData.topic} (You Won't Believe #3!)`,
        `${formData.topic}: 10 Secrets ${audiencePersona ? audiencePersona.name + ' Need' : 'Pros Don\'t Want You'} To Know`,
        `Why Everyone ${audiencePersona ? `in ${baseWords}` : ''} is Talking About ${formData.topic} Right Now`,
        `${formData.topic} Explained in 5 Minutes (${languageLevel} Level)`,
        `The Truth About ${formData.topic} and ${painPoint} That Nobody Tells You`,
        `${formData.topic}: Complete ${audiencePersona?.language_level || 'Beginner'}'s Guide (STEP-BY-STEP)`,
        `I Tried ${formData.topic} for 30 Days to ${audiencePersona?.goals?.split(',')[0] || 'Achieve Success'} - Here's What Happened`,
        `${formData.topic} for ${audiencePersona?.age_range || 'Everyone'}: Which Method is Better?`,
        `${formData.topic}: Avoid These ${painPoint} (7 Common Mistakes)`
      ].slice(0, formData.count)
      
      setTitles(mockTitles)
      
      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        topic: formData.topic,
        titles: mockTitles,
        timestamp: new Date(),
        formData: { ...formData }
      }
      setHistory([newHistoryItem, ...history])
      
      setLoading(false)
      toast.success('Titles generated successfully!')
    }, 1500)
  }

  const loadFromHistory = (item: HistoryItem) => {
    setFormData(item.formData)
    setTitles(item.titles)
    setShowHistory(false)
    toast.success('Loaded from history')
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

        {showHistory && history.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Generations</h3>
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-pink-50 cursor-pointer transition-colors"
                >
                  <div className="font-semibold text-gray-900">{item.topic}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {item.titles.length} titles • {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
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
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
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
