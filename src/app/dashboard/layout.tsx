'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/dashboard/Header'
import { DashboardProvider } from '@/context/DashboardContext'

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
  kpiCardData: {
    totalFeedback: { change: number; changeLabel: string }
    averageRating: { change: number; changeLabel: string }
    positiveFeedback: { change: number; changeLabel: string }
    customerSatisfaction: { change: number; changeLabel: string }
  }
}

interface Feedback {
  id: string
  text: string
  experience: string
  createdAt: string
  name: string
  rating?: number
  sentiment?: "positive" | "negative" | "neutral"
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
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [topPositiveFeedbacks, setTopPositiveFeedbacks] = useState<Feedback[]>([])
  const [topNegativeFeedbacks, setTopNegativeFeedbacks] = useState<Feedback[]>([])
  const [recentFeedbacks, setRecentFeedbacks] = useState<Feedback[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [allFeedback, setAllFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/restaurant/dashboard?includeAllFeedbacks=true', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setRestaurant(data.restaurant)
        setAnalytics(data.analytics)
        setTopPositiveFeedbacks(data.topPositiveFeedbacks || [])
        setTopNegativeFeedbacks(data.topNegativeFeedbacks || [])
        setRecentFeedbacks(data.recentFeedbacks || [])
        setForms(data.forms || [])
        const transformedFeedback = (data.allFeedbacks || []).map((f: any) => ({
          id: f.id,
          date: f.createdAt,
          customerName: f.name || 'Anonymous',
          phone: f.phoneNumber || 'N/A',
          feedback: f.feedback || 'No text feedback',
          rating: f.rating || 3,
          sentiment: f.sentiment?.toLowerCase() || 'neutral',
          tags: []
        }));
        setAllFeedback(transformedFeedback);
      } else {
        console.error('Failed to fetch dashboard data for layout:', response.status)
        setError('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Error fetching data for layout:', error)
      setError('An error occurred while loading data')
    } finally {
      setIsLoading(false)
    }
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
            <p className="text-red-500">{error || 'Unable to load restaurant data.'}</p>
          </div>
        </div>
      </div>
    )
  }

  const contextValue = {
    restaurant,
    analytics,
    topPositiveFeedbacks,
    topNegativeFeedbacks,
    recentFeedbacks,
    forms,
    allFeedback,
  };

  return (
    <DashboardProvider value={contextValue}>
      <div className="min-h-screen bg-background">
        <Header
          restaurantName={restaurant.name}
          restaurantLogo={restaurant.logoUrl}
        />
        {children}
      </div>
    </DashboardProvider>
  )
}
