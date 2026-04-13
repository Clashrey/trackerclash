import React, { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/store'
import { useBudget } from '@/hooks/useBudget'
import { Navigation } from '@/components/Navigation'
import { BottomNavigation } from '@/components/BottomNavigation'
import { TodayView } from '@/components/views/TodayView'
import { TasksView } from '@/components/views/TasksView'
import { IdeasView } from '@/components/views/IdeasView'
import { RecurringView } from '@/components/views/RecurringView'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { variants, transitions } from '@/lib/animations'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

// Lazy load heavy views
const AnalyticsView = lazy(() =>
  import('@/components/views/AnalyticsView').then(m => ({ default: m.AnalyticsView }))
)
const BudgetOverviewView = lazy(() =>
  import('@/components/views/BudgetOverviewView').then(m => ({ default: m.BudgetOverviewView }))
)
const BudgetTransactionsView = lazy(() =>
  import('@/components/views/BudgetTransactionsView').then(m => ({ default: m.BudgetTransactionsView }))
)
const BudgetAnalyticsView = lazy(() =>
  import('@/components/views/BudgetAnalyticsView').then(m => ({ default: m.BudgetAnalyticsView }))
)
const BudgetSettingsView = lazy(() =>
  import('@/components/views/BudgetSettingsView').then(m => ({ default: m.BudgetSettingsView }))
)

const SuspenseFallback = (
  <div className="flex items-center justify-center py-20">
    <LoadingSpinner size="lg" />
  </div>
)

export const Layout: React.FC = () => {
  const { currentCategory, appMode, budgetContext, budgetSelectedMonth } = useAppStore()
  const { loadBudgetData } = useBudget()
  useKeyboardShortcuts()

  // Centralized budget data loading — all budget views share this
  useEffect(() => {
    if (appMode === 'budget') {
      loadBudgetData()
    }
  }, [appMode, budgetContext, budgetSelectedMonth])

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
        return <Suspense fallback={SuspenseFallback}><AnalyticsView /></Suspense>
      case 'budget_overview':
        return <Suspense fallback={SuspenseFallback}><BudgetOverviewView /></Suspense>
      case 'budget_transactions':
        return <Suspense fallback={SuspenseFallback}><BudgetTransactionsView /></Suspense>
      case 'budget_analytics':
        return <Suspense fallback={SuspenseFallback}><BudgetAnalyticsView /></Suspense>
      case 'budget_settings':
        return <Suspense fallback={SuspenseFallback}><BudgetSettingsView /></Suspense>
      default:
        return <TodayView />
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <div className="container mx-auto px-4 py-4 max-w-4xl lg:max-w-5xl">
        <header className="mb-6 sm:mb-8">
          <Navigation />
        </header>

        <main className="pb-bottom-nav sm:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCategory}
              initial="enter"
              animate="center"
              exit="exit"
              variants={variants.viewTransition}
              transition={transitions.smooth}
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNavigation />
    </div>
  )
}
