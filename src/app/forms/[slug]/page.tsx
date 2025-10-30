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
    id: string
    name: string
    slug: string
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
  const restaurantSlug = params.slug as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [customerName, setCustomerName] = useState('')


  useEffect(() => {
    if (restaurantSlug) {
      fetchForm()
    }
  }, [restaurantSlug])

  useEffect(() => {
    if (isSubmitted && typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" }); // "auto" is standard; "instant" isn't
    }
  }, [isSubmitted]);

  const fetchForm = async () => {
    try {
      console.log('Fetching form for slug:', restaurantSlug)
      const response = await fetch(`/api/forms/${restaurantSlug}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Form data received:', data)
        
        // Combine restaurant and form data into a single form object
        const combinedForm: Form = {
          ...data.form,
          restaurant: data.restaurant
        }
        
        setForm(combinedForm)
      } else {
        const errorData = await response.json()
        console.error('Form fetch failed:', errorData)
        setError(errorData.error || 'Form not found')
      }
    } catch (error) {
      console.error('Form fetch error:', error)
      setError('Failed to load form')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (data: FeedbackData) => {
    setCustomerName(data.name);
    setIsSubmitted(true);
  }

  const handleBack = () => {
    setIsSubmitted(false)
    setCustomerName('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading form...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">❌ {error}</h1>
          <p className="text-gray-400">Unable to load restaurant data.</p>
          <p className="text-gray-500 text-sm mt-2">Please check the URL or try again later.</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Form Not Found</h1>
          <p className="text-gray-400">The requested form could not be found.</p>
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
      restaurantSlug={restaurantSlug}
      restaurantName={form.restaurant.name}
      tagline={form.subtitle || "We'd love to hear from you! 🍽️"}
      coverImage={form.coverImageUrl}
      logoImage={form.logoUrl}
    />
  )
}
