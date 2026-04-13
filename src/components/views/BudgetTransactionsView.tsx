import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Trash2, Search, SlidersHorizontal, X, Repeat2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore, formatLocalDate } from '@/store'
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
  const { addTransaction, deleteTransaction } = useBudget()

  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null)
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null)
  const [editSheetOpen, setEditSheetOpen] = useState(false)

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [amountMin, setAmountMin] = useState<number | null>(null)
  const [amountMax, setAmountMax] = useState<number | null>(null)
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset filters (except category) on month change
  useEffect(() => {
    setSearchQuery('')
    setDebouncedSearch('')
    setAmountMin(null)
    setAmountMax(null)
    setDateFrom(null)
    setDateTo(null)
    setFiltersExpanded(false)
  }, [budgetSelectedMonth])

  const defaultCurrency: Currency = budgetContext === 'personal' ? 'THB' : 'RUB'

  const hasDateFilter = dateFrom !== null || dateTo !== null

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (debouncedSearch.trim()) count++
    if (amountMin !== null) count++
    if (amountMax !== null) count++
    if (dateFrom !== null) count++
    if (dateTo !== null) count++
    return count
  }, [debouncedSearch, amountMin, amountMax, dateFrom, dateTo])

  const hasAnyFilter = activeFilterCount > 0 || filterCategoryId !== null

  const resetAllFilters = () => {
    setSearchQuery('')
    setDebouncedSearch('')
    setAmountMin(null)
    setAmountMax(null)
    setDateFrom(null)
    setDateTo(null)
    setFilterCategoryId(null)
    setFiltersExpanded(false)
  }

  const filteredTransactions = useMemo(() => {
    let result = transactions

    if (filterCategoryId) {
      result = result.filter(t => t.category_id === filterCategoryId)
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase()
      result = result.filter(t =>
        t.description?.toLowerCase().includes(q)
      )
    }

    if (amountMin !== null) {
      result = result.filter(t => Number(t.amount) >= amountMin)
    }
    if (amountMax !== null) {
      result = result.filter(t => Number(t.amount) <= amountMax)
    }

    if (dateFrom) {
      result = result.filter(t => t.date >= dateFrom)
    }
    if (dateTo) {
      result = result.filter(t => t.date <= dateTo)
    }

    return result
  }, [transactions, filterCategoryId, debouncedSearch, amountMin, amountMax, dateFrom, dateTo])

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
    if (!window.confirm('Удалить транзакцию?')) return
    await deleteTransaction(id)
  }

  const handleRepeat = async (txn: Transaction) => {
    const today = formatLocalDate(new Date())

    const newTxn = await addTransaction({
      amount: Number(txn.amount),
      currency: txn.currency,
      category_id: txn.category_id,
      context: budgetContext,
      type: txn.type,
      description: txn.description,
      date: today,
    })

    if (newTxn) {
      toast('Транзакция повторена', {
        icon: '🔄',
        duration: 4000,
        action: {
          label: 'Отменить',
          onClick: () => {
            deleteTransaction(newTxn.id)
          },
        },
      })
    }
  }

  // Active filters description
  const activeFiltersLabel = useMemo(() => {
    const parts: string[] = []
    if (debouncedSearch.trim()) parts.push(`«${debouncedSearch.trim()}»`)
    if (amountMin !== null && amountMax !== null) {
      parts.push(`сумма ${amountMin}–${amountMax}`)
    } else if (amountMin !== null) {
      parts.push(`от ${amountMin}`)
    } else if (amountMax !== null) {
      parts.push(`до ${amountMax}`)
    }
    if (dateFrom && dateTo) {
      parts.push(`${dateFrom} — ${dateTo}`)
    } else if (dateFrom) {
      parts.push(`с ${dateFrom}`)
    } else if (dateTo) {
      parts.push(`по ${dateTo}`)
    }
    return parts.length > 0 ? `Фильтры: ${parts.join(', ')}` : null
  }, [debouncedSearch, amountMin, amountMax, dateFrom, dateTo])

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
      <div className={`flex items-center justify-center gap-4 ${hasDateFilter ? 'opacity-40 pointer-events-none' : ''}`}>
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

      {/* Search & filters */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {/* Search input */}
          <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-lg bg-[var(--color-bg-tertiary)]">
            <Search size={14} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
            <input
              type="text"
              placeholder="Поиск по описанию…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="relative h-9 w-9 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {filtersExpanded && (
            <motion.div
              variants={variants.collapse}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={transitions.smooth}
              className="space-y-2 p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
            >
              {/* Amount range */}
              <div>
                <p className="text-[10px] text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Сумма</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="От"
                    value={amountMin !== null ? String(amountMin) : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                      setAmountMin(val ? parseFloat(val) || null : null)
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none placeholder-[var(--color-text-tertiary)]"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="До"
                    value={amountMax !== null ? String(amountMax) : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                      setAmountMax(val ? parseFloat(val) || null : null)
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none placeholder-[var(--color-text-tertiary)]"
                  />
                </div>
              </div>

              {/* Date range */}
              <div>
                <p className="text-[10px] text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Даты</p>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFrom || ''}
                    onChange={(e) => setDateFrom(e.target.value || null)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none"
                  />
                  <input
                    type="date"
                    value={dateTo || ''}
                    onChange={(e) => setDateTo(e.target.value || null)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none"
                  />
                </div>
              </div>

              {/* Reset */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setAmountMin(null)
                    setAmountMax(null)
                    setDateFrom(null)
                    setDateTo(null)
                    setSearchQuery('')
                  }}
                  className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                >
                  Сбросить фильтры
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filters indicator */}
        {activeFiltersLabel && !filtersExpanded && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--color-accent)] truncate">{activeFiltersLabel}</span>
            <button
              onClick={resetAllFilters}
              className="p-0.5 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] flex-shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Category filter chips */}
      <div className="relative">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 pr-6">
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
      <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-[var(--color-bg-secondary)] to-transparent pointer-events-none" />
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
                        onClick={() => handleRepeat(txn)}
                        className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-10)] transition-colors flex-shrink-0"
                        title="Повторить"
                      >
                        <Repeat2 size={14} />
                      </button>
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

        {/* Empty state with filters */}
        {filteredTransactions.length === 0 && hasAnyFilter && (
          <div className="text-center py-8 text-[var(--color-text-tertiary)]">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm mb-3">Ничего не найдено</p>
            <p className="text-xs mb-3">Попробуйте изменить фильтры</p>
            <button
              onClick={resetAllFilters}
              className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              Сбросить всё
            </button>
          </div>
        )}

        {/* Empty state without filters */}
        {filteredTransactions.length === 0 && !hasAnyFilter && (
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
    </div>
  )
}
