'use client'

import { useState } from 'react'
import FeedbackForm, { FeedbackData } from '@/components/FeedbackForm'
import ThankYouPage from '@/components/ThankYouPage'

interface DefaultFeedbackExperienceProps {
  restaurantName?: string
}

export function DefaultFeedbackExperience({
  restaurantName = 'Downtown Rajkot',
}: DefaultFeedbackExperienceProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [customerName, setCustomerName] = useState('')

  const handleSubmit = async (data: FeedbackData) => {
    // The `FeedbackForm` component handles submission (including
    // background sync / fallbacks) and calls this `onSubmit` callback
    // when the form has been accepted. For the demo experience we
    // simply capture the name and show the thank-you page.
    setCustomerName(data.name)
    setIsSubmitted(true)
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
          restaurantSlug="downtown-rajkot"
          restaurantName={restaurantName}
          tagline="Spill the beans — we're all ears! 🍽️"
          isDefault={true}
        />
      )}
    </div>
  )
}
