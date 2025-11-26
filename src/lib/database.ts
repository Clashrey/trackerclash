import { supabase } from './supabase'
import { useAppStore } from '../store'

export interface Task {
  id: string
  title: string
  completed: boolean
  category: 'today' | 'tasks' | 'ideas'
  date: string
  order_index: number
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

class DatabaseService {
  private getCurrentUserId(): string | null {
    // ✅ Берём userId напрямую из Zustand store, без localStorage
    const userId = useAppStore.getState().userId
    if (!userId) {
      console.error('❌ No userId in store')
      return null
    }
    return userId
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
        console.error('Error fetching tasks:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getTasks:', error)
      return []
    }
  }

  async addTask(task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...task,
          user_id: userId
        }])
        .select()
        .single()

      if (error) {
        console.error('Error adding task:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in addTask:', error)
      return null
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
        console.error('Error updating task:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateTask:', error)
      return null
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
        console.error('Error deleting task:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteTask:', error)
      return false
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
        console.error('Error fetching recurring tasks:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getRecurringTasks:', error)
      return []
    }
  }

  async addRecurringTask(task: Omit<RecurringTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<RecurringTask | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .insert([{
          ...task,
          user_id: userId
        }])
        .select()
        .single()

      if (error) {
        console.error('Error adding recurring task:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in addRecurringTask:', error)
      return null
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
        console.error('Error updating recurring task:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateRecurringTask:', error)
      return null
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
        console.error('Error deleting recurring task:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteRecurringTask:', error)
      return false
    }
  }

  // ✅ ИСПРАВЛЕННЫЕ функции Task Completions
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
        console.error('Error fetching task completions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getTaskCompletions:', error)
      return []
    }
  }

  // ✅ ИСПРАВЛЕННАЯ функция addTaskCompletion
  async addTaskCompletion(
    taskId: string | null, 
    recurringTaskId: string | null, 
    date: string
  ): Promise<TaskCompletion | null> {
    const userId = this.getCurrentUserId()
    console.log('🔍 addTaskCompletion - userId:', userId) // Отладка
    if (!userId) return null

    // Проверяем, что передан либо task_id, либо recurring_task_id
    if (!taskId && !recurringTaskId) {
      console.error('Either taskId or recurringTaskId must be provided')
      return null
    }

    if (taskId && recurringTaskId) {
      console.error('Cannot provide both taskId and recurringTaskId')
      return null
    }

    const insertData = {
      task_id: taskId,
      recurring_task_id: recurringTaskId,
      date: date,
      user_id: userId
    }
    console.log('🔍 Inserting task completion:', insertData) // Отладка

    try {
      const { data, error } = await supabase
        .from('task_completions')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('❌ Error adding task completion:', error)
        console.error('❌ Insert data was:', insertData)
        return null
      }

      console.log('✅ Task completion added:', data) // Отладка
      return data
    } catch (error) {
      console.error('❌ Exception in addTaskCompletion:', error)
      return null
    }
  }

  // ✅ ИСПРАВЛЕННАЯ функция removeTaskCompletion
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
        console.error('Either taskId or recurringTaskId must be provided')
        return false
      }

      const { error } = await query

      if (error) {
        console.error('Error removing task completion:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in removeTaskCompletion:', error)
      return false
    }
  }

  // ✅ НОВАЯ функция для проверки выполнения задачи
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

      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking task completion:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Error in isTaskCompleted:', error)
      return false
    }
  }
}

export const databaseService = new DatabaseService()
