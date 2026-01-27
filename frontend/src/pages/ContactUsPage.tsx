import { Sparkles, Phone, Mail, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ContactUsPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-gray-600 text-lg mb-12">
            Have questions or need support? We're here to help! Reach out to us through any of the channels below.
          </p>

          <div className="space-y-8">
            {/* Phone */}
            <div className="flex items-start space-x-4 p-6 bg-gradient-to-br from-brand-50 to-purple-50 rounded-xl hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Phone</h3>
                <p className="text-gray-600 mb-2">Call us for immediate assistance</p>
                <a href="tel:9899262916" className="text-2xl font-bold text-brand-600 hover:text-brand-700">
                  9899262916
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start space-x-4 p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600 mb-2">Send us a detailed message</p>
                <a href="mailto:support@creatorx.com" className="text-lg font-semibold text-pink-600 hover:text-pink-700">
                  support@creatorx.com
                </a>
              </div>
            </div>

            {/* Business Hours */}
            <div className="flex items-start space-x-4 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Business Hours</h3>
                <div className="space-y-1 text-gray-600">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                  <p>Saturday: 10:00 AM - 4:00 PM IST</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Support Information */}
            <div className="mt-12 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Support Information</h3>
              <div className="space-y-3 text-gray-600">
                <p>
                  <span className="font-semibold">Technical Support:</span> For technical issues, please include your account email and a detailed description of the problem.
                </p>
                <p>
                  <span className="font-semibold">Billing Inquiries:</span> For billing questions, please have your transaction ID ready.
                </p>
                <p>
                  <span className="font-semibold">Partnership Opportunities:</span> For brand collaborations or business partnerships, please use our email contact.
                </p>
                <p>
                  <span className="font-semibold">Response Time:</span> We typically respond to all inquiries within 24-48 hours during business days.
                </p>
              </div>
            </div>

            {/* FAQ Note */}
            <div className="mt-8 p-6 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl text-white">
              <h3 className="text-xl font-semibold mb-2">Before You Contact Us</h3>
              <p>
                Many common questions can be answered in our FAQ section or documentation. Check there first for faster assistance!
              </p>
            </div>
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
