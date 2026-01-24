import React from 'react'
import { useAppStore } from '@/store'
import { Navigation } from '@/components/Navigation'
import { TodayView } from '@/components/views/TodayView'
import { TasksView } from '@/components/views/TasksView'
import { IdeasView } from '@/components/views/IdeasView'
import { RecurringView } from '@/components/views/RecurringView'
import { AnalyticsView } from '@/components/views/AnalyticsView'

export const Layout: React.FC = () => {
  const { currentCategory } = useAppStore()

  const renderCurrentView = () => {
    switch (currentCategory) {
      case 'today':
        return <TodayView />
      case 'tasks':
        return <TasksView />
      case 'ideas':
        return <IdeasView />
      case 'recurring':
        return <RecurringView />
      case 'analytics':
        return <AnalyticsView />
      default:
        return <TodayView />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <header className="mb-6 sm:mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              Трекер задач
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Организуйте свои дела эффективно
            </p>
          </div>
          <Navigation />
        </header>

        <main className="pb-safe">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  )
}
