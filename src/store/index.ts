import { create } from 'zustand'
import { Task, RecurringTask, TaskCategory, Subtask } from '@/types'

interface TaskCompletion {
  id: string
  task_id?: string | null
  recurring_task_id?: string | null
  date: string
  user_id: string
  created_at: string
}

interface AppState {
  // Theme
  isDarkMode: boolean
  setIsDarkMode: (isDark: boolean) => void
  toggleDarkMode: () => void

  // User & Auth
  userId: string | null
  apiKey: string | null
  setUserId: (userId: string | null) => void
  setApiKey: (apiKey: string | null) => void
  
  // Current view
  currentCategory: TaskCategory
  setCurrentCategory: (category: TaskCategory) => void
  
  // Current date for "today" view
  currentDate: Date
  setCurrentDate: (date: Date) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  
  // ✅ Tasks - ТОЛЬКО setters, без бизнес-логики
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  
  // ✅ Recurring tasks - ТОЛЬКО setters
  recurringTasks: RecurringTask[]
  setRecurringTasks: (tasks: RecurringTask[]) => void
  
  // ✅ Task completions - ТОЛЬКО setters
  taskCompletions: TaskCompletion[]
  setTaskCompletions: (completions: TaskCompletion[]) => void

  // ✅ Subtasks
  subtasks: Subtask[]
  setSubtasks: (subtasks: Subtask[]) => void

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme - загружаем из localStorage или системных настроек
  isDarkMode: (() => {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })(),
  setIsDarkMode: (isDark) => {
    localStorage.setItem('darkMode', String(isDark))
    set({ isDarkMode: isDark })
  },
  toggleDarkMode: () => {
    const newValue = !get().isDarkMode
    localStorage.setItem('darkMode', String(newValue))
    set({ isDarkMode: newValue })
  },

  // User & Auth
  userId: null,
  apiKey: null,
  setUserId: (userId) => set({ userId }),
  setApiKey: (apiKey) => set({ apiKey }),
  
  // Current view
  currentCategory: 'today',
  setCurrentCategory: (category) => set({ currentCategory: category }),
  
  // Current date
  currentDate: new Date(),
  setCurrentDate: (date) => {
    const dateStr = date.toISOString().split('T')[0]
    set({ currentDate: date, selectedDate: dateStr })
  },
  selectedDate: new Date().toISOString().split('T')[0],
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  // ✅ Tasks - ТОЛЬКО state management, БЕЗ бизнес-логики
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  
  // ✅ Recurring tasks - ТОЛЬКО state management
  recurringTasks: [],
  setRecurringTasks: (tasks) => set({ recurringTasks: tasks }),
  
  // ✅ Task completions - ТОЛЬКО state management
  taskCompletions: [],
  setTaskCompletions: (completions) => set({ taskCompletions: completions }),

  // ✅ Subtasks - ТОЛЬКО state management
  subtasks: [],
  setSubtasks: (subtasks) => set({ subtasks }),

  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))

export type { TaskCompletion }
