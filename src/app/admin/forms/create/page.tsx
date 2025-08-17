'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Restaurant {
  id: string
  name: string
}

/**
 * Create form page component
 * 
 * @returns JSX element containing the form creation interface
 */
export default function CreateForm() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [closingMessage, setClosingMessage] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      const response = await fetch('/api/admin/restaurants')
      if (response.ok) {
        const data = await response.json()
        setRestaurants(data.restaurants)
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    }
  }

  const handleFileUpload = async (file: File, type: 'logo' | 'cover') => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (type === 'logo') {
          setLogoUrl(data.url)
        } else {
          setCoverImageUrl(data.url)
        }
        return data.url
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!selectedRestaurant || !formTitle.trim()) {
      setError('Please fill in all required fields')
      setIsLoading(false)
      return
    }

    try {
      // Upload files if provided
      let finalLogoUrl = logoUrl
      let finalCoverUrl = coverImageUrl

      if (logoFile) {
        finalLogoUrl = await handleFileUpload(logoFile, 'logo')
      }

      if (coverFile) {
        finalCoverUrl = await handleFileUpload(coverFile, 'cover')
      }

      const response = await fetch('/api/admin/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: selectedRestaurant,
          title: formTitle,
          subtitle: subtitle.trim() || null,
          closingMessage: closingMessage.trim() || null,
          logoUrl: finalLogoUrl || null,
          coverImageUrl: finalCoverUrl || null,
          questions: [
            {
              questionText: 'What is your Name?',
              type: 'text'
            },
            {
              questionText: 'What is your Phone Number?',
              type: 'text'
            },
            {
              questionText: 'How was your experience today?',
              type: 'rating'
            },
            {
              questionText: 'Please let us know your feedback?',
              type: 'text'
            }
          ]
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create form')
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">✅</span>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-white">
              Form Created Successfully!
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Your feedback form has been created and is ready to use.
            </p>
          </div>
          <div className="space-y-4">
            <button
              onClick={handleBackToDashboard}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Back to Dashboard
            </button>
            <Link
              href="/admin/forms"
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              View All Forms
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center text-gray-400 hover:text-white mb-4"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Create New Feedback Form</h1>
          <p className="text-gray-400 mt-2">Set up a customized feedback form for your restaurant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Restaurant Selection */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Restaurant Selection</h2>
            <div>
              <label htmlFor="restaurant" className="block text-sm font-medium text-gray-300 mb-2">
                Select Restaurant *
              </label>
              <select
                id="restaurant"
                value={selectedRestaurant}
                onChange={(e) => setSelectedRestaurant(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Choose a restaurant</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Customization */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Form Customization</h2>
            
            {/* Form Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Form Title *
              </label>
              <input
                type="text"
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Downtown Rajkot - Spill the Beans"
                required
              />
            </div>

            {/* Subtitle */}
            <div className="mb-6">
              <label htmlFor="subtitle" className="block text-sm font-medium text-gray-300 mb-2">
                Subtitle / Welcome Message
              </label>
              <textarea
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Tell us what you loved [or didn't] — we can handle the truth 😈"
              />
            </div>

            {/* Closing Message */}
            <div className="mb-6">
              <label htmlFor="closingMessage" className="block text-sm font-medium text-gray-300 mb-2">
                Thank You / Closing Message
              </label>
              <textarea
                id="closingMessage"
                value={closingMessage}
                onChange={(e) => setClosingMessage(e.target.value)}
                rows={2}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Thanks! — Downtown Rajkot"
              />
            </div>

            {/* Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Restaurant Logo
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700"
                />
                {logoUrl && (
                  <img src={logoUrl} alt="Logo preview" className="w-12 h-12 rounded-full object-cover" />
                )}
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cover Image / Banner
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700"
                />
                {coverImageUrl && (
                  <img src={coverImageUrl} alt="Cover preview" className="w-full h-32 rounded-lg object-cover" />
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-md p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Link
              href="/admin"
              className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-800 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 