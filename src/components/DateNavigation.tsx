import React from 'react'
import { format, addDays, subDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAppStore } from '@/store'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

export const DateNavigation: React.FC = () => {
  const { currentDate, setCurrentDate } = useAppStore()

  const goToPreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1))
  }

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex items-center justify-between mb-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center space-x-2">
        <button
          onClick={goToPreviousDay}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          aria-label="Предыдущий день"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 min-w-0">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold truncate text-gray-900 dark:text-white">
              {format(currentDate, 'EEEE', { locale: ru })}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(currentDate, 'd MMMM yyyy', { locale: ru })}
            </p>
          </div>
        </div>

        <button
          onClick={goToNextDay}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          aria-label="Следующий день"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {!isToday && (
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 shadow-md"
        >
          Сегодня
        </button>
      )}
    </div>
  )
}
