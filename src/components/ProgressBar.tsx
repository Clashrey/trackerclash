import React from 'react'

interface ProgressBarProps {
  completed: number
  total: number
  label?: string
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  completed,
  total,
  label,
  className
}) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <span className="font-semibold text-foreground">{label}</span>
          <span className="text-sm text-muted-foreground font-medium">
            {completed}/{total}
          </span>
        </div>
      )}
      
      <div className="relative">
        <div className="w-full bg-muted rounded-full h-6 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-primary to-primary/80 h-6 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>
        
        {/* Percentage text overlay */}
        {percentage > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-foreground drop-shadow-sm">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      
      {percentage === 100 && total > 0 && (
        <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
          <div className="text-lg mb-1">🎉</div>
          <div className="text-sm font-semibold text-green-800">
            Все задачи выполнены!
          </div>
          <div className="text-xs text-green-600 mt-1">
            Отличная работа!
          </div>
        </div>
      )}
    </div>
  )
}

