import { useCallback, useMemo, useState } from 'react'
import { CalendarCheck, Sparkles, RefreshCw, Lightbulb } from 'lucide-react'
import { useAppStore } from '../../store'
import { useDatabase } from '../../hooks/useDatabase'
import { AddTaskForm } from '../AddTaskForm'
import { TaskItem } from '../TaskItem'
import { ProgressBar } from '../ProgressBar'
import { DateNavigation } from '../DateNavigation'
import { DatePickerModal } from '../ui/DatePickerModal'
import { EmptyState } from '../ui/EmptyState'

export function TodayView() {
  const { tasks, recurringTasks, selectedDate, taskCompletions, subtasks } = useAppStore()
  const { updateTask, deleteTask, addTaskCompletion, removeTaskCompletion, addSubtask, updateSubtask, deleteSubtask, syncTaskCompletion, rescheduleTask, copyTaskToToday } = useDatabase()

  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null)
  const [pickTaskId, setPickTaskId] = useState<string | null>(null)
  const [randomSeed, setRandomSeed] = useState(0)

  const todayTasks = tasks
    .filter(task => task.category === 'today' && task.date === selectedDate)
    .sort((a, b) => a.order_index - b.order_index)

  const todayRecurringTasks = recurringTasks
    .filter(recurringTask => {
      if (recurringTask.frequency === 'daily') return true
      if (recurringTask.frequency === 'weekly' && recurringTask.days_of_week) {
        const dayOfWeek = new Date(selectedDate).getDay()
        return recurringTask.days_of_week.includes(dayOfWeek)
      }
      return false
    })
    .sort((a, b) => {
      const aOrder = a.order_index ?? 0
      const bOrder = b.order_index ?? 0
      return aOrder - bOrder
    })
    .map(rt => ({
      ...rt,
      isRecurring: true as const,
      completed: taskCompletions.some(tc =>
        tc.recurring_task_id === rt.id && tc.date === selectedDate
      ),
      category: 'today' as const,
      date: selectedDate,
    }))

  const totalTasks = todayTasks.length + todayRecurringTasks.length
  const completedTasks = todayTasks.filter(t => t.completed).length + todayRecurringTasks.filter(t => t.completed).length

  // Random task from "Задачи" or "Идеи" section
  const backlogItems = useMemo(() => tasks.filter(t => (t.category === 'tasks' || t.category === 'ideas') && !t.completed), [tasks])
  const randomTask = useMemo(() => {
    if (backlogItems.length === 0) return null
    const idx = (Date.now() + randomSeed) % backlogItems.length
    return backlogItems[idx]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backlogItems, randomSeed])

  const handleToggleTask = useCallback(async (taskId: string) => {
    const regularTask = todayRecurringTasks.find(t => t.id === taskId)
    if (regularTask) {
      if (regularTask.completed) {
        await removeTaskCompletion(null, taskId, selectedDate)
      } else {
        await addTaskCompletion(null, taskId, selectedDate)
      }
    } else {
      const task = todayTasks.find(t => t.id === taskId)
      if (task) {
        const newCompleted = !task.completed
        if (task.completed) {
          await removeTaskCompletion(taskId, null, selectedDate)
        } else {
          await addTaskCompletion(taskId, null, selectedDate)
        }
        await updateTask(taskId, { completed: newCompleted })
        if (task.source_task_id) {
          await syncTaskCompletion(taskId, newCompleted)
        }
      }
    }
  }, [todayTasks, todayRecurringTasks, selectedDate, updateTask, addTaskCompletion, removeTaskCompletion, syncTaskCompletion])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await deleteTask(taskId)
  }, [deleteTask])

  const handleMoveTaskUp = useCallback(async (taskId: string) => {
    const taskIndex = todayTasks.findIndex(t => t.id === taskId)
    if (taskIndex <= 0) return
    const task = todayTasks[taskIndex]
    const prevTask = todayTasks[taskIndex - 1]
    await Promise.all([
      updateTask(task.id, { order_index: prevTask.order_index }),
      updateTask(prevTask.id, { order_index: task.order_index })
    ])
  }, [todayTasks, updateTask])

  const handleMoveTaskDown = useCallback(async (taskId: string) => {
    const taskIndex = todayTasks.findIndex(t => t.id === taskId)
    if (taskIndex >= todayTasks.length - 1) return
    const task = todayTasks[taskIndex]
    const nextTask = todayTasks[taskIndex + 1]
    await Promise.all([
      updateTask(task.id, { order_index: nextTask.order_index }),
      updateTask(nextTask.id, { order_index: task.order_index })
    ])
  }, [todayTasks, updateTask])

  const handleAddSubtask = useCallback(async (taskId: string, title: string) => {
    const currentSubtasks = useAppStore.getState().subtasks.filter(s => s.task_id === taskId)
    const maxOrderIndex = currentSubtasks.length > 0
      ? Math.max(...currentSubtasks.map(s => s.order_index))
      : -1
    await addSubtask({ task_id: taskId, title, completed: false, order_index: maxOrderIndex + 1 })
  }, [addSubtask])

  const handleToggleSubtask = useCallback(async (subtaskId: string, completed: boolean) => {
    await updateSubtask(subtaskId, { completed })
  }, [updateSubtask])

  const handleDeleteSubtask = useCallback(async (subtaskId: string) => {
    await deleteSubtask(subtaskId)
  }, [deleteSubtask])

  const handleUpdateTask = useCallback(async (taskId: string, title: string) => {
    await updateTask(taskId, { title })
  }, [updateTask])

  const handleUpdateSubtaskTitle = useCallback(async (subtaskId: string, title: string) => {
    await updateSubtask(subtaskId, { title })
  }, [updateSubtask])

  const handleRescheduleClick = useCallback((taskId: string) => {
    setRescheduleTaskId(taskId)
  }, [])

  const handleRescheduleDateSelect = useCallback(async (date: string) => {
    if (rescheduleTaskId) {
      await rescheduleTask(rescheduleTaskId, date)
      setRescheduleTaskId(null)
    }
  }, [rescheduleTaskId, rescheduleTask])

  const handlePickDateSelect = useCallback(async (date: string) => {
    if (pickTaskId) {
      await copyTaskToToday(pickTaskId, date)
      setPickTaskId(null)
    }
  }, [pickTaskId, copyTaskToToday])

  return (
    <div className="space-y-6">
      <DateNavigation />

      {totalTasks > 0 && (
        <ProgressBar completed={completedTasks} total={totalTasks} label="Прогресс за день" />
      )}

      {/* Random task suggestion */}
      {randomTask && (
        <div className="p-3 rounded-xl bg-[var(--color-accent-light,rgba(59,130,246,0.08))] border border-[var(--color-accent,#3b82f6)]/20">
          <div className="flex items-center gap-2 mb-1.5">
            {randomTask.category === 'ideas'
              ? <Lightbulb size={14} className="text-amber-500" />
              : <Sparkles size={14} className="text-[var(--color-accent)]" />
            }
            <p className="text-xs font-medium text-[var(--color-accent)]">
              {randomTask.category === 'ideas' ? 'Идея на заметку' : 'Может сегодня?'}
            </p>
            <button
              onClick={() => setRandomSeed(s => s + 1)}
              className="ml-auto p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors"
              title="Другая задача"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-[var(--color-text-primary)] flex-1 truncate">{randomTask.title}</p>
            <button
              onClick={() => setPickTaskId(randomTask.id)}
              className="flex-shrink-0 px-2.5 py-1 rounded-md bg-[var(--color-accent)] text-white text-xs font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Запланировать
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Регулярные задачи */}
        {todayRecurringTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Регулярные</h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                {todayRecurringTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {todayRecurringTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  showMoveButtons={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Обычные задачи */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Задачи на день</h3>
            {todayTasks.length > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                {todayTasks.length}
              </span>
            )}
          </div>

          {todayTasks.length === 0 && todayRecurringTasks.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="w-12 h-12" />}
              title="День свободен"
              description="Добавьте задачи или перенесите из раздела Задачи"
            />
          ) : todayTasks.length === 0 ? (
            <div className="text-center py-6 text-[var(--color-text-tertiary)] text-sm">
              Обычных задач на этот день нет
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  subtasks={subtasks}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onUpdate={handleUpdateTask}
                  onMoveUp={handleMoveTaskUp}
                  onMoveDown={handleMoveTaskDown}
                  onMoveToToday={handleRescheduleClick}
                  onAddSubtask={handleAddSubtask}
                  onToggleSubtask={handleToggleSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  onUpdateSubtask={handleUpdateSubtaskTitle}
                  showMoveButtons={todayTasks.length > 1}
                  showMoveToToday={true}
                  isFirst={index === 0}
                  isLast={index === todayTasks.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddTaskForm category="today" placeholder="Добавить задачу на сегодня..." />

      <DatePickerModal
        isOpen={rescheduleTaskId !== null}
        onClose={() => setRescheduleTaskId(null)}
        onSelect={handleRescheduleDateSelect}
        title="Перенести на другой день"
      />

      <DatePickerModal
        isOpen={pickTaskId !== null}
        onClose={() => setPickTaskId(null)}
        onSelect={handlePickDateSelect}
        title="На какой день запланировать?"
      />
    </div>
  )
}
