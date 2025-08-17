'use client'

import { useState, useEffect } from 'react'

interface FeedbackData {
  id: string
  type: 'feedback' | 'response'
  formTitle: string
  formId: string
  name: string
  phoneNumber: string
  experience: string
  feedback: string
  createdAt: string
  sentiment: string
}

interface Form {
  id: string
  title: string
}

/**
 * Feedback table component with filtering capabilities
 * 
 * @returns JSX element containing the feedback table
 */
export default function FeedbackTable() {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filter states
  const [selectedForm, setSelectedForm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSentiment, setSelectedSentiment] = useState('')

  useEffect(() => {
    fetchFeedbacks()
  }, [selectedForm, startDate, endDate, selectedSentiment])

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      
      if (selectedForm) params.append('formId', selectedForm)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/restaurant/feedbacks?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFeedbacks(data.feedbacks)
        setForms(data.forms)
      } else {
        setError('Failed to load feedbacks')
      }
    } catch (error) {
      setError('An error occurred while loading feedbacks')
    } finally {
      setIsLoading(false)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Neutral':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Negative':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return '😊'
      case 'Neutral':
        return '😐'
      case 'Negative':
        return '😞'
      default:
        return '❓'
    }
  }

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (selectedSentiment && feedback.sentiment !== selectedSentiment) {
      return false
    }
    return true
  })

  const clearFilters = () => {
    setSelectedForm('')
    setStartDate('')
    setEndDate('')
    setSelectedSentiment('')
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <h2 className="text-xl font-semibold text-white mb-4 lg:mb-0 flex items-center">
          <span className="mr-2">📋</span>
          All Feedback
        </h2>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Form Filter */}
          <select
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg"
          >
            <option value="">All Forms</option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.title}
              </option>
            ))}
          </select>

          {/* Date Filters */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg"
            placeholder="Start Date"
          />
          
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg"
            placeholder="End Date"
          />

          {/* Sentiment Filter */}
          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 shadow-lg"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📝</span>
          </div>
          <p className="text-gray-400">No feedback found with the current filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-300 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Form</th>
                <th className="px-4 py-3 font-semibold">Feedback</th>
                <th className="px-4 py-3 font-semibold">Sentiment</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {filteredFeedbacks.map((feedback) => (
                <tr key={feedback.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{feedback.name}</p>
                      <p className="text-xs text-gray-400">{feedback.phoneNumber}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded-lg">
                      {feedback.formTitle}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <p className="text-gray-200 text-sm line-clamp-2">
                        {feedback.type === 'response' 
                          ? JSON.stringify(JSON.parse(feedback.feedback), null, 2)
                          : feedback.feedback || 'No text feedback'
                        }
                      </p>
                      {feedback.experience !== 'N/A' && (
                        <p className="text-xs text-gray-400 mt-1">
                          Experience: {feedback.experience}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getSentimentColor(feedback.sentiment)}`}>
                      <span className="mr-1">{getSentimentIcon(feedback.sentiment)}</span>
                      {feedback.sentiment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                    <br />
                    {new Date(feedback.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Count */}
      <div className="mt-4 text-sm text-gray-400">
        Showing {filteredFeedbacks.length} of {feedbacks.length} feedback entries
      </div>
    </div>
  )
} 