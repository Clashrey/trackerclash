import type { Currency, BudgetLimit, Transaction, BudgetCategory } from '@/types/budget'
import { formatAmount } from '@/hooks/useBudget'

interface InsightInput {
  categoryId: string
  amount: number
  currency: Currency
  budgetLimits: BudgetLimit[]
  transactions: Transaction[]
  budgetSelectedMonth: string
  budgetCategories: BudgetCategory[]
}

interface Insight {
  message: string
  icon: string
}

export function computeTransactionInsight(input: InsightInput): Insight | null {
  const {
    categoryId,
    amount,
    currency,
    budgetLimits,
    transactions,
    budgetSelectedMonth,
    budgetCategories,
  } = input

  const cat = budgetCategories.find(c => c.id === categoryId)
  const catName = cat?.name || 'категория'

  // Current spending in this category this month (BEFORE adding new txn)
  const currentSpent = transactions
    .filter(t => t.category_id === categoryId && t.date.startsWith(budgetSelectedMonth))
    .reduce((sum, t) => sum + Number(t.amount), 0)

  // Total after adding
  const totalAfter = currentSpent + amount

  // Check limits
  const limit = budgetLimits.find(l => l.category_id === categoryId)

  if (limit) {
    const limitAmount = Number(limit.amount)
    const pct = Math.round((totalAfter / limitAmount) * 100)

    if (totalAfter > limitAmount) {
      return {
        message: `Лимит по ${catName} превышен: ${formatAmount(totalAfter, currency)}/${formatAmount(limitAmount, currency)}`,
        icon: '⚠️',
      }
    }

    if (pct >= 80) {
      return {
        message: `${catName}: потрачено ${pct}% лимита (${formatAmount(totalAfter, currency)}/${formatAmount(limitAmount, currency)})`,
        icon: '⚡',
      }
    }

    if (pct >= 50) {
      return {
        message: `${catName}: ${pct}% лимита использовано`,
        icon: '📊',
      }
    }
  }

  // No limit — compare with daily average
  if (!limit && currentSpent > 0) {
    const [, m] = budgetSelectedMonth.split('-').map(Number)
    const today = new Date()
    const dayOfMonth = today.getMonth() + 1 === m ? today.getDate() : 30
    const avgPerDay = currentSpent / Math.max(dayOfMonth, 1)

    if (avgPerDay > 0 && amount > avgPerDay * 2) {
      const multiplier = Math.round(amount / avgPerDay)
      return {
        message: `Эта трата в ${multiplier}× больше вашего среднего по ${catName}`,
        icon: '📈',
      }
    }
  }

  return null
}
