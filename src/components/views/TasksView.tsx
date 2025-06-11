import React, { useState, useCallback } from 'react'
import { useAppStore } from '@/store'
import { useDatabase } from '@/hooks/useDatabase'
import { TaskItem } from '@/components/TaskItem'
import { AddTaskForm } from '@/components/AddTaskForm'

export const TasksView: React.FC = () => {
  const { tasks } = useAppStore()
  const { updateTask, deleteTask } = useDatabase()
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
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

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null)
    setDragOverIndex(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (!draggedTaskId) return

    const draggedIndex = tasksList.findIndex(t => t.id === draggedTaskId)
    if (draggedIndex === dropIndex) return

    // Пересчитываем order_index для всех задач
    const reorderedTasks = [...tasksList]
    const [movedTask] = reorderedTasks.splice(draggedIndex, 1)
    reorderedTasks.splice(dropIndex, 0, movedTask)

    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      order_index: index
    }))

    console.log('Reordering tasks:', updates)

    // Обновляем в базе данных
    try {
      for (const update of updates) {
        await updateTask(update.id, { order_index: update.order_index })
      }
      console.log('Successfully reordered tasks')
    } catch (error) {
      console.error('Failed to reorder tasks:', error)
    }

    setDraggedTaskId(null)
    setDragOverIndex(null)
  }, [draggedTaskId, tasksList, updateTask])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📝 Задачи</h2>
        <span className="text-sm text-muted-foreground">
          {tasksList.length} {tasksList.length === 1 ? 'задача' : 'задач'}
        </span>
      </div>

      <div className="space-y-3">
        {tasksList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg mb-2">Задач пока нет</p>
            <p className="text-sm">Добавьте задачи, которые нужно выполнить</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasksList.map((task, index) => (
              <div key={task.id}>
                {/* Drop indicator */}
                {dragOverIndex === index && draggedTaskId !== task.id && (
                  <div className="h-0.5 bg-blue-500 rounded-full mx-4" />
                )}
                
                <div
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <TaskItem
                    task={task}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedTaskId === task.id}
                  />
                </div>
              </div>
            ))}
            
            {/* Final drop zone */}
            {draggedTaskId && (
              <div
                className="h-8 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center text-blue-500 text-sm"
                onDragOver={(e) => handleDragOver(e, tasksList.length)}
                onDrop={(e) => handleDrop(e, tasksList.length)}
              >
                Перетащите сюда
              </div>
            )}
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
