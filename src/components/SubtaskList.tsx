import React, { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X, Plus } from 'lucide-react'
import { Subtask } from '@/types'
import { variants, transitions } from '@/lib/animations'

interface SubtaskListProps {
  subtasks: Subtask[]
  onToggleSubtask?: (subtaskId: string, completed: boolean) => void
  onDeleteSubtask?: (subtaskId: string) => void
  onUpdateSubtask?: (subtaskId: string, title: string) => void
  onAddSubtask?: (title: string) => void
}

export const SubtaskList: React.FC<SubtaskListProps> = ({
  subtasks,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateSubtask,
  onAddSubtask,
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editSubtaskTitle, setEditSubtaskTitle] = useState('')
  const subtaskEditInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingSubtaskId && subtaskEditInputRef.current) {
      subtaskEditInputRef.current.focus()
      subtaskEditInputRef.current.select()
    }
  }, [editingSubtaskId])

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim() || !onAddSubtask) return
    setIsAddingSubtask(true)
    await onAddSubtask(newSubtaskTitle.trim())
    setNewSubtaskTitle('')
    setIsAddingSubtask(false)
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
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={variants.collapse}
      transition={transitions.smooth}
      className="px-4 pb-4 pt-0 border-t border-[var(--color-border-secondary)]"
    >
      {/* Subtasks List */}
      {subtasks.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <AnimatePresence initial={false}>
            {subtasks.map(subtask => (
              <motion.div
                key={subtask.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={transitions.smooth}
                className={`group/subtask flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  subtask.completed
                    ? 'bg-[var(--color-bg-tertiary-50)]'
                    : 'hover:bg-[var(--color-bg-tertiary-30)]'
                }`}
              >
                <button
                  onClick={() => onToggleSubtask?.(subtask.id, !subtask.completed)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    subtask.completed
                      ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white'
                      : 'border-[var(--color-border-primary)] hover:border-[var(--color-accent)]'
                  }`}
                  aria-label={subtask.completed ? 'Отменить выполнение подзадачи' : 'Отметить подзадачу как выполненную'}
                >
                  {subtask.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={transitions.spring}
                    >
                      <Check size={12} />
                    </motion.div>
                  )}
                </button>

                {editingSubtaskId === subtask.id ? (
                  <input
                    ref={subtaskEditInputRef}
                    type="text"
                    value={editSubtaskTitle}
                    onChange={e => setEditSubtaskTitle(e.target.value)}
                    onBlur={() => handleSubtaskEditSubmit(subtask.id, subtask.title)}
                    onKeyDown={e => handleSubtaskEditKeyDown(e, subtask.id, subtask.title)}
                    className="flex-1 px-2 py-1 text-sm border border-[var(--color-accent)] rounded-md bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-30)]"
                  />
                ) : (
                  <span
                    onClick={() => onUpdateSubtask && startEditingSubtask(subtask)}
                    className={`flex-1 text-sm cursor-pointer transition-colors hover:text-[var(--color-accent)] ${
                      subtask.completed
                        ? 'text-[var(--color-text-tertiary)] line-through'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                    title="Нажмите для редактирования"
                  >
                    {subtask.title}
                  </span>
                )}

                <button
                  onClick={() => onDeleteSubtask?.(subtask.id)}
                  className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-danger-10)] hover:text-[var(--color-danger)] transition-all flex-shrink-0"
                  aria-label="Удалить подзадачу"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Subtask Form */}
      <form onSubmit={handleAddSubtask} className="mt-3 flex gap-2">
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={e => setNewSubtaskTitle(e.target.value)}
          placeholder="Добавить подзадачу..."
          className="flex-1 px-3 py-2 text-sm border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-30)] focus:border-[var(--color-accent)] transition-all"
          disabled={isAddingSubtask}
        />
        <button
          type="submit"
          disabled={!newSubtaskTitle.trim() || isAddingSubtask}
          className="px-3 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Добавить подзадачу"
        >
          <Plus size={16} />
        </button>
      </form>
    </motion.div>
  )
}
