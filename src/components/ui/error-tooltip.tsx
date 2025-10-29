import { forwardRef } from 'react'

interface ErrorTooltipProps {
  message: string
  show: boolean
}

export const ErrorTooltip = forwardRef<HTMLDivElement, ErrorTooltipProps>(
  ({ message, show }, ref) => {
    if (!show) return null

    return (
      <div
        ref={ref}
        className="absolute top-full left-0 mt-2 z-10"
      >
        <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-sm text-gray-900 flex items-center whitespace-nowrap">
          <span className="text-amber-500 font-bold mr-1.5">!</span>
          {message}
          <div className="absolute top-0 left-4 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-white" />
        </div>
      </div>
    )
  }
)

ErrorTooltip.displayName = 'ErrorTooltip'