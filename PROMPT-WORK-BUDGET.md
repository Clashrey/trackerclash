<objective>
Реализовать полноценный work-контекст бюджетного модуля TrackerClash: источники дохода с месячным P&L, изоляция счетов по контексту, скрытие shared/personal toggle в work. Только изменения, описанные ниже. Никаких дополнительных фич, рефакторинга или файлов сверх указанного.
</objective>

<starting_state>

## Стек
React 18 + TypeScript 5.8 + Vite, Supabase (PostgreSQL + RLS), Zustand 5, Tailwind CSS 4 (CSS Variables для тем light/dark: `var(--color-*)`), Framer Motion 12, Recharts 2.15, shadcn/ui (New York), Lucide React icons, Sonner toasts, pnpm.

## Архитектура
SPA без роутера. Навигация — `currentCategory` в Zustand store. Два режима: `tracker` и `budget`. Budget имеет два контекста: `personal` (THB) и `work` (RUB). Переключение через `BudgetContextSwitcher` → `setBudgetContext()` → localStorage + Zustand. Все view lazy-loaded. API-key auth через Supabase. Русская локализация.

## Текущее состояние work-контекста
Сейчас work — зеркало personal. Единственные отличия: default currency RUB вместо THB и другой набор категорий (Реклама, SaaS, Подрядчики, Контент, Офис, Налоги, Другое). Все экраны, логика, пара — идентичны personal. Нет доходов, нет P&L, нет изоляции счетов.

## Релевантные файлы

### Views
- `src/components/views/BudgetOverviewView.tsx` (~770 строк) — Обзор: collapsible баланс (Wallet icon, `totalBalance = myBalance + partnerBalance`, счета по пользователям с inline-edit, форма добавления), курсы валют, траты (сегодня/неделя/месяц), обязательные расходы (bills + subscriptions с paidMap, collapsible), лидеры категорий (progress bars), прогресс лимитов, последние 5 транзакций. Баланс НЕ фильтруется по контексту — показывает все счета пары.
- `src/components/views/BudgetTransactionsView.tsx` (~257 строк) — Список транзакций по дням, category filter chips, month navigation, FAB "+".
- `src/components/views/BudgetAnalyticsView.tsx` (~297 строк) — Pie chart по категориям, bar chart 6 мес, прогресс лимитов, split по партнёрам.
- `src/components/views/BudgetSettingsView.tsx` (~389 строк) — Couple setup, CRUD категорий (emoji + color picker), лимиты по категориям. Нет секции для work-специфичных настроек.

### Компоненты
- `src/components/budget/AddTransactionSheet.tsx` (~243 строки) — Bottom sheet: сумма, CategoryPicker, валюта, type toggle (shared/personal — РЕНДЕРИТСЯ ВСЕГДА при personal context, но ТАКЖЕ рендерится при work context, что бессмысленно), дата, описание.
- `src/components/budget/CategoryPicker.tsx` (51 строк) — Grid 5×N, emoji + имя.
- `src/components/BudgetContextSwitcher.tsx` (42 строки) — Toggle «Личный / Рабочий».

### Логика
- `src/hooks/useBudget.ts` (~535 строк) — Все CRUD: `addTransaction`, `updateTransaction`, `deleteTransaction`, `addAccount`, `updateAccount`, `deleteAccount`, `addRecurringExpense`, `markExpensePaid`, `loadBudgetData` (Promise.all: categories, transactions, limits, accounts, recurringExpenses). Экспорт: `formatAmount(amount, currency)`, `CURRENCY_SYMBOLS`.
- `src/lib/budget-database.ts` — BudgetDatabaseService: все Supabase-запросы. `getAccounts(coupleId)` — НЕ фильтрует по контексту. `getTransactions` — фильтрует по context. `getCategories` — фильтрует по context.
- `src/store/index.ts` (~180 строк) — Zustand: `appMode`, `budgetContext`, `couple`, `budgetCategories`, `transactions`, `budgetLimits`, `accounts`, `recurringExpenses`, `exchangeRates`, `budgetSelectedMonth`, `userId`.
- `src/types/budget.ts` (~169 строк) — `Account { id, couple_id, user_id, name, emoji, currency, balance, order_index, is_archived, created_at, updated_at }` — НЕТ поля context. `Transaction { ..., type: TransactionType }` — type 'shared'|'personal'. `Currency`, `BudgetContext`, `TransactionType`.

