import React, { useState } from 'react'
import { GripVertical, Check, X } from 'lucide-react'
import { Task, RecurringTask } from '../lib/database'

interface TaskItemProps {
  task: Task | (RecurringTask & { isRecurring: true; completed?: boolean })
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onDragStart?: (e: React.DragEvent, id: string) => void
  onDragEnd?: (e: React.DragEvent) => void
  isDragging?: boolean
}

export function TaskItem({ task, onToggle, onDelete, onDragStart, onDragEnd, isDragging }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  
  const isRecurring = 'isRecurring' in task && task.isRecurring
  const isCompleted = task.completed || false

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(task.id)
    setIsDeleting(false)
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, task.id)
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(e)
    }
  }

  return (
    <div
      className={`group flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isDeleting ? 'opacity-50' : ''}`}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
        <GripVertical size={16} />
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${
              isCompleted
                ? 'text-gray-500 line-through'
                : 'text-gray-900'
            }`}
          >
            {task.title}
          </span>
          {isRecurring && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              🔄 регулярная
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(task.id)}
          className={`p-1.5 rounded-full transition-colors ${
            isCompleted
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
          title={isCompleted ? 'Отменить выполнение' : 'Отметить как выполненную'}
        >
          <Check size={14} />
        </button>
        
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
          title="Удалить задачу"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

