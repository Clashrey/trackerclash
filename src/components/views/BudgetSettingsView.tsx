import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Archive, Copy, Users, Link2, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store'
import { useBudget, formatAmount, CURRENCY_SYMBOLS } from '@/hooks/useBudget'
import { BudgetContextSwitcher } from '@/components/BudgetContextSwitcher'
import { variants, transitions } from '@/lib/animations'
import type { Currency, BudgetCategory } from '@/types/budget'

// Emoji groups for picker
const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Еда', emojis: ['🍕', '🍔', '🍜', '🥗', '☕', '🍺', '🛒', '🍣', '🧁', '🥐'] },
  { label: 'Дом', emojis: ['🏠', '🏡', '🛋️', '💡', '🧹', '🔧', '🪴', '🛏️', '🚿', '🗑️'] },
  { label: 'Транспорт', emojis: ['🚗', '🚕', '🚌', '✈️', '🚆', '⛽', '🛵', '🚲', '🚇', '🛩️'] },
  { label: 'Деньги', emojis: ['💸', '💰', '💳', '🏦', '📊', '💎', '📈', '🪙', '💵', '🧾'] },
  { label: 'Развлечения', emojis: ['🎬', '🎮', '🎵', '📚', '🎨', '🎭', '🎯', '🏋️', '⚽', '🎪'] },
  { label: 'Здоровье', emojis: ['💊', '🏥', '🧘', '💆', '🦷', '👓', '🩺', '💉', '🧬', '🌿'] },
  { label: 'Другое', emojis: ['📱', '👕', '🎓', '📦', '📢', '💻', '👤', '🏢', '🎁', '🔑'] },
]

const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#F7B801',
  '#95E1D3', '#C6A8FA', '#87CEEB', '#98D8C8', '#F7DC6F',
  '#E74C3C', '#3498DB', '#9B59B6', '#E67E22', '#1ABC9C',
  '#2ECC71', '#BDC3C7', '#95A5A6',
]

