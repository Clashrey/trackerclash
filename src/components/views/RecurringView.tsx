import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import { useDatabase } from '@/hooks/useDatabase'
import { RecurringTask } from '@/types'
import { Plus, X, Clock, ChevronUp, ChevronDown, Repeat, Info } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { transitions } from '@/lib/animations'

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

  const sortedTasks = [...recurringTasks].sort((a, b) => {
    const aOrder = 'order_index' in a ? (a.order_index ?? 0) : 0
    const bOrder = 'order_index' in b ? (b.order_index ?? 0) : 0
    return aOrder - bOrder
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim() || !userId) return

    const maxOrder = Math.max(...sortedTasks.map(t => ('order_index' in t ? t.order_index ?? 0 : 0)), -1)

    await addRecurringTask({
      title: newTask.title.trim(),
      frequency: newTask.frequency,
      days_of_week: newTask.frequency === 'weekly' ? newTask.days_of_week : undefined,
      order_index: maxOrder + 1,
    })

    setNewTask({ title: '', frequency: 'daily', days_of_week: [] })
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
    await Promise.all([
      updateRecurringTask(task.id, { order_index: prevTask.order_index ?? 0 }),
      updateRecurringTask(prevTask.id, { order_index: task.order_index ?? 0 }),
    ])
  }, [sortedTasks, updateRecurringTask])

  const handleMoveDown = useCallback(async (taskId: string) => {
    const taskIndex = sortedTasks.findIndex(t => t.id === taskId)
    if (taskIndex >= sortedTasks.length - 1) return
    const task = sortedTasks[taskIndex]
    const nextTask = sortedTasks[taskIndex + 1]
    await Promise.all([
      updateRecurringTask(task.id, { order_index: nextTask.order_index ?? 0 }),
      updateRecurringTask(nextTask.id, { order_index: task.order_index ?? 0 }),
    ])
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
    if (task.frequency === 'daily') return 'Ежедневно'
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
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Регулярные</h2>
        {recurringTasks.length > 0 && (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
            {recurringTasks.length}
          </span>
        )}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-accent-5)] border border-[var(--color-accent-20)]">
        <Info size={16} className="text-[var(--color-accent)] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Регулярные задачи автоматически появляются во вкладке «Сегодня» согласно расписанию.
        </p>
      </div>

      {sortedTasks.length === 0 ? (
        <EmptyState
          icon={<Repeat className="w-12 h-12" />}
          title="Регулярных задач пока нет"
          description="Создайте задачи, которые повторяются каждый день или в определённые дни недели"
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {sortedTasks.map((task, index) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16, height: 0 }}
                transition={transitions.smooth}
                className="group flex items-center gap-3 p-4 rounded-xl border bg-[var(--color-bg-elevated)] border-[var(--color-border-primary)] hover:border-[var(--color-accent-30)] hover:shadow-md shadow-sm transition-all"
              >
                {sortedTasks.length > 1 && (
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMoveUp(task.id)}
                      disabled={index === 0}
                      className="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      aria-label="Переместить вверх"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(task.id)}
                      disabled={index === sortedTasks.length - 1}
                      className="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      aria-label="Переместить вниз"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--color-text-primary)] text-sm sm:text-base truncate">{task.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-[var(--color-text-tertiary)]">
                    <Clock size={12} />
                    <span>{getFrequencyText(task)}</span>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleDelete(task.id)}
                  className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-10)] transition-colors"
                  aria-label="Удалить регулярную задачу"
                >
                  <X size={16} />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.form
            key="recurring-form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={transitions.smooth}
            onSubmit={handleSubmit}
            className="space-y-4 p-5 border border-[var(--color-border-primary)] rounded-xl bg-[var(--color-bg-elevated)] shadow-sm"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">Название задачи</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Название регулярной задачи..."
                className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-30)] focus:border-[var(--color-accent)] transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-[var(--color-text-secondary)]">Частота</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNewTask(prev => ({ ...prev, frequency: 'daily', days_of_week: [] }))}
                  className={`flex-1 px-4 py-2.5 text-sm rounded-lg border transition-all ${
                    newTask.frequency === 'daily'
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                      : 'bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  Ежедневно
                </button>
                <button
                  type="button"
                  onClick={() => setNewTask(prev => ({ ...prev, frequency: 'weekly' }))}
                  className={`flex-1 px-4 py-2.5 text-sm rounded-lg border transition-all ${
                    newTask.frequency === 'weekly'
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                      : 'bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  По дням недели
                </button>
              </div>
            </div>

            <AnimatePresence>
              {newTask.frequency === 'weekly' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={transitions.smooth}
                >
                  <label className="block text-sm font-medium mb-3 text-[var(--color-text-secondary)]">Дни недели</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`w-10 h-10 text-sm rounded-lg border transition-all font-medium ${
                          newTask.days_of_week.includes(day.id)
                            ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                            : 'bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] hover:border-[var(--color-accent)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={!newTask.title.trim() || (newTask.frequency === 'weekly' && newTask.days_of_week.length === 0)}
                className="px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Создать
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false)
                  setNewTask({ title: '', frequency: 'daily', days_of_week: [] })
                }}
                className="px-5 py-2.5 border border-[var(--color-border-primary)] rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors font-medium text-sm"
              >
                Отмена
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.button
            key="recurring-add-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.smooth}
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-[var(--color-border-primary)] rounded-xl hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-5)] transition-all text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)]"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium text-sm sm:text-base">Добавить регулярную задачу</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
