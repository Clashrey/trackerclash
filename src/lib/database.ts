import { supabase } from './supabase'
import { useAppStore } from '../store'

export interface Task {
  id: string
  title: string
  completed: boolean
  category: 'today' | 'tasks' | 'ideas'
  date: string
  order_index: number
  source_task_id?: string | null  // ID оригинальной задачи из ЗАДАЧИ (для копий в СЕГОДНЯ)
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
    // ✅ Берём userId напрямую из Zustand store, без localStorage
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
    console.log('🔍 getTasks - userId:', userId)
    if (!userId) {
      console.log('❌ getTasks - no userId, returning empty')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('order_index')

      console.log('🔍 getTasks - result:', { count: data?.length, error })

      if (error) {
        console.error('❌ Error fetching tasks:', error)
        return []
      }

      console.log('✅ getTasks - loaded', data?.length, 'tasks')
      return data || []
    } catch (error) {
      console.error('❌ Exception in getTasks:', error)
      return []
    }
  }

  async addTask(task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    const userId = this.getCurrentUserId()
    console.log('🔍 addTask - userId:', userId)
    console.log('🔍 addTask - task:', task)
    if (!userId) {
      console.error('❌ addTask - no userId')
      return null
    }

    try {
      const insertData = {
        ...task,
        user_id: userId
      }
      console.log('🔍 addTask - inserting:', insertData)

      const { data, error } = await supabase
        .from('tasks')
        .insert([insertData])
        .select()
        .single()

      console.log('🔍 addTask - result:', { data, error })

      if (error) {
        console.error('❌ Error adding task:', error)
        return null
      }

      console.log('✅ Task added:', data)
      return data
    } catch (error) {
      console.error('❌ Exception in addTask:', error)
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

  // ========== SUBTASKS ==========

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
        console.error('Error fetching subtasks:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getSubtasks:', error)
      return []
    }
  }

  async addSubtask(subtask: Omit<Subtask, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Subtask | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('subtasks')
        .insert([{
          ...subtask,
          user_id: userId
        }])
        .select()
        .single()

      if (error) {
        console.error('Error adding subtask:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in addSubtask:', error)
      return null
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
        console.error('Error updating subtask:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateSubtask:', error)
      return null
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
        console.error('Error deleting subtask:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteSubtask:', error)
      return false
    }
  }

  // Копирование задачи из ЗАДАЧИ в СЕГОДНЯ (оригинал остаётся)
  async copyTaskToToday(taskId: string, date: string): Promise<Task | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      // Сначала получаем оригинальную задачу
      const { data: originalTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single()

      if (fetchError || !originalTask) {
        console.error('Error fetching original task:', fetchError)
        return null
      }

      // Получаем максимальный order_index для задач на этот день
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('order_index')
        .eq('user_id', userId)
        .eq('category', 'today')
        .eq('date', date)
        .order('order_index', { ascending: false })
        .limit(1)

      const maxOrderIndex = existingTasks?.[0]?.order_index ?? -1

      // Создаём копию в "Сегодня" со ссылкой на оригинал
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: originalTask.title,
          category: 'today',
          date: date,
          completed: false,
          order_index: maxOrderIndex + 1,
          source_task_id: taskId,  // Ссылка на оригинал
          user_id: userId
        }])
        .select()
        .single()

      if (error) {
        console.error('Error copying task to today:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in copyTaskToToday:', error)
      return null
    }
  }

  // Перенос задачи из СЕГОДНЯ на другую дату (вместе с подзадачами)
  async rescheduleTask(taskId: string, newDate: string): Promise<Task | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      // Обновляем дату задачи
      const { data, error } = await supabase
        .from('tasks')
        .update({ date: newDate })
        .eq('id', taskId)
        .eq('user_id', userId)
        .eq('category', 'today')
        .select()
        .single()

      if (error) {
        console.error('Error rescheduling task:', error)
        return null
      }

      // Подзадачи автоматически остаются привязанными к task_id, переносить их не нужно
      return data
    } catch (error) {
      console.error('Error in rescheduleTask:', error)
      return null
    }
  }

  // Синхронизация статуса: при выполнении копии — выполняем и оригинал
  async syncTaskCompletion(taskId: string, completed: boolean): Promise<boolean> {
    const userId = this.getCurrentUserId()
    if (!userId) return false

    try {
      // Получаем задачу, чтобы узнать source_task_id
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('source_task_id')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single()

      if (fetchError || !task?.source_task_id) {
        return false  // Нет оригинала — ничего не делаем
      }

      // Обновляем статус оригинальной задачи
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', task.source_task_id)
        .eq('user_id', userId)

      if (error) {
        console.error('Error syncing task completion:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in syncTaskCompletion:', error)
      return false
    }
  }
}

export const databaseService = new DatabaseService()