export const BudgetSettingsView: React.FC = () => {
  const {
    couple,
    budgetContext,
    budgetCategories,
    budgetLimits,
    budgetSelectedMonth,
    incomeSources,
    monthlyIncomes,
  } = useAppStore()
  const {
    createCouple,
    joinCouple,
    addCategory,
    updateCategory,
    archiveCategory,
    setBudgetLimit,
    copyLimitsFromPrevMonth,
    addIncomeSource,
    archiveIncomeSource,
    setMonthlyIncome,
  } = useBudget()

  const [inviteInput, setInviteInput] = useState('')
  const [joiningCouple, setJoiningCouple] = useState(false)
  const [creatingCouple, setCreatingCouple] = useState(false)

  // Category editing
  const [editingCat, setEditingCat] = useState<BudgetCategory | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [catName, setCatName] = useState('')
  const [catEmoji, setCatEmoji] = useState('📦')
  const [catColor, setCatColor] = useState('#BDC3C7')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Limits
  const [limitInputs, setLimitInputs] = useState<Record<string, string>>({})

  // Income sources
  const [showAddSource, setShowAddSource] = useState(false)
  const [sourceName, setSourceName] = useState('')
  const [sourceEmoji, setSourceEmoji] = useState('💼')
  const [incomeInputs, setIncomeInputs] = useState<Record<string, string>>({})
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null)

  const INCOME_EMOJIS = ['💼', '🏢', '💻', '📊', '🎯', '📝', '🛠️', '🎨', '📱', '🌐']

  const defaultCurrency: Currency = budgetContext === 'personal' ? 'THB' : 'RUB'

  useEffect(() => {
    const inputs: Record<string, string> = {}
    for (const limit of budgetLimits) {
      inputs[limit.category_id] = String(limit.amount)
    }
    setLimitInputs(inputs)
  }, [budgetLimits])

  useEffect(() => {
    const inputs: Record<string, string> = {}
    for (const inc of monthlyIncomes) {
      inputs[inc.source_id] = String(inc.amount)
    }
    setIncomeInputs(inputs)
  }, [monthlyIncomes])

  const handleAddSource = async () => {
    if (!sourceName.trim()) return
    const source = await addIncomeSource({ name: sourceName.trim(), emoji: sourceEmoji })
    setSourceName('')
    setSourceEmoji('💼')
    setShowAddSource(false)
    // Сразу открыть ввод суммы для нового источника
    if (source) {
      setEditingIncomeId(source.id)
    }
  }

  const handleSaveIncome = async (sourceId: string) => {
    const val = parseFloat(incomeInputs[sourceId] || '0')
    if (val <= 0) return
    await setMonthlyIncome({
      source_id: sourceId,
      month: budgetSelectedMonth,
      amount: val,
      currency: defaultCurrency,
    })
    setEditingIncomeId(null)
  }

  const handleCreateCouple = async () => {
    setCreatingCouple(true)
    try {
      await createCouple()
    } finally {
      setCreatingCouple(false)
    }
  }

  const handleJoinCouple = async () => {
    if (!inviteInput.trim()) return
    setJoiningCouple(true)
    try {
      await joinCouple(inviteInput.trim())
      setInviteInput('')
    } finally {
      setJoiningCouple(false)
    }
  }

  const handleAddCategory = async () => {
    if (!catName.trim()) return
    await addCategory({
      name: catName.trim(),
      emoji: catEmoji,
      color: catColor,
      context: budgetContext,
    })
    setCatName('')
    setCatEmoji('📦')
    setCatColor('#BDC3C7')
    setShowAddCategory(false)
  }

  const handleUpdateCategory = async () => {
    if (!editingCat || !catName.trim()) return
    await updateCategory(editingCat.id, {
      name: catName.trim(),
      emoji: catEmoji,
      color: catColor,
    })
    setEditingCat(null)
  }

  const openEditCategory = (cat: BudgetCategory) => {
    setEditingCat(cat)
    setCatName(cat.name)
    setCatEmoji(cat.emoji)
    setCatColor(cat.color || '#BDC3C7')
    setShowAddCategory(false)
  }

  const handleSaveLimit = async (categoryId: string) => {
    const val = parseFloat(limitInputs[categoryId] || '0')
    if (val <= 0) return
    await setBudgetLimit({
      category_id: categoryId,
      amount: val,
      currency: defaultCurrency,
      month: budgetSelectedMonth,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Настройки</h2>
        <BudgetContextSwitcher />
      </div>

      {/* Couple setup */}
      <motion.div
        variants={variants.listItem}
        initial="hidden"
        animate="visible"
        transition={transitions.smooth}
        className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-3"
      >
        <div className="flex items-center gap-2">
          <Users size={16} className="text-[var(--color-text-tertiary)]" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Связка пары</p>
        </div>

        {!couple ? (
          <div className="space-y-3">
            <button
              onClick={handleCreateCouple}
              disabled={creatingCouple}
              className="w-full py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
            >
              {creatingCouple ? 'Создание...' : 'Создать пару'}
            </button>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Код приглашения"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-tertiary)] outline-none"
              />
              <button
                onClick={handleJoinCouple}
                disabled={joiningCouple || !inviteInput.trim()}
                className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
              >
                {joiningCouple ? '...' : 'Войти'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[var(--color-success)]">
              <Link2 size={14} />
              <span>Пара создана</span>
            </div>
            {!couple.user2_id && (
              <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Код для партнёра:</p>
                <p className="text-lg font-mono font-bold text-[var(--color-accent)] tracking-wider">
                  {couple.invite_code}
                </p>
              </div>
            )}
            {couple.user2_id && (
              <p className="text-xs text-[var(--color-text-tertiary)]">{couple.user2_name || 'Партнёр'} подключен(а)</p>
            )}
          </div>
        )}
      </motion.div>

      {/* Categories management */}
      {couple && (
        <motion.div
          variants={variants.listItem}
          initial="hidden"
          animate="visible"
          transition={transitions.smooth}
          className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-3"
        >
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Категории</p>

          <div className="space-y-1">
            {budgetCategories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] group"
              >
                <span className="text-lg">{cat.emoji}</span>
                <button
                  onClick={() => openEditCategory(cat)}
                  className="flex-1 text-left text-sm text-[var(--color-text-primary)]"
                >
                  {cat.name}
                </button>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color || '#ccc' }}
                />
                <button
                  onClick={() => archiveCategory(cat.id)}
                  className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-all"
                  title="Архивировать"
                >
                  <Archive size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Add/Edit category form */}
          <AnimatePresence>
            {(showAddCategory || editingCat) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={transitions.smooth}
                className="space-y-3 pt-2 border-t border-[var(--color-border-secondary)]"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-2xl p-1 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
                  >
                    {catEmoji}
                  </button>
                  <input
                    type="text"
                    placeholder="Название"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none"
                  />
                </div>

                {showEmojiPicker && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {EMOJI_GROUPS.map(group => (
                      <div key={group.label}>
                        <p className="text-[10px] text-[var(--color-text-tertiary)] mb-1">{group.label}</p>
                        <div className="flex flex-wrap gap-1">
                          {group.emojis.map(e => (
                            <button
                              key={e}
                              onClick={() => { setCatEmoji(e); setShowEmojiPicker(false) }}
                              className={`text-xl p-1 rounded hover:bg-[var(--color-bg-tertiary)] ${
                                catEmoji === e ? 'bg-[var(--color-accent-10)]' : ''
                              }`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCatColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        catColor === c ? 'border-[var(--color-text-primary)]' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={editingCat ? handleUpdateCategory : handleAddCategory}
                    disabled={!catName.trim()}
                    className="flex-1 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-50"
                  >
                    {editingCat ? 'Сохранить' : 'Добавить'}
                  </button>
                  <button
                    onClick={() => { setEditingCat(null); setShowAddCategory(false) }}
                    className="px-4 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showAddCategory && !editingCat && (
            <button
              onClick={() => { setShowAddCategory(true); setCatName(''); setCatEmoji('📦'); setCatColor('#BDC3C7') }}
              className="flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              <Plus size={14} />
              Добавить категорию
            </button>
          )}
        </motion.div>
      )}

      {/* Budget limits */}
      {couple && budgetCategories.length > 0 && (
        <motion.div
          variants={variants.listItem}
          initial="hidden"
          animate="visible"
          transition={transitions.smooth}
          className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Лимиты</p>
            <button
              onClick={copyLimitsFromPrevMonth}
              className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              <Copy size={12} />
              С прошлого месяца
            </button>
          </div>

          <div className="space-y-2">
            {budgetCategories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2">
                <span className="text-sm w-24 truncate text-[var(--color-text-primary)]">
                  {cat.emoji} {cat.name}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={limitInputs[cat.id] || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                    setLimitInputs(prev => ({ ...prev, [cat.id]: val }))
                  }}
                  onBlur={() => handleSaveLimit(cat.id)}
                  className="flex-1 px-2 py-1 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm text-right outline-none"
                />
                <span className="text-xs text-[var(--color-text-tertiary)] w-6">
                  {CURRENCY_SYMBOLS[defaultCurrency]}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Income sources (work context only) */}
      {couple && budgetContext === 'work' && (
        <motion.div
          variants={variants.listItem}
          initial="hidden"
          animate="visible"
          transition={transitions.smooth}
          className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Источники дохода</p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">нажмите на сумму для ввода</p>
          </div>

          <div className="space-y-2">
            {incomeSources.filter(s => s.is_active).map(source => {
              const monthlyIncome = monthlyIncomes.find(i => i.source_id === source.id)
              const isEditing = editingIncomeId === source.id

              return (
                <div key={source.id} className="flex items-center gap-2 group">
                  <span className="text-sm">{source.emoji}</span>
                  <span className="text-sm text-[var(--color-text-primary)] flex-1 truncate">
                    {source.name}
                  </span>

                  {isEditing ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      autoFocus
                      placeholder="0"
                      value={incomeInputs[source.id] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                        setIncomeInputs(prev => ({ ...prev, [source.id]: val }))
                      }}
                      onBlur={() => handleSaveIncome(source.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveIncome(source.id) }}
                      className="w-28 px-2 py-1 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm text-right outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingIncomeId(source.id)}
                      className={`text-sm px-2 py-0.5 rounded-md transition-colors ${
                        monthlyIncome
                          ? 'text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-bg-tertiary)]'
                          : 'text-[var(--color-accent)] bg-[var(--color-accent-10,rgba(59,130,246,0.1))] hover:bg-[var(--color-accent-20,rgba(59,130,246,0.15))]'
                      }`}
                    >
                      {monthlyIncome
                        ? formatAmount(Number(monthlyIncome.amount), monthlyIncome.currency)
                        : `Указать сумму`}
                    </button>
                  )}

                  <button
                    onClick={() => archiveIncomeSource(source.id)}
                    className="p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-all"
                    title="Удалить"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>

          <AnimatePresence>
            {showAddSource && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={transitions.smooth}
                className="space-y-2 pt-2 border-t border-[var(--color-border-secondary)]"
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-wrap">
                    {INCOME_EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => setSourceEmoji(e)}
                        className={`text-lg p-0.5 rounded ${sourceEmoji === e ? 'bg-[var(--color-accent-10)]' : ''}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Название источника"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-sm outline-none"
                  />
                  <button
                    onClick={handleAddSource}
                    disabled={!sourceName.trim()}
                    className="px-4 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-50"
                  >
                    Добавить
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showAddSource && (
            <button
              onClick={() => setShowAddSource(true)}
              className="flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              <Plus size={14} />
              Добавить источник
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}
