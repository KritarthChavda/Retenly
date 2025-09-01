'use client'

import { useEffect, useRef } from 'react';
import { Chart, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

Chart.register(ArcElement, Tooltip, Legend);

interface SentimentData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface SentimentChartProps {
  data: SentimentData[];
}

export const SentimentChart = ({ data }: SentimentChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  // Calculate percentages for each sentiment
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 2,
        hoverBorderWidth: 3,
        cutout: '60%',
      },
    ],
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#e5e7eb',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = context.parsed
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0
            return `${context.label}: ${value} (${percentage}%)`
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      easing: 'easeOutQuart' as const
    }
  }

  return (
    <div className="w-full h-80 relative">
      {total > 0 ? (
        <>
          <Doughnut data={chartData} options={options} />
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {total}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              No feedback yet
            </div>
            <div className="text-sm text-muted-foreground">
              Start collecting customer feedback to see insights here
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
