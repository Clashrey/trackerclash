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
    console.log('🔍 updateTask called with:', { id, updates })
    const updatedTask = await databaseService.updateTask(id, updates)
    console.log('🔍 Database returned updated task:', updatedTask)
    
    if (updatedTask) {
      // ✅ Создаем полностью новый массив для принудительного rerending
      const updatedTasks = tasks.map(t => 
        t.id === id ? { ...updatedTask } : { ...t }
      )
      console.log('🔍 Setting new tasks array, length:', updatedTasks.length)
      setTasks(updatedTasks)
      
      // ✅ Принудительно перезагружаем данные для синхронизации
      await loadAllData()
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
    console.log('🔍 updateRecurringTask called with:', { id, updates })
    const updatedTask = await databaseService.updateRecurringTask(id, updates)
    console.log('🔍 Database returned updated recurring task:', updatedTask)
    
    if (updatedTask) {
      // ✅ Создаем полностью новый массив для принудительного rerending
      const updatedTasks = recurringTasks.map(t => 
        t.id === id ? { ...updatedTask } : { ...t }
      )
      console.log('🔍 Setting new recurring tasks array, length:', updatedTasks.length)
      setRecurringTasks(updatedTasks)
      
      // ✅ Принудительно перезагружаем данные для синхронизации
      await loadAllData()
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
    console.log('🔍 addTaskCompletion called with:', { taskId, recurringTaskId, date })
    const newCompletion = await databaseService.addTaskCompletion(taskId, recurringTaskId, date)
    console.log('🔍 Database returned:', newCompletion)
    
    if (newCompletion) {
      // ✅ Создаем полностью новый массив
      const updatedCompletions = [...taskCompletions, { ...newCompletion }]
      console.log('🔍 Setting new completions array, length:', updatedCompletions.length)
      setTaskCompletions(updatedCompletions)
      
      // ✅ Принудительно перезагружаем данные для синхронизации
      await loadAllData()
    }
    return newCompletion
  }

  const removeTaskCompletion = async (
    taskId: string | null, 
    recurringTaskId: string | null, 
    date: string
  ) => {
    console.log('🔍 removeTaskCompletion called with:', { taskId, recurringTaskId, date })
    const success = await databaseService.removeTaskCompletion(taskId, recurringTaskId, date)
    console.log('🔍 Database delete success:', success)
    
    if (success) {
      const filteredCompletions = taskCompletions.filter(tc => {
        // Удаляем completion для конкретной задачи и даты
        if (taskId && tc.task_id === taskId && tc.date === date) {
          console.log('🔍 Removing completion for task:', tc)
          return false
        }
        if (recurringTaskId && tc.recurring_task_id === recurringTaskId && tc.date === date) {
          console.log('🔍 Removing completion for recurring task:', tc)
          return false
        }
        return true
      })
      console.log('🔍 Setting filtered completions array, length:', filteredCompletions.length)
      setTaskCompletions(filteredCompletions)
      
      // ✅ Принудительно перезагружаем данные для синхронизации
      await loadAllData()
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