### Анимации
- `src/lib/animations.ts` — Tokens: `transitions.spring/smooth/slow`, `variants.listItem/staggerContainer/collapse/viewTransition/fadeIn/modal`.

### Паттерны в коде (переиспользовать)
- **Inline-edit**: `editingAccountId` + `editBalance` state → input с onBlur/onKeyDown → `handleUpdateBalance()` → update + clear state. Используется для баланса счетов.
- **Collapsible блок**: `useState(false)` + button с ChevronUp/Down + AnimatePresence + motion.div с `initial/animate/exit` height:0→auto.
- **CRUD список**: emoji picker + name input + кнопка → handler → reset state. Используется для категорий и счетов.
- **Month navigation**: `budgetSelectedMonth` + `navigateMonth(delta)` + ChevronLeft/Right.

</starting_state>

<target_state>

Когда всё готово:

1. **Источники дохода**: новая сущность `IncomeSource` с CRUD в настройках work-контекста. Emoji + имя. Архивация вместо удаления.
2. **Месячный доход**: `MonthlyIncome` — одна запись на источник × месяц. Inline-edit суммы прямо на Overview.
3. **P&L блок на Overview**: при `budgetContext === 'work'` — новый collapsible блок «Результат» с тремя цифрами (доход, расходы, итого). При раскрытии — список источников с суммами. Месячная навигация через существующий `budgetSelectedMonth`.
4. **Счета изолированы по контексту**: таблица `accounts` получает поле `context`. Personal видит personal-счета, work видит work-счета. Форма добавления автоматически ставит текущий контекст.
5. **Shared/personal toggle скрыт в work**: `AddTransactionSheet` не рендерит toggle типа при work-контексте. Все work-транзакции `type: 'shared'`.
6. **P&L в аналитике**: bar chart доходов/расходов/результата по месяцам (только в work).
7. **CRUD источников в настройках**: при work-контексте в Settings появляется секция «Источники дохода».
8. Проект собирается без ошибок (`pnpm build` проходит).

</target_state>

<allowed_actions>
- Редактировать файлы из `<starting_state>`.
- Создавать новые компоненты ТОЛЬКО в `src/components/budget/`.
- Создавать новые файлы типов/утилит ТОЛЬКО в существующих директориях (`src/types/`, `src/lib/`, `src/hooks/`).
- Выполнять SQL-миграции через Supabase CLI или Dashboard (новые таблицы, ALTER TABLE).
- Использовать ТОЛЬКО уже установленные пакеты.
- Использовать CSS Variables `var(--color-*)` для всех цветов.
- Использовать animation tokens из `src/lib/animations.ts`.
- Русская локализация для всех текстов UI.
</allowed_actions>

<forbidden_actions>
- НЕ добавлять новые npm-зависимости.
- НЕ трогать файлы за пределами scope: `src/components/budget/`, `src/components/views/Budget*.tsx`, `src/components/BudgetContextSwitcher.tsx`, `src/hooks/useBudget.ts`, `src/lib/budget-database.ts`, `src/store/index.ts`, `src/types/budget.ts`, `src/lib/animations.ts`.
- НЕ менять существующие поля Zustand store — только добавлять новые.
- НЕ менять логику personal-контекста — все изменения work-контекста через условия `budgetContext === 'work'`.
- НЕ удалять существующую функциональность.
- НЕ добавлять console.log / console.error в продакшн-код.
- НЕ пушить в git, не запускать dev-сервер.
- НЕ добавлять фичи сверх описанных.
- НЕ делать extra файлы, абстракции или рефакторинг за пределами задачи.
</forbidden_actions>

<task_sequence>

## ШАГ 1: Схема БД и типы

### 1.1 SQL-миграции

Создать файл `supabase/migrations/XXX_work_budget.sql` со следующими миграциями:

