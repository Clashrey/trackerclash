import { useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import { useDatabase } from '@/hooks/useDatabase'
import { TaskItem } from '@/components/TaskItem'
import { AddTaskForm } from '@/components/AddTaskForm'
import { DatePickerModal } from '@/components/ui/DatePickerModal'
import { EmptyState } from '@/components/ui/EmptyState'

interface ListViewProps {
  category: 'tasks' | 'ideas'
  title: string
  emptyIcon: React.ReactNode
  emptyTitle: string
  emptyDescription: string
  placeholder: string
  showMoveToToday?: boolean
}

export const ListView: React.FC<ListViewProps> = ({
  category,
  title,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  placeholder,
  showMoveToToday = false,
}) => {
  const { tasks, subtasks } = useAppStore()
  const { updateTask, deleteTask, copyTaskToToday, addSubtask, updateSubtask, deleteSubtask } = useDatabase()

  const [datePickerTaskId, setDatePickerTaskId] = useState<string | null>(null)

  const list = tasks
    .filter(task => task.category === category)
    .sort((a, b) => a.order_index - b.order_index)

  const handleToggleTask = useCallback(async (taskId: string) => {
    const task = list.find(t => t.id === taskId)
    if (task) {
      await updateTask(taskId, { completed: !task.completed })
    }
  }, [list, updateTask])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await deleteTask(taskId)
  }, [deleteTask])

  const handleMoveTaskUp = useCallback(async (taskId: string) => {
    const taskIndex = list.findIndex(t => t.id === taskId)
    if (taskIndex <= 0) return
    const task = list[taskIndex]
    const prevTask = list[taskIndex - 1]
    await Promise.all([
      updateTask(task.id, { order_index: prevTask.order_index }),
      updateTask(prevTask.id, { order_index: task.order_index })
    ])
  }, [list, updateTask])

  const handleMoveTaskDown = useCallback(async (taskId: string) => {
    const taskIndex = list.findIndex(t => t.id === taskId)
    if (taskIndex >= list.length - 1) return
    const task = list[taskIndex]
    const nextTask = list[taskIndex + 1]
    await Promise.all([
      updateTask(task.id, { order_index: nextTask.order_index }),
      updateTask(nextTask.id, { order_index: task.order_index })
    ])
  }, [list, updateTask])

  const handleMoveToTodayClick = useCallback((taskId: string) => {
    setDatePickerTaskId(taskId)
  }, [])

  const handleDateSelect = useCallback(async (date: string) => {
    if (datePickerTaskId) {
      await copyTaskToToday(datePickerTaskId, date)
      setDatePickerTaskId(null)
    }
  }, [datePickerTaskId, copyTaskToToday])

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{title}</h2>
        {list.length > 0 && (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
            {list.length}
          </span>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {list.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                subtasks={subtasks}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onUpdate={handleUpdateTask}
                onMoveUp={handleMoveTaskUp}
                onMoveDown={handleMoveTaskDown}
                onMoveToToday={showMoveToToday ? handleMoveToTodayClick : undefined}
                onAddSubtask={handleAddSubtask}
                onToggleSubtask={handleToggleSubtask}
                onDeleteSubtask={handleDeleteSubtask}
                onUpdateSubtask={handleUpdateSubtaskTitle}
                showMoveButtons={list.length > 1}
                showMoveToToday={showMoveToToday}
                isFirst={index === 0}
                isLast={index === list.length - 1}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddTaskForm category={category} placeholder={placeholder} />

      {showMoveToToday && (
        <DatePickerModal
          isOpen={datePickerTaskId !== null}
          onClose={() => setDatePickerTaskId(null)}
          onSelect={handleDateSelect}
          title="Перенести в Сегодня"
        />
      )}
    </div>
  )
}
