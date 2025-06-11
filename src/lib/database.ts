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
  private getCurrentUser() {
    const user = localStorage.getItem('current_user')
    return user ? JSON.parse(user) : null
  }

  private getStorageKey(type: string) {
    const user = this.getCurrentUser()
    return user ? `${type}_${user.id}` : null
  }

  // Tasks - используем localStorage для демо
  async getTasks(): Promise<Task[]> {
    const storageKey = this.getStorageKey('tasks')
    if (!storageKey) return []

    const stored = localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) : []
  }

  async addTask(task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    const user = this.getCurrentUser()
    if (!user) return null

    const newTask: Task = {
      ...task,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const tasks = await this.getTasks()
    tasks.push(newTask)
    
    const storageKey = this.getStorageKey('tasks')
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(tasks))
    }

    return newTask
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const tasks = await this.getTasks()
    const taskIndex = tasks.findIndex(t => t.id === id)
    
    if (taskIndex === -1) return null

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    const storageKey = this.getStorageKey('tasks')
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(tasks))
    }

    return tasks[taskIndex]
  }

  async deleteTask(id: string): Promise<boolean> {
    const tasks = await this.getTasks()
    const filteredTasks = tasks.filter(t => t.id !== id)
    
    const storageKey = this.getStorageKey('tasks')
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(filteredTasks))
    }

    return true
  }

  // Recurring Tasks - используем localStorage для демо
  async getRecurringTasks(): Promise<RecurringTask[]> {
    const storageKey = this.getStorageKey('recurring_tasks')
    if (!storageKey) return []

    const stored = localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) : []
  }

  async addRecurringTask(task: Omit<RecurringTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<RecurringTask | null> {
    const user = this.getCurrentUser()
    if (!user) return null

    const newTask: RecurringTask = {
      ...task,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const tasks = await this.getRecurringTasks()
    tasks.push(newTask)
    
    const storageKey = this.getStorageKey('recurring_tasks')
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(tasks))
    }

    return newTask
  }

  async updateRecurringTask(id: string, updates: Partial<RecurringTask>): Promise<RecurringTask | null> {
    const tasks = await this.getRecurringTasks()
    const taskIndex = tasks.findIndex(t => t.id === id)
    
    if (taskIndex === -1) return null

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    const storageKey = this.getStorageKey('recurring_tasks')
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(tasks))
    }

    return tasks[taskIndex]
  }

  async deleteRecurringTask(id: string): Promise<boolean> {
    const tasks = await this.getRecurringTasks()
    const filteredTasks = tasks.filter(t => t.id !== id)
    
    const storageKey = this.getStorageKey('recurring_tasks')
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(filteredTasks))
    }

    return true
  }

  // Task Completions - используем localStorage для демо
  async getTaskCompletions(): Promise<TaskCompletion[]> {
    const storageKey = this.getStorageKey('task_completions')
    if (!storageKey) return []

    const stored = localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) : []
  }

  async addTaskCompletion(completion: Omit<TaskCompletion, 'id' | 'user_id' | 'created_at'>): Promise<TaskCompletion | null> {
    const user = this.getCurrentUser()
    if (!user) return null

    const newCompletion: TaskCompletion = {
      ...completion,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      created_at: new Date().toISOString()
    }

    const completions = await this.getTaskCompletions()
    completions.push(newCompletion)
    
    const storageKey = this.getStorageKey('task_completions')
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(completions))
    }

    return newCompletion
  }

  async removeTaskCompletion(taskTitle: string, date: string): Promise<boolean> {
    const completions = await this.getTaskCompletions()
    const filteredCompletions = completions.filter(c => 
      !(c.task_title === taskTitle && c.date === date)
    )
    
    const storageKey = this.getStorageKey('task_completions')
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(filteredCompletions))
    }

    return true
  }
}

export const databaseService = new DatabaseService()

