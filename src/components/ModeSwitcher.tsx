import React from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'
import type { AppMode } from '@/types/budget'

const modes: { id: AppMode; label: string }[] = [
  { id: 'tracker', label: 'Трекер' },
  { id: 'budget', label: 'Бюджет' },
]

export const ModeSwitcher: React.FC = () => {
  const { appMode, setAppMode } = useAppStore()

  return (
    <div className="inline-flex rounded-lg bg-[var(--color-bg-tertiary)] p-0.5">
      {modes.map((mode) => {
        const isActive = appMode === mode.id
        return (
          <button
            key={mode.id}
            onClick={() => setAppMode(mode.id)}
            className={`relative px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              isActive
                ? 'text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="modeSwitcher"
                className="absolute inset-0 bg-[var(--color-bg-elevated)] rounded-md shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{mode.label}</span>
          </button>
        )
      })}
    </div>
  )
}
