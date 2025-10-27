'use client'

import { useState } from 'react'
import { validatePhoneNumber, formatPhoneNumberToE164 } from '@/lib/validation'

interface CustomerFeedbackFormProps {
  // Restaurant branding
  restaurantName: string
  logoUrl?: string
  coverImageUrl?: string
  title: string
  subtitle?: string
  closingMessage?: string
  
  // Theme colors
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  
  // Form configuration
  showName?: boolean
  showPhone?: boolean
  showRating?: boolean
  showFeedback?: boolean
  
  // Callbacks
  onSubmit?: (data: FeedbackData) => void
  onError?: (error: string) => void
}

interface FeedbackData {
  name: string
  phoneNumber: string
  rating: number
  feedback: string
}

/**
 * Modern customer feedback form component
 * 
 * @param props - Component props for customization
 * @returns JSX element containing the feedback form
 */
export default function CustomerFeedbackForm({
  restaurantName = "Downtown Rajkot",
  logoUrl,
  coverImageUrl,
  title = "Spill the Beans",
  subtitle = "Tell us what you loved [or didn't] — we can handle the truth 😈",
  closingMessage = "Thank you so much! 🎉",
  primaryColor = "#10B981", // Green
  secondaryColor = "#6366F1", // Indigo
  accentColor = "#F59E0B", // Amber
  showName = true,
  showPhone = true,
  showRating = true,
  showFeedback = true,
  onSubmit,
  onError
}: CustomerFeedbackFormProps) {
  const [formData, setFormData] = useState<FeedbackData>({
    name: '',
    phoneNumber: '',
    rating: 0,
    feedback: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof FeedbackData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (showName && !formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (showPhone && !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (showPhone && formData.phoneNumber.trim()) {
      // Validate and provide helpful error
      if (!validatePhoneNumber(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Please enter a valid phone number (include country code or leave to default +91)'
      }
    }
    
    if (showRating && formData.rating === 0) {
      newErrors.rating = 'Please select a rating'
    }
    
    if (showFeedback && !formData.feedback.trim()) {
      newErrors.feedback = 'Feedback is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Normalize phone number to E.164 before calling onSubmit
      const formattedPhone = showPhone ? (formatPhoneNumberToE164(formData.phoneNumber) || formData.phoneNumber) : formData.phoneNumber
      if (onSubmit) {
        onSubmit({ ...formData, phoneNumber: formattedPhone })
      }
      
      setIsSubmitted(true)
    } catch (error) {
      if (onError) {
        onError('Failed to submit feedback')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderConfetti = () => {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: [primaryColor, secondaryColor, accentColor][Math.floor(Math.random() * 3)]
              }}
            />
          </div>
        ))}
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative overflow-hidden">
        {renderConfetti()}
        
        <div className="text-center z-10 max-w-md mx-auto px-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white text-3xl">🎉</span>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              {closingMessage}
            </h2>
            
            <p className="text-gray-300 text-lg mb-6">
              Your feedback has been submitted successfully!
            </p>
            
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">
                Thanks for helping us improve! — {restaurantName}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Cover Image with Gradient Overlay */}
      {coverImageUrl && (
        <div className="relative w-full h-80 bg-cover bg-center" style={{ backgroundImage: `url(${coverImageUrl})` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
          
          {/* Logo and Title */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt={`${restaurantName} Logo`}
                  className="w-16 h-16 rounded-full mx-auto mb-4 shadow-lg border-2 border-white/20"
                />
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xl text-gray-200 max-w-2xl mx-auto px-4">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            {showName && (
              <div className="space-y-2">
                <label className="block text-lg font-medium text-white flex items-center">
                  <span className="mr-2">👤</span>
                  What is your Name?
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-green-500'
                  }`}
                  placeholder="Enter your name..."
                />
                {errors.name && (
                  <p className="text-red-400 text-sm">{errors.name}</p>
                )}
              </div>
            )}

            {/* Phone Number Field */}
            {showPhone && (
              <div className="space-y-2">
                <label className="block text-lg font-medium text-white flex items-center">
                  <span className="mr-2">📱</span>
                  What is your Phone Number?
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.phoneNumber 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-green-500'
                  }`}
                  placeholder="Enter your phone number..."
                />
                {errors.phoneNumber && (
                  <p className="text-red-400 text-sm">{errors.phoneNumber}</p>
                )}
              </div>
            )}

            {/* Rating Field */}
            {showRating && (
              <div className="space-y-2">
                <label className="block text-lg font-medium text-white">
                  How was your experience today?
                </label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleInputChange('rating', rating)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 transform hover:scale-110 ${
                        formData.rating >= rating
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-yellow-400'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                {errors.rating && (
                  <p className="text-red-400 text-sm text-center">{errors.rating}</p>
                )}
              </div>
            )}

            {/* Feedback Field */}
            {showFeedback && (
              <div className="space-y-2">
                <label className="block text-lg font-medium text-white flex items-center">
                  <span className="mr-2">✏️</span>
                  Please let us know your feedback?
                </label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) => handleInputChange('feedback', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
                    errors.feedback 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-green-500'
                  }`}
                  placeholder="Share your thoughts with us..."
                />
                {errors.feedback && (
                  <p className="text-red-400 text-sm">{errors.feedback}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
