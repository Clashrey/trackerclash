import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (date: string) => void
  title?: string
}

export function DatePickerModal({ isOpen, onClose, onSelect, title = 'Выберите дату' }: DatePickerModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  if (!isOpen) return null

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // Первый день месяца
  const firstDayOfMonth = new Date(year, month, 1)
  const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday

  // Последний день месяца
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()

  // Создаём массив дней
  const days: (number | null)[] = []

  // Пустые ячейки до первого дня (начинаем с понедельника)
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1
  for (let i = 0; i < adjustedStartDay; i++) {
    days.push(null)
  }

  // Дни месяца
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const handleSelectDate = (day: number) => {
    const selectedDate = new Date(year, month, day)
    const dateStr = selectedDate.toISOString().split('T')[0]
    onSelect(dateStr)
    onClose()
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="text-base font-medium text-gray-900">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(name => (
            <div key={name} className="text-center text-xs font-medium text-gray-500 py-2">
              {name}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="p-2" />
            }

            const dateStr = new Date(year, month, day).toISOString().split('T')[0]
            const isToday = dateStr === todayStr
            const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

            return (
              <button
                key={day}
                onClick={() => handleSelectDate(day)}
                disabled={isPast}
                className={`
                  p-2 text-sm rounded-lg transition-all
                  ${isToday
                    ? 'bg-blue-500 text-white font-semibold'
                    : isPast
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }
                `}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => handleSelectDate(today.getDate())}
            className="flex-1 px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Сегодня
          </button>
          <button
            onClick={() => {
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              onSelect(tomorrow.toISOString().split('T')[0])
              onClose()
            }}
            className="flex-1 px-3 py-2 text-sm font-medium bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Завтра
          </button>
        </div>
      </div>
    </div>
  )
}
