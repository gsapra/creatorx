import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Copy, Download, Check, Loader, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiUrl } from '../config'

export default function SharedScriptPage() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [script, setScript] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchSharedScript = async () => {
      if (!shareToken) {
        setError('Invalid share link')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(apiUrl(`/api/v1/content/shared/${shareToken}`))
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('This script is no longer available or the link is invalid')
          } else {
            setError('Failed to load shared script')
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        setScript(data)
      } catch (err) {
        console.error('Failed to fetch shared script:', err)
        setError('Failed to load shared script')
      } finally {
        setLoading(false)
      }
    }

    fetchSharedScript()
  }, [shareToken])

  const copyToClipboard = async () => {
    if (!script?.content_text) return
    
    try {
      await navigator.clipboard.writeText(script.content_text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const downloadScript = () => {
    if (!script?.content_text) return
    
    const blob = new Blob([script.content_text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const topic = script.meta_data?.topic || script.title?.replace('Script: ', '') || 'script'
    a.download = `${topic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Script downloaded!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading shared script...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Script Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  const topic = script?.meta_data?.topic || script?.title?.replace('Script: ', '') || 'Untitled Script'
  const duration = script?.meta_data?.duration_minutes
  const tone = script?.meta_data?.tone
  const targetAudience = script?.meta_data?.target_audience

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto p-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{topic}</h1>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-600">
            {duration && (
              <span className="px-3 py-1 bg-gray-100 rounded-full">
                ⏱️ {duration} minutes
              </span>
            )}
            {tone && (
              <span className="px-3 py-1 bg-gray-100 rounded-full">
                🎭 {tone} tone
              </span>
            )}
            {targetAudience && (
              <span className="px-3 py-1 bg-gray-100 rounded-full">
                👥 {targetAudience}
              </span>
            )}
          </div>
        </div>

        {/* Script Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {script?.content_text}
            </pre>
          </div>
          
          {/* Action Buttons */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Script'}</span>
              </button>
              <button
                onClick={downloadScript}
                className="flex-1 py-2.5 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Want to create your own AI-powered scripts?</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg transform hover:scale-105"
          >
            Try CreatorX for Free
          </button>
        </div>
      </div>
    </div>
  )
}
