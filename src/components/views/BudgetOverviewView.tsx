import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Wallet, TrendingDown, ChevronRight, ChevronDown, ChevronUp,
  CalendarClock, Trash2, Check, Bell,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { useBudget, formatAmount, CURRENCY_SYMBOLS } from '@/hooks/useBudget'
import { budgetDatabaseService } from '@/lib/budget-database'
import { BudgetContextSwitcher } from '@/components/BudgetContextSwitcher'
import { AddTransactionSheet } from '@/components/budget/AddTransactionSheet'
import { CategoryPicker } from '@/components/budget/CategoryPicker'
import { variants, transitions } from '@/lib/animations'
import type { Currency, RecurringExpenseType } from '@/types/budget'

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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const ACCOUNT_EMOJIS = ['🏦', '💳', '💰', '🪙', '📱', '🏧', '💵', '🐖', '🔐', '🏠']
const EXPENSE_EMOJIS = ['📅', '🔄', '🏠', '🏍️', '📱', '💡', '🎬', '🏋️', '☁️', '🎵', '📦', '🛡️']

// Russian day declension: "1 день", "3 дня", "5 дней"
function pluralDays(n: number): string {
  const abs = Math.abs(n)
  if (abs % 10 === 1 && abs % 100 !== 11) return `${abs} день`
  if (abs % 10 >= 2 && abs % 10 <= 4 && (abs % 100 < 10 || abs % 100 >= 20)) return `${abs} дня`
  return `${abs} дней`
}

type BillState = 'overdue' | 'today' | 'soon' | 'upcoming' | 'paid'

function getBillState(dayOfMonth: number, todayDay: number, isPaid: boolean): BillState {
  if (isPaid) return 'paid'
  const diff = dayOfMonth - todayDay
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 3) return 'soon'
  return 'upcoming'
}

function getBillDateLabel(dayOfMonth: number, todayDay: number, isPaid: boolean): string {
  if (isPaid) return 'оплачено'
  const diff = dayOfMonth - todayDay
  if (diff < 0) return `просрочено на ${pluralDays(-diff)}`
  if (diff === 0) return 'сегодня'
  return `через ${pluralDays(diff)}`
}