```sql
-- Источники дохода
CREATE TABLE income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📣',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage income_sources via couple" ON income_sources
  USING (couple_id IN (
    SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  ));

-- Месячный доход (одна запись = один источник × один месяц)
CREATE TABLE monthly_incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES income_sources(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- 'YYYY-MM'
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RUB',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_id, month)
);

ALTER TABLE monthly_incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage monthly_incomes via couple" ON monthly_incomes
  USING (couple_id IN (
    SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  ));

-- Добавить context к accounts
ALTER TABLE accounts ADD COLUMN context TEXT NOT NULL DEFAULT 'personal';
```

### 1.2 TypeScript типы
**Файл**: `src/types/budget.ts`

Добавить:
```typescript
export interface IncomeSource {
  id: string
  couple_id: string
  name: string
  emoji: string
  is_active: boolean
  created_at: string
}

export interface MonthlyIncome {
  id: string
  couple_id: string
  source_id: string
  month: string // 'YYYY-MM'
  amount: number
  currency: Currency
  updated_at: string
}
```

Расширить `Account`:
```typescript
export interface Account {
  // ... существующие поля
  context: BudgetContext // НОВОЕ
}
```

### 1.3 Zustand store
**Файл**: `src/store/index.ts`

Добавить в budget slice:
```typescript
incomeSources: IncomeSource[]
monthlyIncomes: MonthlyIncome[]
setIncomeSources: (sources: IncomeSource[]) => void
setMonthlyIncomes: (incomes: MonthlyIncome[]) => void
```

**✅ Чекпоинт**: типы определены, store расширен, миграция готова. `pnpm build` проходит (новые поля пока не используются).

---

## ШАГ 2: Database service и хук

### 2.1 Budget database service
**Файл**: `src/lib/budget-database.ts`

Добавить методы:

```typescript
// ─── Income Sources ─────────────────────
async getIncomeSources(coupleId: string): Promise<IncomeSource[]>
async addIncomeSource(coupleId: string, data: { name: string; emoji: string }): Promise<IncomeSource | null>
async updateIncomeSource(id: string, data: Partial<{ name: string; emoji: string; is_active: boolean }>): Promise<void>

// ─── Monthly Incomes ────────────────────
async getMonthlyIncomes(coupleId: string, month: string): Promise<MonthlyIncome[]>
async upsertMonthlyIncome(data: {
  couple_id: string; source_id: string; month: string; amount: number; currency: Currency
}): Promise<MonthlyIncome | null>
// upsert по UNIQUE(source_id, month) — если запись есть, обновить amount

// ─── Accounts (расширить) ───────────────
// Изменить getAccounts: добавить фильтр по context
async getAccounts(coupleId: string, context?: BudgetContext): Promise<Account[]>
// Изменить addAccount: добавить context в insert
```

**Важно**: `upsertMonthlyIncome` использует Supabase `.upsert()` с `onConflict: 'source_id,month'`. Это позволяет inline-edit: если запись за месяц есть — update amount, нет — insert.

### 2.2 useBudget hook
**Файл**: `src/hooks/useBudget.ts`

Добавить методы:
```typescript
// Income Sources CRUD
const addIncomeSource = useCallback(async (data: { name: string; emoji: string }) => { ... }, [])
const updateIncomeSource = useCallback(async (id: string, data: Partial<...>) => { ... }, [])
const archiveIncomeSource = useCallback(async (id: string) => { ... }, [])

// Monthly Income
const setMonthlyIncome = useCallback(async (sourceId: string, month: string, amount: number, currency: Currency) => { ... }, [])

// Расширить loadBudgetData:
// При budgetContext === 'work' — дополнительно загружать incomeSources и monthlyIncomes
// Accounts загружать с фильтром по context
```

Расширить `loadBudgetData`:
```typescript
const loadBudgetData = useCallback(async () => {
  // ... существующий код
  const [categories, transactions, limits, accounts, recurringExpenses] = await Promise.all([
    budgetDatabaseService.getCategories(couple.id, budgetContext),
    budgetDatabaseService.getTransactions(couple.id, { month: budgetSelectedMonth, context: budgetContext }),
    budgetDatabaseService.getBudgetLimits(couple.id, budgetSelectedMonth),
    budgetDatabaseService.getAccounts(couple.id, budgetContext), // ← ДОБАВЛЕН context
    budgetDatabaseService.getRecurringExpenses(couple.id, budgetContext),
  ])

  // ... set state

  // Дополнительно для work
  if (budgetContext === 'work') {
    const [sources, incomes] = await Promise.all([
      budgetDatabaseService.getIncomeSources(couple.id),
      budgetDatabaseService.getMonthlyIncomes(couple.id, budgetSelectedMonth),
    ])
    setIncomeSources(sources)
    setMonthlyIncomes(incomes)
  }
}, [...])
```

