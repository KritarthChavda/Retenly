'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mic, MicOff } from "lucide-react"
import { validatePhoneNumber, formatPhoneNumberToE164 } from '@/lib/validation'
import { ErrorTooltip } from "@/components/ui/error-tooltip"
import { useToast } from '@/hooks/use-toast'
import restaurantCover from "@/assets/restaurant-cover.jpg"
import restaurantLogo from "@/assets/restaurant-logo.png"
import Link from "next/link"
import { addFeedback, deleteFeedback } from '@/lib/indexedDB'
import { pickRecorderMimeType, voiceRecordingFileName } from '@/lib/audio'

interface FeedbackFormProps {
  onSubmit: (data: FeedbackData) => void;
  restaurantSlug: string;
  restaurantName?: string;
  tagline?: string;
  coverImage?: string;
  logoImage?: string;
  isDefault?: boolean;
}

export interface FeedbackData {
  name: string
  phoneNumber: string
  experience: string
  feedback?: string
  voiceRecordingUrl?: string
}

const emojiRatings = [
  { emoji: "😡", value: 'Not great', label: "Terrible", color: "text-red-500" },
  { emoji: "🙁", value: 'Poor', label: "Poor", color: "text-orange-500" },
  { emoji: "😐", value: 'Okay-ish', label: "Neutral", color: "text-yellow-500" },
  { emoji: "😊", value: 'Pretty good', label: "Good", color: "text-green-500" },
  { emoji: "😍", value: 'YO!', label: "Excellent", color: "text-blue-500" },
]

