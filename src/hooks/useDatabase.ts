import { useEffect } from 'react'
import { useAppStore } from '../store'
import { databaseService } from '../lib/database'

export function useDatabase() {
  const { 
    setTasks, 
    setRecurringTasks, 
    setTaskCompletions,
    tasks, 
    recurringTasks,
    taskCompletions
  } = useAppStore()

  // Загрузка данных при инициализации
  useEffect(() => {
    loadAllData()
  }, [])

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
  const addTask = async (task: Parameters<typeof databaseService.addTask>[0]) => {
    const newTask = await databaseService.addTask(task)
    if (newTask) {
      setTasks([...tasks, newTask])
    }
    return newTask
  }

  const updateTask = async (id: string, updates: Parameters<typeof databaseService.updateTask>[1]) => {
    const updatedTask = await databaseService.updateTask(id, updates)
    if (updatedTask) {
      setTasks(tasks.map(t => t.id === id ? updatedTask : t))
    }
    return updatedTask
  }

  const deleteTask = async (id: string) => {
    const success = await databaseService.deleteTask(id)
    if (success) {
      setTasks(tasks.filter(t => t.id !== id))
    }
    return success
  }

  // Recurring Tasks
  const addRecurringTask = async (task: Parameters<typeof databaseService.addRecurringTask>[0]) => {
    const newTask = await databaseService.addRecurringTask(task)
    if (newTask) {
      setRecurringTasks([...recurringTasks, newTask])
    }
    return newTask
  }

  const updateRecurringTask = async (id: string, updates: Parameters<typeof databaseService.updateRecurringTask>[1]) => {
    const updatedTask = await databaseService.updateRecurringTask(id, updates)
    if (updatedTask) {
      setRecurringTasks(recurringTasks.map(t => t.id === id ? updatedTask : t))
    }
    return updatedTask
  }

  const deleteRecurringTask = async (id: string) => {
    const success = await databaseService.deleteRecurringTask(id)
    if (success) {
      setRecurringTasks(recurringTasks.filter(t => t.id !== id))
      // Также удаляем все связанные выполнения
      setTaskCompletions(taskCompletions.filter(tc => tc.recurring_task_id !== id))
    }
    return success
  }

  // ✅ ИСПРАВЛЕННЫЕ Task Completions
  const addTaskCompletion = async (
    taskId: string | null, 
    recurringTaskId: string | null, 
    date: string
  ) => {
    const newCompletion = await databaseService.addTaskCompletion(taskId, recurringTaskId, date)
    if (newCompletion) {
      setTaskCompletions([...taskCompletions, newCompletion])
    }
    return newCompletion
  }

  const removeTaskCompletion = async (
    taskId: string | null, 
    recurringTaskId: string | null, 
    date: string
  ) => {
    const success = await databaseService.removeTaskCompletion(taskId, recurringTaskId, date)
    if (success) {
      setTaskCompletions(taskCompletions.filter(tc => {
        // Удаляем completion для конкретной задачи и даты
        if (taskId && tc.task_id === taskId && tc.date === date) {
          return false
        }
        if (recurringTaskId && tc.recurring_task_id === recurringTaskId && tc.date === date) {
          return false
        }
        return true
      }))
    }
    return success
  }

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