**✅ Чекпоинт**: database service и hook готовы. Данные загружаются. `pnpm build` проходит.

---

## ШАГ 3: P&L блок на Overview

### 3.1 Новый компонент ProfitLossCard
**Новый файл**: `src/components/budget/ProfitLossCard.tsx`

Props:
```typescript
interface ProfitLossCardProps {
  incomeSources: IncomeSource[]
  monthlyIncomes: MonthlyIncome[]
  totalExpenses: number
  defaultCurrency: Currency
  budgetSelectedMonth: string
  onUpdateIncome: (sourceId: string, amount: number) => void
}
```

Структура компонента:

**Свёрнутый вид** (по умолчанию):
```
┌──────────────────────────────────────────┐
│ 📊 РЕЗУЛЬТАТ                        ▼   │
│                                          │
│  Доходы      200 000 ₽                  │
│  Расходы     -82 000 ₽                  │
│              ──────────                  │
│  Итого      +118 000 ₽                  │
└──────────────────────────────────────────┘
```

- «Доходы» — `text-green-600 dark:text-green-400` если > 0
- «Расходы» — `text-red-600 dark:text-red-400` всегда
- «Итого» — зелёный если ≥ 0, красный если < 0
- Разделительная линия — `border-t border-[var(--color-border-secondary)]`
- ChevronDown/Up для раскрытия

**Раскрытый вид** (AnimatePresence + variants.collapse):
```
│ (раскрыто — список источников)           │
│                                          │
│  📣 Севастополь        [150 000]  ₽     │
│  📣 Симферополь         [45 000]  ₽     │
│  📣 Кемерово             [5 000]  ₽     │
│                                          │
│  Если нет источников:                    │
│  Добавьте источники дохода в настройках  │
```

Каждый источник — inline-edit:
- По умолчанию показывает сумму текстом (или «—» если нет записи за месяц)
- Тап на сумму → переключает в input (точный паттерн `editingAccountId`)
- blur / Enter → вызов `onUpdateIncome(sourceId, amount)`
- Валюта показывается после суммы, НЕ editable (всегда defaultCurrency контекста = RUB)

### 3.2 Интеграция в Overview
**Файл**: `BudgetOverviewView.tsx`

После блока баланса и перед блоком трат, при `budgetContext === 'work'`:

```tsx
{budgetContext === 'work' && (
  <ProfitLossCard
    incomeSources={incomeSources}
    monthlyIncomes={monthlyIncomes}
    totalExpenses={spentThisMonth}
    defaultCurrency={defaultCurrency}
    budgetSelectedMonth={budgetSelectedMonth}
    onUpdateIncome={handleUpdateIncome}
  />
)}
```

`handleUpdateIncome` — обёртка над `setMonthlyIncome` из useBudget.

### 3.3 Расчёты в ProfitLossCard

```typescript
const totalIncome = useMemo(() =>
  monthlyIncomes.reduce((sum, mi) => sum + Number(mi.amount), 0),
  [monthlyIncomes]
)

const result = totalIncome - totalExpenses

// Маппинг источников к их доходам за месяц
const incomeBySource = useMemo(() => {
  const map: Record<string, MonthlyIncome | undefined> = {}
  for (const mi of monthlyIncomes) {
    map[mi.source_id] = mi
  }
  return map
}, [monthlyIncomes])
```

**✅ Чекпоинт**: P&L блок рендерится на Overview в work-контексте. Inline-edit суммы доходов работает. Итого считается корректно.

---

## ШАГ 4: Скрытие shared/personal toggle в work

### 4.1 AddTransactionSheet
**Файл**: `src/components/budget/AddTransactionSheet.tsx`

Toggle `shared/personal` сейчас рендерится при `budgetContext === 'personal'`. Проверить что это действительно так. Если рендерится всегда — обернуть условием:

