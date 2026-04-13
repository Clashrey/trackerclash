import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { transitions } from '@/lib/animations'

interface DatePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (date: string) => void
  title?: string
}

function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function DatePickerModal({ isOpen, onClose, onSelect, title = 'Выберите дату' }: DatePickerModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  if (!isOpen) return null

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const startingDayOfWeek = firstDayOfMonth.getDay()
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()

  const days: (number | null)[] = []
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1
  for (let i = 0; i < adjustedStartDay; i++) {
    days.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d)
  }

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

  const handleSelectDate = (day: number) => {
    const selectedDate = new Date(year, month, day)
    onSelect(formatDateLocal(selectedDate))
    onClose()
  }

  const today = new Date()
  const todayStr = formatDateLocal(today)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={transitions.smooth}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="bg-[var(--color-bg-elevated)] rounded-2xl shadow-2xl border border-[var(--color-border-primary)] p-5 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  aria-label="Закрыть"
                >
                  <X size={18} className="text-[var(--color-text-tertiary)]" />
                </button>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors"
                  aria-label="Предыдущий месяц"
                >
                  <ChevronLeft size={18} />
                </button>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${year}-${month}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="text-sm font-medium text-[var(--color-text-primary)]"
                  >
                    {monthNames[month]} {year}
                  </motion.span>
                </AnimatePresence>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors"
                  aria-label="Следующий месяц"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {dayNames.map(name => (
                  <div key={name} className="text-center text-[10px] font-medium text-[var(--color-text-tertiary)] py-1.5 uppercase">
                    {name}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="p-2" />
                  }

                  const dateStr = formatDateLocal(new Date(year, month, day))
                  const isToday = dateStr === todayStr
                  const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

                  return (
                    <button
                      key={day}
                      onClick={() => handleSelectDate(day)}
                      disabled={isPast}
                      className={`
                        p-2 text-sm rounded-lg transition-all font-medium
                        ${isToday
                          ? 'bg-[var(--color-accent)] text-white'
                          : isPast
                            ? 'text-[var(--color-text-tertiary-40)] cursor-not-allowed'
                            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-accent-10)] hover:text-[var(--color-accent)]'
                        }
                      `}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              {/* Quick Actions */}
              <div className="mt-4 pt-3 border-t border-[var(--color-border-secondary)] flex gap-2">
                <button
                  onClick={() => handleSelectDate(today.getDate())}
                  className="flex-1 px-3 py-2 text-xs font-medium bg-[var(--color-accent-10)] text-[var(--color-accent)] rounded-lg hover:bg-[var(--color-accent-20)] transition-colors"
                >
                  Сегодня
                </button>
                <button
                  onClick={() => {
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    onSelect(formatDateLocal(tomorrow))
                    onClose()
                  }}
                  className="flex-1 px-3 py-2 text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-border-primary)] transition-colors"
                >
                  Завтра
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