export default function FeedbackForm({
  onSubmit,
  restaurantSlug,
  restaurantName = "Downtown Rajkot",
  tagline = "Spill the beans — we're all ears! 🍽️",
  coverImage = restaurantCover.src,
  logoImage = restaurantLogo.src,
  isDefault = false
}: FeedbackFormProps) {
  const [formData, setFormData] = useState<Omit<FeedbackData, 'voiceRecordingUrl'>>({
    name: '',
    phoneNumber: '',
    experience: '',
    feedback: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const { toast } = useToast()

  const handleInputChange = (field: keyof Omit<FeedbackData, 'voiceRecordingUrl'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleVoiceRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      toast({
        title: "Recording saved",
        description: "Your voice feedback has been captured.",
      })
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        // Ask for a container we know is supported. Without this, `recorder.mimeType`
        // is "" until recording has started, and a Blob stamped with an empty type is
        // rejected by /api/voice-upload as "Invalid file type".
        const preferredMimeType = pickRecorderMimeType()
        const recorder = preferredMimeType
          ? new MediaRecorder(stream, { mimeType: preferredMimeType })
          : new MediaRecorder(stream)
        mediaRecorderRef.current = recorder
        audioChunksRef.current = []

        recorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data)
        }

        recorder.onstop = () => {
          // By onstop the recorder reports its real container; fall back through the
          // requested type so the blob is never left without a MIME type.
          const recordedMimeType = recorder.mimeType || preferredMimeType || 'audio/webm'
          const audioBlob = new Blob(audioChunksRef.current, { type: recordedMimeType })
          setAudioBlob(audioBlob)
          stream.getTracks().forEach(track => track.stop()) // Stop microphone access
        }

        mediaRecorderRef.current.start()
        setIsRecording(true)
        toast({
          title: "Recording started",
          description: "Speak your thoughts! Tap again to stop.",
        })
      } catch (error) {
        console.error("Error accessing microphone:", error)
        toast({
          title: "Error",
          description: "Could not access microphone. Please check your browser permissions.",
          variant: "destructive"
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Please fill out this field.'
      setErrors(newErrors)
      return
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Please fill out this field.'
      setErrors(newErrors)
      return
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number.'
      setErrors(newErrors)
      return
    }

    if (!formData.experience) {
      newErrors.experience = 'Please select a rating.'
      setErrors(newErrors)
      return
    }

    if (!formData.feedback?.trim() && !audioBlob) {
      newErrors.feedback = 'Please share your feedback/voice message'
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    console.log('[Form] Submission started.')

    const formattedPhone = formatPhoneNumberToE164(formData.phoneNumber) || formData.phoneNumber
    const submissionData = { ...formData, phoneNumber: formattedPhone }
    console.log('[Form] Submission data:', submissionData)

    try {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          const hasSync = 'sync' in registration
          console.log('[Form] SW ready. Background Sync supported:', hasSync)

          if (hasSync) {
            console.log('[Form] Using Background Sync flow')
            const id = new Date().toISOString()
            const fileName = audioBlob ? voiceRecordingFileName(audioBlob.type) : null
            await addFeedback(id, restaurantSlug, submissionData, audioBlob, fileName)

            try {
              await registration.sync.register('submit-feedback')
            } catch (syncErr) {
              // `'sync' in registration` is true even when the browser has Background
              // Sync disabled, and register() only throws here. Drop the queued row so
              // the fallback below doesn't leave a duplicate behind for a later sync.
              await deleteFeedback(id).catch(() => undefined)
              throw syncErr
            }

            // We consider it "submitted" from the user's POV
            onSubmit(submissionData)
            setIsSubmitting(false)
            return
          }
        } catch (err) {
          console.warn('[Form] SW / Background Sync failed, falling back:', err)
        }
      }

      console.log('[Form] Using direct fallback flow (no Background Sync)')

      // Fallback: normal HTTP submission
      const response = await fetch(`/api/forms/${restaurantSlug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: submissionData }),
      })

      if (!response.ok) throw new Error('Submission failed')

      const result = await response.json()
      const feedbackId = result.feedbackId
      onSubmit(submissionData)

      // Upload voice recording in the background (no need to block UX)
      if (audioBlob && feedbackId) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', audioBlob, voiceRecordingFileName(audioBlob.type))
        uploadFormData.append('feedbackId', feedbackId)

        fetch('/api/voice-upload', {
          method: 'POST',
          body: uploadFormData,
        })
          .then(uploadResponse => {
            if (uploadResponse.ok) {
              console.log('[Form] Fallback voice upload successful.')
            } else {
              console.error('[Form] Fallback voice upload failed.')
              toast({
                title: 'Voice Upload Failed',
                description: "We couldn't upload your voice message.",
                variant: 'destructive',
              })
            }
          })
          .catch(error => {
            console.error('[Form] Fallback voice upload error:', error)
            toast({
              title: 'Voice Upload Error',
              description: 'An error occurred while uploading your voice message.',
              variant: 'destructive',
            })
          })
      }

      setIsSubmitting(false)
    } catch (error) {
      console.error('[Form] Submission error:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit feedback.',
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
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
                Your feedback helps us create memorable experiences
              </p>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-white">
                  Your Name
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full bg-slate-700/50 border-slate-500 focus:ring-purple-500 ${
                      errors.name ? 'border-purple-500' : 'border-slate-500'
                    }`}
                  />
                  <ErrorTooltip
                    show={!!errors.name}
                    message={errors.name || ''}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-white">
                  Phone Number
                </Label>
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Your phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    className={`w-full bg-slate-700/50 border-slate-500 focus:ring-purple-500 ${
                      errors.phoneNumber ? 'border-purple-500' : 'border-slate-500'
                    }`}
                  />
                  <ErrorTooltip
                    show={!!errors.phoneNumber}
                    message={errors.phoneNumber || ''}
                  />
                </div>
              </div>
            </div>

            {/* Rating Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-white">
                How was your experience?
              </Label>
              <div className="relative">
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
                {errors.experience && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-max">
                    <ErrorTooltip show={!!errors.experience} message={errors.experience} />
                  </div>
                )}
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
                Leave a Voice Message
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
                Your Valuable Feedback <span className="text-amber-400">*</span>
              </Label>
              <div className="relative">
                <Textarea
                  id="feedback"
                  placeholder="Don't hold back — your words matter! Tell us what made your visit special or how we can improve."
                  value={formData.feedback}
                  onChange={(e) => handleInputChange("feedback", e.target.value)}
                  className={`min-h-32 bg-slate-700/50 focus:ring-purple-500 resize-none ${
                    errors.feedback ? 'border-purple-500' : 'border-slate-500'
                  }`}
                  rows={4}
                />
                <ErrorTooltip show={!!errors.feedback} message={errors.feedback || ''} />
              </div>
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
