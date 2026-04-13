import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'
import { useBudget, CURRENCY_SYMBOLS } from '@/hooks/useBudget'
import { CategoryPicker } from './CategoryPicker'
import { formatLocalDate } from '@/store'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Currency, TransactionType, Transaction } from '@/types/budget'

const CURRENCIES: Currency[] = ['THB', 'RUB', 'USD', 'EUR']
const LAST_CATEGORY_KEY = 'budget_last_category'

interface AddTransactionSheetProps {
  editingTransaction?: Transaction | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const AddTransactionSheet: React.FC<AddTransactionSheetProps> = ({
  editingTransaction,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen

  const { budgetContext, budgetCategories } = useAppStore()
  const { addTransaction, updateTransaction } = useBudget()

  const defaultCurrency: Currency = budgetContext === 'personal' ? 'THB' : 'RUB'
  const defaultType: TransactionType = budgetContext === 'work' ? 'shared' : 'shared'

  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>(defaultCurrency)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [type, setType] = useState<TransactionType>(defaultType)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(formatLocalDate(new Date()))
  const [submitting, setSubmitting] = useState(false)

  const isEditing = !!editingTransaction

  // Set defaults when opening
  useEffect(() => {
    if (open) {
      if (editingTransaction) {
        setAmount(String(editingTransaction.amount))
        setCurrency(editingTransaction.currency)
        setCategoryId(editingTransaction.category_id)
        setType(editingTransaction.type)
        setDescription(editingTransaction.description || '')
        setDate(editingTransaction.date)
      } else {
        setAmount('')
        setCurrency(budgetContext === 'personal' ? 'THB' : 'RUB')
        setType(budgetContext === 'work' ? 'shared' : 'shared')
        setDescription('')
        setDate(formatLocalDate(new Date()))

        const lastCat = localStorage.getItem(LAST_CATEGORY_KEY)
        if (lastCat && budgetCategories.some(c => c.id === lastCat)) {
          setCategoryId(lastCat)
        } else if (budgetCategories.length > 0) {
          setCategoryId(budgetCategories[0].id)
        }
      }
    }
  }, [open, editingTransaction, budgetContext, budgetCategories])

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0 || !categoryId) return

    setSubmitting(true)
    try {
      if (isEditing && editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          amount: numAmount,
          currency,
          category_id: categoryId,
          type,
          description: description.trim() || null,
          date,
        })
      } else {
        localStorage.setItem(LAST_CATEGORY_KEY, categoryId)
        await addTransaction({
          amount: numAmount,
          currency,
          category_id: categoryId,
          context: budgetContext,
          type,
          description: description.trim() || null,
          date,
        })
      }
      setOpen(false)
    } catch {
      // Error handled in hook
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = parseFloat(amount) > 0 && categoryId

  return (
    <>
      {/* FAB button — only shown when not controlled externally */}
      {!controlledOnOpenChange && (
        <motion.button
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-20 sm:bottom-6 z-30 w-14 h-14 rounded-full bg-[var(--color-accent)] text-white shadow-lg flex items-center justify-center hover:bg-[var(--color-accent-hover)] transition-colors"
          whileTap={{ scale: 0.9 }}
          aria-label="Добавить транзакцию"
        >
          <Plus size={24} />
        </motion.button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl bg-[var(--color-bg-elevated)] max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-[var(--color-text-primary)] text-base">
              {isEditing ? 'Редактировать' : 'Новая транзакция'}
            </SheetTitle>
          </SheetHeader>

          <div className="px-4 pb-6 space-y-4">
            {/* Amount input */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl text-[var(--color-text-tertiary)]">
                  {CURRENCY_SYMBOLS[currency]}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                    setAmount(val)
                  }}
                  className="text-4xl font-bold text-center bg-transparent text-[var(--color-text-primary)] outline-none w-48"
                  autoFocus
                />
              </div>
            </div>

            {/* Category picker */}
            <CategoryPicker
              categories={budgetCategories}
              selectedId={categoryId}
              onSelect={setCategoryId}
            />

            {/* Bottom controls row */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Currency */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="px-2 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm border-none outline-none"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Type toggle (only for personal context) */}
              {budgetContext === 'personal' && (
                <div className="inline-flex rounded-lg bg-[var(--color-bg-tertiary)] p-0.5">
                  {(['shared', 'personal'] as TransactionType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        type === t
                          ? 'text-[var(--color-text-primary)]'
                          : 'text-[var(--color-text-tertiary)]'
                      }`}
                    >
                      {type === t && (
                        <motion.div
                          layoutId="txnType"
                          className="absolute inset-0 bg-[var(--color-bg-elevated)] rounded-md shadow-sm"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">
                        {t === 'shared' ? 'Общая' : 'Моя'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Date */}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm border-none outline-none"
              />
            </div>

            {/* Description */}
            <input
              type="text"
              placeholder="Описание (опционально)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-tertiary)] outline-none"
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full py-3 rounded-xl bg-[var(--color-accent)] text-white font-medium text-sm hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Сохранение...'
                : isEditing
                  ? 'Сохранить'
                  : 'Добавить'
              }
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
