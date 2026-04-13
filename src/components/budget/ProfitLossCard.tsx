import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useAppStore } from '@/store'
import { formatAmount } from '@/hooks/useBudget'
import { sumInCurrency } from '@/lib/currency-rates'
import { variants, transitions } from '@/lib/animations'
import type { Currency } from '@/types/budget'

export const ProfitLossCard: React.FC = () => {
  const {
    transactions,
    monthlyIncomes,
    incomeSources,
    exchangeRates,
  } = useAppStore()

  const currency: Currency = 'RUB'

  const totalIncome = useMemo(() => {
    return monthlyIncomes
      .filter(i => incomeSources.some(s => s.id === i.source_id && s.is_active))
      .reduce((sum, i) => sum + Number(i.amount), 0)
  }, [monthlyIncomes, incomeSources])

  const totalExpenses = useMemo(
    () => sumInCurrency(transactions, currency, exchangeRates),
    [transactions, currency, exchangeRates],
  )

  const profit = totalIncome - totalExpenses
  const isPositive = profit > 0
  const isZero = profit === 0

  const ProfitIcon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown
  const profitColor = isZero
    ? 'text-[var(--color-text-tertiary)]'
    : isPositive
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'

  return (
    <motion.div
      variants={variants.listItem}
      transition={transitions.smooth}
      className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
    >
      <div className="flex items-center gap-2 mb-3">
        <ProfitIcon size={14} className={profitColor} />
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">
          P&L за месяц
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mb-0.5">Доход</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatAmount(totalIncome, currency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mb-0.5">Расход</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            {formatAmount(totalExpenses, currency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mb-0.5">Прибыль</p>
          <p className={`text-lg font-bold ${profitColor}`}>
            {isPositive ? '+' : ''}{formatAmount(profit, currency)}
          </p>
        </div>
      </div>

      {totalIncome > 0 && (
        <div className="mt-3">
          <div className="h-2 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isPositive ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, (totalExpenses / totalIncome) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1 text-right">
            Потрачено {Math.round((totalExpenses / totalIncome) * 100)}% дохода
          </p>
        </div>
      )}
    </motion.div>
  )
}
