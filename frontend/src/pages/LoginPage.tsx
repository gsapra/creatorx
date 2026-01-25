import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, Mail, Lock, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiUrl } from '../config'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // OAuth2 expects form data, not JSON
      const formData = new URLSearchParams()
      formData.append('username', email) // OAuth2 uses 'username' field for email
      formData.append('password', password)

      // Call the actual login API with remember_me parameter
      const response = await fetch(apiUrl(`/api/v1/auth/login?remember_me=${rememberMe}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Login failed' }))
        throw new Error(errorData.detail || 'Invalid email or password')
      }

      const data = await response.json()

      // Save tokens based on "Remember me" preference
      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem('token', data.access_token)
      storage.setItem('refresh_token', data.refresh_token)
      storage.setItem('rememberMe', rememberMe.toString())

      // Fetch user info
      const userResponse = await fetch(apiUrl('/api/v1/auth/me'), {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        storage.setItem('user', JSON.stringify(userData))
      }

      console.log('[Login] Success! Token saved to', rememberMe ? 'localStorage' : 'sessionStorage')

      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (error) {
      console.error('[Login] Error:', error)
      toast.error(error instanceof Error ? error.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-brand-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to home</span>
        </button>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <Sparkles className="w-10 h-10 text-brand-600" />
            <h1 className="text-3xl font-bold bg-brand-600 bg-clip-text text-transparent">
              CreatorX
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Welcome Back!</h2>
          <p className="text-gray-600 text-center mb-8">Sign in to continue creating</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-brand-600 hover:text-brand-700">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-brand-600 font-semibold hover:text-brand-700">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