const BILL_STATE_STYLES: Record<BillState, { dot: string; text: string; bg: string }> = {
  overdue: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  today: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  soon: { dot: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-400', bg: '' },
  upcoming: { dot: 'bg-gray-300 dark:bg-gray-600', text: 'text-[var(--color-text-tertiary)]', bg: '' },
  paid: { dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400', bg: '' },
}

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
    addAccount,
    updateAccount,
    deleteAccount,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    markExpensePaid,
  } = useBudget()

  // Account form
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
  const [expType, setExpType] = useState<RecurringExpenseType>('bill')
  const [expCategoryId, setExpCategoryId] = useState<string | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editExpAmount, setEditExpAmount] = useState('')

  // Collapsible balance
  const [balanceExpanded, setBalanceExpanded] = useState(false)
  // Collapsible recurring sub-blocks
  const [billsExpanded, setBillsExpanded] = useState(true)
  const [subsExpanded, setSubsExpanded] = useState(false)
  const [paidVisible, setPaidVisible] = useState(false)

  // Expense payment status for current month
  const [paidMap, setPaidMap] = useState<Record<string, boolean>>({})

  // Load payment status
  useEffect(() => {
    if (!couple) return
    const month = getCurrentMonth()
    budgetDatabaseService.getExpensePaymentsForMonth(couple.id, month).then(setPaidMap)
  }, [couple, transactions])

  const defaultCurrency: Currency = budgetContext === 'personal' ? 'THB' : 'RUB'

  // ─── Spending calculations ──────────────────────────

  const today = getTodayStr()
  const week = getWeekBounds()

  const spentToday = useMemo(() =>
    transactions.filter(t => t.date === today).reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions, today])

  const spentThisWeek = useMemo(() =>
    transactions.filter(t => t.date >= week.start && t.date <= week.end).reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions, week])

  const spentThisMonth = useMemo(() =>
    transactions.reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions])

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

  const myAccounts = useMemo(() => accounts.filter(a => a.user_id === userId), [accounts, userId])
  const partnerAccounts = useMemo(() => accounts.filter(a => a.user_id !== userId), [accounts, userId])
  const myBalance = useMemo(() => myAccounts.reduce((sum, a) => sum + Number(a.balance), 0), [myAccounts])
  const partnerBalance = useMemo(() => partnerAccounts.reduce((sum, a) => sum + Number(a.balance), 0), [partnerAccounts])
  const totalBalance = myBalance + partnerBalance

  // ─── Recurring expenses ─────────────────────────────

  const bills = useMemo(() => recurringExpenses.filter(e => e.type === 'bill'), [recurringExpenses])
  const subscriptions = useMemo(() => recurringExpenses.filter(e => e.type === 'subscription'), [recurringExpenses])

  const totalRecurring = useMemo(() =>
    recurringExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [recurringExpenses])

  const todayDay = new Date().getDate()

  // Notifications: unpaid bills due today or overdue
  const dueBills = useMemo(() =>
    bills.filter(b => b.day_of_month <= todayDay && !paidMap[b.id]),
    [bills, todayDay, paidMap])

  // Sort by next occurrence
  const sortByNext = (items: typeof recurringExpenses) => {
    return [...items].sort((a, b) => {
      const aNext = a.day_of_month >= todayDay ? a.day_of_month - todayDay : a.day_of_month + 31 - todayDay
      const bNext = b.day_of_month >= todayDay ? b.day_of_month - todayDay : b.day_of_month + 31 - todayDay
      return aNext - bNext
    })
  }

  const recentTransactions = transactions.slice(0, 5)

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
    await addAccount({ name: newAccountName.trim(), emoji: newAccountEmoji, currency: newAccountCurrency, balance })
    setNewAccountName(''); setNewAccountEmoji('🏦'); setNewAccountBalance(''); setShowAddAccount(false)
  }

  const handleUpdateBalance = async (accountId: string) => {
    const val = parseFloat(editBalance.replace(',', '.'))
    if (isNaN(val)) return
    await updateAccount(accountId, { balance: val })
    setEditingAccountId(null)
  }

  const handleAddExpense = async () => {
    const amount = parseFloat(expAmount.replace(',', '.'))
    const day = parseInt(expDay)
    if (!expName.trim() || isNaN(amount) || isNaN(day) || day < 1 || day > 31) return
    await addRecurringExpense({
      name: expName.trim(), emoji: expEmoji, amount, currency: expCurrency,
      day_of_month: day, type: expType, context: budgetContext,
      category_id: expType === 'bill' ? expCategoryId : null,
    })
    setExpName(''); setExpEmoji('📅'); setExpAmount(''); setExpDay(''); setExpCategoryId(null); setShowAddExpense(false)
  }

  const handleUpdateExpenseAmount = async (id: string) => {
    const val = parseFloat(editExpAmount.replace(',', '.'))
    if (isNaN(val)) return
    await updateRecurringExpense(id, { amount: val })
    setEditingExpenseId(null)
  }

  const handleMarkPaid = async (expenseId: string) => {
    await markExpensePaid(expenseId)
    setPaidMap(prev => ({ ...prev, [expenseId]: true }))
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

      {/* ═══ DUE BILLS NOTIFICATION ═══ */}
      {dueBills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-[var(--color-warning-bg,#FFF3CD)] border border-[var(--color-warning-border,#F0C040)] dark:bg-amber-900/20 dark:border-amber-700/50"
        >
          <div className="flex items-start gap-2">
            <Bell size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Нужно оплатить
              </p>
              {dueBills.map(bill => (
                <div key={bill.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-amber-900 dark:text-amber-200">
                    {bill.emoji} {bill.name} · {bill.day_of_month}-е · {formatAmount(Number(bill.amount), bill.currency)}
                  </span>
                  <button
                    onClick={() => handleMarkPaid(bill.id)}
                    className="flex-shrink-0 px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-medium hover:bg-amber-700 transition-colors"
                  >
                    Оплачено
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        variants={variants.staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {/* ═══ BALANCE SECTION (collapsible) ═══ */}
        <motion.div
          variants={variants.listItem}
          transition={transitions.smooth}
          className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]"
        >
          <button
            onClick={() => setBalanceExpanded(!balanceExpanded)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Wallet size={14} className="text-[var(--color-text-tertiary)]" />
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Баланс</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-[var(--color-text-primary)]">
                {formatAmount(totalBalance, defaultCurrency)}
              </span>
              {balanceExpanded ? <ChevronUp size={12} className="text-[var(--color-text-tertiary)]" /> : <ChevronDown size={12} className="text-[var(--color-text-tertiary)]" />}
            </div>
          </button>

          <AnimatePresence>
            {balanceExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={transitions.smooth}
                className="mt-3 space-y-3"
              >
                {/* Per-user balances */}
                <div className="flex gap-4">
                  <div className="flex-1 p-2 rounded-lg bg-[var(--color-bg-tertiary)]">
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">Мой</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{formatAmount(myBalance, defaultCurrency)}</p>
                  </div>
                  {couple.user2_id && (
                    <div className="flex-1 p-2 rounded-lg bg-[var(--color-bg-tertiary)]">
                      <p className="text-[10px] text-[var(--color-text-tertiary)]">Партнёр</p>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{formatAmount(partnerBalance, defaultCurrency)}</p>
                    </div>
                  )}
                </div>

                {/* My accounts */}
                {myAccounts.length > 0 && (
                  <div className="space-y-1.5">
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
                              type="text" inputMode="decimal" value={editBalance}
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
                            onClick={() => { if (window.confirm('Удалить счёт?')) deleteAccount(acc.id) }}
                            className="p-0.5 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Partner accounts */}
                {partnerAccounts.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">Счета партнёра</p>
                    {partnerAccounts.map(acc => (
                      <div key={acc.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{acc.emoji}</span>
                          <span className="text-sm text-[var(--color-text-secondary)]">{acc.name}</span>
                        </div>
                        <span className="text-sm text-[var(--color-text-secondary)]">{formatAmount(Number(acc.balance), acc.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add account */}
                <AnimatePresence>
                  {showAddAccount && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      transition={transitions.smooth}
                      className="space-y-2 pt-2 border-t border-[var(--color-border-secondary)]"
                    >
                      <div className="flex gap-1.5 flex-wrap">
                        {ACCOUNT_EMOJIS.map(e => (
                          <button key={e} onClick={() => setNewAccountEmoji(e)}
                            className={`text-lg p-1 rounded ${newAccountEmoji === e ? 'bg-[var(--color-accent-10)]' : 'hover:bg-[var(--color-bg-tertiary)]'}`}
                          >{e}</button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Название" value={newAccountName}
                          onChange={(e) => setNewAccountName(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none" />
                        <input type="text" inputMode="decimal" placeholder="Сумма" value={newAccountBalance}
                          onChange={(e) => setNewAccountBalance(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                          className="w-28 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm text-right outline-none" />
                      </div>
                      <div className="flex gap-2">
                        <select value={newAccountCurrency} onChange={(e) => setNewAccountCurrency(e.target.value as Currency)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none">
                          {(['THB', 'RUB', 'USD', 'EUR'] as Currency[]).map(c => (
                            <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>
                          ))}
                        </select>
                        <button onClick={handleAddAccount} disabled={!newAccountName.trim() || !newAccountBalance}
                          className="flex-1 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-50">
                          Добавить
                        </button>
                        <button onClick={() => setShowAddAccount(false)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-sm">
                          Отмена
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showAddAccount && (
                  <button onClick={() => setShowAddAccount(true)}
                    className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]">
                    <Plus size={12} /> Добавить счёт
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

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
              <p className="text-lg font-bold text-[var(--color-text-primary)]">{formatAmount(spentToday, defaultCurrency)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-text-tertiary)] mb-0.5">Неделя</p>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">{formatAmount(spentThisWeek, defaultCurrency)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-text-tertiary)] mb-0.5">Месяц</p>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">{formatAmount(spentThisMonth, defaultCurrency)}</p>
            </div>
          </div>
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

          {/* ── Bills sub-block ── */}
          {bills.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => setBillsExpanded(!billsExpanded)}
                className="flex items-center gap-1.5 w-full py-1"
              >
                {billsExpanded
                  ? <ChevronDown size={12} className="text-[var(--color-text-tertiary)]" />
                  : <ChevronRight size={12} className="text-[var(--color-text-tertiary)]" />}
                <p className="text-[10px] text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                  Счета и оплаты ({bills.filter(b => !paidMap[b.id]).length}/{bills.length})
                </p>
              </button>
              <AnimatePresence>
                {billsExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    transition={transitions.smooth}
                    className="space-y-1"
                  >
                    {(() => {
                      const sorted = sortByNext(bills)
                      const unpaid = sorted.filter(b => !paidMap[b.id])
                      const paid = sorted.filter(b => paidMap[b.id])
                      return (
                        <>
                          {unpaid.map(exp => {
                            const state = getBillState(exp.day_of_month, todayDay, false)
                            const styles = BILL_STATE_STYLES[state]
                            const dateLabel = getBillDateLabel(exp.day_of_month, todayDay, false)
                            return (
                              <div key={exp.id} className={`flex items-center justify-between py-2 px-2 rounded-lg group ${styles.bg}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`} />
                                  <span className="text-base">{exp.emoji}</span>
                                  <div>
                                    <span className="text-sm text-[var(--color-text-primary)]">{exp.name}</span>
                                    <p className={`text-[10px] ${styles.text}`}>
                                      {exp.day_of_month}-е · {dateLabel}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {editingExpenseId === exp.id ? (
                                    <input type="text" inputMode="decimal" value={editExpAmount}
                                      onChange={(e) => setEditExpAmount(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                                      onBlur={() => handleUpdateExpenseAmount(exp.id)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateExpenseAmount(exp.id) }}
                                      autoFocus
                                      className="w-24 px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-sm text-right text-[var(--color-text-primary)] outline-none" />
                                  ) : (
                                    <button
                                      onClick={() => { setEditingExpenseId(exp.id); setEditExpAmount(String(exp.amount)) }}
                                      className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors">
                                      {formatAmount(Number(exp.amount), exp.currency)}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleMarkPaid(exp.id)}
                                    className="p-1 rounded-md bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:bg-green-500 hover:text-white transition-colors"
                                    title="Отметить оплаченным"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    onClick={() => { if (window.confirm('Удалить расход?')) deleteRecurringExpense(exp.id) }}
                                    className="p-0.5 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            )
                          })}

                          {/* Paid items — collapsed by default */}
                          {paid.length > 0 && (
                            <>
                              <button
                                onClick={() => setPaidVisible(!paidVisible)}
                                className="flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)] mt-1"
                              >
                                {paidVisible ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                Оплачено ({paid.length})
                              </button>
                              <AnimatePresence>
                                {paidVisible && paid.map(exp => (
                                  <motion.div
                                    key={exp.id}
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center justify-between py-1.5 px-2 rounded-lg group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-green-500" />
                                      <span className="text-base opacity-50">{exp.emoji}</span>
                                      <div>
                                        <span className="text-sm text-[var(--color-text-tertiary)] line-through">{exp.name}</span>
                                        <p className="text-[10px] text-green-600 dark:text-green-400">оплачено</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm text-[var(--color-text-tertiary)]">
                                        {formatAmount(Number(exp.amount), exp.currency)}
                                      </span>
                                      <span className="p-1 rounded-md bg-green-500 text-white">
                                        <Check size={12} />
                                      </span>
                                      <button
                                        onClick={() => { if (window.confirm('Удалить расход?')) deleteRecurringExpense(exp.id) }}
                                        className="p-0.5 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </>
                          )}
                        </>
                      )
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── Subscriptions sub-block ── */}
          {subscriptions.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => setSubsExpanded(!subsExpanded)}
                className="flex items-center gap-1.5 w-full py-1"
              >
                {subsExpanded
                  ? <ChevronDown size={12} className="text-[var(--color-text-tertiary)]" />
                  : <ChevronRight size={12} className="text-[var(--color-text-tertiary)]" />}
                <p className="text-[10px] text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                  Подписки ({subscriptions.length})
                </p>
              </button>
              <AnimatePresence>
                {subsExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    transition={transitions.smooth}
                    className="space-y-1"
                  >
                    {sortByNext(subscriptions).map(exp => {
                      const charged = exp.day_of_month <= todayDay
                      const dateLabel = charged
                        ? 'списано'
                        : getBillDateLabel(exp.day_of_month, todayDay, false)
                      return (
                        <div key={exp.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg group">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${charged ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                            <span className="text-base">{exp.emoji}</span>
                            <div>
                              <span className={`text-sm ${charged ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-primary)]'}`}>
                                {exp.name}
                              </span>
                              <p className="text-[10px] text-[var(--color-text-tertiary)]">
                                {exp.day_of_month}-е · {dateLabel} · авто
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {editingExpenseId === exp.id ? (
                              <input type="text" inputMode="decimal" value={editExpAmount}
                                onChange={(e) => setEditExpAmount(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                                onBlur={() => handleUpdateExpenseAmount(exp.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateExpenseAmount(exp.id) }}
                                autoFocus
                                className="w-24 px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-sm text-right text-[var(--color-text-primary)] outline-none" />
                            ) : (
                              <button
                                onClick={() => { setEditingExpenseId(exp.id); setEditExpAmount(String(exp.amount)) }}
                                className={`text-sm font-medium transition-colors hover:text-[var(--color-accent)] ${charged ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-primary)]'}`}>
                                {formatAmount(Number(exp.amount), exp.currency)}
                              </button>
                            )}
                            <button
                              onClick={() => { if (window.confirm('Удалить расход?')) deleteRecurringExpense(exp.id) }}
                              className="p-0.5 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Add form */}
          <AnimatePresence>
            {showAddExpense && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={transitions.smooth}
                className="space-y-2 pt-2 border-t border-[var(--color-border-secondary)]"
              >
                {/* Type toggle */}
                <div className="flex gap-1 p-0.5 rounded-lg bg-[var(--color-bg-tertiary)] w-fit">
                  <button
                    onClick={() => setExpType('bill')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      expType === 'bill' ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-tertiary)]'
                    }`}
                  >
                    Счёт/оплата
                  </button>
                  <button
                    onClick={() => setExpType('subscription')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      expType === 'subscription' ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-tertiary)]'
                    }`}
                  >
                    Подписка
                  </button>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {EXPENSE_EMOJIS.map(e => (
                    <button key={e} onClick={() => setExpEmoji(e)}
                      className={`text-lg p-1 rounded ${expEmoji === e ? 'bg-[var(--color-accent-10)]' : 'hover:bg-[var(--color-bg-tertiary)]'}`}
                    >{e}</button>
                  ))}
                </div>
                <input type="text" placeholder="Название" value={expName}
                  onChange={(e) => setExpName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none" />

                {/* Category picker for bills */}
                {expType === 'bill' && budgetCategories.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] mb-1">Категория (опционально)</p>
                    <CategoryPicker
                      categories={budgetCategories}
                      selectedId={expCategoryId}
                      onSelect={(id) => setExpCategoryId(expCategoryId === id ? null : id)}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <input type="text" inputMode="decimal" placeholder="Сумма" value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm text-right outline-none" />
                  <input type="text" inputMode="numeric" placeholder="День" value={expDay}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '')
                      if (v === '' || (Number(v) >= 1 && Number(v) <= 31)) setExpDay(v)
                    }}
                    className="w-16 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm text-center outline-none" />
                  <select value={expCurrency} onChange={(e) => setExpCurrency(e.target.value as Currency)}
                    className="px-2 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none">
                    {(['THB', 'RUB', 'USD', 'EUR'] as Currency[]).map(c => (
                      <option key={c} value={c}>{CURRENCY_SYMBOLS[c]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddExpense} disabled={!expName.trim() || !expAmount || !expDay}
                    className="flex-1 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-50">
                    Добавить
                  </button>
                  <button onClick={() => setShowAddExpense(false)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-sm">
                    Отмена
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showAddExpense && (
            <button onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] mt-1">
              <Plus size={12} /> Добавить
            </button>
          )}
        </motion.div>

        {/* ═══ TOP CATEGORIES ═══ */}
        {topCategories.length > 0 && (
          <motion.div
            variants={variants.listItem} transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-2.5"
          >
            <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Лидеры расходов</p>
            {topCategories.slice(0, 5).map(({ cat, total }, i) => {
              const pct = (total / maxCategoryTotal) * 100
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.emoji}</span>
                      <span className="text-sm text-[var(--color-text-primary)]">{cat.name}</span>
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{formatAmount(total, defaultCurrency)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
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
            variants={variants.listItem} transition={transitions.smooth}
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
                    <span className="text-[var(--color-text-primary)]">{cat?.emoji} {cat?.name}</span>
                    <span className={isOver ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-tertiary)]'}>
                      {formatAmount(spent, defaultCurrency)} / {formatAmount(Number(limit.amount), defaultCurrency)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={transitions.slow}
                      className="h-full rounded-full"
                      style={{ backgroundColor: isOver ? 'var(--color-danger)' : cat?.color || 'var(--color-accent)' }}
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
            variants={variants.listItem} transition={transitions.smooth}
            className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Последние транзакции</p>
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
                      {txn.description && <p className="text-xs text-[var(--color-text-tertiary)]">{txn.description}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{formatAmount(Number(txn.amount), txn.currency)}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">{txn.date}</p>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        {transactions.length === 0 && myAccounts.length === 0 && recurringExpenses.length === 0 && (
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
