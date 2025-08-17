'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Restaurant {
  id: string
  name: string
  username: string
  createdAt: string
  _count: {
    forms: number
  }
}

interface Form {
  id: string
  title: string
  restaurant: {
    name: string
  }
  _count: {
    questions: number
    feedbacks: number
    responses: number
  }
  createdAt: string
}

/**
 * Main admin dashboard page
 * 
 * @returns JSX element containing the admin dashboard
 */
export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [restaurantsRes, formsRes] = await Promise.all([
        fetch('/api/admin/restaurants'),
        fetch('/api/admin/forms')
      ])

      if (restaurantsRes.ok) {
        const restaurantsData = await restaurantsRes.json()
        setRestaurants(restaurantsData.restaurants)
      }

      if (formsRes.ok) {
        const formsData = await formsRes.json()
        setForms(formsData.forms)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">🍽️ Restaurant Admin</h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="mb-8 flex gap-4">
          <Link
            href="/admin/restaurants/create"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Create Restaurant
          </Link>
          <Link
            href="/admin/forms/create"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>📝</span>
            Create Form
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Restaurants Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">🏪 Restaurants</h2>
            {restaurants.length === 0 ? (
              <p className="text-gray-400">No restaurants created yet.</p>
            ) : (
              <div className="space-y-3">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-medium">{restaurant.name}</h3>
                        <p className="text-gray-400 text-sm">Username: {restaurant.username}</p>
                        <p className="text-gray-400 text-sm">
                          Forms: {restaurant._count.forms}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(restaurant.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Forms Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">📋 Forms</h2>
            {forms.length === 0 ? (
              <p className="text-gray-400">No forms created yet.</p>
            ) : (
              <div className="space-y-3">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-medium">{form.title}</h3>
                        <p className="text-gray-400 text-sm">
                          Restaurant: {form.restaurant.name}
                        </p>
                                                 <p className="text-gray-400 text-sm">
                           Questions: {form._count.questions} | 
                           Responses: {form._count.responses}
                         </p>
                         <div className="flex gap-2 text-sm">
                           <a 
                             href={`/forms/${form.id}`} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="text-purple-400 hover:text-purple-300 underline"
                           >
                             View Form →
                           </a>
                           <a 
                             href={`/admin/forms/${form.id}/responses`}
                             className="text-green-400 hover:text-green-300 underline"
                           >
                             View Responses →
                           </a>
                         </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(form.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 