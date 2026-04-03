import React, { useCallback, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
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
  const { updateTask, deleteTask, addTaskCompletion, removeTaskCompletion, addSubtask, updateSubtask, deleteSubtask, syncTaskCompletion, rescheduleTask } = useDatabase()

  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null)

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
      const aOrder = 'order_index' in a ? a.order_index : 0
      const bOrder = 'order_index' in b ? b.order_index : 0
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

  return (
    <div className="space-y-6">
      <DateNavigation />

      {totalTasks > 0 && (
        <ProgressBar completed={completedTasks} total={totalTasks} label="Прогресс за день" />
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
    </div>
  )
}
