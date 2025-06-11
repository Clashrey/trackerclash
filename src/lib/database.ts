import { supabase } from './supabase'

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
  user_id: string
  created_at: string
  updated_at: string
}

export interface TaskCompletion {
  id: string
  task_title: string
  task_type: 'regular' | 'recurring'
  date: string
  user_id: string
  created_at: string
}

class DatabaseService {
  private async getCurrentUserId(): Promise<string | null> {
    const apiKey = localStorage.getItem('tracker_api_key')
    if (!apiKey) return null

    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id')
        .eq('api_key', apiKey)
        .single()

      if (error || !data) {
        console.error('User not found:', error)
        return null
      }

      return data.user_id
    } catch (error) {
      console.error('Failed to get user ID:', error)
      return null
    }
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    const userId = await this.getCurrentUserId()
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
    const userId = await this.getCurrentUserId()
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
    const userId = await this.getCurrentUserId()
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
    const userId = await this.getCurrentUserId()
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
    const userId = await this.getCurrentUserId()
    if (!userId) return []

    try {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at')

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
    const userId = await this.getCurrentUserId()
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
    const userId = await this.getCurrentUserId()
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
    const userId = await this.getCurrentUserId()
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

  // Task Completions
  async getTaskCompletions(): Promise<TaskCompletion[]> {
    const userId = await this.getCurrentUserId()
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

      return (data || []).map(item => ({
        id: item.id,
        task_title: item.task_title || '',
        task_type: (item.task_type as 'regular' | 'recurring') || 'regular',
        date: item.date,
        user_id: item.user_id,
        created_at: item.created_at
      }))
    } catch (error) {
      console.error('Error in getTaskCompletions:', error)
      return []
    }
  }

  async addTaskCompletion(completion: Omit<TaskCompletion, 'id' | 'user_id' | 'created_at'>): Promise<TaskCompletion | null> {
    const userId = await this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('task_completions')
        .insert([{
          task_title: completion.task_title,
          task_type: completion.task_type,
          date: completion.date,
          user_id: userId
        }])
        .select()
        .single()

      if (error) {
        console.error('Error adding task completion:', error)
        return null
      }

      return {
        id: data.id,
        task_title: data.task_title || '',
        task_type: (data.task_type as 'regular' | 'recurring') || 'regular',
        date: data.date,
        user_id: data.user_id,
        created_at: data.created_at
      }
    } catch (error) {
      console.error('Error in addTaskCompletion:', error)
      return null
    }
  }

  async removeTaskCompletion(taskTitle: string, date: string): Promise<boolean> {
    const userId = await this.getCurrentUserId()
    if (!userId) return false

    try {
      const { error } = await supabase
        .from('task_completions')
        .delete()
        .eq('task_title', taskTitle)
        .eq('date', date)
        .eq('user_id', userId)

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
}

export const databaseService = new DatabaseService()
