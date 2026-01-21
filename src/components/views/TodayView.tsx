import React, { useCallback, useState } from 'react'
import { useAppStore } from '../../store'
import { useDatabase } from '../../hooks/useDatabase'
import { AddTaskForm } from '../AddTaskForm'
import { TaskItem } from '../TaskItem'
import { ProgressBar } from '../ProgressBar'
import { DateNavigation } from '../DateNavigation'
import { DatePickerModal } from '../ui/DatePickerModal'

export function TodayView() {
  const { tasks, recurringTasks, selectedDate, taskCompletions, subtasks } = useAppStore()
  const { updateTask, deleteTask, addTaskCompletion, removeTaskCompletion, addSubtask, updateSubtask, deleteSubtask, syncTaskCompletion, rescheduleTask } = useDatabase()

  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null)

  // Получаем обычные задачи на сегодня (отсортированные)
  const todayTasks = tasks
    .filter(task => task.category === 'today' && task.date === selectedDate)
    .sort((a, b) => a.order_index - b.order_index)

  // Получаем регулярные задачи для сегодня (отсортированные по порядку из вкладки "Регулярные")
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
      // Сортируем по order_index если есть, иначе по дате создания
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

  // Подсчет прогресса
  const totalTasks = todayTasks.length + todayRecurringTasks.length
  const completedTasks = todayTasks.filter(t => t.completed).length + todayRecurringTasks.filter(t => t.completed).length
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const handleToggleTask = useCallback(async (taskId: string) => {
    // Проверяем, это регулярная задача или обычная
    const regularTask = todayRecurringTasks.find(t => t.id === taskId)
    if (regularTask) {
      // Регулярная задача
      if (regularTask.completed) {
        await removeTaskCompletion(null, taskId, selectedDate)
      } else {
        await addTaskCompletion(null, taskId, selectedDate)
      }
    } else {
      // Обычная задача
      const task = todayTasks.find(t => t.id === taskId)
      if (task) {
        const newCompleted = !task.completed
        if (task.completed) {
          await removeTaskCompletion(taskId, null, selectedDate)
        } else {
          await addTaskCompletion(taskId, null, selectedDate)
        }
        await updateTask(taskId, { completed: newCompleted })

        // Если это копия задачи из ЗАДАЧИ — синхронизируем статус оригинала
        if (task.source_task_id) {
          await syncTaskCompletion(taskId, newCompleted)
        }
      }
    }
  }, [todayTasks, todayRecurringTasks, selectedDate, updateTask, addTaskCompletion, removeTaskCompletion, syncTaskCompletion])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await deleteTask(taskId)
  }, [deleteTask])

  // Функции для перемещения задач
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

  // Edit handlers
  const handleUpdateTask = useCallback(async (taskId: string, title: string) => {
    await updateTask(taskId, { title })
  }, [updateTask])

  const handleUpdateSubtaskTitle = useCallback(async (subtaskId: string, title: string) => {
    await updateSubtask(subtaskId, { title })
  }, [updateSubtask])

  // Reschedule handlers
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

      <ProgressBar
        completed={completedTasks}
        total={totalTasks}
        progress={progress}
      />

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">
          Задачи на {new Date(selectedDate).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long'
          })}
        </h2>

        {/* Регулярные задачи (закрепленные сверху) */}
        {todayRecurringTasks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800">🔄 Регулярные задачи</h3>
              <span className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800">📝 Задачи на день</h3>
              {todayTasks.length > 0 && (
                <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                  {todayTasks.length}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-base font-medium">Задач на день пока нет</p>
                <p className="text-sm mt-1">Добавьте задачи, которые нужно выполнить сегодня</p>
              </div>
            ) : (
              todayTasks.map((task, index) => (
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
              ))
            )}
          </div>
        </div>

        {/* Общая информация */}
        {totalTasks === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">✨</div>
            <p className="text-lg font-medium mb-2">День свободен от задач</p>
            <p className="text-sm">Добавьте задачи или наслаждайтесь отдыхом!</p>
          </div>
        )}
      </div>

      <AddTaskForm category="today" placeholder="Добавить задачу на сегодня..." />

      {/* Reschedule Date Picker Modal */}
      <DatePickerModal
        isOpen={rescheduleTaskId !== null}
        onClose={() => setRescheduleTaskId(null)}
        onSelect={handleRescheduleDateSelect}
        title="Перенести на другой день"
      />
    </div>
  )
}
