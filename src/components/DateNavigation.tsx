import React, { useMemo, useState, useEffect } from 'react'
import { format, addDays, subDays, isToday as isDateToday, isTomorrow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore, formatLocalDate } from '@/store'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function getDayLabel(date: Date): string {
  if (isDateToday(date)) return 'Сегодня'
  if (isTomorrow(date)) return 'Завтра'
  const dayAfterTomorrow = addDays(new Date(), 2)
  if (formatLocalDate(date) === formatLocalDate(dayAfterTomorrow)) return 'Послезавтра'
  return format(date, 'EEEE', { locale: ru })
}

export const DateNavigation: React.FC = () => {
  const { currentDate, setCurrentDate, tasks } = useAppStore()

  const [windowStart, setWindowStart] = useState<Date>(() => new Date())

  useEffect(() => {
    const currentStr = formatLocalDate(currentDate)
    const startStr = formatLocalDate(windowStart)
    const endStr = formatLocalDate(addDays(windowStart, 2))
    if (currentStr < startStr || currentStr > endStr) {
      setWindowStart(currentDate)
    }
  }, [currentDate])

  const days = useMemo(() => {
    return [0, 1, 2].map(offset => {
      const date = addDays(windowStart, offset)
      const dateStr = formatLocalDate(date)

      const dayTasks = tasks
        .filter(t => t.category === 'today' && t.date === dateStr)
        .sort((a, b) => a.order_index - b.order_index)

      const totalCount = dayTasks.length
      const completedCount = dayTasks.filter(t => t.completed).length

      const previews = dayTasks.slice(0, 2).map(t => ({
        title: t.title,
        completed: t.completed,
      }))

      return { date, dateStr, totalCount, completedCount, previews }
    })
  }, [windowStart, tasks])

  const selectedDateStr = formatLocalDate(currentDate)
  const todayStr = formatLocalDate(new Date())
  const windowStartStr = formatLocalDate(windowStart)
  const isWindowAtToday = windowStartStr === todayStr

  const shiftBack = () => setWindowStart(prev => subDays(prev, 3))
  const shiftForward = () => setWindowStart(prev => addDays(prev, 3))
  const goToToday = () => {
    setWindowStart(new Date())
    setCurrentDate(new Date())
  }

  return (
    <div className="mb-6 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={shiftBack}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          aria-label="Предыдущие 3 дня"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {!isWindowAtToday && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
            >
              Сегодня
            </motion.button>
          )}
        </div>

        <button
          onClick={shiftForward}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          aria-label="Следующие 3 дня"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 3-day cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {days.map((day, i) => {
          const isActive = day.dateStr === selectedDateStr
          const isRealToday = day.dateStr === todayStr
          const label = getDayLabel(day.date)
          const shortDate = format(day.date, 'EE, d MMM', { locale: ru })
          const allDone = day.totalCount > 0 && day.completedCount === day.totalCount

          return (
            <motion.button
              key={day.dateStr}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: i * 0.03 }}
              onClick={() => setCurrentDate(day.date)}
              className={`relative p-3 sm:p-4 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-[var(--color-accent-10)] border-[var(--color-accent)] shadow-md'
                  : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-primary)] hover:border-[var(--color-accent-20)]'
              }`}
            >
              {/* Day label — single line: "Сегодня, пн, 6 апр" */}
              <div className="flex items-center gap-1.5 mb-2">
                {isRealToday && (
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
                )}
                <span className={`text-sm sm:text-base font-bold truncate ${
                  isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'
                }`}>
                  {label}
                </span>
              </div>

              <div className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-3">
                {shortDate}
              </div>

              {/* Task count */}
              {day.totalCount > 0 ? (
                <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold mb-2 ${
                  allDone
                    ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
                }`}>
                  {allDone && '✓ '}{day.completedCount}/{day.totalCount}
                </div>
              ) : (
                <div className="text-xs text-[var(--color-text-tertiary)] mb-2">нет задач</div>
              )}

              {/* Task previews — readable size */}
              {day.previews.length > 0 && (
                <div className="space-y-1 mt-1">
                  {day.previews.map((p, j) => (
                    <div
                      key={j}
                      className={`text-xs sm:text-sm leading-snug truncate ${
                        p.completed
                          ? 'text-[var(--color-text-tertiary)] line-through'
                          : 'text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {p.title}
                    </div>
                  ))}
                  {day.totalCount > 2 && (
                    <div className="text-xs text-[var(--color-text-tertiary)]">
                      +{day.totalCount - 2} ещё
                    </div>
                  )}
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
