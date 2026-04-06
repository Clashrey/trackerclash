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

      const previews = dayTasks.slice(0, 3).map(t => ({
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
    <div className="mb-4">
      {/* Navigation row: arrows + today button */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={shiftBack}
          className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          aria-label="Предыдущие 3 дня"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {!isWindowAtToday && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
          >
            Сегодня
          </motion.button>
        )}

        <button
          onClick={shiftForward}
          className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          aria-label="Следующие 3 дня"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3-day cards — compact layout */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {days.map((day, i) => {
          const isActive = day.dateStr === selectedDateStr
          const isRealToday = day.dateStr === todayStr
          const label = getDayLabel(day.date)
          const shortDate = format(day.date, 'd MMM', { locale: ru })
          const allDone = day.totalCount > 0 && day.completedCount === day.totalCount

          return (
            <motion.button
              key={day.dateStr}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12, delay: i * 0.02 }}
              onClick={() => setCurrentDate(day.date)}
              className={`relative rounded-xl border text-left transition-all overflow-hidden ${
                isActive
                  ? 'bg-[var(--color-accent-10)] border-[var(--color-accent)] shadow-sm'
                  : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-primary)] hover:border-[var(--color-accent-20)]'
              }`}
            >
              {/* Header row: label + date + count — all in one tight line */}
              <div className={`flex items-center justify-between px-2.5 py-2 sm:px-3 ${
                day.previews.length > 0 ? 'border-b border-[var(--color-border-secondary)]' : ''
              }`}>
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  {isRealToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
                  )}
                  <span className={`text-sm font-semibold truncate ${
                    isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'
                  }`}>
                    {label}
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)] flex-shrink-0 hidden sm:inline">
                    {shortDate}
                  </span>
                </div>

                {day.totalCount > 0 ? (
                  <span className={`text-xs font-semibold flex-shrink-0 ml-1 ${
                    allDone ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]'
                  }`}>
                    {allDone ? '✓' : `${day.completedCount}/${day.totalCount}`}
                  </span>
                ) : (
                  <span className="text-xs text-[var(--color-text-tertiary)] flex-shrink-0 ml-1">0</span>
                )}
              </div>

              {/* Task previews — compact list */}
              {day.previews.length > 0 ? (
                <div className="px-2.5 py-1.5 sm:px-3">
                  {day.previews.map((p, j) => (
                    <div
                      key={j}
                      className={`text-xs leading-5 truncate ${
                        p.completed
                          ? 'text-[var(--color-text-tertiary)] line-through'
                          : 'text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {p.title}
                    </div>
                  ))}
                  {day.totalCount > 3 && (
                    <div className="text-xs text-[var(--color-text-tertiary)] leading-5">
                      +{day.totalCount - 3} ещё
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-2.5 py-1.5 sm:px-3 text-xs text-[var(--color-text-tertiary)]">
                  нет задач
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
