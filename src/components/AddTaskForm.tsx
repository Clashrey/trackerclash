import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppStore } from '@/store'
import { useDatabase } from '@/hooks/useDatabase'
import { TaskCategory } from '@/types'

interface AddTaskFormProps {
  category: TaskCategory
  date?: Date
  placeholder?: string
  className?: string
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({
  category,
  date,
  placeholder = 'Новая задача...',
  className
}) => {
  const { userId, selectedDate } = useAppStore()
  const { addTask } = useDatabase()
  const [title, setTitle] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔍 handleSubmit - title:', title, 'userId:', userId)

    if (!title.trim() || !userId) {
      console.log('❌ handleSubmit blocked - title:', title.trim(), 'userId:', userId)
      return
    }

    const taskDate = date ? date.toISOString().split('T')[0] : (category === 'today' ? selectedDate : undefined)

    // ✅ Получаем актуальные задачи напрямую из store
    const currentTasks = useAppStore.getState().tasks

    // Получаем максимальный order_index для данной категории
    const categoryTasks = currentTasks.filter(task =>
      task.category === (category === 'today' ? 'today' : category) &&
      (!taskDate || task.date === taskDate)
    )
    const maxOrderIndex = categoryTasks.length > 0
      ? Math.max(...categoryTasks.map(t => t.order_index))
      : -1

    console.log('🔍 Calling addTask...')
    const result = await addTask({
      user_id: userId,
      title: title.trim(),
      category: category === 'today' ? 'today' : category,
      completed: false,
      date: taskDate,
      order_index: maxOrderIndex + 1,
    })
    console.log('🔍 addTask result:', result)

    setTitle('')
    setIsExpanded(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setTitle('')
      setIsExpanded(false)
    }
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`w-full flex items-center justify-center space-x-2 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${className}`}
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm sm:text-base font-medium">{placeholder}</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <div className="flex space-x-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          autoFocus
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          setTitle('')
          setIsExpanded(false)
        }}
        className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Нажмите Escape или кликните здесь для отмены
      </button>
    </form>
  )
}
