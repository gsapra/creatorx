import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Settings, User, Wallet } from 'lucide-react'
import GlassCard from '../components/modern/GlassCard'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Profile form states
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.full_name || '',
        email: user.email || '',
        phone: '',
        location: ''
      })
    }
  }, [user])

  useEffect(() => {
    // Apply dark mode on mount
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleDarkModeToggle = () => {
    const newValue = !darkMode
    setDarkMode(newValue)
    localStorage.setItem('darkMode', String(newValue))

    if (newValue) {
      document.documentElement.classList.add('dark')
      toast.success('Dark mode enabled')
    } else {
      document.documentElement.classList.remove('dark')
      toast.success('Dark mode disabled')
    }
  }

  const handleProfileUpdate = () => {
    // TODO: Implement API call to update profile
    toast.success('Profile updated successfully')
    setActiveSection(null)
  }

  const settingsSections = [
    {
      icon: User,
      title: 'Profile Settings',
      description: 'Manage your account information and preferences',
      color: 'blue',
      id: 'profile',
      action: () => setActiveSection('profile')
    },
    {
      icon: Wallet,
      title: 'Wallet',
      description: 'Manage payments and earnings',
      color: 'emerald',
      id: 'wallet',
      action: () => navigate('/dashboard/wallet')
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-24">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account and preferences</p>
          </div>
        </div>

        {/* Quick Toggles */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">Dark Mode</div>
                <div className="text-sm text-gray-600">Switch to dark theme</div>
              </div>
              <button
                onClick={handleDarkModeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-brand-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Profile Settings Section */}
        {activeSection === 'profile' ? (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
              <button
                onClick={() => setActiveSection(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleProfileUpdate}
                  className="px-6 py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold rounded-lg hover:from-brand-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </GlassCard>
        ) : (
          <>
            {/* Settings Categories */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settingsSections.map((section, index) => {
                  const Icon = section.icon
                  const colorClasses: { [key: string]: string } = {
                    blue: 'from-blue-100 to-blue-200',
                    emerald: 'from-emerald-100 to-emerald-200',
                  }
                  const iconColorClasses: { [key: string]: string } = {
                    blue: 'text-blue-600',
                    emerald: 'text-emerald-600',
                  }
                  return (
                    <GlassCard
                      key={index}
                      onClick={section.action}
                      className="p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[section.color] || colorClasses.blue} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${iconColorClasses[section.color] || iconColorClasses.blue}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {section.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
