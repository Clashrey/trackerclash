export interface Task {
  id: string
  user_id: string
  title: string
  category: 'today' | 'tasks' | 'ideas'
  completed: boolean
  date?: string
  order_index: number
  source_task_id?: string | null  // ID оригинальной задачи из ЗАДАЧИ (для копий в СЕГОДНЯ)
  created_at: string
  updated_at: string
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

export interface RecurringTask {
  id: string
  user_id: string
  title: string
  frequency: 'daily' | 'weekly' | 'custom'
  days_of_week?: number[] // 0-6, where 0 is Sunday
  order_index?: number
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  user_id: string
  created_at: string
}

export type TaskCategory = 'today' | 'tasks' | 'ideas' | 'recurring' | 'analytics'
  | 'budget_overview' | 'budget_transactions' | 'budget_analytics' | 'budget_settings'

