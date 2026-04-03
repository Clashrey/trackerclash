import React from 'react'
import { motion } from 'framer-motion'
import { variants, transitions } from '@/lib/animations'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants.fadeIn}
      transition={transitions.slow}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-12 h-12 text-[var(--color-text-tertiary)] mb-4 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
