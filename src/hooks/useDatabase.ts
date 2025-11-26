import { useEffect, useCallback } from 'react'
import { useAppStore } from '../store'
import { databaseService } from '../lib/database'

export function useDatabase() {
  const {
    setTasks,
    setRecurringTasks,
    setTaskCompletions,
    userId
  } = useAppStore()

  // ✅ Получаем актуальные данные напрямую из store, чтобы избежать stale closures
  const getState = () => useAppStore.getState()

  // Загрузка данных когда userId появляется
  useEffect(() => {
    if (userId) {
      console.log('🔍 useDatabase - userId available, loading data:', userId)
      loadAllData()
    }
  }, [userId])

  const loadAllData = async () => {
    try {
      const [tasksData, recurringTasksData, completionsData] = await Promise.all([
        databaseService.getTasks(),
        databaseService.getRecurringTasks(),
        databaseService.getTaskCompletions()
      ])
      
      setTasks(tasksData)
      setRecurringTasks(recurringTasksData)
      setTaskCompletions(completionsData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  // Tasks
  const addTask = useCallback(async (task: Parameters<typeof databaseService.addTask>[0]) => {
    const newTask = await databaseService.addTask(task)
    if (newTask) {
      // ✅ Используем getState() для получения актуального состояния
      const currentTasks = getState().tasks
      setTasks([...currentTasks, newTask])
    }
    return newTask
  }, [setTasks])

  const updateTask = useCallback(async (id: string, updates: Parameters<typeof databaseService.updateTask>[1]) => {
    const updatedTask = await databaseService.updateTask(id, updates)

    if (updatedTask) {
      // ✅ Используем getState() для получения актуального состояния
      const currentTasks = getState().tasks
      const updatedTasks = currentTasks.map(t =>
        t.id === id ? { ...updatedTask } : { ...t }
      )
      setTasks(updatedTasks)
    }
    return updatedTask
  }, [setTasks])

  const deleteTask = useCallback(async (id: string) => {
    const success = await databaseService.deleteTask(id)
    if (success) {
      // ✅ Используем getState() для получения актуального состояния
      const currentTasks = getState().tasks
      setTasks(currentTasks.filter(t => t.id !== id))
    }
    return success
  }, [setTasks])

  // Recurring Tasks
  const addRecurringTask = useCallback(async (task: Parameters<typeof databaseService.addRecurringTask>[0]) => {
    const newTask = await databaseService.addRecurringTask(task)
    if (newTask) {
      const currentRecurringTasks = getState().recurringTasks
      setRecurringTasks([...currentRecurringTasks, newTask])
    }
    return newTask
  }, [setRecurringTasks])

  const updateRecurringTask = useCallback(async (id: string, updates: Parameters<typeof databaseService.updateRecurringTask>[1]) => {
    const updatedTask = await databaseService.updateRecurringTask(id, updates)

    if (updatedTask) {
      const currentRecurringTasks = getState().recurringTasks
      const updatedTasks = currentRecurringTasks.map(t =>
        t.id === id ? { ...updatedTask } : { ...t }
      )
      setRecurringTasks(updatedTasks)
    }
    return updatedTask
  }, [setRecurringTasks])

  const deleteRecurringTask = useCallback(async (id: string) => {
    const success = await databaseService.deleteRecurringTask(id)
    if (success) {
      const currentRecurringTasks = getState().recurringTasks
      const currentTaskCompletions = getState().taskCompletions
      setRecurringTasks(currentRecurringTasks.filter(t => t.id !== id))
      // Также удаляем все связанные выполнения
      setTaskCompletions(currentTaskCompletions.filter(tc => tc.recurring_task_id !== id))
    }
    return success
  }, [setRecurringTasks, setTaskCompletions])

  // ✅ ИСПРАВЛЕННЫЕ Task Completions
  const addTaskCompletion = useCallback(async (
    taskId: string | null,
    recurringTaskId: string | null,
    date: string
  ) => {
    const newCompletion = await databaseService.addTaskCompletion(taskId, recurringTaskId, date)

    if (newCompletion) {
      const currentTaskCompletions = getState().taskCompletions
      setTaskCompletions([...currentTaskCompletions, { ...newCompletion }])
    }
    return newCompletion
  }, [setTaskCompletions])

  const removeTaskCompletion = useCallback(async (
    taskId: string | null,
    recurringTaskId: string | null,
    date: string
  ) => {
    const success = await databaseService.removeTaskCompletion(taskId, recurringTaskId, date)

    if (success) {
      const currentTaskCompletions = getState().taskCompletions
      const filteredCompletions = currentTaskCompletions.filter(tc => {
        // Удаляем completion для конкретной задачи и даты
        if (taskId && tc.task_id === taskId && tc.date === date) {
          return false
        }
        if (recurringTaskId && tc.recurring_task_id === recurringTaskId && tc.date === date) {
          return false
        }
        return true
      })
      setTaskCompletions(filteredCompletions)
    }
    return success
  }, [setTaskCompletions])

  // ✅ НОВАЯ функция для проверки выполнения
  const isTaskCompleted = async (
    taskId: string | null, 
    recurringTaskId: string | null, 
    date: string
  ) => {
    return await databaseService.isTaskCompleted(taskId, recurringTaskId, date)
  }

  return {
    // Data loading
    loadAllData,
    
    // Tasks
    addTask,
    updateTask,
    deleteTask,
    
    // Recurring Tasks
    addRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
    
    // Task Completions
    addTaskCompletion,
    removeTaskCompletion,
    isTaskCompleted
  }
}
