// Budget context — which "sub-app" we're in
export type BudgetContext = 'personal' | 'work'

// Transaction type — shared with partner or personal
export type TransactionType = 'shared' | 'personal'

// Supported currencies
export type Currency = 'RUB' | 'THB' | 'USD' | 'EUR'

// Budget view tabs
export type BudgetView = 'overview' | 'transactions' | 'analytics' | 'settings'

// App-level mode (tasks vs budget)
export type AppMode = 'tracker' | 'budget'

/**
 * Пара пользователей для совместного управления бюджетом
 */
export interface Couple {
  id: string
  user1_id: string
  user2_id: string
  invite_code: string
  created_at: string
}

/**
 * Категория бюджета для разделения расходов
 */
export interface BudgetCategory {
  id: string
  couple_id: string
  name: string
  emoji: string
  color: string | null
  context: BudgetContext
  order_index: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

/**
 * Транзакция (расход или доход)
 */
export interface Transaction {
  id: string
  couple_id: string
  user_id: string
  category_id: string
  amount: number
  currency: Currency
  context: BudgetContext
  type: TransactionType
  description: string | null
  date: string // YYYY-MM-DD
  recurring_expense_id: string | null
  created_at: string
  updated_at: string
  // Joined fields (optional, for display)
  category?: BudgetCategory
}

/**
 * Лимит бюджета на категорию на месяц
 */
export interface BudgetLimit {
  id: string
  couple_id: string
  category_id: string
  amount: number
  currency: Currency
  month: string // YYYY-MM
  created_at: string
  updated_at: string
  // Joined
  category?: BudgetCategory
}

/**
 * Банковский счёт / кошелёк пользователя
 */
export interface Account {
  id: string
  couple_id: string
  user_id: string
  name: string
  emoji: string
  currency: Currency
  balance: number
  order_index: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

/**
 * Фиксированный обязательный расход (подписка, аренда и т.д.)
 */
// bill = напоминание + ручная оплата, subscription = автосписание
export type RecurringExpenseType = 'bill' | 'subscription'

export interface RecurringExpense {
  id: string
  couple_id: string
  user_id: string
  name: string
  emoji: string
  amount: number
  currency: Currency
  day_of_month: number // 1-31
  type: RecurringExpenseType
  category_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Курс обмена между валютами
 */
export interface ExchangeRate {
  id: string
  from_currency: Currency
  to_currency: Currency
  rate: number
  fetched_at: string
}

/**
 * Данные формы для быстрого добавления транзакции
 */
export interface TransactionFormData {
  amount: string // string for input, parse to number
  currency: Currency
  category_id: string
  type: TransactionType
  description: string
  date: string
}

/**
 * Баланс между партнёрами в совместном бюджете
 */
export interface CoupleBalance {
  user1_id: string
  user2_id: string
  user1_total: number // total shared spent by user1
  user2_total: number // total shared spent by user2
  balance: number // positive = user2 owes user1
  currency: Currency // display currency
}

/**
 * Ежемесячная сводка расходов
 */
export interface MonthlySummary {
  month: string
  totalSpent: number
  byCategory: Array<{
    category: BudgetCategory
    amount: number
    limit?: number
    percentage?: number // of limit
  }>
  currency: Currency
}
