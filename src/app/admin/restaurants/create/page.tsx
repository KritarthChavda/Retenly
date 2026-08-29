'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface RestaurantCredentials {
  username: string
  password: string
  emailSent?: boolean
}

/**
 * Create restaurant page component
 * 
 * @returns JSX element containing the restaurant creation form
 */
export default function CreateRestaurant() {
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantEmail, setRestaurantEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState<RestaurantCredentials | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: restaurantName,
          email: restaurantEmail
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCredentials({
          ...data.credentials,
          emailSent: data.emailSent, // ✅ pass the flag along
        })
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create business')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-white">🏢 Create Business</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!credentials ? (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              Create New Business
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-300 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  id="restaurantName"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter business name"
                  required
                />
              </div>

              <div>
                <label htmlFor="restaurantEmail" className="block text-sm font-medium text-gray-300 mb-2">
                  Business Email
                </label>
                <input
                  type="email"
                  id="restaurantEmail"
                  value={restaurantEmail}
                  onChange={(e) => setRestaurantEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter business email"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-md p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Business'}
                </button>
                <button
                  type="button"
                  onClick={handleBackToDashboard}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-xl">✅</span>
              </div>
              <h2 className="text-xl font-semibold text-white">
                Restaurant Created Successfully!
              </h2>
              <p className="text-gray-400 mt-2">
                Here are the credentials for {restaurantName}
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-white font-medium mb-3">🔐 Business Credentials</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Username:</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-gray-600 px-3 py-1 rounded text-white font-mono">
                      {credentials.username}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(credentials.username)}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Password:</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-gray-600 px-3 py-1 rounded text-white font-mono">
                      {credentials.password}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(credentials.password)}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <h4 className="text-yellow-400 font-medium mb-2">⚠️ Important</h4>
              <p className="text-yellow-300 text-sm">
                Please save these credentials securely. They will not be shown again.
                Share them with the restaurant owner so they can access their forms.
              </p>
            </div>

            {credentials.emailSent && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
                <h4 className="text-green-400 font-medium mb-2">📧 Email Sent</h4>
                <p className="text-green-300 text-sm">
                  Credentials have been sent to the restaurant owner's email address.
                </p>
              </div>
            )}

            {!credentials.emailSent && (
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-6">
                <h4 className="text-orange-400 font-medium mb-2">📧 Email Status</h4>
                <p className="text-orange-300 text-sm">
                  Email could not be sent. Please manually share the credentials with the restaurant owner.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleBackToDashboard}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  setCredentials(null)
                  setRestaurantName('')
                  setRestaurantEmail('')
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Create Another Restaurant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 