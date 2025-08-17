'use client'

import CustomerFeedbackForm from '@/components/forms/CustomerFeedbackForm'

/**
 * Demo page for CustomerFeedbackForm component
 * 
 * @returns JSX element containing the demo form
 */
export default function CustomerFormDemo() {
  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data)
    // In a real app, this would send data to your API
  }

  const handleError = (error: string) => {
    console.error('Form error:', error)
    // In a real app, this would show a toast notification
  }

  return (
    <CustomerFeedbackForm
      restaurantName="Downtown Rajkot"
      logoUrl="/uploads/demo-logo.png" // You can add a demo logo to public/uploads/
      coverImageUrl="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
      title="Spill the Beans"
      subtitle="Tell us what you loved [or didn't] — we can handle the truth 😈"
      closingMessage="Thank you so much! 🎉"
      primaryColor="#10B981"
      secondaryColor="#6366F1"
      accentColor="#F59E0B"
      showName={true}
      showPhone={true}
      showRating={true}
      showFeedback={true}
      onSubmit={handleSubmit}
      onError={handleError}
    />
  )
}
