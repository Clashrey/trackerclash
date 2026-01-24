import React, { useState, useRef, useEffect } from 'react'
import { Check, X, ChevronUp, ChevronDown, ChevronRight, Plus, Calendar, Pencil } from 'lucide-react'
import { Task, RecurringTask, Subtask } from '../lib/database'

interface TaskItemProps {
  task: Task | (RecurringTask & { isRecurring: true; completed?: boolean })
  subtasks?: Subtask[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate?: (id: string, title: string) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  onMoveToToday?: (id: string) => void
  onAddSubtask?: (taskId: string, title: string) => void
  onToggleSubtask?: (subtaskId: string, completed: boolean) => void
  onDeleteSubtask?: (subtaskId: string) => void
  onUpdateSubtask?: (subtaskId: string, title: string) => void
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
  onUpdate,
  onMoveUp,
  onMoveDown,
  onMoveToToday,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateSubtask,
  showMoveButtons = false,
  showMoveToToday = false,
  isFirst = false,
  isLast = false
}: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editSubtaskTitle, setEditSubtaskTitle] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  const subtaskEditInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (editingSubtaskId && subtaskEditInputRef.current) {
      subtaskEditInputRef.current.focus()
      subtaskEditInputRef.current.select()
    }
  }, [editingSubtaskId])

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

  const handleEditSubmit = async () => {
    if (!editTitle.trim() || editTitle === task.title) {
      setIsEditing(false)
      setEditTitle(task.title)
      return
    }
    if (onUpdate) {
      await onUpdate(task.id, editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditTitle(task.title)
    }
  }

  const handleSubtaskEditSubmit = async (subtaskId: string, originalTitle: string) => {
    if (!editSubtaskTitle.trim() || editSubtaskTitle === originalTitle) {
      setEditingSubtaskId(null)
      setEditSubtaskTitle('')
      return
    }
    if (onUpdateSubtask) {
      await onUpdateSubtask(subtaskId, editSubtaskTitle.trim())
    }
    setEditingSubtaskId(null)
    setEditSubtaskTitle('')
  }

  const handleSubtaskEditKeyDown = (e: React.KeyboardEvent, subtaskId: string, originalTitle: string) => {
    if (e.key === 'Enter') {
      handleSubtaskEditSubmit(subtaskId, originalTitle)
    } else if (e.key === 'Escape') {
      setEditingSubtaskId(null)
      setEditSubtaskTitle('')
    }
  }

  const startEditingSubtask = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id)
    setEditSubtaskTitle(subtask.title)
  }

  return (
    <div className={`rounded-xl border transition-all ${
      isCompleted
        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-sm'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md shadow-sm'
    } ${isDeleting ? 'opacity-50' : ''}`}>

      {/* Main Task Row */}
      <div className="flex items-center gap-3 p-4">
        {/* Expand Button (for subtasks) */}
        {!isRecurring && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Переместить вверх"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => onMoveDown?.(task.id)}
              disabled={isLast}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Переместить вниз"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <input
                ref={editInputRef}
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={handleEditSubmit}
                onKeyDown={handleEditKeyDown}
                className="flex-1 px-2 py-1 text-base font-medium border border-blue-300 dark:border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <span
                onClick={() => {
                  if (!isRecurring && onUpdate) {
                    setIsEditing(true)
                    setEditTitle(task.title)
                  }
                }}
                className={`text-base font-medium transition-all cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
                  isCompleted
                    ? 'text-gray-400 dark:text-gray-500 line-through decoration-2 decoration-gray-400 dark:decoration-gray-500'
                    : 'text-gray-900 dark:text-white'
                }`}
                title={!isRecurring ? 'Нажмите для редактирования' : undefined}
              >
                {task.title}
              </span>
            )}
            {isRecurring && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                🔄 регулярная
              </span>
            )}
            {hasSubtasks && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
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
              className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50 border border-purple-200 dark:border-purple-700 transition-all font-medium text-sm"
              title="Перенести в Сегодня"
            >
              <Calendar size={16} />
            </button>
          )}

          <button
            onClick={() => onToggle(task.id)}
            className={`p-2.5 rounded-lg transition-all font-medium text-sm ${
              isCompleted
                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50 border border-green-200 dark:border-green-700'
                : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 border border-blue-200 dark:border-blue-700'
            }`}
            title={isCompleted ? 'Отменить выполнение' : 'Отметить как выполненную'}
          >
            <Check size={16} />
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2.5 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50 border border-red-200 dark:border-red-700 transition-all disabled:opacity-50 font-medium text-sm"
            title="Удалить задачу"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Subtasks Section */}
      {!isRecurring && isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700">
          {/* Subtasks List */}
          {taskSubtasks.length > 0 && (
            <div className="mt-3 space-y-2">
              {taskSubtasks.map(subtask => (
                <div
                  key={subtask.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    subtask.completed ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <button
                    onClick={() => onToggleSubtask?.(subtask.id, !subtask.completed)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      subtask.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    {subtask.completed && <Check size={12} />}
                  </button>
                  {editingSubtaskId === subtask.id ? (
                    <input
                      ref={subtaskEditInputRef}
                      type="text"
                      value={editSubtaskTitle}
                      onChange={e => setEditSubtaskTitle(e.target.value)}
                      onBlur={() => handleSubtaskEditSubmit(subtask.id, subtask.title)}
                      onKeyDown={e => handleSubtaskEditKeyDown(e, subtask.id, subtask.title)}
                      className="flex-1 px-2 py-1 text-sm border border-blue-300 dark:border-blue-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span
                      onClick={() => onUpdateSubtask && startEditingSubtask(subtask)}
                      className={`flex-1 text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
                        subtask.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'
                      }`}
                      title="Нажмите для редактирования"
                    >
                      {subtask.title}
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteSubtask?.(subtask.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
