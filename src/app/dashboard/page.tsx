'use client'

import { MessageSquare, Star, TrendingUp, RefreshCcw } from "lucide-react"
import { KPICard } from "@/components/dashboard/KPICard"
import { SentimentChart } from "@/components/dashboard/SentimentChart"
import { FeedbackHighlights } from "@/components/dashboard/FeedbackHighlights"
import { RecentFeedbackTable } from "@/components/dashboard/RecentFeedbackTable"
import { useDashboard } from "@/context/DashboardContext"

/**
 * Main restaurant dashboard page with Loveable design
 * 
 * @returns JSX element containing the restaurant dashboard
 */
export default function RestaurantDashboard() {
  const { restaurant, analytics, topPositiveFeedbacks, topNegativeFeedbacks, recentFeedbacks, forms } = useDashboard();

  if (!restaurant || !analytics) {
    return null; // Or a loading/error state
  }

  if (analytics.totalFeedbackCount === 0) {
    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-6 py-8 text-center">
                <h1 className="text-3xl font-bold text-foreground">Welcome, {restaurant.name}! 👋</h1>
                <p className="text-muted-foreground mt-2">You don't have any feedback yet.</p>
                <p className="text-muted-foreground">Share your feedback form with your customers to get started.</p>
            </main>
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
            change={analytics.kpiCardData.totalFeedback.change}
            changeLabel={analytics.kpiCardData.totalFeedback.changeLabel}
            icon={<MessageSquare className="w-6 h-6" />}
            variant="default"
          />
          <KPICard
            title="Average Rating"
            value={`${analytics.averageRating}/5`}
            change={analytics.kpiCardData.averageRating.change}
            changeLabel={analytics.kpiCardData.averageRating.changeLabel}
            icon={<Star className="w-6 h-6" />}
            variant="positive"
          />
          <KPICard
            title="Positive Feedback"
            value={`${analytics.totalFeedbackCount > 0 ? Math.round((analytics.sentimentData.positive / analytics.totalFeedbackCount) * 100) : 0}%`}
            change={analytics.kpiCardData.positiveFeedback.change}
            changeLabel={analytics.kpiCardData.positiveFeedback.changeLabel}
            icon={<TrendingUp className="w-6 h-6" />}
            variant="positive"
          />
          <KPICard
            title="Repeat Feedback Rate"
            value={`${analytics.repeatFeedbackRate}%`}
            change={analytics.kpiCardData.repeatFeedbackRate.change}
            changeLabel={analytics.kpiCardData.repeatFeedbackRate.changeLabel}
            icon={<RefreshCcw className="w-6 h-6" />}
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
