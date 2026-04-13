import { useMemo } from 'react'
import { BarChart3 } from 'lucide-react'
import { useAppStore } from '../../store'
import { EmptyState } from '../ui/EmptyState'

interface AnalyticsData {
  averageCompletionRate: number
  weeklyCompletionRates: { week: string; rate: number }[]
  mostFailedRecurringTask: { title: string; failureCount: number } | null
}

export function AnalyticsView() {
  const { tasks, recurringTasks, taskCompletions } = useAppStore()

  const analytics = useMemo<AnalyticsData>(() => {
    // 1. Средняя закрываемость в день (30 дней)
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

    // 2. Закрываемость по неделям (4 недели)
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
      const endDate = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
      const weekLabel = `${weekStart.getDate()}.${weekStart.getMonth() + 1} – ${endDate.getDate()}.${endDate.getMonth() + 1}`

      weeklyRates.unshift({ week: weekLabel, rate: weekAverage })
    }

    // 3. Самая проблемная регулярная задача
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

    return {
      averageCompletionRate,
      weeklyCompletionRates: weeklyRates,
      mostFailedRecurringTask: mostFailedRecurringTask && mostFailedRecurringTask.failureCount > 0 ? mostFailedRecurringTask : null
    }
  }, [tasks, recurringTasks, taskCompletions])

  const hasData = tasks.length > 0 || recurringTasks.length > 0

  if (!hasData) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Аналитика</h2>
        <EmptyState
          icon={<BarChart3 className="w-12 h-12" />}
          title="Нет данных для аналитики"
          description="Начните добавлять и выполнять задачи, чтобы увидеть статистику"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Аналитика</h2>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Средняя закрываемость */}
        <div className="bg-[var(--color-bg-elevated)] p-6 rounded-xl border border-[var(--color-border-primary)]">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Средняя закрываемость в день
          </h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-[var(--color-accent)] mb-2">
              {analytics.averageCompletionRate.toFixed(1)}%
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">за последние 30 дней</p>
          </div>
        </div>

        {/* Закрываемость по неделям */}
        <div className="bg-[var(--color-bg-elevated)] p-6 rounded-xl border border-[var(--color-border-primary)]">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Закрываемость по неделям
          </h3>
          <div className="space-y-3">
            {analytics.weeklyCompletionRates.map((week, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">{week.week}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-[var(--color-bg-tertiary)] rounded-full h-2">
                    <div
                      className="bg-[var(--color-accent)] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(week.rate, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-primary)] w-12 text-right">
                    {week.rate.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Самая проблемная регулярная задача */}
      <div className="bg-[var(--color-bg-elevated)] p-6 rounded-xl border border-[var(--color-border-primary)]">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Задача, которую чаще всего не удавалось закрыть
        </h3>
        {analytics.mostFailedRecurringTask ? (
          <div className="flex items-center justify-between p-4 bg-[var(--color-danger-light)] rounded-xl">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                {analytics.mostFailedRecurringTask.title}
              </p>
              <p className="text-sm text-[var(--color-danger)]">
                Пропущено {analytics.mostFailedRecurringTask.failureCount} раз за 30 дней
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--color-text-secondary)]">
            <p>Все регулярные задачи выполняются вовремя</p>
          </div>
        )}
      </div>
    </div>
  )
}
