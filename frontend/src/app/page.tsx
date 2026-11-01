import Link from 'next/link'
import { FaUpload, FaEdit, FaRocket, FaCheck, FaUsers, FaChartLine } from 'react-icons/fa'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      
      {/* Hero Section */}
      <main className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="text-center animate-fadeInUp">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Send Emails
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smarter & Faster
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your email campaigns with personalized bulk messaging. 
              Upload contacts, compose once, and reach everyone instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link href="/signup" className="btn-primary text-lg px-8 py-4 animate-slideInRight">
                <FaRocket className="mr-2" />
                Start Free Today
              </Link>
              <Link href="/login" className="btn-outline text-lg px-8 py-4">
                Sign In
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
                <div className="text-gray-600">Emails Sent</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                <div className="text-gray-600">Delivery Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
                <div className="text-gray-600">Happy Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Three simple steps to send personalized emails to hundreds of recipients
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Step 1 */}
              <div className="text-center group">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <FaUpload className="text-2xl text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Upload Contacts</h3>
                <p className="text-gray-600 leading-relaxed">
                  Upload your Excel file with contact information. We support .xlsx, .xls, and .csv formats with automatic data validation.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center group">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <FaEdit className="text-2xl text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Compose Message</h3>
                <p className="text-gray-600 leading-relaxed">
                  Write your personalized message with dynamic fields. Each recipient gets a customized email with their name and details.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center group">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <FaRocket className="text-2xl text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Send & Track</h3>
                <p className="text-gray-600 leading-relaxed">
                  Send emails in optimized batches and track delivery status in real-time. Get detailed reports on success rates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-24 text-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Why Choose Mailpilot?</h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Built for efficiency, designed for results
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <FaUsers className="text-3xl mb-4 text-blue-200" />
                <h3 className="text-xl font-bold mb-3">Bulk Personalization</h3>
                <p className="text-blue-100">Send personalized emails to hundreds of recipients with individual customization.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <FaChartLine className="text-3xl mb-4 text-green-200" />
                <h3 className="text-xl font-bold mb-3">Real-time Tracking</h3>
                <p className="text-blue-100">Monitor delivery status, success rates, and get detailed analytics on your campaigns.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <FaCheck className="text-3xl mb-4 text-purple-200" />
                <h3 className="text-xl font-bold mb-3">Smart Validation</h3>
                <p className="text-blue-100">Automatic email validation and data cleaning to ensure maximum deliverability.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 py-20">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Email Campaigns?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join hundreds of users who trust Mailpilot for their email marketing needs.
            </p>
            <Link href="/signup" className="btn-primary text-lg px-8 py-4 inline-flex items-center">
              <FaRocket className="mr-2" />
              Get Started Free
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}