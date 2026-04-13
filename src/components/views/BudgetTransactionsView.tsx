import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store'
import { useBudget, formatAmount } from '@/hooks/useBudget'
import { BudgetContextSwitcher } from '@/components/BudgetContextSwitcher'
import { AddTransactionSheet } from '@/components/budget/AddTransactionSheet'
import { variants, transitions } from '@/lib/animations'
import type { Currency, Transaction } from '@/types/budget'

function formatDayHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const fmt = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`

  if (dateStr === fmt(today)) return 'Сегодня'
  if (dateStr === fmt(yesterday)) return 'Вчера'

  return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })
}

interface DayGroup {
  date: string
  label: string
  transactions: Transaction[]
  total: number
}

export const BudgetTransactionsView: React.FC = () => {
  const {
    couple,
    budgetContext,
    budgetCategories,
    transactions,
    budgetSelectedMonth,
    setBudgetSelectedMonth,
  } = useAppStore()
  const { loadBudgetData, deleteTransaction } = useBudget()

  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null)
  const [editSheetOpen, setEditSheetOpen] = useState(false)

  useEffect(() => {
    loadBudgetData()
  }, [budgetContext, budgetSelectedMonth])

  const defaultCurrency: Currency = budgetContext === 'personal' ? 'THB' : 'RUB'

  const filteredTransactions = useMemo(() => {
    if (!filterCategoryId) return transactions
    return transactions.filter(t => t.category_id === filterCategoryId)
  }, [transactions, filterCategoryId])

  // Group by day
  const dayGroups = useMemo((): DayGroup[] => {
    const groups: Record<string, Transaction[]> = {}
    for (const txn of filteredTransactions) {
      if (!groups[txn.date]) groups[txn.date] = []
      groups[txn.date].push(txn)
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, txns]) => ({
        date,
        label: formatDayHeader(date),
        transactions: txns,
        total: txns.reduce((sum, t) => sum + Number(t.amount), 0),
      }))
  }, [filteredTransactions])

  const totalFiltered = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
  }, [filteredTransactions])

  const monthLabel = useMemo(() => {
    const [y, m] = budgetSelectedMonth.split('-')
    const date = new Date(Number(y), Number(m) - 1)
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  }, [budgetSelectedMonth])

  const navigateMonth = (delta: number) => {
    const [y, m] = budgetSelectedMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + delta)
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    setBudgetSelectedMonth(newMonth)
  }

  const handleEdit = (txn: Transaction) => {
    setEditingTxn(txn)
    setEditSheetOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteTransaction(id)
  }

  if (!couple) {
    return (
      <div className="text-center py-12 text-[var(--color-text-tertiary)]">
        <p>Пара не создана</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Транзакции</h2>
        <BudgetContextSwitcher />
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-[var(--color-text-primary)] capitalize min-w-[140px] text-center">
          {monthLabel}
        </span>
        <button
          onClick={() => navigateMonth(1)}
          className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setFilterCategoryId(null)}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filterCategoryId === null
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
          }`}
        >
          Все
        </button>
        {budgetCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategoryId(filterCategoryId === cat.id ? null : cat.id)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterCategoryId === cat.id
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Grouped by day */}
      <div className="space-y-4">
        {dayGroups.map(group => (
          <div key={group.date}>
            {/* Day header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-medium text-[var(--color-text-tertiary)] capitalize">
                {group.label}
              </span>
              <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
                {formatAmount(group.total, defaultCurrency)}
              </span>
            </div>

            {/* Day transactions */}
            <motion.div
              variants={variants.staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-1"
            >
              <AnimatePresence>
                {group.transactions.map(txn => {
                  const cat = budgetCategories.find(c => c.id === txn.category_id)
                  return (
                    <motion.div
                      key={txn.id}
                      variants={variants.listItem}
                      transition={transitions.smooth}
                      layout
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
                    >
                      <button
                        onClick={() => handleEdit(txn)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <span className="text-xl flex-shrink-0">{cat?.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{cat?.name}</p>
                          {txn.description && (
                            <p className="text-xs text-[var(--color-text-tertiary)] truncate">{txn.description}</p>
                          )}
                          {txn.type === 'personal' && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]">
                              Моя
                            </span>
                          )}
                        </div>
                      </button>
                      <span className="text-sm font-semibold text-[var(--color-text-primary)] flex-shrink-0">
                        {formatAmount(Number(txn.amount), txn.currency)}
                      </span>
                      <button
                        onClick={() => handleDelete(txn.id)}
                        className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-10)] transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-[var(--color-text-tertiary)]">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">Нет транзакций</p>
          </div>
        )}
      </div>

      {/* Month total */}
      {filteredTransactions.length > 0 && (
        <div className="text-center py-2">
          <span className="text-sm text-[var(--color-text-tertiary)]">Итого за месяц: </span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            {formatAmount(totalFiltered, defaultCurrency)}
          </span>
        </div>
      )}

      <AddTransactionSheet
        editingTransaction={editingTxn}
        open={editSheetOpen}
        onOpenChange={(open) => {
          setEditSheetOpen(open)
          if (!open) setEditingTxn(null)
        }}
      />
      <AddTransactionSheet />
    </div>
  )
}
