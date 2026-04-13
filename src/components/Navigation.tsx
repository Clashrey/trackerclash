import React from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, LogOut, Search } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAppStore } from '../store'
import { ModeSwitcher } from './ModeSwitcher'
import { TaskCategory } from '@/types'

export function Navigation() {
  const { user, signOut } = useAuth()
  const {
    currentCategory, setCurrentCategory,
    tasks, recurringTasks, selectedDate,
    isDarkMode, toggleDarkMode,
    appMode,
  } = useAppStore()

  const todayTasksCount = tasks.filter(t => t.category === 'today' && t.date === selectedDate).length

  const trackerCategories: { id: TaskCategory; label: string; count: number }[] = [
    { id: 'today', label: 'Сегодня', count: todayTasksCount },
    { id: 'tasks', label: 'Задачи', count: tasks.filter(t => t.category === 'tasks').length },
    { id: 'ideas', label: 'Идеи', count: tasks.filter(t => t.category === 'ideas').length },
    { id: 'recurring', label: 'Регулярные', count: recurringTasks.length },
    { id: 'analytics', label: 'Аналитика', count: 0 },
  ]

  const budgetCategories: { id: TaskCategory; label: string; count: number }[] = [
    { id: 'budget_overview', label: 'Обзор', count: 0 },
    { id: 'budget_transactions', label: 'Транзакции', count: 0 },
    { id: 'budget_analytics', label: 'Аналитика', count: 0 },
    { id: 'budget_settings', label: 'Настройки', count: 0 },
  ]

  const categories = appMode === 'budget' ? budgetCategories : trackerCategories

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl" aria-hidden="true">{appMode === 'budget' ? '💰' : '📋'}</span>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {appMode === 'budget' ? 'Бюджет' : 'Трекер задач'}
            </h1>
          </div>
          <ModeSwitcher />
        </div>
        <div className="flex items-center space-x-2">
          {/* Cmd+K search hint */}
          <button
            onClick={() => {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
            }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors text-xs"
            aria-label="Открыть поиск команд"
          >
            <Search size={14} />
            <span>Поиск</span>
            <kbd className="ml-1 px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] text-[10px] font-mono">⌘K</kbd>
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span className="text-sm text-[var(--color-text-secondary)] hidden sm:inline">
            {user?.username}
          </span>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-primary)]"
            aria-label="Выйти из аккаунта"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs — hidden on mobile (bottom nav used instead) */}
      <nav aria-label="Основная навигация" className="hidden sm:block">
        <div
          role="tablist"
          aria-label={appMode === 'budget' ? 'Разделы бюджета' : 'Разделы трекера'}
          className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-[var(--color-border-primary)] pb-px"
        >
          {categories.map((category) => {
            const isActive = currentCategory === category.id
            return (
              <button
                key={category.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${category.id}`}
                onClick={() => setCurrentCategory(category.id)}
                className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {category.label}
                {category.count > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                  }`}>
                    {category.count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)] rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
