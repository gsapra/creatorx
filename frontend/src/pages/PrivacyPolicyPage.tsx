import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/70 backdrop-blur-2xl sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative">
                <div className="absolute inset-0 bg-brand-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <Sparkles className="w-8 h-8 text-brand-600 animate-pulse relative z-10" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-600 via-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                CreatorX
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <div className="text-gray-600 text-sm mb-8">Last Updated: January 26, 2026</div>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="leading-relaxed">
                Welcome to CreatorX. We respect your privacy and are committed to protecting your personal data.
                This privacy policy will inform you about how we look after your personal data when you visit our
                platform and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <p className="leading-relaxed mb-3">
                We may collect, use, store and transfer different kinds of personal data about you:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Identity Data: name, username, profile information</li>
                <li>Contact Data: email address, phone number</li>
                <li>Technical Data: IP address, browser type, device information</li>
                <li>Usage Data: information about how you use our platform</li>
                <li>Content Data: scripts, titles, and other content you create</li>
                <li>Marketing Data: your preferences in receiving marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="leading-relaxed mb-3">
                We use your personal data for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To provide and maintain our service</li>
                <li>To notify you about changes to our service</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information to improve our service</li>
                <li>To monitor the usage of our service</li>
                <li>To detect, prevent and address technical issues</li>
                <li>To provide you with AI-powered content generation features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="leading-relaxed">
                We have implemented appropriate security measures to prevent your personal data from being
                accidentally lost, used, or accessed in an unauthorized way. We use industry-standard encryption
                and security protocols to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Third-Party Services</h2>
              <p className="leading-relaxed">
                We may use third-party service providers to help us operate our platform and provide services to you.
                These providers have access to your personal data only to perform specific tasks on our behalf and are
                obligated not to disclose or use it for any other purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="leading-relaxed mb-3">
                Under data protection laws, you have rights including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The right to access your personal data</li>
                <li>The right to correct inaccurate personal data</li>
                <li>The right to request deletion of your personal data</li>
                <li>The right to object to processing of your personal data</li>
                <li>The right to request transfer of your personal data</li>
                <li>The right to withdraw consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="leading-relaxed">
                We will only retain your personal data for as long as necessary to fulfill the purposes we collected
                it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-brand-50 rounded-lg">
                <p className="font-semibold text-brand-700">Phone: 9899262916</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 CreatorX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
