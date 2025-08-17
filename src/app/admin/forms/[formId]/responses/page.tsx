'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Question {
  id: string
  questionText: string
  type: string
  options?: string
}

interface Form {
  id: string
  title: string
  restaurant: {
    name: string
  }
  questions: Question[]
}

interface Response {
  id: string
  answers: Record<string, any>
  createdAt: string
}

/**
 * Form responses page component
 * 
 * @returns JSX element containing the form responses view
 */
export default function FormResponses() {
  const params = useParams()
  const router = useRouter()
  const formId = params.formId as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (formId) {
      fetchResponses()
    }
  }, [formId])

  const fetchResponses = async () => {
    try {
      const response = await fetch(`/api/admin/forms/${formId}/responses`)
      if (response.ok) {
        const data = await response.json()
        setForm(data.form)
        setResponses(data.responses)
      } else {
        setError('Failed to load responses')
      }
    } catch (error) {
      setError('An error occurred while loading responses')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">❌ Error</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Form Not Found</h1>
          <p className="text-gray-400">The requested form could not be found.</p>
        </div>
      </div>
    )
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
              <h1 className="text-2xl font-bold text-white">📊 Form Responses</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">
                {responses.length} responses
              </span>
              <a
                href={`/forms/${formId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                View Form
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-2">
            {form.title}
          </h2>
          <p className="text-gray-400">
            {form.restaurant.name} • {form.questions.length} questions
          </p>
        </div>

        {/* Responses */}
        {responses.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Responses Yet
            </h3>
            <p className="text-gray-400">
              Share the form link with your customers to start collecting responses.
            </p>
            <div className="mt-4">
              <a
                href={`/forms/${formId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                View Form
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map((response, index) => (
              <div key={response.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Response #{responses.length - index}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {new Date(response.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3">
                  {form.questions.map((question, qIndex) => {
                    // Handle both legacy feedback format and new dynamic form format
                    let answer = response.answers[question.id]
                    
                    // If no answer found by question ID, try legacy field names
                    if (answer === undefined) {
                      // Map question text to legacy field names
                      const questionText = question.questionText.toLowerCase()
                      if (questionText.includes('name')) {
                        answer = response.answers.name || response.answers.name
                      } else if (questionText.includes('phone')) {
                        answer = response.answers.phoneNumber || response.answers.phone
                      } else if (questionText.includes('experience') || questionText.includes('rating')) {
                        answer = response.answers.experience || response.answers.rating
                      } else if (questionText.includes('feedback')) {
                        answer = response.answers.feedback
                      }
                    }
                    
                    return (
                      <div key={question.id} className="border-b border-gray-700 pb-3 last:border-b-0">
                        <p className="text-sm font-medium text-gray-300 mb-1">
                          {qIndex + 1}. {question.questionText}
                        </p>
                        <div className="bg-gray-700 rounded px-3 py-2">
                          {question.type === 'rating' ? (
                            <div className="flex items-center gap-2">
                              {/* Handle both numeric ratings and legacy experience text */}
                              {typeof answer === 'number' ? (
                                <>
                                  <span className="text-purple-400 font-medium">{answer}/5</span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        className={`text-lg ${
                                          star <= answer ? 'text-yellow-400' : 'text-gray-600'
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-200">{answer || 'No answer'}</span>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-200">{answer || 'No answer'}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 