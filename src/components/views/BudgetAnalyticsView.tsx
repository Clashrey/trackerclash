import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useAppStore } from '@/store'
import { formatAmount } from '@/hooks/useBudget'
import { BudgetContextSwitcher } from '@/components/BudgetContextSwitcher'
import { AddTransactionSheet } from '@/components/budget/AddTransactionSheet'
import { budgetDatabaseService } from '@/lib/budget-database'
import { variants, transitions } from '@/lib/animations'
import type { Currency } from '@/types/budget'

const CHART_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#F7B801',
  '#95E1D3', '#C6A8FA', '#87CEEB', '#98D8C8', '#F7DC6F', '#BDC3C7',
]

export const BudgetAnalyticsView: React.FC = () => {
  const {
    couple,
    budgetContext,
    budgetCategories,
    transactions,
    budgetLimits,
    budgetSelectedMonth,
    userId,
  } = useAppStore()
  const [monthlyHistory, setMonthlyHistory] = useState<{ month: string; total: number }[]>([])

  // Load 6-month history
  useEffect(() => {
    if (!couple) return

    const loadHistory = async () => {
      const months: { month: string; total: number }[] = []
      const [y, m] = budgetSelectedMonth.split('-').map(Number)

      for (let i = 5; i >= 0; i--) {
        const d = new Date(y, m - 1 - i)
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        try {
          const txns = await budgetDatabaseService.getTransactions(couple.id, {
            month: monthStr,
            context: budgetContext,
          })
          const total = txns.reduce((s, t) => s + Number(t.amount), 0)
          const label = d.toLocaleDateString('ru-RU', { month: 'short' })
          months.push({ month: label, total })
        } catch {
          months.push({ month: monthStr, total: 0 })
        }
      }
      setMonthlyHistory(months)
    }

    loadHistory()
  }, [couple, budgetContext, budgetSelectedMonth])

  const defaultCurrency: Currency = budgetContext === 'personal' ? 'THB' : 'RUB'

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const t of transactions) {
      totals[t.category_id] = (totals[t.category_id] || 0) + Number(t.amount)
    }
    return budgetCategories
      .map((cat, i) => ({
        name: `${cat.emoji} ${cat.name}`,
        value: totals[cat.id] || 0,
        color: cat.color || CHART_COLORS[i % CHART_COLORS.length],
        id: cat.id,
        emoji: cat.emoji,
        catName: cat.name,
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [transactions, budgetCategories])

  // Split by user (personal context)
  const userSplit = useMemo(() => {
    if (budgetContext !== 'personal' || !couple) return null
    let user1 = 0
    let user2 = 0
    for (const t of transactions) {
      if (t.user_id === couple.user1_id) user1 += Number(t.amount)
      else user2 += Number(t.amount)
    }
    return [
      { name: userId === couple.user1_id ? 'Я' : 'Партнёр', value: user1, color: '#4ECDC4' },
      { name: userId === couple.user1_id ? 'Партнёр' : 'Я', value: user2, color: '#FF6B6B' },
    ].filter(d => d.value > 0)
  }, [transactions, budgetContext, couple, userId])

  if (!couple) {
    return (
      <div className="text-center py-12 text-[var(--color-text-tertiary)]">
        <p>Пара не создана</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Аналитика</h2>
        <BudgetContextSwitcher />
      </div>

      <motion.div
        variants={variants.staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* Donut chart - by category */}
        {categoryData.length > 0 && (
          <motion.div
            variants={variants.listItem}
            transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
          >
            <p className="text-xs text-[var(--color-text-tertiary)] mb-3">Расходы по категориям</p>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
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
              <div className="flex-1 space-y-1.5 overflow-hidden">
                {(() => {
                  const total = categoryData.reduce((s, d) => s + d.value, 0)
                  return categoryData.map(d => (
                    <div key={d.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-[var(--color-text-primary)] truncate">{d.emoji} {d.catName}</span>
                      </div>
                      <span className="text-[var(--color-text-secondary)] flex-shrink-0 ml-2">
                        {formatAmount(d.value, defaultCurrency)} · {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                      </span>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Bar chart - monthly */}
        {monthlyHistory.length > 0 && (
          <motion.div
            variants={variants.listItem}
            transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
          >
            <p className="text-xs text-[var(--color-text-tertiary)] mb-3">Динамика расходов</p>
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
                  <Bar dataKey="total" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Limits progress */}
        {budgetLimits.length > 0 && (
          <motion.div
            variants={variants.listItem}
            transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-3"
          >
            <p className="text-xs text-[var(--color-text-tertiary)]">Прогресс лимитов</p>
            {budgetLimits.map(limit => {
              const cat = budgetCategories.find(c => c.id === limit.category_id)
              const catTotal = categoryData.find(d => d.id === limit.category_id)
              const spent = catTotal?.value || 0
              const pct = Math.min((spent / Number(limit.amount)) * 100, 100)
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
                  <div className="h-2 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
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

        {/* User split (personal) */}
        {userSplit && userSplit.length > 0 && (
          <motion.div
            variants={variants.listItem}
            transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
          >
            <p className="text-xs text-[var(--color-text-tertiary)] mb-3">Расходы по партнёрам</p>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userSplit}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={40}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {userSplit.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {userSplit.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[var(--color-text-primary)]">{d.name}</span>
                    <span className="text-[var(--color-text-secondary)]">
                      {formatAmount(d.value, defaultCurrency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {categoryData.length === 0 && (
          <div className="text-center py-8 text-[var(--color-text-tertiary)]">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm">Нет данных для анализа</p>
          </div>
        )}
      </motion.div>

      <AddTransactionSheet />
    </div>
  )
}
