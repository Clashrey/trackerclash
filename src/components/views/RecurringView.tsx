import React, { useState } from 'react'
import { useAppStore } from '@/store'
import { useDatabase } from '@/hooks/useDatabase'
import { RecurringTask } from '@/types'
import { Plus, X, Calendar, Clock } from 'lucide-react'

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
  const { addRecurringTask, deleteRecurringTask } = useDatabase()
  const [isAdding, setIsAdding] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    frequency: 'daily' as 'daily' | 'weekly',
    days_of_week: [] as number[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTask.title.trim() || !userId) return

    await addRecurringTask({
      user_id: userId,
      title: newTask.title.trim(),
      frequency: newTask.frequency,
      days_of_week: newTask.frequency === 'weekly' ? newTask.days_of_week : undefined,
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
        <h2 className="text-2xl font-bold">🔄 Регулярные задачи</h2>
        <span className="text-sm text-gray-500">
          {recurringTasks.length} {recurringTasks.length === 1 ? 'задача' : 'задач'}
        </span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Как работают регулярные задачи:</p>
            <p>Регулярные задачи автоматически появляются во вкладке "Сегодня" согласно расписанию. Их можно перетаскивать между собой для изменения порядка.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {recurringTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🔄</div>
            <p className="text-lg mb-2">Регулярных задач пока нет</p>
            <p className="text-sm">Создайте задачи, которые повторяются каждый день или в определенные дни недели</p>
          </div>
        ) : (
          recurringTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-white"
            >
              <div className="flex-1">
                <h3 className="font-medium">{task.title}</h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{getFrequencyText(task)}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDelete(task.id)}
                className="p-2 rounded-md hover:bg-red-100 text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white">
          <div>
            <label className="block text-sm font-medium mb-2">Название задачи</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Название регулярной задачи..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Частота</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="daily"
                  checked={newTask.frequency === 'daily'}
                  onChange={(e) => setNewTask(prev => ({ 
                    ...prev, 
                    frequency: e.target.value as 'daily' | 'weekly',
                    days_of_week: []
                  }))}
                  className="text-blue-600"
                />
                <span>Ежедневно</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="weekly"
                  checked={newTask.frequency === 'weekly'}
                  onChange={(e) => setNewTask(prev => ({ 
                    ...prev, 
                    frequency: e.target.value as 'daily' | 'weekly'
                  }))}
                  className="text-blue-600"
                />
                <span>По дням недели</span>
              </label>
            </div>
          </div>

          {newTask.frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium mb-2">Дни недели</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                      newTask.days_of_week.includes(day.id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={!newTask.title.trim() || (newTask.frequency === 'weekly' && newTask.days_of_week.length === 0)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Создать
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false)
                setNewTask({ title: '', frequency: 'daily', days_of_week: [] })
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-gray-500 hover:text-gray-700"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить регулярную задачу</span>
        </button>
      )}
    </div>
  )
}

