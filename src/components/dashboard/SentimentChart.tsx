'use client'

import { useEffect, useRef } from 'react'
import type { ChartOptions, TooltipModel, ChartType } from 'chart.js'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

type DoughnutArcElement = InstanceType<typeof ArcElement>
type DoughnutChartInstance = ChartJS<'doughnut'>
type DoughnutTooltipModel = TooltipModel<'doughnut'>

ChartJS.register(ArcElement, Tooltip, Legend)

interface SentimentData {
  name: string
  value: number
  percentage: number
  color: string
}

interface SentimentChartProps {
  data: SentimentData[]
}

export const SentimentChart = ({ data }: SentimentChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const chartWrapperRef = useRef<HTMLDivElement | null>(null)
  const tooltipElRef = useRef<HTMLDivElement | null>(null)

  const ensureTooltipElement = (chart: DoughnutChartInstance) => {
    let tooltipEl = tooltipElRef.current

    if (!tooltipEl) {
      tooltipEl = document.createElement('div')
      tooltipElRef.current = tooltipEl
      tooltipEl.style.pointerEvents = 'none'
      tooltipEl.style.position = 'absolute'
      tooltipEl.style.zIndex = '30'
      tooltipEl.style.background = 'rgba(17, 24, 39, 0.92)'
      tooltipEl.style.color = '#F3F4F6'
      tooltipEl.style.padding = '6px 10px'
      tooltipEl.style.borderRadius = '12px'
      tooltipEl.style.border = '1px solid rgba(148, 163, 184, 0.35)'
      tooltipEl.style.boxShadow = '0 24px 50px rgba(15, 23, 42, 0.5)'
      tooltipEl.style.transform = 'translate(-50%, -50%)'
      tooltipEl.style.width = '120px'
      tooltipEl.style.opacity = '0'
      tooltipEl.style.transition = 'opacity 140ms ease'
      tooltipEl.style.whiteSpace = 'nowrap'
      tooltipEl.style.lineHeight = '1.3'

      const wrapper = chartWrapperRef.current ?? chart.canvas.parentNode
      if (wrapper instanceof HTMLElement) {
        if (window.getComputedStyle(wrapper).position === 'static') {
          wrapper.style.position = 'relative'
        }
        wrapper.appendChild(tooltipEl)
      }
    }

    return tooltipEl
  }

  const externalTooltipHandler = (context: { chart: DoughnutChartInstance; tooltip: DoughnutTooltipModel }) => {
    const { chart, tooltip } = context
    const tooltipEl = ensureTooltipElement(chart)

    if (tooltip.opacity === 0 || !tooltip.body?.length) {
      tooltipEl.style.opacity = '0'
      return
    }

    const activeElements = chart.getActiveElements()
    if (!activeElements.length) {
      tooltipEl.style.opacity = '0'
      return
    }

    const arc = activeElements[0].element as DoughnutArcElement
    const angle = (arc.startAngle + arc.endAngle) / 2
    const offsetRadius = arc.outerRadius + 64
    const posX = arc.x + Math.cos(angle) * offsetRadius
    const posY = arc.y + Math.sin(angle) * offsetRadius

    tooltipEl.innerHTML = ''

    const title = tooltip.title?.[0]
    if (title) {
      const titleEl = document.createElement('div')
      titleEl.style.fontWeight = '600'
      titleEl.style.fontSize = '0.85rem'
      titleEl.style.marginBottom = '0.35rem'
      titleEl.style.textAlign = 'center'
      titleEl.textContent = title
      tooltipEl.appendChild(titleEl)
    }

    tooltip.body.forEach((bodyItem, index) => {
      bodyItem.lines.forEach((line) => {
        const container = document.createElement('div')
        container.style.display = 'flex'
        container.style.alignItems = 'center'
        container.style.justifyContent = 'center'
        container.style.width = '100%'

        const pill = document.createElement('span')
        pill.style.display = 'inline-flex'
        pill.style.alignItems = 'center'
        pill.style.justifyContent = 'center'
        pill.style.gap = '0.45rem'
        pill.style.padding = '3px 8px'
        pill.style.borderRadius = '9999px'
        pill.style.background = 'rgba(255,255,255,0.08)'
        pill.style.fontSize = '0.78rem'
        pill.style.width = '100%'

        const color = tooltip.labelColors?.[index]
        const colorValue = color?.backgroundColor
        const dot = document.createElement('span')
        dot.style.display = 'inline-flex'
        dot.style.width = '0.55rem'
        dot.style.height = '0.55rem'
        dot.style.borderRadius = '9999px'
        dot.style.background = typeof colorValue === 'string' ? colorValue : '#3B82F6'
        pill.appendChild(dot)

        const text = document.createElement('span')
        text.textContent = line
        pill.appendChild(text)

        container.appendChild(pill)
        tooltipEl.appendChild(container)
      })
    })

    tooltipEl.style.left = `${posX}px`
    tooltipEl.style.top = `${posY}px`
    tooltipEl.style.opacity = '1'
  }

  useEffect(() => {
    return () => {
      tooltipElRef.current?.remove()
      tooltipElRef.current = null
    }
  }, [])

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
    layout: {
      padding: 28,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e5e7eb',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed as number
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0
            return `${value} (${percentage}%)`
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      easing: 'easeOutQuart'
    }
  }

  return (
    <div className="w-full h-80 relative">
      {total > 0 ? (
        <>
          <div ref={chartWrapperRef} className="relative h-full">
            <Doughnut data={chartData} options={options} />
          </div>

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
  )
}
