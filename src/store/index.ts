import { create } from 'zustand'
import { Task, RecurringTask, TaskCategory } from '@/types'

interface TaskCompletion {
  id: string
  task_id?: string
  recurring_task_id?: string
  date: string
  user_id: string
  created_at: string
}

interface AppState {
  // User
  userId: string | null
  setUserId: (userId: string) => void
  
  // Current view
  currentCategory: TaskCategory
  setCurrentCategory: (category: TaskCategory) => void
  
  // Current date for "today" view
  currentDate: Date
  setCurrentDate: (date: Date) => void
  selectedDate: string // Добавляем selectedDate как строку в формате YYYY-MM-DD
  setSelectedDate: (date: string) => void
  
  // Tasks
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  
  // Recurring tasks
  recurringTasks: RecurringTask[]
  setRecurringTasks: (tasks: RecurringTask[]) => void
  addRecurringTask: (task: Omit<RecurringTask, 'id' | 'created_at' | 'updated_at'>) => void
  updateRecurringTask: (id: string, updates: Partial<RecurringTask>) => void
  deleteRecurringTask: (id: string) => void
  
  // Task completions
  taskCompletions: TaskCompletion[]
  setTaskCompletions: (completions: TaskCompletion[]) => void
  
  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // User
  userId: null,
  setUserId: (userId) => set({ userId }),
  
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
  
  // Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    set((state) => ({ tasks: [...state.tasks, newTask] }))
  },
  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
      ),
    }))
  },
  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }))
  },
  
  // Recurring tasks
  recurringTasks: [],
  setRecurringTasks: (tasks) => set({ recurringTasks: tasks }),
  addRecurringTask: (task) => {
    const newTask: RecurringTask = {
      ...task,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    set((state) => ({ recurringTasks: [...state.recurringTasks, newTask] }))
  },
  updateRecurringTask: (id, updates) => {
    set((state) => ({
      recurringTasks: state.recurringTasks.map((task) =>
        task.id === id
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
      ),
    }))
  },
  deleteRecurringTask: (id) => {
    set((state) => ({
      recurringTasks: state.recurringTasks.filter((task) => task.id !== id),
    }))
  },
  
  // Task completions
  taskCompletions: [],
  setTaskCompletions: (completions) => set({ taskCompletions: completions }),
  
  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))

export type { TaskCompletion }

