import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useAppStore } from '@/store'
import { useDatabase } from '@/hooks/useDatabase'
import { TaskCategory } from '@/types'
import { transitions, variants } from '@/lib/animations'

interface AddTaskFormProps {
  category: TaskCategory
  date?: Date
  placeholder?: string
  className?: string
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({
  category,
  date,
  placeholder = 'Новая задача...',
  className
}) => {
  const { userId, selectedDate } = useAppStore()
  const { addTask } = useDatabase()
  const [title, setTitle] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !userId) {
      return
    }

    const taskDate = date ? date.toISOString().split('T')[0] : (category === 'today' ? selectedDate : undefined)

    const currentTasks = useAppStore.getState().tasks

    const categoryTasks = currentTasks.filter(task =>
      task.category === (category === 'today' ? 'today' : category) &&
      (!taskDate || task.date === taskDate)
    )
    const maxOrderIndex = categoryTasks.length > 0
      ? Math.max(...categoryTasks.map(t => t.order_index))
      : -1

    await addTask({
      user_id: userId,
      title: title.trim(),
      category: category === 'today' ? 'today' : category,
      completed: false,
      date: taskDate,
      order_index: maxOrderIndex + 1,
    })

    // Serial input mode: stay open, clear field, keep focus
    setTitle('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setTitle('')
      setIsExpanded(false)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {!isExpanded ? (
        <motion.button
          key="add-button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transitions.smooth}
          onClick={() => setIsExpanded(true)}
          className={`w-full flex items-center justify-center space-x-2 p-4 rounded-xl border-2 border-dashed border-[var(--color-border-primary)] hover:border-[var(--color-accent)] transition-all text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 ${className}`}
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm sm:text-base font-medium">{placeholder}</span>
        </motion.button>
      ) : (
        <motion.form
          key="add-form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={transitions.smooth}
          onSubmit={handleSubmit}
          className={`space-y-3 ${className}`}
        >
          <div className="flex space-x-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 px-4 py-3 border border-[var(--color-border-primary)] rounded-xl bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all"
              autoFocus
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-3 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>

          <button
            type="button"
            onClick={() => {
              setTitle('')
              setIsExpanded(false)
            }}
            className="w-full text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Нажмите Escape или кликните здесь для отмены
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
