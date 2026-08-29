'use client'

import { MessageSquare, Star, TrendingUp, RefreshCcw, Loader2 } from "lucide-react"
import { KPICard } from "@/components/dashboard/KPICard"
import { SentimentChart } from "@/components/dashboard/SentimentChart"
import { FeedbackHighlights } from "@/components/dashboard/FeedbackHighlights"
import { RecentFeedbackTable } from "@/components/dashboard/RecentFeedbackTable"
import { useDashboard, FeedbackWindow } from "@/context/DashboardContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

/**
 * Main restaurant dashboard page with Loveable design
 * 
 * @returns JSX element containing the restaurant dashboard
 */
export default function RestaurantDashboard() {
  const { restaurant, analytics, topHighlights, recentFeedbacks, forms, feedbackWindow, setFeedbackWindow, isHighlightsLoading } = useDashboard();

  const handleWindowChange = (value: string) => {
    setFeedbackWindow(value as FeedbackWindow)
  }

  const windowLabelMap: Record<FeedbackWindow, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days'
  }

  const fallbackWindow: FeedbackWindow = feedbackWindow === '7d'
    ? '30d'
    : feedbackWindow === '30d'
      ? '90d'
      : '30d'

  const handleEmptyHighlightsAction = () => {
    handleWindowChange(fallbackWindow)
  }

  if (!restaurant || !analytics) {
    return null; // Or a loading/error state
  }

  const hasFeedback = analytics.totalFeedbackCount > 0

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
  // Transform recent feedback for the table
  const recentFeedbackForTable = recentFeedbacks.map(feedback => ({
    id: feedback.id,
    date: feedback.date,
    customerName: feedback.customerName,
    rating: feedback.rating || 3,
    feedback: feedback.feedback,
    sentiment: feedback.sentiment || "neutral",
    voiceRecordingUrl: feedback.voiceRecordingUrl,
    // RecentFeedbackTable only renders the transcript when both of these are set;
    // dropping it here hid every voice transcript on the dashboard.
    voiceTranscript: feedback.voiceTranscript,
  }))

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Welcome Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {restaurant.name}! 👋
              </h1>
              <p className="text-muted-foreground">
                Here's your customer feedback overview for this month.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Showing</span>
              <Select value={feedbackWindow} onValueChange={handleWindowChange} disabled={isHighlightsLoading}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              {isHighlightsLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {!hasFeedback && (
            <div className="rounded-2xl border border-dashed border-glass/60 bg-card/40 p-5 text-sm text-muted-foreground flex flex-col gap-3">
              <p>
                No feedback was collected during this period. Try expanding the timeframe to review recent insights or share your form to gather more responses.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEmptyHighlightsAction}
                  disabled={isHighlightsLoading}
                >
                  View {windowLabelMap[fallbackWindow]}
                </Button>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <KPICard
              title="Total Feedback"
              value={analytics.totalFeedbackCount}
              icon={<MessageSquare className="w-6 h-6" />}
              variant="positive"
            />
            <KPICard
              title="Average Rating"
              value={`${analytics.averageRating}/5`}
              icon={<Star className="w-6 h-6" />}
              variant="neutral"
            />
            <KPICard
              title="Positive Feedback"
              value={`${analytics.totalFeedbackCount > 0 ? Math.round((analytics.sentimentData.positive / analytics.totalFeedbackCount) * 100) : 0}%`}
              icon={<TrendingUp className="w-6 h-6" />}
              variant="positive"
            />
            <KPICard
              title="Repeat Feedback Rate"
              value={`${analytics.repeatFeedbackRate}%`}
              icon={<RefreshCcw className="w-6 h-6" />}
              variant="neutral"
            />
          </div>

          {/* Charts and Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sentiment Chart */}
            <div className="p-6 rounded-2xl border border-glass bg-gradient-card backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-6">Sentiment Overview</h2>
              <SentimentChart
                key={feedbackWindow}
                data={sentimentChartData}
                centerLabel={windowLabelMap[feedbackWindow]}
                totalValue={analytics.totalFeedbackCount}
              />
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
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-xl font-semibold">Feedback Highlights</h2>
            </div>
            {topHighlights.length > 0 ? (
              <FeedbackHighlights highlights={topHighlights} />
            ) : (
              <div className="rounded-xl border border-dashed border-glass/60 p-6 text-sm text-muted-foreground flex flex-col gap-4">
                <p>
                  No feedback highlights are available for this time range. Try expanding the window to reveal more insights.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEmptyHighlightsAction}
                    disabled={isHighlightsLoading}
                  >
                    View {windowLabelMap[fallbackWindow]}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Recent Feedback Table */}
          <div className="p-6 rounded-2xl border border-glass bg-gradient-card backdrop-blur-sm">
            <RecentFeedbackTable data={recentFeedbackForTable} />
          </div>
        </div>
      </main>
    </div>
  )
}
