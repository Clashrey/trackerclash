import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../store'

interface AnalyticsData {
  averageCompletionRate: number
  weeklyCompletionRates: { week: string; rate: number }[]
  mostFailedRecurringTask: { title: string; failureCount: number } | null
}

export function AnalyticsView() {
  const { tasks, recurringTasks, taskCompletions } = useAppStore()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    averageCompletionRate: 0,
    weeklyCompletionRates: [],
    mostFailedRecurringTask: null
  })

  useEffect(() => {
    calculateAnalytics()
  }, [tasks, recurringTasks, taskCompletions])

  const calculateAnalytics = () => {
    // 1. Средняя закрываемость в день
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    })

    const dailyRates = last30Days.map(date => {
      const dayTasks = tasks.filter(t => t.date === date)
      const dayRecurringTasks = recurringTasks.filter(rt => {
        if (rt.frequency === 'daily') return true
        if (rt.frequency === 'weekly' && rt.days_of_week) {
          const dayOfWeek = new Date(date).getDay()
          return rt.days_of_week.includes(dayOfWeek)
        }
        return false
      })

      const totalTasks = dayTasks.length + dayRecurringTasks.length
      if (totalTasks === 0) return 0

      const completedTasks = dayTasks.filter(t => t.completed).length
      const completedRecurringTasks = dayRecurringTasks.filter(rt =>
        taskCompletions.some(tc => tc.recurring_task_id === rt.id && tc.date === date)
      ).length

      return ((completedTasks + completedRecurringTasks) / totalTasks) * 100
    })

    const averageCompletionRate = dailyRates.reduce((sum, rate) => sum + rate, 0) / dailyRates.length

    // 2. Закрываемость по итогам недели (последние 4 недели)
    const weeklyRates = []
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (week * 7) - weekStart.getDay())
      
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart)
        date.setDate(date.getDate() + i)
        return date.toISOString().split('T')[0]
      })

      const weekRates = weekDays.map(date => {
        const dayTasks = tasks.filter(t => t.date === date)
        const dayRecurringTasks = recurringTasks.filter(rt => {
          if (rt.frequency === 'daily') return true
          if (rt.frequency === 'weekly' && rt.days_of_week) {
            const dayOfWeek = new Date(date).getDay()
            return rt.days_of_week.includes(dayOfWeek)
          }
          return false
        })

        const totalTasks = dayTasks.length + dayRecurringTasks.length
        if (totalTasks === 0) return 0

        const completedTasks = dayTasks.filter(t => t.completed).length
        const completedRecurringTasks = dayRecurringTasks.filter(rt =>
          taskCompletions.some(tc => tc.recurring_task_id === rt.id && tc.date === date)
        ).length

        return ((completedTasks + completedRecurringTasks) / totalTasks) * 100
      })

      const weekAverage = weekRates.reduce((sum, rate) => sum + rate, 0) / weekRates.length
      const weekLabel = `${weekStart.getDate()}.${weekStart.getMonth() + 1} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()}.${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getMonth() + 1}`
      
      weeklyRates.unshift({ week: weekLabel, rate: weekAverage })
    }

    // 3. Задача которую чаще всего не удавалось закрыть из регулярных
    const recurringTaskFailures = recurringTasks.map(rt => {
      const expectedDays = last30Days.filter(date => {
        if (rt.frequency === 'daily') return true
        if (rt.frequency === 'weekly' && rt.days_of_week) {
          const dayOfWeek = new Date(date).getDay()
          return rt.days_of_week.includes(dayOfWeek)
        }
        return false
      })

      const completedDays = expectedDays.filter(date =>
        taskCompletions.some(tc => tc.recurring_task_id === rt.id && tc.date === date)
      )

      return {
        title: rt.title,
        failureCount: expectedDays.length - completedDays.length
      }
    })

    const mostFailedRecurringTask = recurringTaskFailures.length > 0
      ? recurringTaskFailures.reduce((max, current) => 
          current.failureCount > max.failureCount ? current : max
        )
      : null

    setAnalytics({
      averageCompletionRate,
      weeklyCompletionRates: weeklyRates,
      mostFailedRecurringTask: mostFailedRecurringTask?.failureCount > 0 ? mostFailedRecurringTask : null
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Аналитика</h2>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Средняя закрываемость в день */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Средняя закрываемость в день
          </h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {analytics.averageCompletionRate.toFixed(1)}%
            </div>
            <p className="text-gray-600 dark:text-gray-400">за последние 30 дней</p>
          </div>
        </div>

        {/* Закрываемость по неделям */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Закрываемость по итогам недели
          </h3>
          <div className="space-y-3">
            {analytics.weeklyCompletionRates.map((week, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{week.week}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(week.rate, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                    {week.rate.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Самая проблемная регулярная задача */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Задача, которую чаще всего не удавалось закрыть
        </h3>
        {analytics.mostFailedRecurringTask ? (
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
            <div>
              <p className="font-medium text-red-900 dark:text-red-300">
                {analytics.mostFailedRecurringTask.title}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Пропущено {analytics.mostFailedRecurringTask.failureCount} раз за последние 30 дней
              </p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">🎉</div>
            <p>Отлично! Все регулярные задачи выполняются вовремя</p>
          </div>
        )}
      </div>
    </div>
  )
}

