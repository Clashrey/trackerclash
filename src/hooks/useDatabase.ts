import { useCallback } from 'react'
import { useAppStore } from '../store'
import { databaseService } from '../lib/database'

// FIX #8: Cleanup запускается не чаще одного раза за браузерную сессию
const CLEANUP_SESSION_KEY = 'tracker_cleanup_done'

export function useDatabase() {
  const {
    setTasks,
    setRecurringTasks,
    setTaskCompletions,
    setSubtasks,
  } = useAppStore()

  const getState = () => useAppStore.getState()

  // FIX #5 + #8: Пробрасываем ошибки + guard для cleanup
  const loadAllData = useCallback(async (): Promise<void> => {
    try {
      // FIX #8: Cleanup — только один раз за сессию
      if (!sessionStorage.getItem(CLEANUP_SESSION_KEY)) {
        await databaseService.cleanupOldTodayTasks()
        sessionStorage.setItem(CLEANUP_SESSION_KEY, '1')
      }

      const [tasksData, recurringTasksData, completionsData, subtasksData] = await Promise.all([
        databaseService.getTasks(),
        databaseService.getRecurringTasks(),
        databaseService.getTaskCompletions(),
        databaseService.getSubtasks(),
      ])

      setTasks(tasksData)
      setRecurringTasks(recurringTasksData)
      setTaskCompletions(completionsData)
      setSubtasks(subtasksData)
    } catch (error) {
      console.error('Error loading data:', error)
      throw error // FIX #5: пробрасываем в caller
    }
  }, [setTasks, setRecurringTasks, setTaskCompletions, setSubtasks])

  // Tasks
  const addTask = useCallback(async (task: Parameters<typeof databaseService.addTask>[0]) => {
    try {
      const newTask = await databaseService.addTask(task)
      if (newTask) {
        const currentTasks = getState().tasks
        setTasks([...currentTasks, newTask])
      }
      return newTask
    } catch (error) {
      console.error('❌ addTask failed:', error)
      throw error
    }
  }, [setTasks])

  const updateTask = useCallback(async (id: string, updates: Parameters<typeof databaseService.updateTask>[1]) => {
    try {
      const updatedTask = await databaseService.updateTask(id, updates)
      if (updatedTask) {
        const currentTasks = getState().tasks
        setTasks(currentTasks.map(t => t.id === id ? { ...updatedTask } : { ...t }))
      }
      return updatedTask
    } catch (error) {
      console.error('❌ updateTask failed:', error)
      throw error
    }
  }, [setTasks])

  const deleteTask = useCallback(async (id: string) => {
    try {
      const success = await databaseService.deleteTask(id)
      if (success) {
        const currentTasks = getState().tasks
        setTasks(currentTasks.filter(t => t.id !== id))
      }
      return success
    } catch (error) {
      console.error('❌ deleteTask failed:', error)
      throw error
    }
  }, [setTasks])

  // Recurring Tasks
  const addRecurringTask = useCallback(async (task: Parameters<typeof databaseService.addRecurringTask>[0]) => {
    try {
      const newTask = await databaseService.addRecurringTask(task)
      if (newTask) {
        const currentRecurringTasks = getState().recurringTasks
        setRecurringTasks([...currentRecurringTasks, newTask])
      }
      return newTask
    } catch (error) {
      console.error('❌ addRecurringTask failed:', error)
      throw error
    }
  }, [setRecurringTasks])

  const updateRecurringTask = useCallback(async (id: string, updates: Parameters<typeof databaseService.updateRecurringTask>[1]) => {
    try {
      const updatedTask = await databaseService.updateRecurringTask(id, updates)
      if (updatedTask) {
        const currentRecurringTasks = getState().recurringTasks
        setRecurringTasks(currentRecurringTasks.map(t => t.id === id ? { ...updatedTask } : { ...t }))
      }
      return updatedTask
    } catch (error) {
      console.error('❌ updateRecurringTask failed:', error)
      throw error
    }
  }, [setRecurringTasks])

  const deleteRecurringTask = useCallback(async (id: string) => {
    try {
      const success = await databaseService.deleteRecurringTask(id)
      if (success) {
        const currentRecurringTasks = getState().recurringTasks
        const currentTaskCompletions = getState().taskCompletions
        setRecurringTasks(currentRecurringTasks.filter(t => t.id !== id))
        setTaskCompletions(currentTaskCompletions.filter(tc => tc.recurring_task_id !== id))
      }
      return success
    } catch (error) {
      console.error('❌ deleteRecurringTask failed:', error)
      throw error
    }
  }, [setRecurringTasks, setTaskCompletions])

  // Task Completions
  const addTaskCompletion = useCallback(async (
    taskId: string | null,
    recurringTaskId: string | null,
    date: string
  ) => {
    try {
      const newCompletion = await databaseService.addTaskCompletion(taskId, recurringTaskId, date)
      if (newCompletion) {
        const currentTaskCompletions = getState().taskCompletions
        setTaskCompletions([...currentTaskCompletions, { ...newCompletion }])
      }
      return newCompletion
    } catch (error) {
      console.error('❌ addTaskCompletion failed:', error)
      throw error
    }
  }, [setTaskCompletions])

  const removeTaskCompletion = useCallback(async (
    taskId: string | null,
    recurringTaskId: string | null,
    date: string
  ) => {
    try {
      const success = await databaseService.removeTaskCompletion(taskId, recurringTaskId, date)
      if (success) {
        const currentTaskCompletions = getState().taskCompletions
        setTaskCompletions(currentTaskCompletions.filter(tc => {
          if (taskId && tc.task_id === taskId && tc.date === date) return false
          if (recurringTaskId && tc.recurring_task_id === recurringTaskId && tc.date === date) return false
          return true
        }))
      }
      return success
    } catch (error) {
      console.error('❌ removeTaskCompletion failed:', error)
      throw error
    }
  }, [setTaskCompletions])

  const isTaskCompleted = async (
    taskId: string | null,
    recurringTaskId: string | null,
    date: string
  ) => {
    return await databaseService.isTaskCompleted(taskId, recurringTaskId, date)
  }

  // Subtasks
  const addSubtask = useCallback(async (subtask: Parameters<typeof databaseService.addSubtask>[0]) => {
    try {
      const newSubtask = await databaseService.addSubtask(subtask)
      if (newSubtask) {
        const currentSubtasks = getState().subtasks
        setSubtasks([...currentSubtasks, newSubtask])
      }
      return newSubtask
    } catch (error) {
      console.error('❌ addSubtask failed:', error)
      throw error
    }
  }, [setSubtasks])

  const updateSubtask = useCallback(async (id: string, updates: Parameters<typeof databaseService.updateSubtask>[1]) => {
    try {
      const updatedSubtask = await databaseService.updateSubtask(id, updates)
      if (updatedSubtask) {
        const currentSubtasks = getState().subtasks
        setSubtasks(currentSubtasks.map(s => s.id === id ? updatedSubtask : s))
      }
      return updatedSubtask
    } catch (error) {
      console.error('❌ updateSubtask failed:', error)
      throw error
    }
  }, [setSubtasks])

  const deleteSubtask = useCallback(async (id: string) => {
    try {
      const success = await databaseService.deleteSubtask(id)
      if (success) {
        const currentSubtasks = getState().subtasks
        setSubtasks(currentSubtasks.filter(s => s.id !== id))
      }
      return success
    } catch (error) {
      console.error('❌ deleteSubtask failed:', error)
      throw error
    }
  }, [setSubtasks])

  const copyTaskToToday = useCallback(async (taskId: string, date: string) => {
    try {
      const newTask = await databaseService.copyTaskToToday(taskId, date)
      if (newTask) {
        const currentTasks = getState().tasks
        setTasks([...currentTasks, newTask])
      }
      return newTask
    } catch (error) {
      console.error('❌ copyTaskToToday failed:', error)
      throw error
    }
  }, [setTasks])

  const syncTaskCompletion = useCallback(async (taskId: string, completed: boolean) => {
    try {
      const success = await databaseService.syncTaskCompletion(taskId, completed)
      if (success) {
        const currentTasks = getState().tasks
        const task = currentTasks.find(t => t.id === taskId)
        if (task?.source_task_id) {
          setTasks(currentTasks.map(t =>
            t.id === task.source_task_id ? { ...t, completed } : t
          ))
        }
      }
      return success
    } catch (error) {
      console.error('❌ syncTaskCompletion failed:', error)
      return false
    }
  }, [setTasks])

  const rescheduleTask = useCallback(async (taskId: string, newDate: string) => {
    try {
      const rescheduledTask = await databaseService.rescheduleTask(taskId, newDate)
      if (rescheduledTask) {
        const currentTasks = getState().tasks
        setTasks(currentTasks.map(t => t.id === taskId ? rescheduledTask : t))
      }
      return rescheduledTask
    } catch (error) {
      console.error('❌ rescheduleTask failed:', error)
      throw error
    }
  }, [setTasks])

  return {
    loadAllData,
    addTask,
    updateTask,
    deleteTask,
    addRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
    addTaskCompletion,
    removeTaskCompletion,
    isTaskCompleted,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    copyTaskToToday,
    syncTaskCompletion,
    rescheduleTask,
  }
}
