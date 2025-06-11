import React, { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '../../store'
import { useDatabase } from '../../hooks/useDatabase'
import { AddTaskForm } from '../AddTaskForm'
import { TaskItem } from '../TaskItem'
import { ProgressBar } from '../ProgressBar'
import { DateNavigation } from '../DateNavigation'
import { Task, RecurringTask } from '../../lib/database'

export function TodayView() {
  const { tasks, recurringTasks, selectedDate, taskCompletions, setTasks } = useAppStore()
  const { updateTask, deleteTask, addTaskCompletion, removeTaskCompletion } = useDatabase()
  
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Получаем задачи на сегодня
  const todayTasks = tasks.filter(task => 
    task.category === 'today' && task.date === selectedDate
  )

  // Получаем регулярные задачи для сегодня
  const todayRecurringTasks = recurringTasks.filter(recurringTask => {
    if (recurringTask.frequency === 'daily') return true
    if (recurringTask.frequency === 'weekly' && recurringTask.days_of_week) {
      const dayOfWeek = new Date(selectedDate).getDay()
      return recurringTask.days_of_week.includes(dayOfWeek)
    }
    return false
  }).map(rt => ({
    ...rt,
    isRecurring: true as const,
    completed: taskCompletions.some(tc => 
      tc.recurring_task_id === rt.id && tc.date === selectedDate
    ),
    category: 'today' as const,
    date: selectedDate,
    order_index: -1 // Регулярные задачи всегда сверху
  }))

  // Объединяем все задачи и сортируем
  const allTasks = [
    ...todayRecurringTasks,
    ...todayTasks
  ].sort((a, b) => a.order_index - b.order_index)

  // Подсчет прогресса
  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter(task => task.completed).length
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const handleToggleTask = useCallback(async (taskId: string) => {
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return

    if ('isRecurring' in task && task.isRecurring) {
      // Регулярная задача
      if (task.completed) {
        await removeTaskCompletion(taskId, selectedDate)
      } else {
        await addTaskCompletion({
          task_id: taskId,
          recurring_task_id: taskId,
          date: selectedDate
        })
      }
    } else {
      // Обычная задача
      await updateTask(taskId, { completed: !task.completed })
    }
  }, [allTasks, selectedDate, updateTask, addTaskCompletion, removeTaskCompletion])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await deleteTask(taskId)
  }, [deleteTask])

  // Drag and Drop handlers - ТОЛЬКО для обычных задач
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    // Проверяем, что это НЕ регулярная задача
    const task = allTasks.find(t => t.id === taskId)
    if (task && 'isRecurring' in task && task.isRecurring) {
      e.preventDefault()
      return
    }
    
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
  }, [allTasks])

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

    const draggedTask = allTasks.find(t => t.id === draggedTaskId)
    if (!draggedTask || 'isRecurring' in draggedTask) return // Не перетаскиваем регулярные задачи

    const draggedIndex = allTasks.findIndex(t => t.id === draggedTaskId)
    if (draggedIndex === dropIndex) return

    // 🔥 ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ: Сначала обновляем UI
    const reorderedTasks = [...allTasks]
    const [movedTask] = reorderedTasks.splice(draggedIndex, 1)
    reorderedTasks.splice(dropIndex, 0, movedTask)

    const regularTasks = reorderedTasks.filter(task => !('isRecurring' in task))
    const reorderedRegularTasks = regularTasks.map((task, index) => ({
      ...task,
      order_index: index
    }))

    // Сразу обновляем UI (оптимистично)
    const updatedTasks = tasks.map(task => {
      const reorderedTask = reorderedRegularTasks.find(rt => rt.id === task.id)
      return reorderedTask ? { ...task, order_index: reorderedTask.order_index } : task
    })
    setTasks(updatedTasks)

    console.log('Reordering tasks optimistically:', reorderedRegularTasks.map(t => ({ id: t.id, order_index: t.order_index })))

    // Затем обновляем в БД (в фоне)
    try {
      const updatePromises = reorderedRegularTasks.map(task => 
        updateTask(task.id, { order_index: task.order_index })
      )
      
      await Promise.all(updatePromises)
      console.log('Successfully reordered tasks in database')
      
    } catch (error) {
      console.error('Failed to reorder tasks in database:', error)
      // В случае ошибки - перезагружаем данные из БД
      // await loadAllData()
    }

    setDraggedTaskId(null)
    setDragOverIndex(null)
  }, [draggedTaskId, allTasks, tasks, setTasks, updateTask])

  return (
    <div className="space-y-6">
      <DateNavigation />
      
      <ProgressBar 
        completed={completedTasks} 
        total={totalTasks} 
        progress={progress} 
      />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Задачи на {new Date(selectedDate).toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'long' 
          })}
        </h2>

        {/* Drop Zone */}
        <div className="space-y-2">
          {allTasks.map((task, index) => {
            const isRegularTask = 'isRecurring' in task && task.isRecurring
            
            return (
              <div key={task.id}>
                {/* Drop indicator - только для обычных задач */}
                {!isRegularTask && dragOverIndex === index && draggedTaskId !== task.id && (
                  <div className="h-0.5 bg-blue-500 rounded-full mx-4" />
                )}
                
                <div
                  onDragOver={!isRegularTask ? (e) => handleDragOver(e, index) : undefined}
                  onDrop={!isRegularTask ? (e) => handleDrop(e, index) : undefined}
                >
                  <TaskItem
                    task={task}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onDragStart={!isRegularTask ? handleDragStart : undefined}
                    onDragEnd={!isRegularTask ? handleDragEnd : undefined}
                    isDragging={draggedTaskId === task.id}
                  />
                </div>
              </div>
            )
          })}
          
          {/* Final drop zone - только если есть перетаскиваемая задача */}
          {draggedTaskId && (
            <div
              className="h-8 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center text-blue-500 text-sm"
              onDragOver={(e) => handleDragOver(e, allTasks.length)}
              onDrop={(e) => handleDrop(e, allTasks.length)}
            >
              Перетащите сюда
            </div>
          )}
        </div>

        {allTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Нет задач на сегодня
          </div>
        )}
      </div>

      <AddTaskForm category="today" />
    </div>
  )
}
