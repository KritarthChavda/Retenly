'use client'

import { createContext, useContext, ReactNode } from 'react';

interface Restaurant {
  id: string;
  name: string;
  username: string;
  logoUrl?: string;
}

interface Analytics {
  totalFeedbackCount: number;
  sentimentData: {
    positive: number;
    neutral: number;
    negative: number;
  };
  csatScore: number;
  npsScore: number;
  mostLovedFeature: string;
  averageRating: number;
  repeatFeedbackRate: number;
  kpiCardData: {
    totalFeedback: { change: number; changeLabel: string };
    averageRating: { change: number; changeLabel: string };
    positiveFeedback: { change: number; changeLabel: string };
    repeatFeedbackRate: { change: number; changeLabel: string };
  };
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
  id: string;
  title: string;
  feedbackCount: number;
  responseCount: number;
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

interface DashboardContextProps {
  restaurant: Restaurant | null
  setRestaurant: (restaurant: Restaurant) => void
  analytics: Analytics | null
  topHighlights: FeedbackHighlight[]
  recentFeedbacks: FeedbackItem[]
  forms: Form[]
  allFeedback: FeedbackItem[]
}

const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

export const DashboardProvider = ({ children, value }: { children: ReactNode, value: DashboardContextProps }) => {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
