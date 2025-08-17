'use client'

import Link from 'next/link'

/**
 * Demo index page showcasing both components
 * 
 * @returns JSX element containing the demo navigation
 */
export default function DemoIndex() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎨 Modern Components Demo
          </h1>
          <p className="text-xl text-gray-300">
            Showcasing the latest UI improvements for restaurant feedback forms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer Form Demo */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">📝</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Customer Feedback Form
              </h2>
              <p className="text-gray-300">
                Modern, responsive form with full-width cover image, gradient overlays, 
                icons, animations, and confetti effect.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Full-width cover image with gradient overlay</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Restaurant logo and title centered</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Form fields with icons (👤 📱 ⭐ ✏️)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Rating with hover glow animation</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Gradient submit button with animations</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Animated confetti effect on submission</span>
              </div>
            </div>

            <Link
              href="/demo/customer-form"
              className="block w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              View Customer Form Demo
            </Link>
          </div>

          {/* Analytics Dashboard Demo */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Owner Analytics Dashboard
              </h2>
              <p className="text-gray-300">
                Responsive dashboard with Tailwind grid layout, analytics cards, 
                pie chart, and feedback table with hover effects.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-blue-400">✅</span>
                <span className="text-gray-300">Responsive Tailwind grid layout</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-blue-400">✅</span>
                <span className="text-gray-300">Analytics cards (Total, CSAT, NPS, Most Loved)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-blue-400">✅</span>
                <span className="text-gray-300">Color-coded sentiment pie chart</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-blue-400">✅</span>
                <span className="text-gray-300">Recent feedback table with ratings</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-blue-400">✅</span>
                <span className="text-gray-300">Sentiment badges (green/yellow/red)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-blue-400">✅</span>
                <span className="text-gray-300">Hover effects and subtle animations</span>
              </div>
            </div>

            <Link
              href="/demo/analytics-dashboard"
              className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              View Analytics Dashboard Demo
            </Link>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-12 bg-white/5 rounded-2xl p-8 border border-white/10">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            🎯 Key Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🎨</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Modern Design</h4>
              <p className="text-gray-300 text-sm">
                TailwindCSS + DaisyUI theme with rounded corners, drop shadows, and clean typography
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">📱</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Responsive</h4>
              <p className="text-gray-300 text-sm">
                Mobile-first design that works perfectly on all screen sizes
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🎭</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Customizable</h4>
              <p className="text-gray-300 text-sm">
                Brand colors passed as props so each restaurant can have a unique theme
              </p>
            </div>
          </div>
        </div>

        {/* Back to Main App */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Main Application
          </Link>
        </div>
      </div>
    </div>
  )
} 