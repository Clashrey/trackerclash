import React from 'react'
import { motion } from 'framer-motion'
import type { BudgetCategory } from '@/types/budget'

interface CategoryPickerProps {
  categories: BudgetCategory[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedId,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
      {categories.map((cat) => {
        const isSelected = selectedId === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`relative flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${
              isSelected
                ? 'bg-[var(--color-accent-10)]'
                : 'hover:bg-[var(--color-bg-tertiary)]'
            }`}
            title={cat.name}
          >
            {isSelected && (
              <motion.div
                layoutId="selectedCategory"
                className="absolute inset-0 rounded-xl border-2"
                style={{ borderColor: cat.color || 'var(--color-accent)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="text-2xl" role="img" aria-label={cat.name}>
              {cat.emoji}
            </span>
            <span className="text-[9px] text-[var(--color-text-tertiary)] truncate w-full text-center">
              {cat.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
