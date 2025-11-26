import React, { useCallback, useState } from 'react'
import { useAppStore } from '@/store'
import { useDatabase } from '@/hooks/useDatabase'
import { TaskItem } from '@/components/TaskItem'
import { AddTaskForm } from '@/components/AddTaskForm'
import { DatePickerModal } from '@/components/ui/DatePickerModal'

export const TasksView: React.FC = () => {
  const { tasks, subtasks } = useAppStore()
  const { updateTask, deleteTask, copyTaskToToday, addSubtask, updateSubtask, deleteSubtask } = useDatabase()

  const [datePickerTaskId, setDatePickerTaskId] = useState<string | null>(null)

  const tasksList = tasks
    .filter(task => task.category === 'tasks')
    .sort((a, b) => a.order_index - b.order_index)

  const handleToggleTask = useCallback(async (taskId: string) => {
    const task = tasksList.find(t => t.id === taskId)
    if (task) {
      await updateTask(taskId, { completed: !task.completed })
    }
  }, [tasksList, updateTask])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await deleteTask(taskId)
  }, [deleteTask])

  const handleMoveTaskUp = useCallback(async (taskId: string) => {
    const taskIndex = tasksList.findIndex(t => t.id === taskId)
    if (taskIndex <= 0) return

    const task = tasksList[taskIndex]
    const prevTask = tasksList[taskIndex - 1]

    await Promise.all([
      updateTask(task.id, { order_index: prevTask.order_index }),
      updateTask(prevTask.id, { order_index: task.order_index })
    ])
  }, [tasksList, updateTask])

  const handleMoveTaskDown = useCallback(async (taskId: string) => {
    const taskIndex = tasksList.findIndex(t => t.id === taskId)
    if (taskIndex >= tasksList.length - 1) return

    const task = tasksList[taskIndex]
    const nextTask = tasksList[taskIndex + 1]

    await Promise.all([
      updateTask(task.id, { order_index: nextTask.order_index }),
      updateTask(nextTask.id, { order_index: task.order_index })
    ])
  }, [tasksList, updateTask])

  // Открыть модалку выбора даты
  const handleMoveToTodayClick = useCallback((taskId: string) => {
    setDatePickerTaskId(taskId)
  }, [])

  // Скопировать задачу в "Сегодня" на выбранную дату
  const handleDateSelect = useCallback(async (date: string) => {
    if (datePickerTaskId) {
      await copyTaskToToday(datePickerTaskId, date)
      setDatePickerTaskId(null)
    }
  }, [datePickerTaskId, copyTaskToToday])

  // Subtask handlers
  const handleAddSubtask = useCallback(async (taskId: string, title: string) => {
    const currentSubtasks = useAppStore.getState().subtasks.filter(s => s.task_id === taskId)
    const maxOrderIndex = currentSubtasks.length > 0
      ? Math.max(...currentSubtasks.map(s => s.order_index))
      : -1

    await addSubtask({
      task_id: taskId,
      title,
      completed: false,
      order_index: maxOrderIndex + 1
    })
  }, [addSubtask])

  const handleToggleSubtask = useCallback(async (subtaskId: string, completed: boolean) => {
    await updateSubtask(subtaskId, { completed })
  }, [updateSubtask])

  const handleDeleteSubtask = useCallback(async (subtaskId: string) => {
    await deleteSubtask(subtaskId)
  }, [deleteSubtask])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📝 Задачи</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {tasksList.length} {tasksList.length === 1 ? 'задача' : 'задач'}
        </span>
      </div>

      <div className="space-y-4">
        {tasksList.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg font-medium mb-2">Задач пока нет</p>
            <p className="text-sm">Добавьте задачи, которые нужно выполнить</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasksList.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                subtasks={subtasks}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onMoveUp={handleMoveTaskUp}
                onMoveDown={handleMoveTaskDown}
                onMoveToToday={handleMoveToTodayClick}
                onAddSubtask={handleAddSubtask}
                onToggleSubtask={handleToggleSubtask}
                onDeleteSubtask={handleDeleteSubtask}
                showMoveButtons={tasksList.length > 1}
                showMoveToToday={true}
                isFirst={index === 0}
                isLast={index === tasksList.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      <AddTaskForm
        category="tasks"
        placeholder="Добавить новую задачу..."
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={datePickerTaskId !== null}
        onClose={() => setDatePickerTaskId(null)}
        onSelect={handleDateSelect}
        title="Перенести в Сегодня"
      />
    </div>
  )
}
