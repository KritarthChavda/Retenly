'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Header } from '@/components/dashboard/Header'
import { Footer } from '@/components/dashboard/Footer'
import { DashboardProvider, FeedbackWindow } from '@/context/DashboardContext'

interface Restaurant {
  id: string
  name: string
  username: string
  logoUrl?: string
}

interface Analytics {
  totalFeedbackCount: number
  sentimentData: {
    positive: number
    neutral: number
    negative: number
  }
  csatScore: number
  npsScore: number
  mostLovedFeature: string
  averageRating: number
  repeatFeedbackRate: number
}

interface FeedbackHighlight {
  id: string
  summary: string
  generatedAt: string
  themes: string[]
  confidence: number
  type: "positive" | "negative"
}

interface Form {
  id: string
  title: string
  feedbackCount: number
  responseCount: number
}

interface FeedbackItem {
  id: string;
  date: string;
  customerName: string;
  phone?: string;
  rating: number;
  feedback: string;
  sentiment: "positive" | "negative" | "neutral";
  tags?: string[];
  voiceRecordingUrl?: string;
  voiceTranscript?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [topHighlights, setTopHighlights] = useState<FeedbackHighlight[]>([])
  const [recentFeedbacks, setRecentFeedbacks] = useState<FeedbackItem[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [allFeedback, setAllFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true)
  const [isHighlightsLoading, setIsHighlightsLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedbackWindow, setFeedbackWindowState] = useState<FeedbackWindow>('30d')
  const latestRequestIdRef = useRef(0)

  useEffect(() => {
    fetchDashboardData(feedbackWindow, { showFullLoader: true })
  }, [])

  const fetchDashboardData = async (
    windowParam: FeedbackWindow,
    { showFullLoader = false }: { showFullLoader?: boolean } = {}
  ) => {
    const requestId = ++latestRequestIdRef.current
    try {
      if (showFullLoader) {
        setIsLoading(true)
      } else {
        setIsHighlightsLoading(true)
      }

      const response = await fetch(
        `/api/restaurant/dashboard?includeAllFeedbacks=true&window=${windowParam}`,
        { credentials: 'include' }
      )
      if (response.ok) {
        const data = await response.json()
        if (requestId !== latestRequestIdRef.current) {
          return
        }
        setRestaurant(data.restaurant)
        setAnalytics(data.analytics)
        setError('')
        const topHighlights = (data.topHighlights || []).map((item: any) => ({
          id: item.id,
          summary: item.summary,
          generatedAt: item.generatedAt,
          themes: item.themes || [],
          confidence: item.confidence ?? 0.6,
          type: item.type === 'negative' ? 'negative' : 'positive'
        }))
        setTopHighlights(() => {
          const map = new Map<string, FeedbackHighlight>()
          for (const h of topHighlights) {
            map.set(h.id, h)
          }
          return Array.from(map.values())
        })
        const recent = (data.recentFeedbacks || []).map((f: any) => ({
          id: f.id,
          date: f.createdAt,
          customerName: f.name || 'Anonymous',
          phone: f.phoneNumber || 'N/A',
          feedback: f.feedback || 'No text feedback',
          rating: f.rating || 3,
          sentiment: (f.sentiment || 'neutral').toLowerCase(),
          tags: [],
          voiceRecordingUrl: f.voiceRecordingUrl,
          voiceTranscript: f.voiceTranscript,
        }))
        setRecentFeedbacks(recent)
        setForms(data.forms || [])
        const transformedFeedback = (data.allFeedbacks || []).map((f: any) => ({
          id: f.id,
          date: f.createdAt,
          customerName: f.name || 'Anonymous',
          phone: f.phoneNumber || 'N/A',
          feedback: f.feedback || 'No text feedback',
          rating: f.rating || 3,
          sentiment: f.sentiment?.toLowerCase() || 'neutral',
          tags: [],
          voiceRecordingUrl: f.voiceRecordingUrl,
          voiceTranscript: f.voiceTranscript,
        }));
        setAllFeedback(transformedFeedback);
      } else {
        console.error('Failed to fetch dashboard data for layout:', response.status)
        if (requestId === latestRequestIdRef.current) {
          setError('Failed to load dashboard data')
        }
      }
    } catch (error) {
      if (requestId === latestRequestIdRef.current) {
        console.error('Error fetching data for layout:', error)
        setError('An error occurred while loading data')
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        if (showFullLoader) {
          setIsLoading(false)
        }
        setIsHighlightsLoading(false)
      }
    }
  }

  const handleWindowChange = (windowParam: FeedbackWindow) => {
    setFeedbackWindowState(windowParam)
    const currentWindow = windowParam
    fetchDashboardData(windowParam)
    if (currentWindow !== feedbackWindow) return
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header restaurantName="Loading..." />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Header restaurantName="Error" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500">{error || 'Unable to load business data.'}</p>
          </div>
        </div>
      </div>
    )
  }

  const contextValue = {
    restaurant,
    setRestaurant,
    analytics,
    topHighlights,
    recentFeedbacks,
    forms,
    allFeedback,
    feedbackWindow,
    setFeedbackWindow: handleWindowChange,
    isHighlightsLoading,
  };

  return (
    <DashboardProvider value={contextValue}>
      <div className="min-h-screen bg-background flex flex-col">
        <Header
          restaurantName={restaurant.name}
          restaurantLogo={restaurant.logoUrl}
        />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </DashboardProvider>
  )
}
