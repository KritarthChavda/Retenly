'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import FeedbackForm, { FeedbackData } from '@/components/FeedbackForm'
import ThankYouPage from '@/components/ThankYouPage'

interface Question {
  id: string
  questionText: string
  type: string
  options?: string
}

interface Form {
  id: string
  title: string
  subtitle?: string
  closingMessage?: string
  logoUrl?: string
  coverImageUrl?: string
  restaurant: {
    name: string
  }
  questions: Question[]
}

/**
 * Dynamic form page for customers to fill out feedback
 * 
 * @returns JSX element containing the customer feedback form
 */
export default function CustomerForm() {
  const params = useParams()
  const formId = params.formId as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [customerName, setCustomerName] = useState('')

  useEffect(() => {
    if (formId) {
      fetchForm()
    }
  }, [formId])

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}`)
      if (response.ok) {
        const data = await response.json()
        setForm(data.form)
      } else {
        setError('Form not found')
      }
    } catch (error) {
      setError('Failed to load form')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: FeedbackData) => {
    setCustomerName(data.name)
    
    try {
      const response = await fetch(`/api/forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: data }),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Failed to submit form'}`)
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    }
  }

  const handleBack = () => {
    setIsSubmitted(false)
    setCustomerName('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">❌ Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Form Not Found</h1>
          <p className="text-muted-foreground">The requested form could not be found.</p>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <ThankYouPage 
        onBack={handleBack}
        restaurantName={form.restaurant.name}
        customerName={customerName}
      />
      )
  }

  return (
    <FeedbackForm 
      onSubmit={handleSubmit}
      isSubmitting={false}
      restaurantName={form.restaurant.name}
      tagline={form.subtitle || "We'd love to hear from you! 🍽️"}
      coverImage={form.coverImageUrl}
      logoImage={form.logoUrl}
    />
  )
} 