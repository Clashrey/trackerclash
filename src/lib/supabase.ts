import { createClient } from '@supabase/supabase-js'

// Читаем из переменных окружения (установлены в Vercel Dashboard)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Отсутствуют переменные окружения: ' +
    'VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY обязательны. ' +
    'Добавьте их в Vercel Dashboard → Settings → Environment Variables.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
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

// FIX #2: CSPRNG вместо Math.random() для генерации API-ключей
export const generateApiKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes) // Криптографически стойкий ГПСЧ
  let result = 'tk_'
  for (const byte of randomBytes) {
    result += chars[byte % chars.length]
  }
  return result
}

export const validateApiKey = (key: string): boolean => {
  return /^tk_[A-Za-z0-9]{32}$/.test(key)
}
