import { supabase } from './supabase'
import { useAppStore } from '../store'

export interface Task {
  id: string
  title: string
  completed: boolean
  category: 'today' | 'tasks' | 'ideas'
  date: string
  order_index: number
  source_task_id?: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface RecurringTask {
  id: string
  title: string
  frequency: 'daily' | 'weekly' | 'custom'
  days_of_week?: number[]
  order_index?: number
  user_id: string
  created_at: string
  updated_at: string
}

export interface TaskCompletion {
  id: string
  task_id?: string | null
  recurring_task_id?: string | null
  date: string
  user_id: string
  created_at: string
}

export interface Subtask {
  id: string
  task_id: string
  user_id: string
  title: string
  completed: boolean
  order_index: number
  created_at: string
  updated_at: string
}

class DatabaseService {
  private getCurrentUserId(): string | null {
    const userId = useAppStore.getState().userId
    if (!userId) {
      console.error('❌ No userId in store')
      return null
    }
    return userId
  }

  // Очистка старых задач из раздела "Сегодня" (старше 30 дней)
  async cleanupOldTodayTasks(): Promise<number> {
    const userId = this.getCurrentUserId()
    if (!userId) return 0

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoffDate = thirtyDaysAgo.toISOString()

    try {
      const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .eq('category', 'today')
        .lt('created_at', cutoffDate)
        .select()

      if (error) {
        console.error('❌ Error cleaning up old tasks:', error)
        return 0
      }

      const deletedCount = data?.length || 0
      if (deletedCount > 0) {
        console.log(`🗑️ Deleted ${deletedCount} old "today" tasks`)
      }
      return deletedCount
    } catch (error) {
      console.error('❌ Exception in cleanupOldTodayTasks:', error)
      return 0
    }
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    const userId = this.getCurrentUserId()
    if (!userId) return []

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('order_index')

      if (error) {
        throw new Error(`getTasks failed: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('❌ Exception in getTasks:', error)
      throw error
    }
  }

  async addTask(task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...task, user_id: userId }])
        .select()
        .single()

      if (error) {
        throw new Error(`addTask failed: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Exception in addTask:', error)
      throw error
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`updateTask failed: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Error in updateTask:', error)
      throw error
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    const userId = this.getCurrentUserId()
    if (!userId) return false

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`deleteTask failed: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('❌ Error in deleteTask:', error)
      throw error
    }
  }

  // Recurring Tasks
  async getRecurringTasks(): Promise<RecurringTask[]> {
    const userId = this.getCurrentUserId()
    if (!userId) return []

    try {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('order_index')

      if (error) {
        throw new Error(`getRecurringTasks failed: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('❌ Error in getRecurringTasks:', error)
      throw error
    }
  }

  async addRecurringTask(task: Omit<RecurringTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<RecurringTask | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .insert([{ ...task, user_id: userId }])
        .select()
        .single()

      if (error) {
        throw new Error(`addRecurringTask failed: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Error in addRecurringTask:', error)
      throw error
    }
  }

  async updateRecurringTask(id: string, updates: Partial<RecurringTask>): Promise<RecurringTask | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`updateRecurringTask failed: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Error in updateRecurringTask:', error)
      throw error
    }
  }

  async deleteRecurringTask(id: string): Promise<boolean> {
    const userId = this.getCurrentUserId()
    if (!userId) return false

    try {
      const { error } = await supabase
        .from('recurring_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`deleteRecurringTask failed: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('❌ Error in deleteRecurringTask:', error)
      throw error
    }
  }

  // Task Completions
  async getTaskCompletions(): Promise<TaskCompletion[]> {
    const userId = this.getCurrentUserId()
    if (!userId) return []

    try {
      const { data, error } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (error) {
        throw new Error(`getTaskCompletions failed: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('❌ Error in getTaskCompletions:', error)
      throw error
    }
  }

  async addTaskCompletion(
    taskId: string | null,
    recurringTaskId: string | null,
    date: string
  ): Promise<TaskCompletion | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    if (!taskId && !recurringTaskId) {
      throw new Error('Either taskId or recurringTaskId must be provided')
    }

    if (taskId && recurringTaskId) {
      throw new Error('Cannot provide both taskId and recurringTaskId')
    }

    try {
      const { data, error } = await supabase
        .from('task_completions')
        .insert([{
          task_id: taskId,
          recurring_task_id: recurringTaskId,
          date,
          user_id: userId,
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`addTaskCompletion failed: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Exception in addTaskCompletion:', error)
      throw error
    }
  }

  async removeTaskCompletion(
    taskId: string | null,
    recurringTaskId: string | null,
    date: string
  ): Promise<boolean> {
    const userId = this.getCurrentUserId()
    if (!userId) return false

    try {
      let query = supabase
        .from('task_completions')
        .delete()
        .eq('date', date)
        .eq('user_id', userId)

      if (taskId) {
        query = query.eq('task_id', taskId)
      } else if (recurringTaskId) {
        query = query.eq('recurring_task_id', recurringTaskId)
      } else {
        throw new Error('Either taskId or recurringTaskId must be provided')
      }

      const { error } = await query

      if (error) {
        throw new Error(`removeTaskCompletion failed: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('❌ Error in removeTaskCompletion:', error)
      throw error
    }
  }

  // FIX #6: maybeSingle() вместо single() — не маскирует настоящие ошибки
  async isTaskCompleted(
    taskId: string | null,
    recurringTaskId: string | null,
    date: string
  ): Promise<boolean> {
    const userId = this.getCurrentUserId()
    if (!userId) return false

    try {
      let query = supabase
        .from('task_completions')
        .select('id')
        .eq('date', date)
        .eq('user_id', userId)

      if (taskId) {
        query = query.eq('task_id', taskId)
      } else if (recurringTaskId) {
        query = query.eq('recurring_task_id', recurringTaskId)
      } else {
        return false
      }

      // FIX #6: maybeSingle() возвращает null при 0 строках вместо PGRST116
      const { data, error } = await (query as any).maybeSingle()

      if (error) {
        // Любая ошибка здесь — настоящий сбой, не маскируем
        throw new Error(`isTaskCompleted failed: ${error.message}`)
      }

      return data !== null
    } catch (error) {
      console.error('❌ Error in isTaskCompleted:', error)
      throw error
    }
  }

  // Subtasks
  async getSubtasks(taskId?: string): Promise<Subtask[]> {
    const userId = this.getCurrentUserId()
    if (!userId) return []

    try {
      let query = supabase
        .from('subtasks')
        .select('*')
        .eq('user_id', userId)
        .order('order_index')

      if (taskId) {
        query = query.eq('task_id', taskId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`getSubtasks failed: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('❌ Error in getSubtasks:', error)
      throw error
    }
  }

  async addSubtask(subtask: Omit<Subtask, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Subtask | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('subtasks')
        .insert([{ ...subtask, user_id: userId }])
        .select()
        .single()

      if (error) {
        throw new Error(`addSubtask failed: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Error in addSubtask:', error)
      throw error
    }
  }

  async updateSubtask(id: string, updates: Partial<Subtask>): Promise<Subtask | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`updateSubtask failed: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Error in updateSubtask:', error)
      throw error
    }
  }

  async deleteSubtask(id: string): Promise<boolean> {
    const userId = this.getCurrentUserId()
    if (!userId) return false

    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`deleteSubtask failed: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('❌ Error in deleteSubtask:', error)
      throw error
    }
  }

  async copyTaskToToday(taskId: string, date: string): Promise<Task | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data: originalTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single()

      if (fetchError || !originalTask) {
        throw new Error(`copyTaskToToday fetch failed: ${fetchError?.message}`)
      }

      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('order_index')
        .eq('user_id', userId)
        .eq('category', 'today')
        .eq('date', date)
        .order('order_index', { ascending: false })
        .limit(1)

      const maxOrderIndex = existingTasks?.[0]?.order_index ?? -1

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: originalTask.title,
          category: 'today',
          date,
          completed: false,
          order_index: maxOrderIndex + 1,
          source_task_id: taskId,
          user_id: userId,
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`copyTaskToToday insert failed: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Error in copyTaskToToday:', error)
      throw error
    }
  }

  async rescheduleTask(taskId: string, newDate: string): Promise<Task | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ date: newDate })
        .eq('id', taskId)
        .eq('user_id', userId)
        .eq('category', 'today')
        .select()
        .single()

      if (error) {
        throw new Error(`rescheduleTask failed: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Error in rescheduleTask:', error)
      throw error
    }
  }

  async syncTaskCompletion(taskId: string, completed: boolean): Promise<boolean> {
    const userId = this.getCurrentUserId()
    if (!userId) return false

    try {
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('source_task_id')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single()

      if (fetchError || !task?.source_task_id) {
        return false
      }

      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', task.source_task_id)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`syncTaskCompletion failed: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('❌ Error in syncTaskCompletion:', error)
      return false
    }
  }
}

export const databaseService = new DatabaseService()
