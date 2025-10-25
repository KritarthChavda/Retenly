'use client'

import { useCallback, useMemo, useState } from 'react'
import RestaurantDashboard from '@/app/dashboard/page'
import { DashboardProvider, FeedbackWindow } from '@/context/DashboardContext'
import { Header } from '@/components/dashboard/Header'

const restaurant = {
  id: 'demo-restaurant',
  name: 'Downtown Rajkot',
  username: 'demo-owner',
  logoUrl: undefined as string | undefined,
}

type DemoAnalytics = {
  totalFeedbackCount: number
  sentimentData: { positive: number; neutral: number; negative: number }
  csatScore: number
  npsScore: number
  mostLovedFeature: string
  averageRating: number
  repeatFeedbackRate: number
  kpiCardData: {
    totalFeedback: { change: number; changeLabel: string }
    averageRating: { change: number; changeLabel: string }
    positiveFeedback: { change: number; changeLabel: string }
    repeatFeedbackRate: { change: number; changeLabel: string }
  }
}

type DemoHighlight = {
  id: string
  summary: string
  generatedAt: string
  themes: string[]
  confidence: number
  type: 'positive' | 'negative'
}

type DemoFeedback = {
  id: string
  date: string
  customerName: string
  rating: number
  feedback: string
  sentiment: 'positive' | 'neutral' | 'negative'
}

const analyticsByWindow: Record<FeedbackWindow, DemoAnalytics> = {
  '7d': {
    totalFeedbackCount: 42,
    sentimentData: { positive: 28, neutral: 10, negative: 4 },
    csatScore: 82,
    npsScore: 36,
    mostLovedFeature: 'Friendly staff',
    averageRating: 4.4,
    repeatFeedbackRate: 18,
    kpiCardData: {
      totalFeedback: { change: 8, changeLabel: 'vs last week' },
      averageRating: { change: 0.3, changeLabel: 'vs last week' },
      positiveFeedback: { change: 5, changeLabel: 'vs last week' },
      repeatFeedbackRate: { change: 4, changeLabel: 'vs last week' },
    },
  },
  '30d': {
    totalFeedbackCount: 168,
    sentimentData: { positive: 118, neutral: 34, negative: 16 },
    csatScore: 86,
    npsScore: 44,
    mostLovedFeature: 'Signature thali',
    averageRating: 4.5,
    repeatFeedbackRate: 24,
    kpiCardData: {
      totalFeedback: { change: 14, changeLabel: 'vs last month' },
      averageRating: { change: 0.1, changeLabel: 'vs last month' },
      positiveFeedback: { change: 9, changeLabel: 'vs last month' },
      repeatFeedbackRate: { change: 3, changeLabel: 'vs last month' },
    },
  },
  '90d': {
    totalFeedbackCount: 482,
    sentimentData: { positive: 336, neutral: 102, negative: 44 },
    csatScore: 88,
    npsScore: 51,
    mostLovedFeature: 'Live music nights',
    averageRating: 4.6,
    repeatFeedbackRate: 31,
    kpiCardData: {
      totalFeedback: { change: 6, changeLabel: 'vs last quarter' },
      averageRating: { change: 0.2, changeLabel: 'vs last quarter' },
      positiveFeedback: { change: 11, changeLabel: 'vs last quarter' },
      repeatFeedbackRate: { change: 5, changeLabel: 'vs last quarter' },
    },
  },
}

const topHighlightsByWindow: Record<FeedbackWindow, DemoHighlight[]> = {
  '7d': [
    {
      id: 'h-pos-1',
      summary: 'Guests loved the warmth and attentiveness from the evening shift team.',
      generatedAt: new Date().toISOString(),
      themes: ['service', 'staff'],
      confidence: 0.82,
      type: 'positive' as const,
    },
    {
      id: 'h-pos-2',
      summary: 'Families appreciated the quick table turnaround during the weekend rush.',
      generatedAt: new Date().toISOString(),
      themes: ['operations'],
      confidence: 0.74,
      type: 'positive' as const,
    },
    {
      id: 'h-neg-1',
      summary: 'Several diners mentioned noise levels near the live cooking station.',
      generatedAt: new Date().toISOString(),
      themes: ['ambience'],
      confidence: 0.71,
      type: 'negative' as const,
    },
  ],
  '30d': [
    {
      id: 'h30-pos-1',
      summary: 'The new monsoon specials are a hit, especially the kathiyawadi platter.',
      generatedAt: new Date().toISOString(),
      themes: ['menu', 'seasonal'],
      confidence: 0.89,
      type: 'positive' as const,
    },
    {
      id: 'h30-pos-2',
      summary: 'Customers praised seamless celebrations with the events concierge.',
      generatedAt: new Date().toISOString(),
      themes: ['events', 'service'],
      confidence: 0.8,
      type: 'positive' as const,
    },
    {
      id: 'h30-neg-1',
      summary: 'Delivery patrons noted occasional delays on Friday evenings.',
      generatedAt: new Date().toISOString(),
      themes: ['delivery', 'timeliness'],
      confidence: 0.77,
      type: 'negative' as const,
    },
  ],
  '90d': [
    {
      id: 'h90-pos-1',
      summary: 'Guests consistently highlight the signature thali and complimentary chutneys.',
      generatedAt: new Date().toISOString(),
      themes: ['menu', 'quality'],
      confidence: 0.91,
      type: 'positive' as const,
    },
    {
      id: 'h90-pos-2',
      summary: 'The hospitality team is applauded for remembering regulars by name.',
      generatedAt: new Date().toISOString(),
      themes: ['service', 'loyalty'],
      confidence: 0.84,
      type: 'positive' as const,
    },
    {
      id: 'h90-neg-1',
      summary: 'Parking availability remains the most cited friction for first-time guests.',
      generatedAt: new Date().toISOString(),
      themes: ['logistics'],
      confidence: 0.79,
      type: 'negative' as const,
    },
  ],
}

