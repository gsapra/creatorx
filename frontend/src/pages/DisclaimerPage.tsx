import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DisclaimerPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Disclaimer</h1>
          <div className="text-gray-600 text-sm mb-8">Last Updated: January 26, 2026</div>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. General Information</h2>
              <p className="leading-relaxed">
                The information provided by CreatorX ("we," "us," or "our") on our platform is for general
                informational purposes only. All information on the platform is provided in good faith, however
                we make no representation or warranty of any kind, express or implied, regarding the accuracy,
                adequacy, validity, reliability, availability, or completeness of any information on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. AI-Generated Content</h2>
              <p className="leading-relaxed">
                CreatorX uses artificial intelligence to generate content including scripts, titles, thumbnails,
                captions, and SEO content. While we strive for accuracy and quality:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>AI-generated content should be reviewed and edited before use</li>
                <li>We do not guarantee the accuracy, completeness, or appropriateness of AI-generated content</li>
                <li>Users are responsible for ensuring content meets their specific needs and standards</li>
                <li>AI-generated content may contain errors, biases, or inappropriate material</li>
                <li>Users should verify facts, claims, and information before publication</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Professional Advice Disclaimer</h2>
              <p className="leading-relaxed">
                The platform cannot and does not contain professional advice. The content generation and marketing
                information is provided for general informational and educational purposes only and is not a
                substitute for professional advice. You should not take any action based solely on the information
                provided by our AI tools without seeking professional consultation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. External Links Disclaimer</h2>
              <p className="leading-relaxed">
                The platform may contain links to external websites that are not provided or maintained by or in
                any way affiliated with us. We do not guarantee the accuracy, relevance, timeliness, or completeness
                of any information on these external websites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Content Ownership and Copyright</h2>
              <p className="leading-relaxed">
                While you retain ownership of the content you create using our platform, you are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>Ensuring your content does not infringe on third-party copyrights</li>
                <li>Complying with platform-specific content guidelines (YouTube, Instagram, etc.)</li>
                <li>Verifying that AI-generated content is original and does not plagiarize</li>
                <li>Obtaining necessary licenses or permissions for any referenced content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Results Disclaimer</h2>
              <p className="leading-relaxed">
                CreatorX provides tools to assist with content creation, but we make no guarantees regarding:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>The success or performance of content created using our platform</li>
                <li>Increased views, engagement, or revenue from using our tools</li>
                <li>Brand collaborations or partnership opportunities</li>
                <li>Any specific outcomes or results from using our services</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Results vary based on numerous factors including content quality, audience, timing, and market conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Platform Availability</h2>
              <p className="leading-relaxed">
                We do not guarantee that the platform will be available at all times. We may experience hardware,
                software, or other problems that could lead to interruptions, delays, or errors. We reserve the
                right to change, revise, update, suspend, discontinue, or otherwise modify the platform at any
                time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="leading-relaxed">
                Under no circumstance shall we have any liability to you for any loss or damage of any kind
                incurred as a result of the use of the platform or reliance on any information provided on the
                platform. Your use of the platform and your reliance on any information on the platform is solely
                at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about this Disclaimer, please contact us:
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
