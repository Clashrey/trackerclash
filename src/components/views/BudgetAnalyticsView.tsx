import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'
import { useAppStore } from '@/store'
import { formatAmount } from '@/hooks/useBudget'
import { BudgetContextSwitcher } from '@/components/BudgetContextSwitcher'
import { AddTransactionSheet } from '@/components/budget/AddTransactionSheet'
import { budgetDatabaseService } from '@/lib/budget-database'
import { variants, transitions } from '@/lib/animations'
import { sumInCurrency, convertAmount } from '@/lib/currency-rates'
import type { Currency, Transaction } from '@/types/budget'

const CHART_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#F7B801',
  '#95E1D3', '#C6A8FA', '#87CEEB', '#98D8C8', '#F7DC6F', '#BDC3C7',
]

interface CategoryDataItem {
  id: string
  name: string
  emoji: string
  catName: string
  color: string
  value: number
  pct: number
}

interface MonthlyHistoryItem {
  month: string
  total: number
}

export const BudgetAnalyticsView: React.FC = () => {
  const {
    couple,
    budgetContext,
    budgetCategories,
    transactions,
    budgetLimits,
    budgetSelectedMonth,
    setBudgetSelectedMonth,
    userId,
    exchangeRates,
    incomeSources,
    monthlyIncomes,
  } = useAppStore()

  const [prevMonthTransactions, setPrevMonthTransactions] = useState<Transaction[]>([])
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistoryItem[]>([])
  const [showAllCategories, setShowAllCategories] = useState(false)

  // ─── Month navigation ───────────────────────────────

  const monthLabel = useMemo(() => {
    const [y, m] = budgetSelectedMonth.split('-')
    const date = new Date(Number(y), Number(m) - 1)
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  }, [budgetSelectedMonth])

  const navigateMonth = (delta: number) => {
    const [y, m] = budgetSelectedMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + delta)
    setBudgetSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // ─── Load additional data ───────────────────────────

  useEffect(() => {
    if (!couple) return

    const [y, m] = budgetSelectedMonth.split('-').map(Number)

    const loadExtra = async () => {
      // Previous month
      const prevDate = new Date(y, m - 2)
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

      // 6-month history (parallel)
      const historyPromises = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(y, m - 1 - (5 - i))
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const dc: Currency = budgetContext === 'personal' ? 'THB' : 'RUB'
        const rates = useAppStore.getState().exchangeRates
        return budgetDatabaseService.getTransactions(couple.id, { month: monthStr, context: budgetContext })
          .then(txns => ({
            month: d.toLocaleDateString('ru-RU', { month: 'short' }),
            total: sumInCurrency(txns, dc, rates),
          }))
          .catch(() => ({ month: monthStr, total: 0 }))
      })

      const [prevTxns, ...historyResults] = await Promise.all([
        budgetDatabaseService.getTransactions(couple.id, { month: prevMonth, context: budgetContext }).catch(() => [] as Transaction[]),
        ...historyPromises,
      ])

      setPrevMonthTransactions(prevTxns)
      setMonthlyHistory(historyResults)
    }

    loadExtra()
  }, [couple, budgetContext, budgetSelectedMonth])

  // ─── Derived data ──────────────────────────────────

  const defaultCurrency: Currency = budgetContext === 'personal' ? 'THB' : 'RUB'

  const totalSpent = useMemo(() =>
    sumInCurrency(transactions, defaultCurrency, exchangeRates),
    [transactions, defaultCurrency, exchangeRates])

  const prevTotalSpent = useMemo(() =>
    sumInCurrency(prevMonthTransactions, defaultCurrency, exchangeRates),
    [prevMonthTransactions, defaultCurrency, exchangeRates])

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const t of transactions) {
      totals[t.category_id] = (totals[t.category_id] || 0) + convertAmount(Number(t.amount), t.currency, defaultCurrency, exchangeRates)
    }
    return totals
  }, [transactions, defaultCurrency, exchangeRates])

  const prevCategoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const t of prevMonthTransactions) {
      totals[t.category_id] = (totals[t.category_id] || 0) + convertAmount(Number(t.amount), t.currency, defaultCurrency, exchangeRates)
    }
    return totals
  }, [prevMonthTransactions, defaultCurrency, exchangeRates])

  const categoryData = useMemo((): CategoryDataItem[] => {
    const items = budgetCategories
      .map((cat, i) => ({
        id: cat.id,
        name: `${cat.emoji} ${cat.name}`,
        emoji: cat.emoji,
        catName: cat.name,
        color: cat.color || CHART_COLORS[i % CHART_COLORS.length],
        value: categoryTotals[cat.id] || 0,
        pct: 0,
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)

    const total = items.reduce((s, d) => s + d.value, 0)
    for (const item of items) {
      item.pct = total > 0 ? Math.round((item.value / total) * 100) : 0
    }
    return items
  }, [budgetCategories, categoryTotals])

  // Average per day
  const avgPerDay = useMemo(() => {
    if (transactions.length === 0) return 0
    const [y, m] = budgetSelectedMonth.split('-').map(Number)
    const now = new Date()
    const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m
    if (isCurrentMonth) {
      const daysPassed = now.getDate()
      return totalSpent / daysPassed
    }
    const uniqueDates = new Set(transactions.map(t => t.date))
    return uniqueDates.size > 0 ? totalSpent / uniqueDates.size : 0
  }, [transactions, totalSpent, budgetSelectedMonth])

  // vs previous month
  const monthDiff = useMemo(() => {
    if (prevTotalSpent === 0) return { pct: 0, abs: 0, direction: 'neutral' as const }
    const diff = totalSpent - prevTotalSpent
    const pct = Math.round((diff / prevTotalSpent) * 100)
    const direction = pct > 5 ? 'up' as const : pct < -5 ? 'down' as const : 'neutral' as const
    return { pct, abs: diff, direction }
  }, [totalSpent, prevTotalSpent])

  // Average monthly (for bar chart reference line)
  const avgMonthly = useMemo(() => {
    if (monthlyHistory.length === 0) return 0
    const total = monthlyHistory.reduce((s, m) => s + m.total, 0)
    return total / monthlyHistory.length
  }, [monthlyHistory])

  // Problematic limits (≥80%)
  const { problematicLimits, okLimitsCount } = useMemo(() => {
    const problematic = budgetLimits
      .map(limit => {
        const spent = categoryTotals[limit.category_id] || 0
        const pct = (spent / Number(limit.amount)) * 100
        const cat = budgetCategories.find(c => c.id === limit.category_id)
        return { limit, spent, pct, cat }
      })
      .filter(l => l.pct >= 80)
      .sort((a, b) => b.pct - a.pct)
    return { problematicLimits: problematic, okLimitsCount: budgetLimits.length - problematic.length }
  }, [budgetLimits, categoryTotals, budgetCategories])

  // Comparison with prev month
  const comparisonData = useMemo(() => {
    return budgetCategories
      .map(cat => {
        const current = categoryTotals[cat.id] || 0
        const prev = prevCategoryTotals[cat.id] || 0
        if (current === 0 && prev === 0) return null
        const diff = current - prev
        const pctChange = prev > 0 ? Math.round((diff / prev) * 100) : (current > 0 ? 100 : 0)
        return { cat, current, prev, diff, pctChange }
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
  }, [budgetCategories, categoryTotals, prevCategoryTotals])

  // User split (personal context only)
  const userSplit = useMemo(() => {
    if (budgetContext !== 'personal' || !couple?.user2_id) return null

    let myTotal = 0
    let partnerTotal = 0
    const myCategoryTotals: Record<string, number> = {}
    const partnerCategoryTotals: Record<string, number> = {}

    for (const t of transactions) {
      const isMe = t.user_id === userId
      const amount = convertAmount(Number(t.amount), t.currency, defaultCurrency, exchangeRates)
      if (isMe) {
        myTotal += amount
        myCategoryTotals[t.category_id] = (myCategoryTotals[t.category_id] || 0) + amount
      } else {
        partnerTotal += amount
        partnerCategoryTotals[t.category_id] = (partnerCategoryTotals[t.category_id] || 0) + amount
      }
    }

    const grandTotal = myTotal + partnerTotal
    const myPct = grandTotal > 0 ? Math.round((myTotal / grandTotal) * 100) : 0
    const partnerPct = 100 - myPct

    const topDiff = budgetCategories
      .map(cat => ({ cat, my: myCategoryTotals[cat.id] || 0, partner: partnerCategoryTotals[cat.id] || 0 }))
      .filter(d => d.my > 0 || d.partner > 0)
      .sort((a, b) => Math.abs(b.my - b.partner) - Math.abs(a.my - a.partner))
      .slice(0, 3)

    return { myTotal, partnerTotal, grandTotal, myPct, partnerPct, topDiff }
  }, [transactions, budgetContext, couple, userId, budgetCategories, defaultCurrency, exchangeRates])

  // User names
  const myName = couple ? (userId === couple.user1_id ? couple.user1_name : couple.user2_name) || 'Я' : 'Я'
  const partnerName = couple ? (userId === couple.user1_id ? couple.user2_name : couple.user1_name) || 'Партнёр' : 'Партнёр'

  // ─── Guards ─────────────────────────────────────────

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
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Аналитика</h2>
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

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-[var(--color-text-tertiary)]">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm">Нет данных для анализа</p>
        </div>
      ) : (
        <motion.div
          variants={variants.staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* ═══ BLOCK 1: Month summary ═══ */}
          <motion.div variants={variants.listItem} transition={transitions.smooth}>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]">
                <p className="text-[10px] text-[var(--color-text-tertiary)] mb-0.5">Расходы</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  {formatAmount(totalSpent, defaultCurrency)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]">
                <p className="text-[10px] text-[var(--color-text-tertiary)] mb-0.5">vs прошлый</p>
                {prevTotalSpent === 0 ? (
                  <p className="text-lg font-bold text-[var(--color-text-secondary)]">—</p>
                ) : (
                  <>
                    <p className={`text-lg font-bold ${
                      monthDiff.direction === 'up' ? 'text-red-500 dark:text-red-400'
                        : monthDiff.direction === 'down' ? 'text-emerald-500 dark:text-emerald-400'
                          : 'text-[var(--color-text-secondary)]'
                    }`}>
                      {monthDiff.direction === 'up' ? '▲' : monthDiff.direction === 'down' ? '▼' : ''}
                      {monthDiff.pct > 0 ? '+' : ''}{monthDiff.pct}%
                    </p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">
                      {monthDiff.abs > 0 ? '+' : ''}{formatAmount(monthDiff.abs, defaultCurrency)}
                    </p>
                  </>
                )}
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]">
                <p className="text-[10px] text-[var(--color-text-tertiary)] mb-0.5">В среднем/день</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  {formatAmount(avgPerDay, defaultCurrency)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ═══ BLOCK 2: Categories ═══ */}
          {categoryData.length > 0 && (
            <motion.div
              variants={variants.listItem}
              transition={transitions.smooth}
              className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
            >
              <p className="text-xs text-[var(--color-text-tertiary)] mb-3">Расходы по категориям</p>

              {/* Centered donut with total in center */}
              <div className="flex justify-center mb-4 relative">
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">
                    {formatAmount(totalSpent, defaultCurrency)}
                  </span>
                </div>
              </div>

              {/* Legend list under donut */}
              <div className="space-y-1">
                {(showAllCategories ? categoryData : categoryData.slice(0, 5)).map(d => (
                  <div key={d.id} className="flex items-center gap-2 py-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-sm text-[var(--color-text-primary)] truncate">{d.emoji} {d.catName}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden mx-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${categoryData[0].value > 0 ? (d.value / categoryData[0].value) * 100 : 0}%`,
                          backgroundColor: d.color,
                        }}
                      />
                    </div>
                    <span className="text-xs text-[var(--color-text-tertiary)] flex-shrink-0 w-8 text-right">{d.pct}%</span>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] flex-shrink-0">
                      {formatAmount(d.value, defaultCurrency)}
                    </span>
                  </div>
                ))}
              </div>

              {categoryData.length > 5 && (
                <AnimatePresence>
                  <button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="flex items-center gap-1 mt-2 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                  >
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${showAllCategories ? 'rotate-180' : ''}`}
                    />
                    {showAllCategories ? 'Свернуть' : `Ещё ${categoryData.length - 5}`}
                  </button>
                </AnimatePresence>
              )}
            </motion.div>
          )}

          {/* ═══ BLOCK 3: Monthly dynamics ═══ */}
          {monthlyHistory.length > 0 && (
            <motion.div
              variants={variants.listItem}
              transition={transitions.smooth}
              className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[var(--color-text-tertiary)]">Динамика расходов</p>
                {avgMonthly > 0 && (
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                    Средний: {formatAmount(avgMonthly, defaultCurrency)}/мес
                  </p>
                )}
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyHistory}>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border-primary)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [formatAmount(value, defaultCurrency), 'Расходы']}
                    />
                    {avgMonthly > 0 && (
                      <ReferenceLine
                        y={avgMonthly}
                        stroke="var(--color-text-tertiary)"
                        strokeDasharray="4 4"
                      />
                    )}
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {monthlyHistory.map((_, i) => (
                        <Cell
                          key={i}
                          fill="var(--color-accent)"
                          fillOpacity={i === monthlyHistory.length - 1 ? 1 : 0.35}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* ═══ BLOCK 4: Limits — only problematic ═══ */}
          {budgetLimits.length > 0 && (
            <motion.div
              variants={variants.listItem}
              transition={transitions.smooth}
              className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-3"
            >
              <p className="text-xs text-[var(--color-text-tertiary)]">Лимиты</p>

              {problematicLimits.length > 0 ? (
                <>
                  {problematicLimits.map(({ limit, spent, pct, cat }) => {
                    const isOver = pct > 100
                    const barColor = isOver ? 'var(--color-danger)' : '#F59E0B'
                    const textColor = isOver ? 'text-[var(--color-danger)]' : 'text-amber-500'
                    return (
                      <div key={limit.id} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[var(--color-text-primary)]">
                            {cat?.emoji} {cat?.name}
                          </span>
                          <span className={textColor}>
                            {formatAmount(spent, defaultCurrency)} / {formatAmount(Number(limit.amount), defaultCurrency)}
                            <span className="ml-1">({Math.round(pct)}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct, 100)}%` }}
                            transition={transitions.slow}
                            className="h-full rounded-full"
                            style={{ backgroundColor: barColor }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {okLimitsCount > 0 && (
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      ✅ Остальные {okLimitsCount} в норме
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-emerald-500 dark:text-emerald-400">
                  ✅ Все {budgetLimits.length} лимитов в порядке
                </p>
              )}
            </motion.div>
          )}

          {/* ═══ BLOCK 5: vs previous month ═══ */}
          <motion.div
            variants={variants.listItem}
            transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
          >
            <p className="text-xs text-[var(--color-text-tertiary)] mb-3">vs прошлый месяц</p>

            {prevMonthTransactions.length === 0 && transactions.length === 0 ? (
              <p className="text-xs text-[var(--color-text-tertiary)]">Нет данных за прошлый месяц</p>
            ) : (
              <div className="space-y-1.5">
                {comparisonData.map(({ cat, current, diff, pctChange }) => {
                  const isUp = diff > 0 && Math.abs(pctChange) > 5
                  const isDown = diff < 0 && Math.abs(pctChange) > 5
                  return (
                    <div key={cat.id} className="flex items-center gap-2 text-xs">
                      <span className="text-sm">{cat.emoji}</span>
                      <span className="text-[var(--color-text-primary)] truncate flex-1">{cat.name}</span>
                      <span className="text-[var(--color-text-secondary)] flex-shrink-0">
                        {formatAmount(current, defaultCurrency)}
                      </span>
                      <span className={`flex-shrink-0 min-w-[80px] text-right ${
                        isUp ? 'text-red-500 dark:text-red-400'
                          : isDown ? 'text-emerald-500 dark:text-emerald-400'
                            : 'text-[var(--color-text-tertiary)]'
                      }`}>
                        {isUp ? '▲' : isDown ? '▼' : '—'}
                        {diff !== 0 && (
                          <> {diff > 0 ? '+' : ''}{formatAmount(diff, defaultCurrency)} ({pctChange > 0 ? '+' : ''}{pctChange}%)</>
                        )}
                      </span>
                    </div>
                  )
                })}
                {comparisonData.length === 0 && (
                  <p className="text-xs text-[var(--color-text-tertiary)]">Нет данных за прошлый месяц</p>
                )}
              </div>
            )}
          </motion.div>

          {/* ═══ BLOCK 6b: P&L (work only) ═══ */}
          {budgetContext === 'work' && (() => {
            const totalIncome = monthlyIncomes
              .filter(i => incomeSources.some(s => s.id === i.source_id && s.is_active))
              .reduce((sum, i) => sum + Number(i.amount), 0)
            const totalExp = sumInCurrency(transactions, defaultCurrency, exchangeRates)
            const profit = totalIncome - totalExp

            if (totalIncome === 0 && totalExp === 0) return null

            const plData = [
              { name: 'Доход', value: totalIncome, fill: '#4ECDC4' },
              { name: 'Расход', value: totalExp, fill: '#FF6B6B' },
              { name: 'Прибыль', value: Math.abs(profit), fill: profit >= 0 ? '#45B7D1' : '#E74C3C' },
            ]

            return (
              <motion.div
                variants={variants.listItem}
                transition={transitions.smooth}
                className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
              >
                <p className="text-xs text-[var(--color-text-tertiary)] mb-3">P&L за месяц</p>

                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={plData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                      <Tooltip
                        formatter={(value: number) => formatAmount(value, defaultCurrency)}
                        contentStyle={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border-primary)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {plData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-[var(--color-text-tertiary)]">
                    {profit >= 0 ? 'Прибыль' : 'Убыток'}:
                  </span>
                  <span className={profit >= 0 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>
                    {profit >= 0 ? '+' : ''}{formatAmount(profit, defaultCurrency)}
                  </span>
                </div>
              </motion.div>
            )
          })()}

          {/* ═══ BLOCK 6: Who spends (personal only) ═══ */}
          {userSplit && (
            <motion.div
              variants={variants.listItem}
              transition={transitions.smooth}
              className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
            >
              <p className="text-xs text-[var(--color-text-tertiary)] mb-3">Расходы по партнёрам</p>

              {/* Stacked bar */}
              <div className="flex h-3 rounded-full overflow-hidden mb-2">
                <div style={{ width: `${userSplit.myPct}%` }} className="bg-[#4ECDC4]" />
                <div style={{ width: `${userSplit.partnerPct}%` }} className="bg-[#FF6B6B]" />
              </div>

              <div className="flex justify-between text-sm mb-3">
                <span className="text-[var(--color-text-primary)]">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#4ECDC4] mr-1.5" />
                  {myName}: {formatAmount(userSplit.myTotal, defaultCurrency)} ({userSplit.myPct}%)
                </span>
                <span className="text-[var(--color-text-primary)]">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#FF6B6B] mr-1.5" />
                  {partnerName}: {formatAmount(userSplit.partnerTotal, defaultCurrency)} ({userSplit.partnerPct}%)
                </span>
              </div>

              {/* Top diff categories */}
              {userSplit.topDiff.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-[var(--color-border-secondary)]">
                  <p className="text-[10px] text-[var(--color-text-tertiary)] mb-1">Наибольшая разница</p>
                  {userSplit.topDiff.map(d => (
                    <div key={d.cat.id} className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                      <span className="text-sm">{d.cat.emoji}</span>
                      <span className="truncate">{d.cat.name}</span>
                      <span className="flex-shrink-0 ml-auto">
                        {myName}: {formatAmount(d.my, defaultCurrency)}, {partnerName}: {formatAmount(d.partner, defaultCurrency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      <AddTransactionSheet />
    </div>
  )
}
