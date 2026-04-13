import { useCallback } from 'react'
import { toast } from 'sonner'
import { useAppStore } from '../store'
import { budgetDatabaseService } from '../lib/budget-database'
import type { Currency, TransactionType, BudgetContext } from '../types/budget'

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  THB: '฿',
  RUB: '₽',
  USD: '$',
  EUR: '€',
}

export function formatAmount(amount: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${formatted} ${CURRENCY_SYMBOLS[currency]}`
}

export function useBudget() {
  const {
    setCouple,
    setBudgetCategories,
    setTransactions,
    setBudgetLimits,
    setAccounts,
    setRecurringExpenses,
  } = useAppStore()

  const getState = () => useAppStore.getState()

  // ─── Load all budget data ─────────────────────────────

  const loadBudgetData = useCallback(async () => {
    try {
      const couple = await budgetDatabaseService.getCouple()
      setCouple(couple)

      if (!couple) return

      const { budgetContext, budgetSelectedMonth } = getState()

      const [categories, transactions, limits, accounts, recurringExpenses] = await Promise.all([
        budgetDatabaseService.getCategories(couple.id, budgetContext),
        budgetDatabaseService.getTransactions(couple.id, {
          month: budgetSelectedMonth,
          context: budgetContext,
        }),
        budgetDatabaseService.getBudgetLimits(couple.id, budgetSelectedMonth),
        budgetDatabaseService.getAccounts(couple.id),
        budgetDatabaseService.getRecurringExpenses(couple.id),
      ])

      setBudgetCategories(categories)
      setTransactions(transactions)
      setBudgetLimits(limits)
      setAccounts(accounts)
      setRecurringExpenses(recurringExpenses)
    } catch (error) {
      console.error('loadBudgetData failed:', error)
      toast.error('Не удалось загрузить данные бюджета')
    }
  }, [setCouple, setBudgetCategories, setTransactions, setBudgetLimits, setAccounts, setRecurringExpenses])

  const reloadTransactions = useCallback(async () => {
    const { couple, budgetContext, budgetSelectedMonth } = getState()
    if (!couple) return

    try {
      const transactions = await budgetDatabaseService.getTransactions(couple.id, {
        month: budgetSelectedMonth,
        context: budgetContext,
      })
      setTransactions(transactions)
    } catch (error) {
      console.error('reloadTransactions failed:', error)
    }
  }, [setTransactions])

  const reloadCategories = useCallback(async () => {
    const { couple, budgetContext } = getState()
    if (!couple) return

    try {
      const categories = await budgetDatabaseService.getCategories(couple.id, budgetContext)
      setBudgetCategories(categories)
    } catch (error) {
      console.error('reloadCategories failed:', error)
    }
  }, [setBudgetCategories])

  const reloadLimits = useCallback(async () => {
    const { couple, budgetSelectedMonth } = getState()
    if (!couple) return

    try {
      const limits = await budgetDatabaseService.getBudgetLimits(couple.id, budgetSelectedMonth)
      setBudgetLimits(limits)
    } catch (error) {
      console.error('reloadLimits failed:', error)
    }
  }, [setBudgetLimits])

  // ─── Couple ───────────────────────────────────────────

  const createCouple = useCallback(async () => {
    try {
      const couple = await budgetDatabaseService.createCouple()
      if (couple) {
        setCouple(couple)
        toast.success('Пара создана! Поделитесь кодом с партнёром')
        await loadBudgetData()
      }
      return couple
    } catch (error) {
      console.error('createCouple failed:', error)
      toast.error('Не удалось создать пару')
      throw error
    }
  }, [setCouple, loadBudgetData])

  const joinCouple = useCallback(async (inviteCode: string) => {
    try {
      const couple = await budgetDatabaseService.joinCouple(inviteCode)
      if (couple) {
        setCouple(couple)
        toast.success('Вы присоединились к паре!')
        await loadBudgetData()
      }
      return couple
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Не удалось присоединиться'
      toast.error(msg)
      throw error
    }
  }, [setCouple, loadBudgetData])

  // ─── Transactions ─────────────────────────────────────

  const addTransaction = useCallback(async (params: {
    category_id: string
    amount: number
    currency: Currency
    context: BudgetContext
    type: TransactionType
    description: string | null
    date: string
  }) => {
    const { couple, budgetCategories } = getState()
    if (!couple) return null

    try {
      const txn = await budgetDatabaseService.addTransaction(couple.id, params)
      if (txn) {
        const currentTransactions = getState().transactions
        setTransactions([txn, ...currentTransactions])

        const cat = budgetCategories.find(c => c.id === params.category_id)
        const emoji = cat?.emoji || ''
        toast.success(`Добавлено: ${emoji} ${formatAmount(params.amount, params.currency)}`)
      }
      return txn
    } catch (error) {
      console.error('addTransaction failed:', error)
      toast.error('Не удалось добавить транзакцию')
      throw error
    }
  }, [setTransactions])

  const updateTransaction = useCallback(async (id: string, updates: {
    category_id?: string
    amount?: number
    currency?: Currency
    type?: TransactionType
    description?: string | null
    date?: string
  }) => {
    try {
      const txn = await budgetDatabaseService.updateTransaction(id, updates)
      if (txn) {
        const currentTransactions = getState().transactions
        setTransactions(currentTransactions.map(t => t.id === id ? txn : t))
        toast.success('Транзакция обновлена')
      }
      return txn
    } catch (error) {
      console.error('updateTransaction failed:', error)
      toast.error('Не удалось обновить транзакцию')
      throw error
    }
  }, [setTransactions])

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const success = await budgetDatabaseService.deleteTransaction(id)
      if (success) {
        const currentTransactions = getState().transactions
        setTransactions(currentTransactions.filter(t => t.id !== id))
        toast('Транзакция удалена')
      }
      return success
    } catch (error) {
      console.error('deleteTransaction failed:', error)
      toast.error('Не удалось удалить транзакцию')
      throw error
    }
  }, [setTransactions])

  // ─── Categories ───────────────────────────────────────

  const addCategory = useCallback(async (params: {
    name: string
    emoji: string
    color: string
    context: BudgetContext
  }) => {
    const { couple, budgetCategories } = getState()
    if (!couple) return null

    try {
      const cat = await budgetDatabaseService.addCategory(couple.id, {
        ...params,
        order_index: budgetCategories.length,
      })
      if (cat) {
        setBudgetCategories([...budgetCategories, cat])
        toast.success('Категория добавлена')
      }
      return cat
    } catch (error) {
      console.error('addCategory failed:', error)
      toast.error('Не удалось добавить категорию')
      throw error
    }
  }, [setBudgetCategories])

  const updateCategory = useCallback(async (id: string, updates: {
    name?: string
    emoji?: string
    color?: string
  }) => {
    try {
      const cat = await budgetDatabaseService.updateCategory(id, updates)
      if (cat) {
        const currentCategories = getState().budgetCategories
        setBudgetCategories(currentCategories.map(c => c.id === id ? cat : c))
      }
      return cat
    } catch (error) {
      console.error('updateCategory failed:', error)
      toast.error('Не удалось обновить категорию')
      throw error
    }
  }, [setBudgetCategories])

  const archiveCategory = useCallback(async (id: string) => {
    try {
      const success = await budgetDatabaseService.archiveCategory(id)
      if (success) {
        const currentCategories = getState().budgetCategories
        setBudgetCategories(currentCategories.filter(c => c.id !== id))
        toast('Категория архивирована')
      }
      return success
    } catch (error) {
      console.error('archiveCategory failed:', error)
      toast.error('Не удалось архивировать категорию')
      throw error
    }
  }, [setBudgetCategories])

  const reorderCategories = useCallback(async (ids: string[]) => {
    try {
      const currentCategories = getState().budgetCategories
      const reordered = ids
        .map((id, i) => {
          const cat = currentCategories.find(c => c.id === id)
          return cat ? { ...cat, order_index: i } : null
        })
        .filter(Boolean) as typeof currentCategories
      setBudgetCategories(reordered)

      await budgetDatabaseService.reorderCategories(ids)
    } catch (error) {
      console.error('reorderCategories failed:', error)
      toast.error('Не удалось изменить порядок')
    }
  }, [setBudgetCategories])

  // ─── Budget Limits ────────────────────────────────────

  const setBudgetLimit = useCallback(async (params: {
    category_id: string
    amount: number
    currency: Currency
    month: string
  }) => {
    const { couple } = getState()
    if (!couple) return null

    try {
      const limit = await budgetDatabaseService.setBudgetLimit(couple.id, params)
      if (limit) {
        const currentLimits = getState().budgetLimits
        const existingIdx = currentLimits.findIndex(
          l => l.category_id === params.category_id && l.month === params.month
        )
        if (existingIdx >= 0) {
          setBudgetLimits(currentLimits.map((l, i) => i === existingIdx ? limit : l))
        } else {
          setBudgetLimits([...currentLimits, limit])
        }
        toast.success('Лимит установлен')
      }
      return limit
    } catch (error) {
      console.error('setBudgetLimit failed:', error)
      toast.error('Не удалось установить лимит')
      throw error
    }
  }, [setBudgetLimits])

  const copyLimitsFromPrevMonth = useCallback(async () => {
    const { couple, budgetSelectedMonth } = getState()
    if (!couple) return

    try {
      const newLimits = await budgetDatabaseService.copyLimitsFromPrevMonth(couple.id, budgetSelectedMonth)
      setBudgetLimits(newLimits)
      toast.success('Лимиты скопированы с прошлого месяца')
    } catch (error) {
      console.error('copyLimitsFromPrevMonth failed:', error)
      toast.error('Не удалось скопировать лимиты')
      throw error
    }
  }, [setBudgetLimits])

  // ─── Accounts ─────────────────────────────────────────

  const addAccount = useCallback(async (params: {
    name: string
    emoji: string
    currency: Currency
    balance: number
  }) => {
    const { couple, accounts } = getState()
    if (!couple) return null

    try {
      const account = await budgetDatabaseService.addAccount(couple.id, {
        ...params,
        order_index: accounts.length,
      })
      if (account) {
        setAccounts([...accounts, account])
        toast.success(`Счёт «${params.name}» добавлен`)
      }
      return account
    } catch (error) {
      console.error('addAccount failed:', error)
      toast.error('Не удалось добавить счёт')
      throw error
    }
  }, [setAccounts])

  const updateAccount = useCallback(async (id: string, updates: {
    name?: string
    emoji?: string
    balance?: number
    currency?: Currency
  }) => {
    try {
      const account = await budgetDatabaseService.updateAccount(id, updates)
      if (account) {
        const current = getState().accounts
        setAccounts(current.map(a => a.id === id ? account : a))
      }
      return account
    } catch (error) {
      console.error('updateAccount failed:', error)
      toast.error('Не удалось обновить счёт')
      throw error
    }
  }, [setAccounts])

  const deleteAccount = useCallback(async (id: string) => {
    try {
      const success = await budgetDatabaseService.deleteAccount(id)
      if (success) {
        const current = getState().accounts
        setAccounts(current.filter(a => a.id !== id))
        toast('Счёт удалён')
      }
      return success
    } catch (error) {
      console.error('deleteAccount failed:', error)
      toast.error('Не удалось удалить счёт')
      throw error
    }
  }, [setAccounts])

  // ─── Recurring Expenses ────────────────────────────────

  const addRecurringExpense = useCallback(async (params: {
    name: string
    emoji: string
    amount: number
    currency: Currency
    day_of_month: number
    category_id?: string | null
  }) => {
    const { couple, recurringExpenses } = getState()
    if (!couple) return null

    try {
      const expense = await budgetDatabaseService.addRecurringExpense(couple.id, params)
      if (expense) {
        setRecurringExpenses([...recurringExpenses, expense])
        toast.success(`Расход «${params.name}» добавлен`)
      }
      return expense
    } catch (error) {
      console.error('addRecurringExpense failed:', error)
      toast.error('Не удалось добавить расход')
      throw error
    }
  }, [setRecurringExpenses])

  const updateRecurringExpense = useCallback(async (id: string, updates: {
    name?: string
    emoji?: string
    amount?: number
    currency?: Currency
    day_of_month?: number
  }) => {
    try {
      const expense = await budgetDatabaseService.updateRecurringExpense(id, updates)
      if (expense) {
        const current = getState().recurringExpenses
        setRecurringExpenses(current.map(e => e.id === id ? expense : e))
      }
      return expense
    } catch (error) {
      console.error('updateRecurringExpense failed:', error)
      toast.error('Не удалось обновить расход')
      throw error
    }
  }, [setRecurringExpenses])

  const deleteRecurringExpense = useCallback(async (id: string) => {
    try {
      const success = await budgetDatabaseService.deleteRecurringExpense(id)
      if (success) {
        const current = getState().recurringExpenses
        setRecurringExpenses(current.filter(e => e.id !== id))
        toast('Расход удалён')
      }
      return success
    } catch (error) {
      console.error('deleteRecurringExpense failed:', error)
      toast.error('Не удалось удалить расход')
      throw error
    }
  }, [setRecurringExpenses])

  // ─── Balance ──────────────────────────────────────────

  const getCoupleBalance = useCallback(async () => {
    const { couple, budgetSelectedMonth } = getState()
    if (!couple) return null

    try {
      return await budgetDatabaseService.getCoupleBalance(couple.id, budgetSelectedMonth)
    } catch (error) {
      console.error('getCoupleBalance failed:', error)
      return null
    }
  }, [])

  return {
    loadBudgetData,
    reloadTransactions,
    reloadCategories,
    reloadLimits,
    createCouple,
    joinCouple,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    archiveCategory,
    reorderCategories,
    setBudgetLimit,
    copyLimitsFromPrevMonth,
    getCoupleBalance,
    addAccount,
    updateAccount,
    deleteAccount,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    formatAmount,
  }
}

export { CURRENCY_SYMBOLS }
