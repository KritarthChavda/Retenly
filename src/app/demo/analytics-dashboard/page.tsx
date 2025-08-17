'use client'

import OwnerAnalyticsDashboard from '@/components/dashboard/OwnerAnalyticsDashboard'

/**
 * Demo page for OwnerAnalyticsDashboard component
 * 
 * @returns JSX element containing the demo dashboard
 */
export default function AnalyticsDashboardDemo() {
  // Dummy data for demonstration
  const dummyAnalytics = {
    totalFeedback: 247,
    csatScore: 87,
    npsScore: 52,
    mostLovedFeature: "Food Quality",
    sentimentDistribution: {
      positive: 156,
      neutral: 67,
      negative: 24
    },
    recentFeedback: [
      {
        id: "1",
        customerName: "Sarah Johnson",
        date: "2024-01-15T10:30:00Z",
        rating: 5,
        sentiment: "positive" as const,
        feedback: "Amazing experience! The food was delicious and the service was impeccable. Will definitely come back!"
      },
      {
        id: "2",
        customerName: "Mike Chen",
        date: "2024-01-14T19:15:00Z",
        rating: 4,
        sentiment: "positive" as const,
        feedback: "Great atmosphere and friendly staff. The pasta was cooked perfectly."
      },
      {
        id: "3",
        customerName: "Emily Davis",
        date: "2024-01-14T14:45:00Z",
        rating: 3,
        sentiment: "neutral" as const,
        feedback: "Food was okay, but the wait time was a bit long. Service was friendly though."
      },
      {
        id: "4",
        customerName: "David Wilson",
        date: "2024-01-13T20:00:00Z",
        rating: 2,
        sentiment: "negative" as const,
        feedback: "Disappointed with the portion size. Food was cold when it arrived."
      },
      {
        id: "5",
        customerName: "Lisa Brown",
        date: "2024-01-13T12:30:00Z",
        rating: 5,
        sentiment: "positive" as const,
        feedback: "Absolutely loved the dessert! The chocolate cake was to die for. Staff was very attentive."
      },
      {
        id: "6",
        customerName: "Tom Anderson",
        date: "2024-01-12T18:20:00Z",
        rating: 4,
        sentiment: "positive" as const,
        feedback: "Good food and reasonable prices. The ambiance is perfect for a date night."
      }
    ]
  }

  const handleRefresh = async () => {
    console.log('Refreshing analytics...')
    // In a real app, this would fetch fresh data from your API
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Analytics refreshed!')
  }

  const handleViewDetails = (feedbackId: string) => {
    console.log('Viewing details for feedback:', feedbackId)
    // In a real app, this would navigate to a detailed view
  }

  return (
    <OwnerAnalyticsDashboard
      restaurantName="Downtown Rajkot"
      logoUrl="/uploads/demo-logo.png" // You can add a demo logo to public/uploads/
      primaryColor="#10B981"
      secondaryColor="#6366F1"
      accentColor="#F59E0B"
      analytics={dummyAnalytics}
      onRefresh={handleRefresh}
      onViewDetails={handleViewDetails}
    />
  )
}
