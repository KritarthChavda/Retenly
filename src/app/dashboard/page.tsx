'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Star, TrendingUp, Users } from "lucide-react"
import { Header } from "@/components/dashboard/Header"
import { KPICard } from "@/components/dashboard/KPICard"
import { SentimentChart } from "@/components/dashboard/SentimentChart"
import { FeedbackHighlights } from "@/components/dashboard/FeedbackHighlights"
import { RecentFeedbackTable } from "@/components/dashboard/RecentFeedbackTable"

interface Restaurant {
  id: string
  name: string
  username: string
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

/**
 * Main restaurant dashboard page with Loveable design
 * 
 * @returns JSX element containing the restaurant dashboard
 */
export default function RestaurantDashboard() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [topPositiveFeedbacks, setTopPositiveFeedbacks] = useState<Feedback[]>([])
  const [topNegativeFeedbacks, setTopNegativeFeedbacks] = useState<Feedback[]>([])
  const [recentFeedbacks, setRecentFeedbacks] = useState<Feedback[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard analytics
      const analyticsResponse = await fetch('/api/restaurant/dashboard')
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setRestaurant(analyticsData.restaurant)
        setAnalytics(analyticsData.analytics)
        setTopPositiveFeedbacks(analyticsData.topPositiveFeedbacks || [])
        setTopNegativeFeedbacks(analyticsData.topNegativeFeedbacks || [])
        setForms(analyticsData.forms || [])
        
        // Use recent feedbacks from the dashboard API
        const recentFeedbacksData = analyticsData.recentFeedbacks || []
        setRecentFeedbacks(recentFeedbacksData)
      } else {
        console.error('Failed to fetch dashboard data:', analyticsResponse.status)
        setError('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('An error occurred while loading dashboard data')
    } finally {
      setIsLoading(false)
    }
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

  if (!restaurant || !analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Restaurant Not Found</h1>
          <p className="text-muted-foreground">Unable to load restaurant data.</p>
        </div>
      </div>
    )
  }

  // Transform data for the new components
  const sentimentChartData = [
    { 
      name: "Positive", 
      value: analytics.sentimentData.positive, 
      percentage: analytics.totalFeedbackCount > 0 ? Math.round((analytics.sentimentData.positive / analytics.totalFeedbackCount) * 100) : 0, 
      color: "#10b981" 
    },
    { 
      name: "Neutral", 
      value: analytics.sentimentData.neutral, 
      percentage: analytics.totalFeedbackCount > 0 ? Math.round((analytics.sentimentData.neutral / analytics.totalFeedbackCount) * 100) : 0, 
      color: "#f59e0b" 
    },
    { 
      name: "Negative", 
      value: analytics.sentimentData.negative, 
      percentage: analytics.totalFeedbackCount > 0 ? Math.round((analytics.sentimentData.negative / analytics.totalFeedbackCount) * 100) : 0, 
      color: "#ef4444" 
    },
  ]

  // Transform feedback data for the highlights component
  const positiveFeedbackForHighlights = topPositiveFeedbacks.map(feedback => ({
    id: feedback.id,
    customerName: feedback.name,
    rating: feedback.rating || 5,
    feedback: feedback.text,
    date: feedback.createdAt,
    sentiment: "positive" as const
  }))

  const negativeFeedbackForHighlights = topNegativeFeedbacks.map(feedback => ({
    id: feedback.id,
    customerName: feedback.name,
    rating: feedback.rating || 2,
    feedback: feedback.text,
    date: feedback.createdAt,
    sentiment: "negative" as const
  }))

  // Transform recent feedback for the table
  const recentFeedbackForTable = recentFeedbacks.map(feedback => ({
    id: feedback.id,
    date: feedback.createdAt,
    customerName: feedback.name,
    rating: feedback.rating || 3,
    feedback: feedback.text,
    sentiment: feedback.sentiment || "neutral"
  }))

  return (
    <div className="min-h-screen bg-background">
      <Header 
        restaurantName={restaurant.name}
        restaurantLogo={(restaurant as any)?.logoUrl || undefined}
      />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {restaurant.name}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's your customer feedback overview for this month.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Feedback"
            value={analytics.totalFeedbackCount}
            change={12}
            changeLabel="vs last month"
            icon={<MessageSquare className="w-6 h-6" />}
            variant="default"
          />
          <KPICard
            title="Average Rating"
            value={`${analytics.averageRating}/5`}
            change={8}
            changeLabel="vs last month"
            icon={<Star className="w-6 h-6" />}
            variant="positive"
          />
          <KPICard
            title="Positive Feedback"
            value={`${analytics.totalFeedbackCount > 0 ? Math.round((analytics.sentimentData.positive / analytics.totalFeedbackCount) * 100) : 0}%`}
            change={5}
            changeLabel="vs last month"
            icon={<TrendingUp className="w-6 h-6" />}
            variant="positive"
          />
          <KPICard
            title="Customer Satisfaction"
            value={`${analytics.csatScore}%`}
            change={-2}
            changeLabel="vs last month"
            icon={<Users className="w-6 h-6" />}
            variant="neutral"
          />
        </div>

        {/* Charts and Analysis */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Sentiment Chart */}
          <div className="p-6 rounded-2xl border border-glass bg-gradient-card backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-6">Sentiment Overview</h2>
            <SentimentChart data={sentimentChartData} />
          </div>

          {/* Summary Stats */}
          <div className="p-6 rounded-2xl border border-glass bg-gradient-card backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-6">Summary Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-glass border border-glass">
                <span className="text-muted-foreground">Customer Satisfaction Score (CSAT)</span>
                <span className="text-2xl font-bold text-success">{analytics.csatScore}%</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-glass border border-glass">
                <span className="text-muted-foreground">Net Promoter Score (NPS)</span>
                <span className="text-2xl font-bold text-info">{analytics.npsScore}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-glass border border-glass">
                <span className="text-muted-foreground">Most-Loved Feature</span>
                <span className="text-sm font-medium text-success">{analytics.mostLovedFeature}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-glass border border-glass">
                <span className="text-muted-foreground">Top Improvement Area</span>
                <span className="text-sm font-medium text-destructive">Reduce table wait times</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Highlights */}
        <div className="p-6 rounded-2xl border border-glass bg-gradient-card backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-6">Feedback Highlights</h2>
          <FeedbackHighlights 
            positiveFeedback={positiveFeedbackForHighlights}
            negativeFeedback={negativeFeedbackForHighlights}
          />
        </div>

        {/* Recent Feedback Table */}
        <div className="p-6 rounded-2xl border border-glass bg-gradient-card backdrop-blur-sm">
          <RecentFeedbackTable data={recentFeedbackForTable} />
        </div>
      </main>
    </div>
  )
} 