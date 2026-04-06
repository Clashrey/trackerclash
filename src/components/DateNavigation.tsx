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
  const { currentDate, setCurrentDate, tasks, recurringTasks, taskCompletions } = useAppStore()

  // Window anchor — the first of the 3 visible days
  // Starts at today's date, independent of selected day
  const [windowStart, setWindowStart] = useState<Date>(() => new Date())

  // When user navigates to a date outside the current window, snap the window
  useEffect(() => {
    const currentStr = formatLocalDate(currentDate)
    const startStr = formatLocalDate(windowStart)
    const endStr = formatLocalDate(addDays(windowStart, 2))
    if (currentStr < startStr || currentStr > endStr) {
      setWindowStart(currentDate)
    }
  }, [currentDate])

  // The 3 days in the window
  const days = useMemo(() => {
    return [0, 1, 2].map(offset => {
      const date = addDays(windowStart, offset)
      const dateStr = formatLocalDate(date)

      const dayTasks = tasks.filter(t => t.category === 'today' && t.date === dateStr)

      const dayOfWeek = date.getDay()
      const dayRecurring = recurringTasks.filter(rt => {
        if (rt.frequency === 'daily') return true
        if (rt.frequency === 'weekly' && rt.days_of_week) {
          return rt.days_of_week.includes(dayOfWeek)
        }
        return false
      })

      const totalCount = dayTasks.length + dayRecurring.length
      const completedCount = dayTasks.filter(t => t.completed).length +
        dayRecurring.filter(rt =>
          taskCompletions.some(tc => tc.recurring_task_id === rt.id && tc.date === dateStr)
        ).length

      const previews = [
        ...dayTasks.slice(0, 3).map(t => ({ title: t.title, completed: t.completed })),
        ...dayRecurring.slice(0, Math.max(0, 3 - dayTasks.length)).map(rt => ({
          title: rt.title,
          completed: taskCompletions.some(tc => tc.recurring_task_id === rt.id && tc.date === dateStr)
        }))
      ].slice(0, 3)

      return { date, dateStr, totalCount, completedCount, previews }
    })
  }, [windowStart, tasks, recurringTasks, taskCompletions])

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

  const selectDay = (date: Date) => {
    setCurrentDate(date)
  }

  return (
    <div className="mb-6 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={shiftBack}
          className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          aria-label="Предыдущие 3 дня"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          <motion.span
            key={days[0].dateStr}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.12 }}
            className="text-xs text-[var(--color-text-tertiary)]"
          >
            {format(days[0].date, 'd MMM', { locale: ru })} — {format(days[2].date, 'd MMM', { locale: ru })}
          </motion.span>
        </AnimatePresence>

        <div className="flex items-center gap-1">
          {!isWindowAtToday && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={goToToday}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
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
      </div>

      {/* 3-day cards */}
      <div className="grid grid-cols-3 gap-2">
        {days.map((day, i) => {
          const isActive = day.dateStr === selectedDateStr
          const isRealToday = day.dateStr === todayStr
          const label = getDayLabel(day.date)
          const allDone = day.totalCount > 0 && day.completedCount === day.totalCount

          return (
            <motion.button
              key={day.dateStr}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: i * 0.03 }}
              onClick={() => selectDay(day.date)}
              className={`relative p-2.5 sm:p-3 rounded-xl border text-left transition-all min-h-[88px] ${
                isActive
                  ? 'bg-[var(--color-accent-10)] border-[var(--color-accent)] shadow-md'
                  : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-primary)] hover:border-[var(--color-accent-20)]'
              }`}
            >
              {/* Day label + today dot */}
              <div className="flex items-center gap-1.5 mb-0.5">
                {isRealToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
                )}
                <span className={`text-xs font-semibold truncate ${
                  isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'
                }`}>
                  {label}
                </span>
              </div>

              {/* Date */}
              <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1.5">
                {format(day.date, 'd MMM, EE', { locale: ru })}
              </div>

              {/* Task count */}
              {day.totalCount > 0 ? (
                <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium mb-1.5 ${
                  allDone
                    ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                }`}>
                  {allDone && '✓ '}{day.completedCount}/{day.totalCount}
                </div>
              ) : (
                <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1.5">нет задач</div>
              )}

              {/* Preview lines */}
              <div className="space-y-px">
                {day.previews.map((p, j) => (
                  <div
                    key={j}
                    className={`text-[10px] leading-snug truncate ${
                      p.completed
                        ? 'text-[var(--color-text-tertiary)] line-through'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {p.title}
                  </div>
                ))}
                {day.totalCount > 3 && (
                  <div className="text-[10px] text-[var(--color-text-tertiary)]">
                    +{day.totalCount - 3} ещё
                  </div>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
