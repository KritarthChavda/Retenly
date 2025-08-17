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
}

interface DashboardAnalyticsProps {
  analytics: Analytics
}

/**
 * Dashboard analytics component displaying key metrics
 * 
 * @param analytics - The analytics data object
 * @returns JSX element containing the analytics cards
 */
export default function DashboardAnalytics({ analytics }: DashboardAnalyticsProps) {
  const getNpsColor = (score: number) => {
    if (score >= 50) return 'text-green-400'
    if (score >= 0) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getCsatColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Feedback Count */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl border border-blue-500/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 backdrop-blur-sm">
            <span className="text-white text-xl">📊</span>
          </div>
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Feedback</p>
            <p className="text-3xl font-bold text-white">{analytics.totalFeedbackCount}</p>
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
            <p className={`text-3xl font-bold ${getCsatColor(analytics.csatScore)}`}>
              {analytics.csatScore}%
            </p>
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
            <p className={`text-3xl font-bold ${getNpsColor(analytics.npsScore)}`}>
              {analytics.npsScore}
            </p>
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
  )
} 