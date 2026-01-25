import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, Mail, Lock, User, Briefcase, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiUrl } from '../config'

export default function SignupPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'creator'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      // Call the actual signup API
      const response = await fetch(apiUrl('/api/v1/auth/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.email.split('@')[0], // Use email prefix as username
          password: formData.password,
          full_name: formData.fullName,
          role: formData.role
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Signup failed' }))
        throw new Error(errorData.detail || 'Failed to create account')
      }

      const userData = await response.json()
      
      // After signup, need to login to get token
      const loginFormData = new URLSearchParams()
      loginFormData.append('username', formData.email)
      loginFormData.append('password', formData.password)

      const loginResponse = await fetch(apiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: loginFormData.toString()
      })

      if (loginResponse.ok) {
        const loginData = await loginResponse.json()
        localStorage.setItem('token', loginData.access_token)
        localStorage.setItem('user', JSON.stringify(userData))
      }
      
      console.log('[Signup] Success! User created and logged in')
      
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (error) {
      console.error('[Signup] Error:', error)
      toast.error(error instanceof Error ? error.message : 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Signup Card */}
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

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Create Your Account</h2>
          <p className="text-gray-600 text-center mb-8">Start your creator journey today</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'creator' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'creator'
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2 text-brand-600" />
                  <div className="text-sm font-semibold">Creator</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'brand' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'brand'
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <Briefcase className="w-6 h-6 mx-auto mb-2 text-brand-600" />
                  <div className="text-sm font-semibold">Brand</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="input pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
