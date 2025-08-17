'use client'

import { useEffect, useRef } from 'react'
import { Chart, ChartConfiguration, ChartData } from 'chart.js/auto'

interface SentimentData {
  positive: number
  neutral: number
  negative: number
}

interface SentimentPieChartProps {
  data: SentimentData
}

/**
 * Sentiment pie chart component using Chart.js
 * 
 * @param data - The sentiment data object
 * @returns JSX element containing the pie chart
 */
export default function SentimentPieChart({ data }: SentimentPieChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    const chartData: ChartData<'pie'> = {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [
        {
          data: [data.positive, data.neutral, data.negative],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)', // Green for positive
            'rgba(156, 163, 175, 0.8)', // Gray for neutral
            'rgba(239, 68, 68, 0.8)', // Red for negative
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(156, 163, 175, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 2,
        },
      ],
    }

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#d1d5db', // text-gray-300
              font: {
                size: 12,
              },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(31, 41, 55, 0.9)', // bg-gray-800
            titleColor: '#f9fafb', // text-gray-50
            bodyColor: '#d1d5db', // text-gray-300
            borderColor: '#4b5563', // border-gray-600
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const label = context.label || ''
                const value = context.parsed
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
        },
      },
    }

    chartInstance.current = new Chart(ctx, config)

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data])

  return (
    <div className="relative h-64">
      <canvas ref={chartRef} />
    </div>
  )
} 