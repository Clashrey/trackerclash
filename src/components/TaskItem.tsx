import React, { useState } from 'react'
import { Check, X, ChevronUp, ChevronDown, ChevronRight, Plus, Calendar } from 'lucide-react'
import { Task, RecurringTask, Subtask } from '../lib/database'

interface TaskItemProps {
  task: Task | (RecurringTask & { isRecurring: true; completed?: boolean })
  subtasks?: Subtask[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  onMoveToToday?: (id: string) => void
  onAddSubtask?: (taskId: string, title: string) => void
  onToggleSubtask?: (subtaskId: string, completed: boolean) => void
  onDeleteSubtask?: (subtaskId: string) => void
  showMoveButtons?: boolean
  showMoveToToday?: boolean
  isFirst?: boolean
  isLast?: boolean
}

export function TaskItem({
  task,
  subtasks = [],
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveToToday,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  showMoveButtons = false,
  showMoveToToday = false,
  isFirst = false,
  isLast = false
}: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)

  const isRecurring = 'isRecurring' in task && task.isRecurring
  const isCompleted = task.completed || false

  // Подзадачи этой задачи
  const taskSubtasks = subtasks.filter(s => s.task_id === task.id).sort((a, b) => a.order_index - b.order_index)
  const hasSubtasks = taskSubtasks.length > 0
  const completedSubtasks = taskSubtasks.filter(s => s.completed).length

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(task.id)
    setIsDeleting(false)
  }

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim() || !onAddSubtask) return

    setIsAddingSubtask(true)
    await onAddSubtask(task.id, newSubtaskTitle.trim())
    setNewSubtaskTitle('')
    setIsAddingSubtask(false)
  }

  return (
    <div className={`rounded-xl border transition-all ${
      isCompleted
        ? 'bg-gray-50 border-gray-200 shadow-sm'
        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md shadow-sm'
    } ${isDeleting ? 'opacity-50' : ''}`}>

      {/* Main Task Row */}
      <div className="flex items-center gap-3 p-4">
        {/* Expand Button (for subtasks) */}
        {!isRecurring && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight
              size={16}
              className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        )}

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
                  ? 'text-gray-400 line-through decoration-2 decoration-gray-400'
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
            {hasSubtasks && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {completedSubtasks}/{taskSubtasks.length}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Move to Today Button */}
          {showMoveToToday && onMoveToToday && !isRecurring && (
            <button
              onClick={() => onMoveToToday(task.id)}
              className="p-2.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 transition-all font-medium text-sm"
              title="Перенести в Сегодня"
            >
              <Calendar size={16} />
            </button>
          )}

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

      {/* Subtasks Section */}
      {!isRecurring && isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          {/* Subtasks List */}
          {taskSubtasks.length > 0 && (
            <div className="mt-3 space-y-2">
              {taskSubtasks.map(subtask => (
                <div
                  key={subtask.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    subtask.completed ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <button
                    onClick={() => onToggleSubtask?.(subtask.id, !subtask.completed)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      subtask.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {subtask.completed && <Check size={12} />}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => onDeleteSubtask?.(subtask.id)}
                    className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Subtask Form */}
          <form onSubmit={handleAddSubtask} className="mt-3 flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={e => setNewSubtaskTitle(e.target.value)}
              placeholder="Добавить подзадачу..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isAddingSubtask}
            />
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim() || isAddingSubtask}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