```tsx
{budgetContext === 'personal' && (
  <div className="inline-flex rounded-lg ...">
    {(['shared', 'personal'] as TransactionType[]).map(t => ( ... ))}
  </div>
)}
```

При `budgetContext === 'work'` — `type` должен быть хардкод `'shared'`. Проверить, что в `useEffect` при `!editingTransaction`:
```typescript
setType(budgetContext === 'work' ? 'shared' : 'shared') // уже так — оба shared
```
Это уже корректно (defaultType = 'shared'), но убедиться что пользователь не может переключить тип при work.

**✅ Чекпоинт**: в work нет toggle типа. Все work-транзакции type === 'shared'.

---

## ШАГ 5: Изоляция счетов по контексту

### 5.1 Database
**Файл**: `src/lib/budget-database.ts`

Изменить `getAccounts`:
```typescript
async getAccounts(coupleId: string, context?: BudgetContext): Promise<Account[]> {
  let query = supabase
    .from('accounts')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('is_archived', false)
    .order('order_index')

  if (context) {
    query = query.eq('context', context)
  }

  const { data, error } = await query
  // ...
}
```

Изменить `addAccount` — добавить `context` в insert:
```typescript
async addAccount(coupleId: string, data: {
  name: string; emoji: string; currency: Currency; balance: number; context?: BudgetContext
}): Promise<Account | null> {
  const { data: account, error } = await supabase
    .from('accounts')
    .insert({
      couple_id: coupleId,
      user_id: userId,
      name: data.name,
      emoji: data.emoji,
      currency: data.currency,
      balance: data.balance,
      context: data.context || 'personal', // default personal для обратной совместимости
    })
    .select()
    .single()
  // ...
}
```

### 5.2 useBudget hook
Изменить вызов `addAccount` — передавать текущий `budgetContext`:
```typescript
const addAccount = useCallback(async (data: { name: string; emoji: string; currency: Currency; balance: number }) => {
  // ...
  await budgetDatabaseService.addAccount(couple.id, { ...data, context: budgetContext })
  // ...
}, [budgetContext, ...])
```

### 5.3 loadBudgetData
Уже изменён в Шаге 2 — `getAccounts(couple.id, budgetContext)`.

### 5.4 Миграция существующих данных
Все существующие счета остаются `context = 'personal'` (DEFAULT в миграции). Это корректно — рабочие счета будут создаваться заново в work-контексте.

**✅ Чекпоинт**: в personal видны только personal-счета, в work — только work-счета. Добавление счёта привязывает к текущему контексту.

---

## ШАГ 6: CRUD источников дохода в настройках

### 6.1 Секция в Settings
**Файл**: `BudgetSettingsView.tsx`

При `budgetContext === 'work'` — добавить секцию «Источники дохода» ПЕРЕД секцией категорий. Визуально идентична секции категорий:

```tsx
{budgetContext === 'work' && (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Источники дохода</h3>
      <button onClick={() => setShowAddSource(true)} ...>
        <Plus size={14} /> Добавить
      </button>
    </div>

    {/* Список источников */}
    {incomeSources.filter(s => s.is_active).map(source => (
      <div key={source.id} className="flex items-center justify-between py-2 ...">
        <div className="flex items-center gap-2">
          <span>{source.emoji}</span>
          <span>{source.name}</span>
        </div>
        <button onClick={() => archiveIncomeSource(source.id)} ...>
          <Archive size={14} />
        </button>
      </div>
    ))}

    {/* Форма добавления — паттерн категорий */}
    {showAddSource && ( ... emoji picker + name input + кнопка ... )}
  </div>
)}
```

Emoji picker — переиспользовать существующие `EXPENSE_EMOJIS` или создать `SOURCE_EMOJIS`:
```typescript
const SOURCE_EMOJIS = ['📣', '📺', '🌐', '💼', '🏙️', '📱', '🎯', '💡', '🏢', '📊']
```

### 6.2 State для формы
Новые useState в `BudgetSettingsView`:
```typescript
const [showAddSource, setShowAddSource] = useState(false)
const [newSourceName, setNewSourceName] = useState('')
const [newSourceEmoji, setNewSourceEmoji] = useState('📣')
```

**✅ Чекпоинт**: в настройках work-контекста видна секция «Источники дохода». Можно добавить, архивировать. В personal секция не видна.

