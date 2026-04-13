import { create } from 'zustand'
import { Task, RecurringTask, TaskCategory, Subtask } from '@/types'
import type { AppMode, BudgetContext, Couple, BudgetCategory, Transaction, BudgetLimit, ExchangeRate, Account, RecurringExpense } from '@/types/budget'

interface TaskCompletion {
  id: string
  task_id?: string | null
  recurring_task_id?: string | null
  date: string
  user_id: string
  created_at: string
}

// FIX #4: Используем локальную дату, а не UTC
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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

  // FIX #4: selectedDate теперь использует локальную дату, не UTC
  currentDate: Date
  setCurrentDate: (date: Date) => void
  selectedDate: string
  setSelectedDate: (date: string) => void

  // Tasks
  tasks: Task[]
  setTasks: (tasks: Task[]) => void

  // Recurring tasks
  recurringTasks: RecurringTask[]
  setRecurringTasks: (tasks: RecurringTask[]) => void

  // Task completions
  taskCompletions: TaskCompletion[]
  setTaskCompletions: (completions: TaskCompletion[]) => void

  // Subtasks
  subtasks: Subtask[]
  setSubtasks: (subtasks: Subtask[]) => void

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Budget
  appMode: AppMode
  setAppMode: (mode: AppMode) => void
  budgetContext: BudgetContext
  setBudgetContext: (ctx: BudgetContext) => void
  couple: Couple | null
  setCouple: (couple: Couple | null) => void
  budgetCategories: BudgetCategory[]
  setBudgetCategories: (cats: BudgetCategory[]) => void
  transactions: Transaction[]
  setTransactions: (txns: Transaction[]) => void
  budgetLimits: BudgetLimit[]
  setBudgetLimits: (limits: BudgetLimit[]) => void
  accounts: Account[]
  setAccounts: (accounts: Account[]) => void
  recurringExpenses: RecurringExpense[]
  setRecurringExpenses: (expenses: RecurringExpense[]) => void
  exchangeRates: ExchangeRate[]
  setExchangeRates: (rates: ExchangeRate[]) => void
  budgetSelectedMonth: string
  setBudgetSelectedMonth: (month: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
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

  // FIX #4: Локальная дата вместо UTC
  currentDate: new Date(),
  setCurrentDate: (date) => {
    const dateStr = formatLocalDate(date) // локальная дата
    set({ currentDate: date, selectedDate: dateStr })
  },
  selectedDate: formatLocalDate(new Date()), // локальная дата

  setSelectedDate: (date) => set({ selectedDate: date }),

  // Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),

  // Recurring tasks
  recurringTasks: [],
  setRecurringTasks: (tasks) => set({ recurringTasks: tasks }),

  // Task completions
  taskCompletions: [],
  setTaskCompletions: (completions) => set({ taskCompletions: completions }),

  // Subtasks
  subtasks: [],
  setSubtasks: (subtasks) => set({ subtasks }),

  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Budget
  appMode: 'tracker',
  setAppMode: (mode) => {
    if (mode === 'budget') {
      set({ appMode: mode, currentCategory: 'budget_overview' })
    } else {
      set({ appMode: mode, currentCategory: 'today' })
    }
  },
  budgetContext: (localStorage.getItem('budget_context') as BudgetContext) || 'personal',
  setBudgetContext: (ctx) => {
    localStorage.setItem('budget_context', ctx)
    set({ budgetContext: ctx })
  },
  couple: null,
  setCouple: (couple) => set({ couple }),
  budgetCategories: [],
  setBudgetCategories: (cats) => set({ budgetCategories: cats }),
  transactions: [],
  setTransactions: (txns) => set({ transactions: txns }),
  budgetLimits: [],
  setBudgetLimits: (limits) => set({ budgetLimits: limits }),
  accounts: [],
  setAccounts: (accounts) => set({ accounts }),
  recurringExpenses: [],
  setRecurringExpenses: (expenses) => set({ recurringExpenses: expenses }),
  exchangeRates: [],
  setExchangeRates: (rates) => set({ exchangeRates: rates }),
  budgetSelectedMonth: (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })(),
  setBudgetSelectedMonth: (month) => set({ budgetSelectedMonth: month }),
}))

export type { TaskCompletion }
