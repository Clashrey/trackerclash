import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://mszntxpdgnuvthjypkih.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zem50eHBkZ251dnRoanlwa2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NjM4NDIsImV4cCI6MjA2NTEzOTg0Mn0.2zfcQ7qJ3wLlt1e4ONwp5Thd75SYppSoufGEd0wtqnY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (упрощенные)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          user_id: string
          api_key: string | null
          name: string | null
          last_active: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          api_key?: string | null
          name?: string | null
          last_active?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          api_key?: string | null
          name?: string | null
          last_active?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          category: 'today' | 'tasks' | 'ideas'
          completed: boolean
          date: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category: 'today' | 'tasks' | 'ideas'
          completed?: boolean
          date?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: 'today' | 'tasks' | 'ideas'
          completed?: boolean
          date?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      recurring_tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          frequency: 'daily' | 'weekly' | 'custom'
          days_of_week: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          frequency: 'daily' | 'weekly' | 'custom'
          days_of_week?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          frequency?: 'daily' | 'weekly' | 'custom'
          days_of_week?: number[] | null
          created_at?: string
          updated_at?: string
        }
      }
      task_completions: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          recurring_task_id: string | null
          task_title: string | null
          task_type: 'regular' | 'recurring' | null
          completed_at: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          recurring_task_id?: string | null
          task_title?: string | null
          task_type?: 'regular' | 'recurring' | null
          completed_at?: string
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          recurring_task_id?: string | null
          task_title?: string | null
          task_type?: 'regular' | 'recurring' | null
          completed_at?: string
          date?: string
          created_at?: string
        }
      }
    }
  }
}

// API Key utilities
export const generateApiKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'tk_' // tracker key prefix
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const validateApiKey = (key: string): boolean => {
  return /^tk_[A-Za-z0-9]{32}$/.test(key)
}
