'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mic, MicOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import restaurantCover from "@/assets/restaurant-cover.jpg"
import restaurantLogo from "@/assets/restaurant-logo.png"
import Link from "next/link"

interface FeedbackFormProps {
  onSubmit: (data: FeedbackData) => void
  isSubmitting: boolean
  restaurantName?: string
  tagline?: string
  coverImage?: string
  logoImage?: string
  isDefault?: boolean
}

export interface FeedbackData {
  name: string
  phoneNumber: string
  experience: string
  feedback?: string
}

const emojiRatings = [
  { emoji: "😡", value: 'Not great', label: "Terrible", color: "text-red-500" },
  { emoji: "🙁", value: 'Poor', label: "Poor", color: "text-orange-500" },
  { emoji: "😐", value: 'Okay-ish', label: "Neutral", color: "text-yellow-500" },
  { emoji: "😊", value: 'Pretty good', label: "Good", color: "text-green-500" },
  { emoji: "😍", value: 'YO!', label: "Excellent", color: "text-blue-500" },
]

/**
 * Premium restaurant feedback form component with modern styling
 * 
 * @param onSubmit - Callback function when form is submitted
 * @param isSubmitting - Boolean to show loading state
 * @param restaurantName - Name of the restaurant (optional)
 * @param tagline - Tagline or welcome message (optional)
 * @param coverImage - URL to cover image (optional)
 * @param logoImage - URL to logo image (optional)
 * @returns JSX element containing the feedback form
 */
export default function FeedbackForm({
  onSubmit,
  isSubmitting,
  restaurantName = "Downtown Rajkot",
  tagline = "Spill the beans — we're all ears! 🍽️",
  coverImage = restaurantCover.src,
  logoImage = restaurantLogo.src,
  isDefault = false
}: FeedbackFormProps) {
  const [formData, setFormData] = useState<FeedbackData>({
    name: '',
    phoneNumber: '',
    experience: '',
    feedback: ''
  })
  const [isRecording, setIsRecording] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: keyof FeedbackData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleVoiceRecording = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      toast({
        title: "Recording started",
        description: "Speak your thoughts! Tap again to stop.",
      })
    } else {
      toast({
        title: "Recording saved",
        description: "Your voice feedback has been captured.",
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.experience) {
      toast({
        title: "Please rate your experience",
        description: "Your rating helps us improve!",
        variant: "destructive",
      })
      return
    }

    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your name to continue.",
        variant: "destructive",
      })
      return
    }

    if (!formData.phoneNumber.trim()) {
      toast({
        title: "Phone number is required",
        description: "Please enter your phone number to continue.",
        variant: "destructive",
      })
      return
    }

    onSubmit(formData)
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header Section */}
      <div className="relative">
        {/* Cover Image */}
        <div 
          className="h-64 sm:h-80 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${coverImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        </div>
        
        {/* Restaurant Logo - Overlapping */}
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-full">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-slate-900 shadow-2xl overflow-hidden bg-white">
            <img 
              src={logoImage} 
              alt={`${restaurantName} logo`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        {/* Restaurant Info */}
        <div className="text-center pt-16 pb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent mb-2">
            {restaurantName}
          </h1>
          <p className="text-slate-300 text-lg">
            {tagline}
          </p>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-lg backdrop-blur-sm p-6 sm:p-8 space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2 text-white">Share Your Experience</h2>
              <p className="text-slate-300">
                Your feedback helps us create memorable dining experiences
              </p>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-white">
                  Your Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="bg-slate-700/50 border-slate-500 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-white">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Your phone number"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className="bg-slate-700/50 border-slate-500 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            {/* Rating Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-white">
                How was your experience?
              </Label>
              <div className="flex justify-center space-x-2 sm:space-x-4">
                {emojiRatings.map((rating) => (
                  <button
                    key={rating.value}
                    type="button"
                    onClick={() => handleInputChange("experience", rating.value)}
                    className={`transition-all duration-300 ease-out cursor-pointer select-none text-4xl sm:text-5xl p-2 rounded-lg ${
                      formData.experience === rating.value 
                        ? "filter-none brightness-100 scale-125" 
                        : "filter grayscale brightness-50 scale-100"
                    } hover:filter-none hover:brightness-100 hover:scale-110`}
                    title={rating.label}
                  >
                    {rating.emoji}
                  </button>
                ))}
              </div>
              {formData.experience && (
                <p className="text-center text-sm text-slate-400">
                  {emojiRatings.find(r => r.value === formData.experience)?.label}
                </p>
              )}
            </div>

            {/* Voice Recording */}
            <div className="text-center">
              <Label className="text-sm font-medium block mb-3 text-white">
                Leave a Voice Message (Optional)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleVoiceRecording}
                className={`rounded-full w-16 h-16 p-0 border-2 transition-all duration-300 ${
                  isRecording 
                    ? "border-yellow-400 shadow-lg shadow-yellow-400/25" 
                    : "border-slate-500 hover:border-purple-500"
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>
              <p className="text-xs text-slate-400 mt-2">
                {isRecording ? "Recording... Tap to stop" : "Tap to record"}
              </p>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-sm font-medium text-white">
                Additional Comments
              </Label>
              <Textarea
                id="feedback"
                placeholder="Don't hold back — your words matter! Tell us what made your visit special or how we can improve."
                value={formData.feedback}
                onChange={(e) => handleInputChange("feedback", e.target.value)}
                className="min-h-32 bg-slate-700/50 border-slate-500 focus:ring-purple-500 resize-none"
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-white font-semibold py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Share My Feedback'
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-slate-400">
          Powered by{" "}
          <span className="font-semibold bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent">Retenly</span>
          {isDefault && ( 
          <div className="mt-2">
            <Link
              href="/demo/analytics-dashboard"
              className="text-slate-200 underline underline-offset-4 hover:text-yellow-300 transition-colors"
            >
              Peek at our analytics dashboard
            </Link>
          </div>
          )}
        </div>
      </div>
    </div>
  )
} 
