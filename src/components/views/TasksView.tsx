import React, { useCallback } from 'react'
import { useAppStore } from '@/store'
import { useDatabase } from '@/hooks/useDatabase'
import { TaskItem } from '@/components/TaskItem'
import { AddTaskForm } from '@/components/AddTaskForm'

export const TasksView: React.FC = () => {
  const { tasks } = useAppStore()
  const { updateTask, deleteTask } = useDatabase()
  
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

    // Меняем order_index местами
    await Promise.all([
      updateTask(task.id, { order_index: prevTask.order_index }),
      updateTask(prevTask.id, { order_index: task.order_index })
    ])

    console.log(`Moved task ${taskId} up`)
  }, [tasksList, updateTask])

  const handleMoveTaskDown = useCallback(async (taskId: string) => {
    const taskIndex = tasksList.findIndex(t => t.id === taskId)
    if (taskIndex >= tasksList.length - 1) return

    const task = tasksList[taskIndex]
    const nextTask = tasksList[taskIndex + 1]

    // Меняем order_index местами
    await Promise.all([
      updateTask(task.id, { order_index: nextTask.order_index }),
      updateTask(nextTask.id, { order_index: task.order_index })
    ])

    console.log(`Moved task ${taskId} down`)
  }, [tasksList, updateTask])

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
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onMoveUp={handleMoveTaskUp}
                onMoveDown={handleMoveTaskDown}
                showMoveButtons={tasksList.length > 1}
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
    </div>
  )
}
