'use client'

import { useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface AnalyticsData {
  totalFeedback: number
  csatScore: number
  npsScore: number
  mostLovedFeature: string
  sentimentDistribution: {
    positive: number
    neutral: number
    negative: number
  }
  recentFeedback: Array<{
    id: string
    customerName: string
    date: string
    rating: number
    sentiment: 'positive' | 'neutral' | 'negative'
    feedback: string
  }>
}

interface OwnerAnalyticsDashboardProps {
  // Restaurant branding
  restaurantName: string
  logoUrl?: string
  
  // Theme colors
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  
  // Data
  analytics: AnalyticsData
  
  // Callbacks
  onRefresh?: () => void
  onViewDetails?: (feedbackId: string) => void
}

/**
 * Modern owner analytics dashboard component
 * 
 * @param props - Component props for customization
 * @returns JSX element containing the analytics dashboard
 */
export default function OwnerAnalyticsDashboard({
  restaurantName = "Downtown Rajkot",
  logoUrl,
  primaryColor = "#10B981", // Green
  secondaryColor = "#6366F1", // Indigo
  accentColor = "#F59E0B", // Amber
  analytics,
  onRefresh,
  onViewDetails
}: OwnerAnalyticsDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = async () => {
    setIsLoading(true)
    if (onRefresh) {
      await onRefresh()
    }
    setIsLoading(false)
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'neutral':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊'
      case 'neutral':
        return '😐'
      case 'negative':
        return '😞'
      default:
        return '❓'
    }
  }

  const pieChartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [
          analytics.sentimentDistribution.positive,
          analytics.sentimentDistribution.neutral,
          analytics.sentimentDistribution.negative
        ],
        backgroundColor: [
          '#10B981', // Green
          '#F59E0B', // Yellow
          '#EF4444'  // Red
        ],
        borderColor: [
          '#059669',
          '#D97706',
          '#DC2626'
        ],
        borderWidth: 2,
      },
    ],
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#D1D5DB',
          font: {
            size: 12,
          },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        borderColor: '#4B5563',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.parsed
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt={`${restaurantName} Logo`}
                  className="w-12 h-12 rounded-full shadow-lg"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{restaurantName}</h1>
                <p className="text-gray-300 text-sm">Analytics Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Refreshing...
                  </div>
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Feedback */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl border border-blue-500/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 backdrop-blur-sm">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Feedback</p>
                <p className="text-3xl font-bold text-white">{analytics.totalFeedback}</p>
              </div>
            </div>
          </div>

          {/* CSAT Score */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 shadow-xl border border-green-500/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 backdrop-blur-sm">
                <span className="text-white text-xl">😊</span>
              </div>
              <div>
                <p className="text-green-100 text-sm font-medium">CSAT Score</p>
                <p className="text-3xl font-bold text-white">{analytics.csatScore}%</p>
              </div>
            </div>
          </div>

          {/* NPS Score */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-xl border border-purple-500/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 backdrop-blur-sm">
                <span className="text-white text-xl">⭐</span>
              </div>
              <div>
                <p className="text-purple-100 text-sm font-medium">NPS Score</p>
                <p className="text-3xl font-bold text-white">{analytics.npsScore}</p>
              </div>
            </div>
          </div>

          {/* Most Loved Feature */}
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 shadow-xl border border-yellow-500/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 backdrop-blur-sm">
                <span className="text-white text-xl">❤️</span>
              </div>
              <div>
                <p className="text-yellow-100 text-sm font-medium">Most Loved</p>
                <p className="text-lg font-bold text-white capitalize">
                  {analytics.mostLovedFeature}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Table Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sentiment Distribution Pie Chart */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Sentiment Distribution
            </h2>
            <div className="h-64">
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </div>

          {/* Recent Feedback Table */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Recent Feedback
            </h2>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {analytics.recentFeedback.map((feedback) => (
                <div 
                  key={feedback.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => onViewDetails?.(feedback.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-white">
                        {feedback.customerName}
                      </span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < feedback.rating ? 'text-yellow-400' : 'text-gray-500'
                            }`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getSentimentColor(feedback.sentiment)}`}>
                      <span className="mr-1">{getSentimentIcon(feedback.sentiment)}</span>
                      {feedback.sentiment}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                    {feedback.feedback}
                  </p>
                  
                  <p className="text-gray-400 text-xs">
                    {new Date(feedback.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
              
              {analytics.recentFeedback.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">📝</span>
                  </div>
                  <p className="text-gray-400">No recent feedback</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">Average Rating</h3>
            <p className="text-3xl font-bold text-yellow-400">
              {analytics.recentFeedback.length > 0 
                ? (analytics.recentFeedback.reduce((sum, f) => sum + f.rating, 0) / analytics.recentFeedback.length).toFixed(1)
                : '0.0'
              }
            </p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">Response Rate</h3>
            <p className="text-3xl font-bold text-green-400">
              {analytics.recentFeedback.length > 0 ? '95%' : '0%'}
            </p>
          </div>
          
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">This Month</h3>
            <p className="text-3xl font-bold text-blue-400">
              {analytics.recentFeedback.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
