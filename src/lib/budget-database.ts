import { supabase } from './supabase'
import { useAppStore } from '../store'
import type {
  Couple,
  BudgetCategory,
  Transaction,
  BudgetLimit,
  Account,
  RecurringExpense,
  RecurringExpenseType,
  BudgetContext,
  Currency,
  TransactionType,
} from '../types/budget'

interface TransactionFilters {
  month?: string // YYYY-MM
  categoryId?: string
  context?: BudgetContext
}

interface AddTransactionParams {
  category_id: string
  amount: number
  currency: Currency
  context: BudgetContext
  type: TransactionType
  description: string | null
  date: string
}

class BudgetDatabaseService {
  private getCurrentUserId(): string | null {
    const userId = useAppStore.getState().userId
    if (!userId) {
      console.error('No userId in store')
      return null
    }
    return userId
  }

  // ─── Couples ──────────────────────────────────────────

  async getCouple(): Promise<Couple | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .maybeSingle()

      if (error) throw new Error(`getCouple failed: ${error.message}`)
      return data
    } catch (error) {
      console.error('getCouple error:', error)
      throw error
    }
  }

  async createCouple(): Promise<Couple | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    const inviteCode = this.generateInviteCode()

    try {
      const { data, error } = await supabase
        .from('couples')
        .insert([{ user1_id: userId, invite_code: inviteCode }])
        .select()
        .single()

      if (error) throw new Error(`createCouple failed: ${error.message}`)

      // Create default categories directly (no RPC dependency)
      await this.createDefaultCategories(data.id)

      return data
    } catch (error) {
      console.error('createCouple error:', error)
      throw error
    }
  }

  private async createDefaultCategories(coupleId: string): Promise<void> {
    const personal = [
      { name: 'Еда', emoji: '🍕', color: '#FF6B6B', context: 'personal' as const, order_index: 0 },
      { name: 'Жильё', emoji: '🏠', color: '#4ECDC4', context: 'personal' as const, order_index: 1 },
      { name: 'Транспорт', emoji: '🚗', color: '#45B7D1', context: 'personal' as const, order_index: 2 },
      { name: 'Развлечения', emoji: '🎬', color: '#FFA07A', context: 'personal' as const, order_index: 3 },
      { name: 'Одежда', emoji: '👕', color: '#F7B801', context: 'personal' as const, order_index: 4 },
      { name: 'Здоровье', emoji: '💊', color: '#95E1D3', context: 'personal' as const, order_index: 5 },
      { name: 'Подписки', emoji: '📱', color: '#C6A8FA', context: 'personal' as const, order_index: 6 },
      { name: 'Путешествия', emoji: '✈️', color: '#87CEEB', context: 'personal' as const, order_index: 7 },
      { name: 'Образование', emoji: '🎓', color: '#98D8C8', context: 'personal' as const, order_index: 8 },
      { name: 'Переводы', emoji: '💸', color: '#F7DC6F', context: 'personal' as const, order_index: 9 },
      { name: 'Другое', emoji: '📦', color: '#BDC3C7', context: 'personal' as const, order_index: 10 },
    ]
    const work = [
      { name: 'Реклама', emoji: '📢', color: '#E74C3C', context: 'work' as const, order_index: 0 },
      { name: 'Подписки/SaaS', emoji: '💻', color: '#3498DB', context: 'work' as const, order_index: 1 },
      { name: 'Подрядчики', emoji: '👤', color: '#9B59B6', context: 'work' as const, order_index: 2 },
      { name: 'Контент', emoji: '🎨', color: '#E67E22', context: 'work' as const, order_index: 3 },
      { name: 'Офис/Оборудование', emoji: '🏢', color: '#1ABC9C', context: 'work' as const, order_index: 4 },
      { name: 'Налоги/Бухгалтерия', emoji: '📊', color: '#2ECC71', context: 'work' as const, order_index: 5 },
      { name: 'Другое', emoji: '📦', color: '#95A5A6', context: 'work' as const, order_index: 6 },
    ]

    const rows = [...personal, ...work].map(cat => ({ couple_id: coupleId, ...cat }))

    const { error } = await supabase
      .from('budget_categories')
      .insert(rows)

    if (error) {
      console.error('createDefaultCategories error:', error)
    }
  }

  async joinCouple(inviteCode: string): Promise<Couple | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data: couple, error: findError } = await supabase
        .from('couples')
        .select('*')
        .eq('invite_code', inviteCode)
        .is('user2_id', null)
        .maybeSingle()

      if (findError) throw new Error(`joinCouple find failed: ${findError.message}`)
      if (!couple) throw new Error('Код приглашения не найден или уже использован')

      if (couple.user1_id === userId) {
        throw new Error('Нельзя присоединиться к собственной паре')
      }

      const { data, error } = await supabase
        .from('couples')
        .update({ user2_id: userId })
        .eq('id', couple.id)
        .select()
        .single()

      if (error) throw new Error(`joinCouple update failed: ${error.message}`)
      return data
    } catch (error) {
      console.error('joinCouple error:', error)
      throw error
    }
  }

  // ─── Categories ───────────────────────────────────────

  async getCategories(coupleId: string, context: BudgetContext): Promise<BudgetCategory[]> {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('context', context)
        .eq('is_archived', false)
        .order('order_index')

      if (error) throw new Error(`getCategories failed: ${error.message}`)
      return data || []
    } catch (error) {
      console.error('getCategories error:', error)
      throw error
    }
  }

  async addCategory(
    coupleId: string,
    params: { name: string; emoji: string; color: string; context: BudgetContext; order_index: number }
  ): Promise<BudgetCategory | null> {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .insert([{ couple_id: coupleId, ...params }])
        .select()
        .single()

      if (error) throw new Error(`addCategory failed: ${error.message}`)
      return data
    } catch (error) {
      console.error('addCategory error:', error)
      throw error
    }
  }

  async updateCategory(
    id: string,
    updates: Partial<Pick<BudgetCategory, 'name' | 'emoji' | 'color' | 'order_index' | 'is_archived'>>
  ): Promise<BudgetCategory | null> {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(`updateCategory failed: ${error.message}`)
      return data
    } catch (error) {
      console.error('updateCategory error:', error)
      throw error
    }
  }

  async archiveCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('budget_categories')
        .update({ is_archived: true })
        .eq('id', id)

      if (error) throw new Error(`archiveCategory failed: ${error.message}`)
      return true
    } catch (error) {
      console.error('archiveCategory error:', error)
      throw error
    }
  }

  async reorderCategories(ids: string[]): Promise<boolean> {
    try {
      const updates = ids.map((id, index) => ({ id, order_index: index }))

      for (const update of updates) {
        const { error } = await supabase
          .from('budget_categories')
          .update({ order_index: update.order_index })
          .eq('id', update.id)

        if (error) throw new Error(`reorderCategories failed: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('reorderCategories error:', error)
      throw error
    }
  }

  // ─── Transactions ─────────────────────────────────────

  async getTransactions(coupleId: string, filters: TransactionFilters): Promise<Transaction[]> {
    try {
      let query = supabase
        .from('transactions')
        .select('*, category:budget_categories(*)')
        .eq('couple_id', coupleId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters.context) {
        query = query.eq('context', filters.context)
      }

      if (filters.month) {
        const startDate = `${filters.month}-01`
        const [year, month] = filters.month.split('-').map(Number)
        const lastDay = new Date(year, month, 0).getDate()
        const endDate = `${filters.month}-${String(lastDay).padStart(2, '0')}`
        query = query.gte('date', startDate).lte('date', endDate)
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      const { data, error } = await query

      if (error) throw new Error(`getTransactions failed: ${error.message}`)
      return data || []
    } catch (error) {
      console.error('getTransactions error:', error)
      throw error
    }
  }

  async addTransaction(coupleId: string, params: AddTransactionParams): Promise<Transaction | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ couple_id: coupleId, user_id: userId, ...params }])
        .select('*, category:budget_categories(*)')
        .single()

      if (error) throw new Error(`addTransaction failed: ${error.message}`)
      return data
    } catch (error) {
      console.error('addTransaction error:', error)
      throw error
    }
  }

  async updateTransaction(
    id: string,
    updates: Partial<AddTransactionParams>
  ): Promise<Transaction | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*, category:budget_categories(*)')
        .single()

      if (error) throw new Error(`updateTransaction failed: ${error.message}`)
      return data
    } catch (error) {
      console.error('updateTransaction error:', error)
      throw error
    }
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const userId = this.getCurrentUserId()
    if (!userId) return false

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw new Error(`deleteTransaction failed: ${error.message}`)
      return true
    } catch (error) {
      console.error('deleteTransaction error:', error)
      throw error
    }
  }

  // ─── Budget Limits ────────────────────────────────────

  async getBudgetLimits(coupleId: string, month: string): Promise<BudgetLimit[]> {
    try {
      const { data, error } = await supabase
        .from('budget_limits')
        .select('*, category:budget_categories(*)')
        .eq('couple_id', coupleId)
        .eq('month', month)

      if (error) throw new Error(`getBudgetLimits failed: ${error.message}`)
      return data || []
    } catch (error) {
      console.error('getBudgetLimits error:', error)
      throw error
    }
  }

  async setBudgetLimit(
    coupleId: string,
    params: { category_id: string; amount: number; currency: Currency; month: string }
  ): Promise<BudgetLimit | null> {
    try {
      const { data, error } = await supabase
        .from('budget_limits')
        .upsert(
          [{ couple_id: coupleId, ...params }],
          { onConflict: 'couple_id,category_id,month' }
        )
        .select('*, category:budget_categories(*)')
        .single()

      if (error) throw new Error(`setBudgetLimit failed: ${error.message}`)
      return data
    } catch (error) {
      console.error('setBudgetLimit error:', error)
      throw error
    }
  }

  async copyLimitsFromPrevMonth(coupleId: string, targetMonth: string): Promise<BudgetLimit[]> {
    const [year, month] = targetMonth.split('-').map(Number)
    const prevDate = new Date(year, month - 2, 1)
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

    try {
      const prevLimits = await this.getBudgetLimits(coupleId, prevMonth)

      const newLimits: BudgetLimit[] = []
      for (const limit of prevLimits) {
        const result = await this.setBudgetLimit(coupleId, {
          category_id: limit.category_id,
          amount: limit.amount,
          currency: limit.currency,
          month: targetMonth,
        })
        if (result) newLimits.push(result)
      }

      return newLimits
    } catch (error) {
      console.error('copyLimitsFromPrevMonth error:', error)
      throw error
    }
  }

  // ─── Aggregations ─────────────────────────────────────

  async getMonthlyTotals(
    coupleId: string,
    month: string,
    context: BudgetContext
  ): Promise<{ categoryId: string; total: number }[]> {
    const startDate = `${month}-01`
    const [year, m] = month.split('-').map(Number)
    const lastDay = new Date(year, m, 0).getDate()
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('couple_id', coupleId)
        .eq('context', context)
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) throw new Error(`getMonthlyTotals failed: ${error.message}`)

      const totals: Record<string, number> = {}
      for (const row of data || []) {
        totals[row.category_id] = (totals[row.category_id] || 0) + Number(row.amount)
      }

      return Object.entries(totals).map(([categoryId, total]) => ({
        categoryId,
        total,
      }))
    } catch (error) {
      console.error('getMonthlyTotals error:', error)
      throw error
    }
  }

  async getCoupleBalance(
    coupleId: string,
    month: string
  ): Promise<{ user1Total: number; user2Total: number } | null> {
    const startDate = `${month}-01`
    const [year, m] = month.split('-').map(Number)
    const lastDay = new Date(year, m, 0).getDate()
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('user_id, amount')
        .eq('couple_id', coupleId)
        .eq('type', 'shared')
        .eq('context', 'personal')
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) throw new Error(`getCoupleBalance failed: ${error.message}`)

      const couple = await this.getCouple()
      if (!couple) return null

      let user1Total = 0
      let user2Total = 0

      for (const row of data || []) {
        if (row.user_id === couple.user1_id) {
          user1Total += Number(row.amount)
        } else {
          user2Total += Number(row.amount)
        }
      }

      return { user1Total, user2Total }
    } catch (error) {
      console.error('getCoupleBalance error:', error)
      throw error
    }
  }

  // ─── Recurring Expenses ────────────────────────────────

  async getRecurringExpenses(coupleId: string, context: BudgetContext): Promise<RecurringExpense[]> {
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('context', context)
        .eq('is_active', true)
        .order('day_of_month')

      if (error) throw new Error(`getRecurringExpenses failed: ${error.message}`)
      return data || []
    } catch (error) {
      console.error('getRecurringExpenses error:', error)
      throw error
    }
  }

  async addRecurringExpense(
    coupleId: string,
    params: { name: string; emoji: string; amount: number; currency: Currency; day_of_month: number; type?: RecurringExpenseType; context?: BudgetContext; category_id?: string | null }
  ): Promise<RecurringExpense | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert([{ couple_id: coupleId, user_id: userId, ...params }])
        .select()
        .single()

      if (error) throw new Error(`addRecurringExpense failed: ${error.message}`)
      return data
    } catch (error) {
      console.error('addRecurringExpense error:', error)
      throw error
    }
  }

  async updateRecurringExpense(
    id: string,
    updates: Partial<Pick<RecurringExpense, 'name' | 'emoji' | 'amount' | 'currency' | 'day_of_month' | 'is_active'>>
  ): Promise<RecurringExpense | null> {
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(`updateRecurringExpense failed: ${error.message}`)
      return data
    } catch (error) {
      console.error('updateRecurringExpense error:', error)
      throw error
    }
  }

  async markExpensePaid(
    expense: RecurringExpense,
    coupleId: string
  ): Promise<Transaction | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    const today = new Date()
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const row: Record<string, unknown> = {
      couple_id: coupleId,
      user_id: userId,
      amount: expense.amount,
      currency: expense.currency,
      context: expense.context,
      type: 'shared' as TransactionType,
      description: expense.name,
      date,
      recurring_expense_id: expense.id,
    }
    if (expense.category_id) {
      row.category_id = expense.category_id
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([row])
        .select('*')
        .single()

      if (error) throw new Error(`markExpensePaid failed: ${error.message}`)
      return data
    } catch (error) {
      console.error('markExpensePaid error:', error)
      throw error
    }
  }

  async getExpensePaymentsForMonth(
    coupleId: string,
    month: string
  ): Promise<Record<string, boolean>> {
    const startDate = `${month}-01`
    const [year, m] = month.split('-').map(Number)
    const lastDay = new Date(year, m, 0).getDate()
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('recurring_expense_id')
        .eq('couple_id', coupleId)
        .not('recurring_expense_id', 'is', null)
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) throw new Error(`getExpensePayments failed: ${error.message}`)

      const paid: Record<string, boolean> = {}
      for (const row of data || []) {
        if (row.recurring_expense_id) {
          paid[row.recurring_expense_id] = true
        }
      }
      return paid
    } catch (error) {
      console.error('getExpensePayments error:', error)
      return {}
    }
  }

  async deleteRecurringExpense(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw new Error(`deleteRecurringExpense failed: ${error.message}`)
      return true
    } catch (error) {
      console.error('deleteRecurringExpense error:', error)
      throw error
    }
  }

  // ─── Exchange Rates ───────────────────────────────────

  async getExchangeRate(from: Currency, to: Currency): Promise<number | null> {
    if (from === to) return 1

    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', from)
        .eq('to_currency', to)
        .maybeSingle()

      if (error) throw new Error(`getExchangeRate failed: ${error.message}`)
      return data?.rate ?? null
    } catch (error) {
      console.error('getExchangeRate error:', error)
      return null
    }
  }

  async updateExchangeRate(from: Currency, to: Currency, rate: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('exchange_rates')
        .upsert(
          [{ from_currency: from, to_currency: to, rate, fetched_at: new Date().toISOString() }],
          { onConflict: 'from_currency,to_currency' }
        )

      if (error) throw new Error(`updateExchangeRate failed: ${error.message}`)
      return true
    } catch (error) {
      console.error('updateExchangeRate error:', error)
      throw error
    }
  }

  // ─── Accounts ─────────────────────────────────────────

  async getAccounts(coupleId: string): Promise<Account[]> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('is_archived', false)
        .order('order_index')

      if (error) throw new Error(`getAccounts failed: ${error.message}`)
      return data || []
    } catch (error) {
      console.error('getAccounts error:', error)
      throw error
    }
  }

  async addAccount(
    coupleId: string,
    params: { name: string; emoji: string; currency: Currency; balance: number; order_index: number }
  ): Promise<Account | null> {
    const userId = this.getCurrentUserId()
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{ couple_id: coupleId, user_id: userId, ...params }])
        .select()
        .single()

      if (error) throw new Error(`addAccount failed: ${error.message}`)
      return data
    } catch (error) {
      console.error('addAccount error:', error)
      throw error
    }
  }

  async updateAccount(
    id: string,
    updates: Partial<Pick<Account, 'name' | 'emoji' | 'balance' | 'currency'>>
  ): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(`updateAccount failed: ${error.message}`)
      return data
    } catch (error) {
      console.error('updateAccount error:', error)
      throw error
    }
  }

  async deleteAccount(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_archived: true })
        .eq('id', id)

      if (error) throw new Error(`deleteAccount failed: ${error.message}`)
      return true
    } catch (error) {
      console.error('deleteAccount error:', error)
      throw error
    }
  }

  // ─── Helpers ──────────────────────────────────────────

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    let code = ''
    for (const byte of bytes) {
      code += chars[byte % chars.length]
    }
    return code
  }
}

export const budgetDatabaseService = new BudgetDatabaseService()
