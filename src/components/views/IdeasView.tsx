import React, { useState, useCallback } from 'react'
import { useAppStore } from '@/store'
import { useDatabase } from '@/hooks/useDatabase'
import { TaskItem } from '@/components/TaskItem'
import { AddTaskForm } from '@/components/AddTaskForm'

export const IdeasView: React.FC = () => {
  const { tasks } = useAppStore()
  const { updateTask, deleteTask, loadAllData } = useDatabase()
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
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

    const draggedIndex = ideasList.findIndex(t => t.id === draggedTaskId)
    if (draggedIndex === dropIndex) return

    // Пересчитываем order_index для всех идей
    const reorderedIdeas = [...ideasList]
    const [movedIdea] = reorderedIdeas.splice(draggedIndex, 1)
    reorderedIdeas.splice(dropIndex, 0, movedIdea)

    const updates = reorderedIdeas.map((idea, index) => ({
      id: idea.id,
      order_index: index
    }))

    console.log('Reordering ideas:', updates)

    // Обновляем в базе данных
    try {
      for (const update of updates) {
        await updateTask(update.id, { order_index: update.order_index })
      }
      console.log('Successfully reordered ideas')
      
      // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Перезагружаем данные из БД
      await loadAllData()
      console.log('Data reloaded after reordering')
      
    } catch (error) {
      console.error('Failed to reorder ideas:', error)
    }

    setDraggedTaskId(null)
    setDragOverIndex(null)
  }, [draggedTaskId, ideasList, updateTask, loadAllData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">💡 Идеи</h2>
        <span className="text-sm text-muted-foreground">
          {ideasList.length} {ideasList.length === 1 ? 'идея' : 'идей'}
        </span>
      </div>

      <div className="space-y-3">
        {ideasList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-4">💡</div>
            <p className="text-lg mb-2">Идей пока нет</p>
            <p className="text-sm">Записывайте сюда свои идеи и планы</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ideasList.map((task, index) => (
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
                onDragOver={(e) => handleDragOver(e, ideasList.length)}
                onDrop={(e) => handleDrop(e, ideasList.length)}
              >
                Перетащите сюда
              </div>
            )}
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
