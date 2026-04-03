import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

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
  const prevPercentageRef = useRef(percentage)

  // Celebration toast when reaching 100%
  useEffect(() => {
    if (percentage === 100 && prevPercentageRef.current < 100 && total > 0) {
      toast.success('Все задачи выполнены! Отличная работа!', {
        duration: 3000,
      })
    }
    prevPercentageRef.current = percentage
  }, [percentage, total])

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {label || 'Прогресс'}
        </span>
        <span className="text-sm text-[var(--color-text-secondary)]">
          {completed}/{total} ({Math.round(percentage)}%)
        </span>
      </div>

      <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-2 rounded-full ${
            percentage === 100
              ? 'bg-[var(--color-success)]'
              : 'bg-[var(--color-accent)]'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  )
}
