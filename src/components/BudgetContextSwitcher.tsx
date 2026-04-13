import React from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'
import type { BudgetContext } from '@/types/budget'

const contexts: { id: BudgetContext; label: string }[] = [
  { id: 'personal', label: 'Личный' },
  { id: 'work', label: 'Рабочий' },
]

export const BudgetContextSwitcher: React.FC = () => {
  const { budgetContext, setBudgetContext } = useAppStore()

  return (
    <div className="inline-flex rounded-lg bg-[var(--color-bg-tertiary)] p-0.5">
      {contexts.map((ctx) => {
        const isActive = budgetContext === ctx.id
        return (
          <button
            key={ctx.id}
            onClick={() => setBudgetContext(ctx.id)}
            className={`relative px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              isActive
                ? 'text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="budgetContextSwitcher"
                className="absolute inset-0 bg-[var(--color-bg-elevated)] rounded-md shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{ctx.label}</span>
          </button>
        )
      })}
    </div>
  )
}
