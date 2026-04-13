import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'
import { useBudget, formatAmount } from '@/hooks/useBudget'
import { BudgetContextSwitcher } from '@/components/BudgetContextSwitcher'
import { AddTransactionSheet } from '@/components/budget/AddTransactionSheet'
import { variants, transitions } from '@/lib/animations'
import type { Currency } from '@/types/budget'

export const BudgetOverviewView: React.FC = () => {
  const {
    couple,
    budgetContext,
    budgetCategories,
    transactions,
    budgetLimits,
    budgetSelectedMonth,
    userId,
  } = useAppStore()
  const { loadBudgetData, getCoupleBalance } = useBudget()
  const [balance, setBalance] = useState<{ user1Total: number; user2Total: number } | null>(null)

  useEffect(() => {
    loadBudgetData()
  }, [budgetContext, budgetSelectedMonth])

  useEffect(() => {
    if (budgetContext === 'personal' && couple) {
      getCoupleBalance().then(setBalance)
    }
  }, [budgetContext, couple, transactions])

  const defaultCurrency: Currency = budgetContext === 'personal' ? 'THB' : 'RUB'

  const totalSpent = useMemo(() => {
    return transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  }, [transactions])

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const t of transactions) {
      totals[t.category_id] = (totals[t.category_id] || 0) + Number(t.amount)
    }
    return totals
  }, [transactions])

  const topCategories = useMemo(() => {
    return budgetCategories
      .map(cat => ({ cat, total: categoryTotals[cat.id] || 0 }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [budgetCategories, categoryTotals])

  const recentTransactions = transactions.slice(0, 5)

  const monthLabel = useMemo(() => {
    const [y, m] = budgetSelectedMonth.split('-')
    const date = new Date(Number(y), Number(m) - 1)
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  }, [budgetSelectedMonth])

  if (!couple) {
    return (
      <div className="text-center py-12 text-[var(--color-text-tertiary)]">
        <p className="text-lg mb-2">Пара не создана</p>
        <p className="text-sm">Перейдите в Настройки, чтобы создать или присоединиться к паре</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Обзор
        </h2>
        <BudgetContextSwitcher />
      </div>

      <p className="text-sm text-[var(--color-text-tertiary)] capitalize">{monthLabel}</p>

      <motion.div
        variants={variants.staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {/* Total card */}
        <motion.div
          variants={variants.listItem}
          transition={transitions.smooth}
          className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
        >
          <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
            {budgetContext === 'personal' ? 'Потрачено в этом месяце' : 'Расходы за месяц'}
          </p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {formatAmount(totalSpent, defaultCurrency)}
          </p>
        </motion.div>

        {/* Balance card (personal only) */}
        {budgetContext === 'personal' && balance && couple && (
          <motion.div
            variants={variants.listItem}
            transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
          >
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Баланс</p>
            {(() => {
              const diff = balance.user1Total - balance.user2Total
              const halfDiff = diff / 2
              if (Math.abs(halfDiff) < 1) {
                return (
                  <p className="text-lg font-semibold text-[var(--color-success)]">
                    Вы квиты
                  </p>
                )
              }
              const isUser1 = userId === couple.user1_id
              const owes = halfDiff > 0
                ? (isUser1 ? 'Партнёр должен вам' : 'Вы должны партнёру')
                : (isUser1 ? 'Вы должны партнёру' : 'Партнёр должен вам')
              return (
                <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {owes} {formatAmount(Math.abs(halfDiff), defaultCurrency)}
                </p>
              )
            })()}
          </motion.div>
        )}

        {/* Limits progress (if any) */}
        {budgetLimits.length > 0 && (
          <motion.div
            variants={variants.listItem}
            transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-3"
          >
            <p className="text-xs text-[var(--color-text-tertiary)]">Лимиты</p>
            {budgetLimits.map(limit => {
              const spent = categoryTotals[limit.category_id] || 0
              const pct = Math.min((spent / Number(limit.amount)) * 100, 100)
              const cat = budgetCategories.find(c => c.id === limit.category_id)
              const isOver = spent > Number(limit.amount)
              return (
                <div key={limit.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--color-text-primary)]">
                      {cat?.emoji} {cat?.name}
                    </span>
                    <span className={isOver ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-tertiary)]'}>
                      {formatAmount(spent, defaultCurrency)} / {formatAmount(Number(limit.amount), defaultCurrency)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={transitions.slow}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: isOver
                          ? 'var(--color-danger)'
                          : cat?.color || 'var(--color-accent)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* Top categories (work) */}
        {budgetContext === 'work' && topCategories.length > 0 && (
          <motion.div
            variants={variants.listItem}
            transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-2"
          >
            <p className="text-xs text-[var(--color-text-tertiary)]">Топ категории</p>
            {topCategories.slice(0, 3).map(({ cat, total }) => (
              <div key={cat.id} className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-primary)]">
                  {cat.emoji} {cat.name}
                </span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {formatAmount(total, defaultCurrency)}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Recent transactions */}
        {recentTransactions.length > 0 && (
          <motion.div
            variants={variants.listItem}
            transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-2"
          >
            <p className="text-xs text-[var(--color-text-tertiary)]">Последние транзакции</p>
            {recentTransactions.map(txn => {
              const cat = budgetCategories.find(c => c.id === txn.category_id)
              return (
                <div key={txn.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat?.emoji}</span>
                    <div>
                      <p className="text-sm text-[var(--color-text-primary)]">{cat?.name}</p>
                      {txn.description && (
                        <p className="text-xs text-[var(--color-text-tertiary)]">{txn.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {formatAmount(Number(txn.amount), txn.currency)}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">{txn.date}</p>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        {recentTransactions.length === 0 && (
          <div className="text-center py-8 text-[var(--color-text-tertiary)]">
            <p className="text-3xl mb-2">💰</p>
            <p className="text-sm">Нет транзакций за этот месяц</p>
          </div>
        )}
      </motion.div>

      <AddTransactionSheet />
    </div>
  )
}
