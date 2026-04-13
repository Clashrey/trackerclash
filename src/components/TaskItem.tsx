import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X, ChevronUp, ChevronDown, ChevronRight, Calendar } from 'lucide-react'
import { Task, RecurringTask, Subtask } from '@/types'
import { SubtaskList } from './SubtaskList'
import { transitions } from '@/lib/animations'

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
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  const isRecurring = 'isRecurring' in task && task.isRecurring
  const isCompleted = task.completed || false

  const taskSubtasks = subtasks.filter(s => s.task_id === task.id).sort((a, b) => a.order_index - b.order_index)
  const hasSubtasks = taskSubtasks.length > 0
  const completedSubtasks = taskSubtasks.filter(s => s.completed).length

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(task.id)
    setIsDeleting(false)
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

  const handleAddSubtask = async (title: string) => {
    if (onAddSubtask) {
      await onAddSubtask(task.id, title)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, height: 0, marginBottom: 0 }}
      transition={transitions.smooth}
      className={`group rounded-xl border transition-all ${
        isCompleted
          ? 'bg-[var(--color-bg-tertiary-50)] border-[var(--color-border-primary)]'
          : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-primary)] hover:border-[var(--color-accent-30)] hover:shadow-md shadow-sm'
      } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Main Task Row */}
      <div className="flex items-center gap-3 p-3 sm:p-4">
        {/* Drag Handle / Expand Button */}
        {!isRecurring && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            aria-label={isExpanded ? 'Свернуть подзадачи' : 'Развернуть подзадачи'}
            aria-expanded={isExpanded}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={transitions.spring}
            >
              <ChevronRight size={16} />
            </motion.div>
          </button>
        )}

        {/* Move Buttons */}
        {showMoveButtons && (onMoveUp || onMoveDown) && (
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => onMoveUp?.(task.id)}
              disabled={isFirst}
              className="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              aria-label="Переместить вверх"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => onMoveDown?.(task.id)}
              disabled={isLast}
              className="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              aria-label="Переместить вниз"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}

        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            isCompleted
              ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white'
              : 'border-[var(--color-border-primary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-5)]'
          }`}
          aria-label={isCompleted ? 'Отменить выполнение' : 'Отметить как выполненную'}
          role="checkbox"
          aria-checked={isCompleted}
        >
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={transitions.spring}
              >
                <Check size={14} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                ref={editInputRef}
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={handleEditSubmit}
                onKeyDown={handleEditKeyDown}
                className="flex-1 px-2 py-1 text-sm font-medium border border-[var(--color-accent)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-30)]"
              />
            ) : (
              <span
                onClick={() => {
                  if (!isRecurring && onUpdate) {
                    setIsEditing(true)
                    setEditTitle(task.title)
                  }
                }}
                className={`text-sm sm:text-base font-medium transition-all truncate ${
                  !isRecurring && onUpdate ? 'cursor-pointer hover:text-[var(--color-accent)]' : ''
                } ${
                  isCompleted
                    ? 'text-[var(--color-text-tertiary)] line-through decoration-[var(--color-text-tertiary)]'
                    : 'text-[var(--color-text-primary)]'
                }`}
                title={!isRecurring ? 'Нажмите для редактирования' : undefined}
              >
                {task.title}
              </span>
            )}

            {isRecurring && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-accent-light)] text-[var(--color-accent)] flex-shrink-0">
                регулярная
              </span>
            )}

            {hasSubtasks && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] flex-shrink-0">
                {completedSubtasks}/{taskSubtasks.length}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Move to Today / Reschedule Button */}
          {showMoveToToday && onMoveToToday && !isRecurring && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => onMoveToToday(task.id)}
              className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-10)] transition-colors"
              aria-label="Перенести на другой день"
              title="Перенести на другой день"
            >
              <Calendar size={16} />
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-10)] transition-colors disabled:opacity-50"
            aria-label="Удалить задачу"
          >
            <X size={16} />
          </motion.button>
        </div>
      </div>

      {/* Subtasks Section (extracted component) */}
      <AnimatePresence>
        {!isRecurring && isExpanded && (
          <SubtaskList
            subtasks={taskSubtasks}
            onToggleSubtask={onToggleSubtask}
            onDeleteSubtask={onDeleteSubtask}
            onUpdateSubtask={onUpdateSubtask}
            onAddSubtask={handleAddSubtask}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
