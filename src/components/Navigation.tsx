import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAppStore } from '../store'

export function Navigation() {
  const { user, signOut } = useAuth()
  const { currentCategory, setCurrentCategory, tasks, recurringTasks, selectedDate, isDarkMode, toggleDarkMode } = useAppStore()

  // Для "Сегодня" считаем только задачи на выбранную дату
  const todayTasksCount = tasks.filter(t => t.category === 'today' && t.date === selectedDate).length

  const categories = [
    { id: 'today', label: 'Сегодня', count: todayTasksCount },
    { id: 'tasks', label: 'Задачи', count: tasks.filter(t => t.category === 'tasks').length },
    { id: 'ideas', label: 'Идеи', count: tasks.filter(t => t.category === 'ideas').length },
    { id: 'recurring', label: 'Регулярные', count: recurringTasks.length },
    { id: 'analytics', label: 'Аналитика', count: 0 }
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">📋</span>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Трекер задач</h1>
        </div>
        <div className="flex items-center space-x-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title={isDarkMode ? 'Светлая тема' : 'Тёмная тема'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user?.username}
          </span>
          <button
            onClick={signOut}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setCurrentCategory(category.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category.label}
            {category.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                currentCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}>
                {category.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