const recentFeedbackByWindow: Record<FeedbackWindow, DemoFeedback[]> = {
  '7d': [
    {
      id: 'f-01',
      date: '2024-10-18T19:12:00Z',
      customerName: 'Aarav Patel',
      rating: 5,
      feedback: 'Loved the paneer tikka! Staff made sure our anniversary dinner was memorable.',
      sentiment: 'positive' as const,
    },
    {
      id: 'f-02',
      date: '2024-10-17T13:45:00Z',
      customerName: 'Nidhi Shah',
      rating: 4,
      feedback: 'Food was fantastic, but the music was a bit loud for lunch.',
      sentiment: 'neutral' as const,
    },
    {
      id: 'f-03',
      date: '2024-10-15T20:25:00Z',
      customerName: 'Rohan Desai',
      rating: 5,
      feedback: 'Prompt service and authentic flavors. The jalebi was top notch.',
      sentiment: 'positive' as const,
    },
  ],
  '30d': [
    {
      id: 'f-11',
      date: '2024-10-12T18:10:00Z',
      customerName: 'Emily Davis',
      rating: 4,
      feedback: 'Great vegetarian spread. Wish the waiting area had more seating.',
      sentiment: 'positive' as const,
    },
    {
      id: 'f-12',
      date: '2024-10-05T21:05:00Z',
      customerName: 'Vikram Mehta',
      rating: 5,
      feedback: 'Our corporate dinner was handled flawlessly. Special thanks to the event team.',
      sentiment: 'positive' as const,
    },
    {
      id: 'f-13',
      date: '2024-09-26T19:42:00Z',
      customerName: 'Priya Menon',
      rating: 3,
      feedback: 'Delivery took 50 minutes, but the driver kept us updated.',
      sentiment: 'neutral' as const,
    },
    {
      id: 'f-14',
      date: '2024-09-20T17:30:00Z',
      customerName: 'Kevin Wright',
      rating: 2,
      feedback: 'Tasty food, yet the bill took too long to arrive.',
      sentiment: 'negative' as const,
    },
  ],
  '90d': [
    {
      id: 'f-21',
      date: '2024-08-14T18:30:00Z',
      customerName: 'Simran Kaur',
      rating: 5,
      feedback: 'Live music Fridays are my favorite. Always a delight for the family.',
      sentiment: 'positive' as const,
    },
    {
      id: 'f-22',
      date: '2024-07-30T12:55:00Z',
      customerName: 'Rahul Sharma',
      rating: 4,
      feedback: 'Lunch buffet has amazing variety. Parking still tricky on weekends.',
      sentiment: 'neutral' as const,
    },
    {
      id: 'f-23',
      date: '2024-07-10T20:40:00Z',
      customerName: 'Ananya Sen',
      rating: 5,
      feedback: 'Staff remembered my gluten preference. Appreciate the extra care!',
      sentiment: 'positive' as const,
    },
    {
      id: 'f-24',
      date: '2024-06-22T19:05:00Z',
      customerName: 'Michael Reyes',
      rating: 3,
      feedback: 'Good experience overall, though desserts ran out by 9 PM.',
      sentiment: 'neutral' as const,
    },
    {
      id: 'f-25',
      date: '2024-06-02T18:20:00Z',
      customerName: 'Ishita Bhatt',
      rating: 4,
      feedback: 'Loved the chef interaction and tasting menu recommendations.',
      sentiment: 'positive' as const,
    },
  ],
}

const mockForms = [
  { id: 'form-1', title: 'Dine-in Feedback', feedbackCount: 124, responseCount: 124 },
  { id: 'form-2', title: 'Delivery Feedback', feedbackCount: 58, responseCount: 58 },
]

const allFeedback = [
  ...recentFeedbackByWindow['90d'],
  ...recentFeedbackByWindow['30d'],
  ...recentFeedbackByWindow['7d'],
]

const noopSetRestaurant = () => undefined

export default function DemoRestaurantDashboard() {
  const [feedbackWindow, setFeedbackWindow] = useState<FeedbackWindow>('30d')
  const updateFeedbackWindow = useCallback((window: FeedbackWindow) => setFeedbackWindow(window), [])

  const dashboardValue = useMemo(() => {
    return {
      restaurant,
      setRestaurant: noopSetRestaurant,
      analytics: analyticsByWindow[feedbackWindow],
      topHighlights: topHighlightsByWindow[feedbackWindow],
      recentFeedbacks: recentFeedbackByWindow[feedbackWindow],
      forms: mockForms,
      allFeedback,
      feedbackWindow,
      setFeedbackWindow: updateFeedbackWindow,
      isHighlightsLoading: false,
    }
  }, [feedbackWindow, updateFeedbackWindow])

  return (
    <DashboardProvider value={dashboardValue}>
      <div className="min-h-screen bg-background">
        <Header restaurantName={restaurant.name} restaurantLogo={restaurant.logoUrl} />
        <RestaurantDashboard />
      </div>
    </DashboardProvider>
  )
}
