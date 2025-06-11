export interface Task {
  id: string
  user_id: string
  title: string
  category: 'today' | 'tasks' | 'ideas'
  completed: boolean
  date?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface RecurringTask {
  id: string
  user_id: string
  title: string
  frequency: 'daily' | 'weekly'
  days_of_week?: number[] // 0-6, where 0 is Sunday
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  user_id: string
  created_at: string
}

export type TaskCategory = 'today' | 'tasks' | 'ideas' | 'recurring' | 'analytics'

