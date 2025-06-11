import React, { useCallback } from 'react'
import { useAppStore } from '@/store'
import { useDatabase } from '@/hooks/useDatabase'
import { TaskItem } from '@/components/TaskItem'
import { AddTaskForm } from '@/components/AddTaskForm'

export const IdeasView: React.FC = () => {
  const { tasks } = useAppStore()
  const { updateTask, deleteTask } = useDatabase()
  
  const ideasList = tasks
    .filter(task => task.category === 'ideas')
    .sort((a, b) => a.order_index - b.order_index)

  const handleToggleTask = useCallback(async (taskId: string) => {
    const task = ideasList.find(t => t.id === taskId)
    if (task) {
      await updateTask(taskId, { completed: !task.completed })
    }
  }, [ideasList, updateTask])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await deleteTask(taskId)
  }, [deleteTask])

  const handleMoveTaskUp = useCallback(async (taskId: string) => {
    const taskIndex = ideasList.findIndex(t => t.id === taskId)
    if (taskIndex <= 0) return

    const task = ideasList[taskIndex]
    const prevTask = ideasList[taskIndex - 1]

    // Меняем order_index местами
    await Promise.all([
      updateTask(task.id, { order_index: prevTask.order_index }),
      updateTask(prevTask.id, { order_index: task.order_index })
    ])

    console.log(`Moved idea ${taskId} up`)
  }, [ideasList, updateTask])

  const handleMoveTaskDown = useCallback(async (taskId: string) => {
    const taskIndex = ideasList.findIndex(t => t.id === taskId)
    if (taskIndex >= ideasList.length - 1) return

    const task = ideasList[taskIndex]
    const nextTask = ideasList[taskIndex + 1]

    // Меняем order_index местами
    await Promise.all([
      updateTask(task.id, { order_index: nextTask.order_index }),
      updateTask(nextTask.id, { order_index: task.order_index })
    ])

    console.log(`Moved idea ${taskId} down`)
  }, [ideasList, updateTask])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">💡 Идеи</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {ideasList.length} {ideasList.length === 1 ? 'идея' : 'идей'}
        </span>
      </div>

      <div className="space-y-4">
        {ideasList.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-4xl mb-4">💡</div>
            <p className="text-lg font-medium mb-2">Идей пока нет</p>
            <p className="text-sm">Записывайте сюда свои идеи и планы</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ideasList.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onMoveUp={handleMoveTaskUp}
                onMoveDown={handleMoveTaskDown}
                showMoveButtons={ideasList.length > 1}
                isFirst={index === 0}
                isLast={index === ideasList.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      <AddTaskForm 
        category="ideas" 
        placeholder="Добавить новую идею..."
      />
    </div>
  )
}
