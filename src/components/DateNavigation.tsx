import React from 'react'
import { format, addDays, subDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/store'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

export const DateNavigation: React.FC = () => {
  const { currentDate, setCurrentDate } = useAppStore()

  const goToPreviousDay = () => setCurrentDate(subDays(currentDate, 1))
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex items-center justify-between mb-6 bg-[var(--color-bg-elevated)]/80 backdrop-blur-sm p-4 rounded-xl border border-[var(--color-border-primary)]">
      <div className="flex items-center space-x-2">
        <button
          onClick={goToPreviousDay}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-secondary)]"
          aria-label="Предыдущий день"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 min-w-0">
          <Calendar className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0" />
          <AnimatePresence mode="wait">
            <motion.div
              key={format(currentDate, 'yyyy-MM-dd')}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="min-w-0"
            >
              <h2 className="text-lg sm:text-xl font-semibold truncate text-[var(--color-text-primary)]">
                {format(currentDate, 'EEEE', { locale: ru })}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {format(currentDate, 'd MMMM yyyy', { locale: ru })}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={goToNextDay}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-secondary)]"
          aria-label="Следующий день"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {!isToday && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={goToToday}
          className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
        >
          Сегодня
        </motion.button>
      )}
    </div>
  )
}
