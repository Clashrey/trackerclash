import React, { useState } from 'react'
import { Check, X, ChevronUp, ChevronDown } from 'lucide-react'
import { Task, RecurringTask } from '../lib/database'

interface TaskItemProps {
  task: Task | (RecurringTask & { isRecurring: true; completed?: boolean })
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  showMoveButtons?: boolean
  isFirst?: boolean
  isLast?: boolean
}

export function TaskItem({ 
  task, 
  onToggle, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  showMoveButtons = false,
  isFirst = false,
  isLast = false
}: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  
  const isRecurring = 'isRecurring' in task && task.isRecurring
  const isCompleted = task.completed || false

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(task.id)
    setIsDeleting(false)
  }

  return (
    <div
      className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-gray-50 border-gray-200 shadow-sm' // Более заметный фон для закрытых
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md shadow-sm'
      } ${isDeleting ? 'opacity-50' : ''}`}
    >
      {/* Move Buttons */}
      {showMoveButtons && (onMoveUp || onMoveDown) && (
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onMoveUp?.(task.id)}
            disabled={isFirst}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Переместить вверх"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => onMoveDown?.(task.id)}
            disabled={isLast}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Переместить вниз"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      )}

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span
            className={`text-base font-medium transition-all ${
              isCompleted
                ? 'text-gray-400 line-through decoration-2 decoration-gray-400' // Более заметное зачеркивание
                : 'text-gray-900'
            }`}
          >
            {task.title}
          </span>
          {isRecurring && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
              🔄 регулярная
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(task.id)}
          className={`p-2.5 rounded-lg transition-all font-medium text-sm ${
            isCompleted
              ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
          }`}
          title={isCompleted ? 'Отменить выполнение' : 'Отметить как выполненную'}
        >
          <Check size={16} />
        </button>
        
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 transition-all disabled:opacity-50 font-medium text-sm"
          title="Удалить задачу"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
