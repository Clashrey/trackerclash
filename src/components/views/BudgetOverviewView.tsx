import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Wallet, TrendingDown, ChevronRight, CalendarClock, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store'
import { useBudget, formatAmount, CURRENCY_SYMBOLS } from '@/hooks/useBudget'
import { BudgetContextSwitcher } from '@/components/BudgetContextSwitcher'
import { AddTransactionSheet } from '@/components/budget/AddTransactionSheet'
import { variants, transitions } from '@/lib/animations'
import type { Currency } from '@/types/budget'

// ─── Helpers ──────────────────────────────────────────

function getWeekBounds(): { start: string; end: string } {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }
  return { start: fmt(monday), end: fmt(sunday) }
}

function getTodayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const ACCOUNT_EMOJIS = ['🏦', '💳', '💰', '🪙', '📱', '🏧', '💵', '🐖', '🔐', '🏠']
const EXPENSE_EMOJIS = ['📅', '🔄', '🏠', '🏍️', '📱', '💡', '🎬', '🏋️', '☁️', '🎵', '📦', '🛡️']

// ─── Component ────────────────────────────────────────

export const BudgetOverviewView: React.FC = () => {
  const {
    couple,
    budgetContext,
    budgetCategories,
    transactions,
    budgetLimits,
    accounts,
    recurringExpenses,
    userId,
  } = useAppStore()
  const {
    loadBudgetData,
    addAccount,
    updateAccount,
    deleteAccount,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
  } = useBudget()

  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountEmoji, setNewAccountEmoji] = useState('🏦')
  const [newAccountBalance, setNewAccountBalance] = useState('')
  const [newAccountCurrency, setNewAccountCurrency] = useState<Currency>('THB')
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [editBalance, setEditBalance] = useState('')

  // Recurring expenses form
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expName, setExpName] = useState('')
  const [expEmoji, setExpEmoji] = useState('📅')
  const [expAmount, setExpAmount] = useState('')
  const [expCurrency, setExpCurrency] = useState<Currency>('THB')
  const [expDay, setExpDay] = useState('')
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editExpAmount, setEditExpAmount] = useState('')

  useEffect(() => {
    loadBudgetData()
  }, [budgetContext])

  const defaultCurrency: Currency = budgetContext === 'personal' ? 'THB' : 'RUB'

  // ─── Spending calculations ──────────────────────────

  const today = getTodayStr()
  const week = getWeekBounds()

  const spentToday = useMemo(() => {
    return transactions
      .filter(t => t.date === today)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }, [transactions, today])

  const spentThisWeek = useMemo(() => {
    return transactions
      .filter(t => t.date >= week.start && t.date <= week.end)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }, [transactions, week])

  const spentThisMonth = useMemo(() => {
    return transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  }, [transactions])

  // ─── Category leaders ───────────────────────────────

  const topCategories = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const t of transactions) {
      totals[t.category_id] = (totals[t.category_id] || 0) + Number(t.amount)
    }
    return budgetCategories
      .map(cat => ({ cat, total: totals[cat.id] || 0 }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [budgetCategories, transactions])

  const maxCategoryTotal = topCategories[0]?.total || 1

  // ─── Balance ────────────────────────────────────────

  const myAccounts = useMemo(() =>
    accounts.filter(a => a.user_id === userId),
    [accounts, userId]
  )
  const partnerAccounts = useMemo(() =>
    accounts.filter(a => a.user_id !== userId),
    [accounts, userId]
  )

  const myBalance = useMemo(() =>
    myAccounts.reduce((sum, a) => sum + Number(a.balance), 0),
    [myAccounts]
  )
  const partnerBalance = useMemo(() =>
    partnerAccounts.reduce((sum, a) => sum + Number(a.balance), 0),
    [partnerAccounts]
  )
  const totalBalance = myBalance + partnerBalance

  // ─── Recurring expenses ─────────────────────────────

  const totalRecurring = useMemo(() =>
    recurringExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [recurringExpenses]
  )

  const upcomingExpenses = useMemo(() => {
    const todayDay = new Date().getDate()
    const sorted = [...recurringExpenses].sort((a, b) => {
      const aNext = a.day_of_month >= todayDay ? a.day_of_month - todayDay : a.day_of_month + 31 - todayDay
      const bNext = b.day_of_month >= todayDay ? b.day_of_month - todayDay : b.day_of_month + 31 - todayDay
      return aNext - bNext
    })
    return sorted
  }, [recurringExpenses])

  // ─── Recent transactions ────────────────────────────

  const recentTransactions = transactions.slice(0, 5)

  // ─── Limits ─────────────────────────────────────────

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const t of transactions) {
      totals[t.category_id] = (totals[t.category_id] || 0) + Number(t.amount)
    }
    return totals
  }, [transactions])

  // ─── Handlers ───────────────────────────────────────

  const handleAddAccount = async () => {
    const balance = parseFloat(newAccountBalance.replace(',', '.'))
    if (!newAccountName.trim() || isNaN(balance)) return

    await addAccount({
      name: newAccountName.trim(),
      emoji: newAccountEmoji,
      currency: newAccountCurrency,
      balance,
    })
    setNewAccountName('')
    setNewAccountEmoji('🏦')
    setNewAccountBalance('')
    setShowAddAccount(false)
  }

  const handleAddExpense = async () => {
    const amount = parseFloat(expAmount.replace(',', '.'))
    const day = parseInt(expDay)
    if (!expName.trim() || isNaN(amount) || isNaN(day) || day < 1 || day > 31) return

    await addRecurringExpense({
      name: expName.trim(),
      emoji: expEmoji,
      amount,
      currency: expCurrency,
      day_of_month: day,
    })
    setExpName('')
    setExpEmoji('📅')
    setExpAmount('')
    setExpDay('')
    setShowAddExpense(false)
  }

  const handleUpdateExpenseAmount = async (id: string) => {
    const val = parseFloat(editExpAmount.replace(',', '.'))
    if (isNaN(val)) return
    await updateRecurringExpense(id, { amount: val })
    setEditingExpenseId(null)
  }

  const handleUpdateBalance = async (accountId: string) => {
    const val = parseFloat(editBalance.replace(',', '.'))
    if (isNaN(val)) return
    await updateAccount(accountId, { balance: val })
    setEditingAccountId(null)
  }

  if (!couple) {
    return (
      <div className="text-center py-12 text-[var(--color-text-tertiary)]">
        <p className="text-lg mb-2">Пара не создана</p>
        <p className="text-sm">Перейдите в Настройки, чтобы создать или присоединиться к паре</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Обзор</h2>
        <BudgetContextSwitcher />
      </div>

      <motion.div
        variants={variants.staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {/* ═══ SPENDING SECTION ═══ */}
        <motion.div
          variants={variants.listItem}
          transition={transitions.smooth}
          className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} className="text-[var(--color-text-tertiary)]" />
            <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Траты</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-[var(--color-text-tertiary)] mb-0.5">Сегодня</p>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">
                {formatAmount(spentToday, defaultCurrency)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-text-tertiary)] mb-0.5">Неделя</p>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">
                {formatAmount(spentThisWeek, defaultCurrency)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-text-tertiary)] mb-0.5">Месяц</p>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">
                {formatAmount(spentThisMonth, defaultCurrency)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ═══ BALANCE SECTION ═══ */}
        <motion.div
          variants={variants.listItem}
          transition={transitions.smooth}
          className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet size={14} className="text-[var(--color-text-tertiary)]" />
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Баланс</p>
            </div>
          </div>

          {/* Total + per-user balances */}
          <div className="mb-3">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {formatAmount(totalBalance, defaultCurrency)}
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">общий</p>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 p-2 rounded-lg bg-[var(--color-bg-tertiary)]">
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Мой</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {formatAmount(myBalance, defaultCurrency)}
              </p>
            </div>
            {couple.user2_id && (
              <div className="flex-1 p-2 rounded-lg bg-[var(--color-bg-tertiary)]">
                <p className="text-[10px] text-[var(--color-text-tertiary)]">Партнёр</p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {formatAmount(partnerBalance, defaultCurrency)}
                </p>
              </div>
            )}
          </div>

          {/* My accounts list */}
          {myAccounts.length > 0 && (
            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Мои счета</p>
              {myAccounts.map(acc => (
                <div key={acc.id} className="flex items-center justify-between py-1.5 group">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{acc.emoji}</span>
                    <span className="text-sm text-[var(--color-text-primary)]">{acc.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {editingAccountId === acc.id ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editBalance}
                        onChange={(e) => setEditBalance(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                        onBlur={() => handleUpdateBalance(acc.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateBalance(acc.id) }}
                        autoFocus
                        className="w-24 px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-sm text-right text-[var(--color-text-primary)] outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingAccountId(acc.id); setEditBalance(String(acc.balance)) }}
                        className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        {formatAmount(Number(acc.balance), acc.currency)}
                      </button>
                    )}
                    <button
                      onClick={() => deleteAccount(acc.id)}
                      className="p-0.5 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Partner accounts (view only) */}
          {partnerAccounts.length > 0 && (
            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Счета партнёра</p>
              {partnerAccounts.map(acc => (
                <div key={acc.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{acc.emoji}</span>
                    <span className="text-sm text-[var(--color-text-secondary)]">{acc.name}</span>
                  </div>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {formatAmount(Number(acc.balance), acc.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Add account */}
          <AnimatePresence>
            {showAddAccount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={transitions.smooth}
                className="space-y-2 pt-2 border-t border-[var(--color-border-secondary)]"
              >
                <div className="flex gap-1.5 flex-wrap">
                  {ACCOUNT_EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => setNewAccountEmoji(e)}
                      className={`text-lg p-1 rounded ${newAccountEmoji === e ? 'bg-[var(--color-accent-10)]' : 'hover:bg-[var(--color-bg-tertiary)]'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Название"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Сумма"
                    value={newAccountBalance}
                    onChange={(e) => setNewAccountBalance(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                    className="w-28 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm text-right outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={newAccountCurrency}
                    onChange={(e) => setNewAccountCurrency(e.target.value as Currency)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none"
                  >
                    {(['THB', 'RUB', 'USD', 'EUR'] as Currency[]).map(c => (
                      <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddAccount}
                    disabled={!newAccountName.trim() || !newAccountBalance}
                    className="flex-1 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-50"
                  >
                    Добавить
                  </button>
                  <button
                    onClick={() => setShowAddAccount(false)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showAddAccount && (
            <button
              onClick={() => setShowAddAccount(true)}
              className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] mt-1"
            >
              <Plus size={12} />
              Добавить счёт
            </button>
          )}
        </motion.div>

        {/* ═══ RECURRING EXPENSES ═══ */}
        <motion.div
          variants={variants.listItem}
          transition={transitions.smooth}
          className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarClock size={14} className="text-[var(--color-text-tertiary)]" />
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">
                Обязательные расходы
              </p>
            </div>
            {recurringExpenses.length > 0 && (
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {formatAmount(totalRecurring, defaultCurrency)}/мес
              </span>
            )}
          </div>

          {/* List */}
          {upcomingExpenses.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {upcomingExpenses.map(exp => {
                const todayDay = new Date().getDate()
                const isPast = exp.day_of_month < todayDay
                return (
                  <div key={exp.id} className="flex items-center justify-between py-1.5 group">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{exp.emoji}</span>
                      <div>
                        <span className="text-sm text-[var(--color-text-primary)]">{exp.name}</span>
                        <p className="text-[10px] text-[var(--color-text-tertiary)]">
                          {exp.day_of_month}-е число
                          {isPast && ' (оплачено)'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {editingExpenseId === exp.id ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editExpAmount}
                          onChange={(e) => setEditExpAmount(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                          onBlur={() => handleUpdateExpenseAmount(exp.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateExpenseAmount(exp.id) }}
                          autoFocus
                          className="w-24 px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-sm text-right text-[var(--color-text-primary)] outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingExpenseId(exp.id); setEditExpAmount(String(exp.amount)) }}
                          className={`text-sm font-medium transition-colors hover:text-[var(--color-accent)] ${
                            isPast ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-primary)]'
                          }`}
                        >
                          {formatAmount(Number(exp.amount), exp.currency)}
                        </button>
                      )}
                      <button
                        onClick={() => deleteRecurringExpense(exp.id)}
                        className="p-0.5 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add form */}
          <AnimatePresence>
            {showAddExpense && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={transitions.smooth}
                className="space-y-2 pt-2 border-t border-[var(--color-border-secondary)]"
              >
                <div className="flex gap-1.5 flex-wrap">
                  {EXPENSE_EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => setExpEmoji(e)}
                      className={`text-lg p-1 rounded ${expEmoji === e ? 'bg-[var(--color-accent-10)]' : 'hover:bg-[var(--color-bg-tertiary)]'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Название"
                    value={expName}
                    onChange={(e) => setExpName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Сумма"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm text-right outline-none"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="День"
                    value={expDay}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '')
                      if (v === '' || (Number(v) >= 1 && Number(v) <= 31)) setExpDay(v)
                    }}
                    className="w-16 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm text-center outline-none"
                  />
                  <select
                    value={expCurrency}
                    onChange={(e) => setExpCurrency(e.target.value as Currency)}
                    className="px-2 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none"
                  >
                    {(['THB', 'RUB', 'USD', 'EUR'] as Currency[]).map(c => (
                      <option key={c} value={c}>{CURRENCY_SYMBOLS[c]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddExpense}
                    disabled={!expName.trim() || !expAmount || !expDay}
                    className="flex-1 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-50"
                  >
                    Добавить
                  </button>
                  <button
                    onClick={() => setShowAddExpense(false)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showAddExpense && (
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] mt-1"
            >
              <Plus size={12} />
              Добавить расход
            </button>
          )}
        </motion.div>

        {/* ═══ TOP CATEGORIES ═══ */}
        {topCategories.length > 0 && (
          <motion.div
            variants={variants.listItem}
            transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-2.5"
          >
            <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">
              Лидеры расходов
            </p>
            {topCategories.slice(0, 5).map(({ cat, total }, i) => {
              const pct = (total / maxCategoryTotal) * 100
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.emoji}</span>
                      <span className="text-sm text-[var(--color-text-primary)]">{cat.name}</span>
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {formatAmount(total, defaultCurrency)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ ...transitions.slow, delay: i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color || 'var(--color-accent)' }}
                    />
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* ═══ LIMITS PROGRESS ═══ */}
        {budgetLimits.length > 0 && (
          <motion.div
            variants={variants.listItem}
            transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-3"
          >
            <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Лимиты</p>
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

        {/* ═══ RECENT TRANSACTIONS ═══ */}
        {recentTransactions.length > 0 && (
          <motion.div
            variants={variants.listItem}
            transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">
                Последние транзакции
              </p>
              <button
                onClick={() => useAppStore.getState().setCurrentCategory('budget_transactions')}
                className="flex items-center gap-0.5 text-xs text-[var(--color-accent)]"
              >
                Все <ChevronRight size={12} />
              </button>
            </div>
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

        {transactions.length === 0 && myAccounts.length === 0 && (
          <div className="text-center py-8 text-[var(--color-text-tertiary)]">
            <p className="text-3xl mb-2">💰</p>
            <p className="text-sm">Добавьте счета и начните отслеживать расходы</p>
          </div>
        )}
      </motion.div>

      <AddTransactionSheet />
    </div>
  )
}