---

## ШАГ 7: P&L chart в аналитике

### 7.1 Дополнительный блок
**Файл**: `BudgetAnalyticsView.tsx`

При `budgetContext === 'work'` — добавить bar chart «Доходы и расходы» в начало аналитики (перед pie chart категорий).

Данные: загрузить доходы и расходы за последние 6 месяцев.

```typescript
// В loadAnalyticsData (или отдельный useEffect при work):
if (budgetContext === 'work') {
  const months = getLast6Months(budgetSelectedMonth)
  const plData = await Promise.all(months.map(async (month) => {
    const [incomes, transactions] = await Promise.all([
      budgetDatabaseService.getMonthlyIncomes(couple.id, month),
      budgetDatabaseService.getTransactions(couple.id, { month, context: 'work' }),
    ])
    const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0)
    const totalExpense = transactions.reduce((s, t) => s + Number(t.amount), 0)
    return { month, income: totalIncome, expense: totalExpense, result: totalIncome - totalExpense }
  }))
}
```

Recharts BarChart:
```tsx
<BarChart data={plData} height={200}>
  <XAxis dataKey="month" tickFormatter={formatMonthShort} />
  <YAxis />
  <Bar dataKey="income" fill="var(--color-success, #22C55E)" name="Доходы" />
  <Bar dataKey="expense" fill="var(--color-danger, #EF4444)" name="Расходы" />
  <ReferenceLine y={0} stroke="var(--color-border-primary)" />
</BarChart>
```

Под графиком — строка с текущим результатом: «Результат за {month}: +118 000 ₽» (зелёный/красный).

**✅ Чекпоинт**: в аналитике work-контекста виден bar chart P&L за 6 месяцев. В personal chart не виден.

---

## ШАГ 8: Верификация

1. `pnpm build` проходит без ошибок.
2. Ни одного `console.log` / `console.error` в изменённых файлах.
3. Все новые тексты UI на русском.
4. Все цвета через `var(--color-*)` — light/dark совместимость.
5. Типы: нет `any`, все новые функции и props типизированы.
6. **Personal контекст не изменился** — все экраны работают как раньше.
7. **Work Overview**: P&L блок показывает доходы/расходы/итого, inline-edit источников работает.
8. **Work Settings**: CRUD источников работает (добавить, архивировать).
9. **Work AddTransaction**: нет toggle shared/personal, все транзакции type 'shared'.
10. **Work Analytics**: P&L bar chart за 6 месяцев показывается.
11. **Счета изолированы**: personal показывает personal-счета, work показывает work-счета.
12. **Inline-edit дохода**: тап → ввод → blur → `upsertMonthlyIncome` → store обновляется → сумма видна.
13. **Пустые состояния**: нет источников → «Добавьте в настройках», нет доходов за месяц → суммы показывают «—».

</task_sequence>

<stop_conditions>
Остановиться и спросить, если:
- Миграция `ALTER TABLE accounts ADD COLUMN context` требует дефолтных значений для существующих записей иначе чем 'personal'.
- RLS политики на новые таблицы конфликтуют с существующими.
- `supabase.upsert()` не поддерживает `onConflict` на составном UNIQUE(source_id, month) — нужно альтернативное решение.
- `loadBudgetData` становится слишком тяжёлым с дополнительными запросами — нужна оптимизация.
- Ошибка не решается за 2 попытки.
- Изменение требует правок файлов за пределами scope.
</stop_conditions>

<checkpoints>
После каждого шага вывести: ✅ [что сделано, какие файлы изменены/созданы]
В конце — полный список всех изменённых и созданных файлов с кратким описанием изменений.
</checkpoints>

<constraints>
- Все стили — Tailwind utility classes + CSS Variables `var(--color-*)`.
- Анимации — только через tokens из `src/lib/animations.ts`.
- Иконки — только Lucide React.
- Toast — только Sonner.
- Переиспользовать существующие паттерны (inline-edit, collapsible, CRUD, month navigation) — НЕ изобретать новые.
- Не использовать `any`.
- Не добавлять console.log/console.error.
- Русская локализация для всех текстов.
- Только изменения, описанные выше. Не добавлять extra features или abstractions.
</constraints>
