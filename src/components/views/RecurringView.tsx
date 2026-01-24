import React, { useState, useCallback } from 'react'
import { useAppStore } from '@/store'
import { useDatabase } from '@/hooks/useDatabase'
import { RecurringTask } from '@/types'
import { Plus, X, Clock, ChevronUp, ChevronDown } from 'lucide-react'

const daysOfWeek = [
  { id: 0, label: 'Вс', fullLabel: 'Воскресенье' },
  { id: 1, label: 'Пн', fullLabel: 'Понедельник' },
  { id: 2, label: 'Вт', fullLabel: 'Вторник' },
  { id: 3, label: 'Ср', fullLabel: 'Среда' },
  { id: 4, label: 'Чт', fullLabel: 'Четверг' },
  { id: 5, label: 'Пт', fullLabel: 'Пятница' },
  { id: 6, label: 'Сб', fullLabel: 'Суббота' },
]

export const RecurringView: React.FC = () => {
  const { recurringTasks, userId } = useAppStore()
  const { addRecurringTask, deleteRecurringTask, updateRecurringTask } = useDatabase()
  const [isAdding, setIsAdding] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    frequency: 'daily' as 'daily' | 'weekly',
    days_of_week: [] as number[]
  })

  // Сортируем задачи по order_index
  const sortedTasks = [...recurringTasks].sort((a, b) => {
    const aOrder = 'order_index' in a ? a.order_index || 0 : 0
    const bOrder = 'order_index' in b ? b.order_index || 0 : 0
    return aOrder - bOrder
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTask.title.trim() || !userId) return

    // Получаем максимальный order_index и добавляем новую задачу в конец
    const maxOrder = Math.max(...sortedTasks.map(t => ('order_index' in t ? t.order_index || 0 : 0)), -1)

    await addRecurringTask({
      user_id: userId,
      title: newTask.title.trim(),
      frequency: newTask.frequency,
      days_of_week: newTask.frequency === 'weekly' ? newTask.days_of_week : undefined,
      order_index: maxOrder + 1,
    })

    setNewTask({
      title: '',
      frequency: 'daily',
      days_of_week: []
    })
    setIsAdding(false)
  }

  const handleDelete = async (id: string) => {
    await deleteRecurringTask(id)
  }

  const handleMoveUp = useCallback(async (taskId: string) => {
    const taskIndex = sortedTasks.findIndex(t => t.id === taskId)
    if (taskIndex <= 0) return

    const task = sortedTasks[taskIndex]
    const prevTask = sortedTasks[taskIndex - 1]

    // Меняем order_index местами
    await Promise.all([
      updateRecurringTask(task.id, { order_index: prevTask.order_index || 0 }),
      updateRecurringTask(prevTask.id, { order_index: task.order_index || 0 })
    ])

    console.log(`Moved recurring task ${taskId} up`)
  }, [sortedTasks, updateRecurringTask])

  const handleMoveDown = useCallback(async (taskId: string) => {
    const taskIndex = sortedTasks.findIndex(t => t.id === taskId)
    if (taskIndex >= sortedTasks.length - 1) return

    const task = sortedTasks[taskIndex]
    const nextTask = sortedTasks[taskIndex + 1]

    // Меняем order_index местами
    await Promise.all([
      updateRecurringTask(task.id, { order_index: nextTask.order_index || 0 }),
      updateRecurringTask(nextTask.id, { order_index: task.order_index || 0 })
    ])

    console.log(`Moved recurring task ${taskId} down`)
  }, [sortedTasks, updateRecurringTask])

  const toggleDay = (dayId: number) => {
    setNewTask(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(dayId)
        ? prev.days_of_week.filter(d => d !== dayId)
        : [...prev.days_of_week, dayId].sort()
    }))
  }

  const getFrequencyText = (task: RecurringTask) => {
    if (task.frequency === 'daily') {
      return 'Ежедневно'
    }

    if (task.frequency === 'weekly' && task.days_of_week) {
      const selectedDays = task.days_of_week
        .map(dayId => daysOfWeek.find(d => d.id === dayId)?.label)
        .filter(Boolean)
      return selectedDays.join(', ')
    }

    return 'Еженедельно'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🔄 Регулярные задачи</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {recurringTasks.length} {recurringTasks.length === 1 ? 'задача' : 'задач'}
        </span>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Как работают регулярные задачи:</p>
            <p>Регулярные задачи автоматически появляются во вкладке "Сегодня" согласно расписанию. Используйте стрелочки для настройки порядка их появления.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">🔄</div>
            <p className="text-lg font-medium mb-2">Регулярных задач пока нет</p>
            <p className="text-sm">Создайте задачи, которые повторяются каждый день или в определенные дни недели</p>
          </div>
        ) : (
          sortedTasks.map((task, index) => (
            <div
              key={task.id}
              className="flex items-center gap-4 p-4 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md shadow-sm transition-all"
            >
              {/* Move Buttons */}
              {sortedTasks.length > 1 && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(task.id)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Переместить вверх"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => handleMoveDown(task.id)}
                    disabled={index === sortedTasks.length - 1}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Переместить вниз"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              )}

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">{task.title}</h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{getFrequencyText(task)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(task.id)}
                className="p-2.5 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50 border border-red-200 dark:border-red-700 transition-all"
                title="Удалить регулярную задачу"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Название задачи</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Название регулярной задачи..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Частота</label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="daily"
                  checked={newTask.frequency === 'daily'}
                  onChange={(e) => setNewTask(prev => ({
                    ...prev,
                    frequency: e.target.value as 'daily' | 'weekly',
                    days_of_week: []
                  }))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Ежедневно</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="weekly"
                  checked={newTask.frequency === 'weekly'}
                  onChange={(e) => setNewTask(prev => ({
                    ...prev,
                    frequency: e.target.value as 'daily' | 'weekly'
                  }))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">По дням недели</span>
              </label>
            </div>
          </div>

          {newTask.frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Дни недели</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                      newTask.days_of_week.includes(day.id)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={!newTask.title.trim() || (newTask.frequency === 'weekly' && newTask.days_of_week.length === 0)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Создать
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false)
                setNewTask({ title: '', frequency: 'daily', days_of_week: [] })
              }}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all font-medium"
            >
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center space-x-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Добавить регулярную задачу</span>
        </button>
      )}
    </div>
  )
}
