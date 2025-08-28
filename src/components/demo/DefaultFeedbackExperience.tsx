'use client'

import { useState } from 'react'
import FeedbackForm, { FeedbackData } from '@/components/FeedbackForm'
import ThankYouPage from '@/components/ThankYouPage'

//test

interface DefaultFeedbackExperienceProps {
  restaurantName?: string
}

export function DefaultFeedbackExperience({
  restaurantName = 'Downtown Rajkot ',
}: DefaultFeedbackExperienceProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerName, setCustomerName] = useState('')

  const handleSubmit = async (data: FeedbackData) => {
    setIsSubmitting(true)
    setCustomerName(data.name)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Something went wrong'}`)
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    setIsSubmitted(false)
    setCustomerName('')
  }

  return (
    <div className="min-h-screen bg-background">
      {isSubmitted ? (
        <ThankYouPage
          onBack={handleBack}
          restaurantName={restaurantName}
          customerName={customerName}
        />
      ) : (
        <FeedbackForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          restaurantName={restaurantName}
          tagline="Spill the beans — we're all ears! 🍽️"
          isDefault = {true}
        />
      )}
    </div>
  )
}
