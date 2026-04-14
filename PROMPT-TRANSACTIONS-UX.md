<objective>
Реализовать четыре UX-улучшения бюджетного модуля TrackerClash: поиск и фильтрация транзакций, обратная связь после добавления транзакции, кнопка «Повторить», редизайн блока баланса (мультивалютный, метка обновления). Только изменения, описанные ниже. Никаких дополнительных фич, рефакторинга или файлов сверх указанного.
</objective>

<starting_state>

## Стек
React 18 + TypeScript 5.8 + Vite, Supabase (PostgreSQL + RLS), Zustand 5, Tailwind CSS 4 (CSS Variables для тем light/dark: `var(--color-*)`), Framer Motion 12, Recharts 2.15, shadcn/ui (New York), Lucide React icons, Sonner toasts, pnpm.

## Архитектура
SPA без роутера. Навигация — `currentCategory` в Zustand store. Два режима: `tracker` и `budget`. Budget имеет два контекста: `personal` (THB) и `work` (RUB). Поддержка валют: THB, RUB, USD, EUR. Все view lazy-loaded. API-key auth через Supabase. Русская локализация. Пара пользователей (Couple) — базовая единица для совместного бюджета.

## Релевантные файлы

### Views
- `src/components/views/BudgetTransactionsView.tsx` (~257 строк) — Список транзакций, группировка по дням (`formatDayHeader`), горизонтальные filter chips по категориям, навигация по месяцам (ChevronLeft/Right), FAB "+". Один экземпляр `<AddTransactionSheet />` с controlled open/onOpenChange. Удаление через `window.confirm`.
- `src/components/views/BudgetOverviewView.tsx` (~770 строк) — Обзор: collapsible баланс (счета по пользователям, `myAccounts`/`partnerAccounts`, `totalBalance = myBalance + partnerBalance` — суммирует без учёта валют), траты (сегодня/неделя/месяц), обязательные расходы, лидеры категорий, прогресс лимитов, последние 5 транзакций. Баланс раскрывается по клику → показывает счета каждого пользователя с inline-edit баланса и удалением. Форма добавления счёта: emoji picker + имя + валюта + баланс.

### Компоненты
- `src/components/budget/AddTransactionSheet.tsx` (~243 строки) — Bottom sheet: ввод суммы, CategoryPicker, валюта/тип/дата, описание. FAB "+" встроен (рендерится когда нет `controlledOnOpenChange`). `handleSubmit` вызывает `addTransaction` / `updateTransaction`, потом `setOpen(false)`. Использует localStorage для последней категории.
- `src/components/budget/CategoryPicker.tsx` (51 строк) — Grid 5×N, emoji + имя, animated border (layoutId).

### Логика
- `src/hooks/useBudget.ts` (~535 строк) — Все CRUD: `addTransaction`, `updateTransaction`, `deleteTransaction`, `addAccount`, `updateAccount`, `deleteAccount`, `loadBudgetData`. Экспорт: `formatAmount(amount, currency)`, `CURRENCY_SYMBOLS`.
- `src/store/index.ts` — Zustand: `transactions`, `budgetCategories`, `budgetLimits`, `budgetSelectedMonth`, `budgetContext`, `accounts`, `userId`. Экспорт: `formatLocalDate()`.
- `src/types/budget.ts` — `Transaction { id, couple_id, user_id, category_id, amount, currency, context, type, description, date, recurring_expense_id, ... }`, `BudgetLimit { category_id, amount, currency, month }`, `Account { id, couple_id, user_id, name, emoji, currency, balance, order_index, is_archived, updated_at }`, `BudgetCategory`, `Currency`, `TransactionType`.

### Анимации
- `src/lib/animations.ts` — Tokens: `transitions.spring/smooth/slow`, `variants.listItem/staggerContainer/collapse/viewTransition/fadeIn/modal`.

</starting_state>

<target_state>

Когда всё готово:

1. **Поиск и фильтрация** работают на экране транзакций: текстовый поиск по описанию, фильтр по диапазону сумм (мин/макс), фильтр по дате (от/до) — всё сочетается с существующим фильтром по категории и навигацией по месяцам.
2. **Обратная связь после добавления** показывает контекстный micro-insight (прогресс лимита по выбранной категории, сравнение с дневным средним) через toast при успешном добавлении транзакции.
3. **Кнопка «Повторить»** на каждой транзакции в списке позволяет в один тап создать копию (та же сумма, категория, валюта, тип, описание) с сегодняшней датой, с подтверждением через toast с undo.
4. **Баланс переработан**: общая сумма показывается с группировкой по валютам (вместо бессмысленного суммирования разных валют), отображается метка «Обновлено: ...» с relative time последнего обновления любого счёта. Collapsible раскрытие с деталями по пользователям сохранено.
5. Проект собирается без ошибок (`pnpm build` проходит).

</target_state>

<allowed_actions>
- Редактировать файлы, перечисленные в `<starting_state>`.
- Создавать новые компоненты ТОЛЬКО в `src/components/budget/`.
- Использовать ТОЛЬКО уже установленные пакеты (framer-motion, lucide-react, recharts, sonner, shadcn/ui). Никаких новых зависимостей.
- Использовать CSS Variables `var(--color-*)` для всех цветов, light/dark совместимость.
- Использовать animation tokens из `src/lib/animations.ts`.
- Русская локализация для всех текстов UI.
</allowed_actions>

<forbidden_actions>
- НЕ добавлять новые npm-зависимости.
- НЕ трогать файлы за пределами `src/components/budget/`, `src/components/views/BudgetTransactionsView.tsx`, `src/components/views/BudgetOverviewView.tsx`, `src/hooks/useBudget.ts`, `src/store/index.ts`, `src/types/budget.ts`, `src/lib/animations.ts`.
- НЕ менять структуру Zustand store (можно добавлять новые поля в budget slice, нельзя менять существующие).
- НЕ менять API-контракты Supabase (запросы, RLS).
- НЕ менять AddTransactionSheet UI (расположение полей, порядок) — только добавить логику post-submit feedback.
- НЕ удалять существующую функциональность.
- НЕ добавлять console.log / console.error в продакшн-код.
- НЕ пушить в git, не запускать dev-сервер.
- НЕ добавлять фичи сверх описанных четырёх.
</forbidden_actions>

<task_sequence>

## ШАГ 1: Поиск и фильтрация транзакций

### 1.1 Панель поиска и фильтров
**Файл**: `BudgetTransactionsView.tsx`

Добавить collapsible блок фильтров между month navigation и category chips:

**Поисковая строка:**
- Иконка `Search` (lucide) + текстовый input, placeholder: «Поиск по описанию…»
- Debounce 300мс перед фильтрацией (useDebounce hook или inline setTimeout + cleanup)
- Иконка `X` для сброса, появляется при наличии текста
- Компактный вид: высота 36px, rounded-lg, `bg-[var(--color-bg-tertiary)]`

**Расширенные фильтры:**
- Кнопка `SlidersHorizontal` (lucide) справа от поиска
- По нажатию — разворачивается блок (variants.collapse из animations.ts):
  - Диапазон сумм: два input `number` — «От» и «До», placeholder с примерами
  - Диапазон дат: два input `date` — «С» и «По» (перекрывает навигацию по месяцам: если задан date range, month navigation отключается визуально)
- Кнопка «Сбросить фильтры» — появляется когда хотя бы один фильтр активен
- Бейдж-счётчик активных фильтров рядом с иконкой `SlidersHorizontal`

### 1.2 Логика фильтрации
**Файл**: `BudgetTransactionsView.tsx`

Расширить `filteredTransactions` useMemo:

```typescript
const filteredTransactions = useMemo(() => {
  let result = transactions

  // Существующий фильтр по категории
  if (filterCategoryId) {
    result = result.filter(t => t.category_id === filterCategoryId)
  }

  // Текстовый поиск по описанию (case-insensitive)
  if (debouncedSearch.trim()) {
    const q = debouncedSearch.trim().toLowerCase()
    result = result.filter(t =>
      t.description?.toLowerCase().includes(q)
    )
  }

  // Фильтр по сумме
  if (amountMin !== null) {
    result = result.filter(t => Number(t.amount) >= amountMin)
  }
  if (amountMax !== null) {
    result = result.filter(t => Number(t.amount) <= amountMax)
  }

  // Фильтр по дате (перекрывает month navigation)
  if (dateFrom) {
    result = result.filter(t => t.date >= dateFrom)
  }
  if (dateTo) {
    result = result.filter(t => t.date <= dateTo)
  }

  return result
}, [transactions, filterCategoryId, debouncedSearch, amountMin, amountMax, dateFrom, dateTo])
```

### 1.3 Состояния
Новые useState в `BudgetTransactionsView`:
```typescript
const [searchQuery, setSearchQuery] = useState('')
const [amountMin, setAmountMin] = useState<number | null>(null)
const [amountMax, setAmountMax] = useState<number | null>(null)
const [dateFrom, setDateFrom] = useState<string | null>(null)
const [dateTo, setDateTo] = useState<string | null>(null)
const [filtersExpanded, setFiltersExpanded] = useState(false)
```

Debounce для search:
```typescript
const [debouncedSearch, setDebouncedSearch] = useState('')
useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
  return () => clearTimeout(timer)
}, [searchQuery])
```

### 1.4 Пустое состояние при фильтрации
Если `filteredTransactions.length === 0` и любой фильтр активен — показать специальное сообщение:
```
📭 Ничего не найдено
Попробуйте изменить фильтры
[Сбросить всё] ← кнопка
```

### 1.5 Визуальные детали
- Активные фильтры: бейдж-число на кнопке SlidersHorizontal (маленький кружок `bg-[var(--color-accent)]` с белым числом, абсолютно позиционирован top-right)
- При наличии активных фильтров — строка под category chips: «Активные фильтры: сумма 100–500, дата с 01.03» — текст `text-xs text-[var(--color-accent)]` с кнопкой «×» для сброса всех
- Month navigation disabled state: `opacity-40 pointer-events-none` когда задан dateFrom или dateTo

**✅ Чекпоинт**: поиск по описанию работает с debounce, фильтр по сумме и дате работает, всё сочетается с category filter. Empty state корректный.

---

## ШАГ 2: Обратная связь после добавления транзакции

### 2.1 Сбор контекстных данных
**Файл**: `AddTransactionSheet.tsx`

После успешного `addTransaction` (перед `setOpen(false)`), вычислить micro-insight:

```typescript
// После await addTransaction(...)
const insight = computeTransactionInsight({
  categoryId,
  amount: numAmount,
  currency,
  budgetLimits,      // из useAppStore
  transactions,       // из useAppStore (уже включает новую после loadBudgetData)
  budgetSelectedMonth,
  budgetCategories,
})

if (insight) {
  toast(insight.message, {
    icon: insight.icon,
    duration: 4000,
  })
}

setOpen(false)
```

### 2.2 Функция computeTransactionInsight
**Новый файл**: `src/components/budget/transactionInsights.ts`

```typescript
interface InsightInput {
  categoryId: string
  amount: number
  currency: Currency
  budgetLimits: BudgetLimit[]
  transactions: Transaction[]
  budgetSelectedMonth: string
  budgetCategories: BudgetCategory[]
}

interface Insight {
  message: string
  icon: string
}

export function computeTransactionInsight(input: InsightInput): Insight | null
```

Логика приоритетов (показываем ПЕРВЫЙ сработавший):

1. **Лимит превышен**: если после добавления сумма по категории за месяц > лимита → `⚠️ Лимит по {category} превышен: {spent}/{limit} {currency}`
2. **Лимит ≥ 80%**: если потрачено ≥ 80% лимита → `⚡ {category}: потрачено {percent}% лимита ({spent}/{limit})`
3. **Лимит ≥ 50%**: если потрачено ≥ 50% лимита → `📊 {category}: {percent}% лимита использовано`
4. **Без лимита, сравнение со средним**: если нет лимита по категории — посчитать среднедневной расход за текущий месяц по этой категории. Если сегодняшняя транзакция > 2× среднего → `📈 Эта трата в {n}× больше вашего среднего по {category}`
5. **Ничего**: вернуть `null`, toast не показывается

Расчёт spent по категории:
```typescript
const monthTransactions = transactions.filter(t =>
  t.category_id === categoryId &&
  t.date.startsWith(budgetSelectedMonth)
)
const spent = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
```

### 2.3 Важно: данные после добавления
После `addTransaction` вызывается `loadBudgetData` внутри хука (если нет — нужно чтобы `addTransaction` в `useBudget.ts` обновлял `transactions` в store после успешного insert). Insight должен считаться на ОБНОВЛЁННЫХ данных (включая только что добавленную транзакцию).

Варианты:
- **Вариант A** (предпочтительный): Вычислить insight ДО вызова `addTransaction`, прибавив `numAmount` к текущей сумме. Так не нужно ждать reload.
- **Вариант B**: Если `addTransaction` уже обновляет store — вычислить сразу после.

Использовать **Вариант A**: вычисляем на текущих данных + новая сумма.

### 2.4 Стилизация toast
Использовать `toast()` из Sonner (уже установлен). Формат:
```typescript
toast(insight.message, {
  icon: insight.icon,
  duration: 4000,
  className: 'text-sm',
})
```

Не использовать toast.warning / toast.error — только нейтральный `toast()` с emoji-иконкой.

**✅ Чекпоинт**: после добавления транзакции в категорию с лимитом — появляется toast с прогрессом. Без лимита — показывает сравнение со средним (если аномалия) или ничего.

---

## ШАГ 3: Кнопка «Повторить» на транзакциях

### 3.1 UI кнопки
**Файл**: `BudgetTransactionsView.tsx`

В каждой строке транзакции, между суммой и кнопкой удаления, добавить кнопку «Повторить»:

```tsx
{/* Repeat button */}
<button
  onClick={() => handleRepeat(txn)}
  className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-10)] transition-colors flex-shrink-0"
  title="Повторить"
>
  <Repeat2 size={14} />
</button>
```

Импорт: `import { Repeat2 } from 'lucide-react'`

Расположение в строке транзакции (текущий порядок: `[emoji | name+desc | amount | delete]`):
→ Новый порядок: `[emoji | name+desc | amount | repeat | delete]`

### 3.2 Логика повтора
**Файл**: `BudgetTransactionsView.tsx`

```typescript
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
```

### 3.3 Возвращаемое значение addTransaction
**Файл**: `useBudget.ts`

Проверить, что `addTransaction` возвращает созданную транзакцию (нужен `id` для undo). Если сейчас возвращает `void` — изменить return type:

```typescript
const addTransaction = useCallback(async (data: { ... }): Promise<Transaction | null> => {
  // ... existing logic
  const created = await budgetDatabaseService.addTransaction(...)
  // ... reload
  return created ?? null
}, [...])
```

Также проверить `budgetDatabaseService.addTransaction` — он должен возвращать вставленную запись (`.select().single()` в Supabase insert).

### 3.4 Toast с Undo
Sonner поддерживает `action` в toast. При нажатии «Отменить» — вызвать `deleteTransaction(newTxn.id)`. Транзакция удалится, данные перезагрузятся.

### 3.5 Post-repeat insight
После повтора транзакции — тоже показать insight (из Шага 2). Но чтобы не было двух toasts одновременно, выбрать: показывать undo-toast (приоритет) ИЛИ insight-toast. **Решение**: показывать только undo-toast при повторе. Insight — только при ручном добавлении через AddTransactionSheet.

**✅ Чекпоинт**: кнопка Repeat2 видна на каждой транзакции, при нажатии создаётся копия с сегодняшней датой, toast с «Отменить» работает, undo удаляет транзакцию.

---

## ШАГ 4: Редизайн блока баланса

### 4.1 Мультивалютный баланс
**Файл**: `BudgetOverviewView.tsx`

Текущая проблема: `totalBalance = myBalance + partnerBalance` складывает числа без учёта валют. Если у одного пользователя счета в THB, а у другого в RUB — сумма бессмысленна.

**Решение**: группировать баланс по валютам.

Заменить текущий расчёт:
```typescript
// БЫЛО:
const myBalance = myAccounts.reduce((sum, a) => sum + Number(a.balance), 0)
const partnerBalance = partnerAccounts.reduce((sum, a) => sum + Number(a.balance), 0)
const totalBalance = myBalance + partnerBalance

// СТАЛО:
const balanceByCurrency = useMemo(() => {
  const allAccounts = [...myAccounts, ...partnerAccounts]
  const groups: Record<Currency, number> = {} as Record<Currency, number>
  for (const acc of allAccounts) {
    groups[acc.currency] = (groups[acc.currency] || 0) + Number(acc.balance)
  }
  // Отсортировать: сначала валюта текущего контекста, потом остальные по сумме
  return Object.entries(groups)
    .sort(([a], [b]) => {
      if (a === defaultCurrency) return -1
      if (b === defaultCurrency) return 1
      return (groups[b as Currency] || 0) - (groups[a as Currency] || 0)
    })
    .map(([currency, total]) => ({ currency: currency as Currency, total }))
}, [myAccounts, partnerAccounts, defaultCurrency])
```

### 4.2 Отображение в заголовке блока

Заменить единственную сумму `formatAmount(totalBalance, defaultCurrency)` на мультивалютную строку:

```tsx
<div className="flex items-center gap-1.5 flex-wrap justify-end">
  {balanceByCurrency.map((group, i) => (
    <React.Fragment key={group.currency}>
      {i > 0 && <span className="text-xs text-[var(--color-text-tertiary)]">·</span>}
      <span className="text-sm font-bold text-[var(--color-text-primary)]">
        {formatAmount(group.total, group.currency)}
      </span>
    </React.Fragment>
  ))}
</div>
```

Если все счета в одной валюте — отобразится одна цифра как раньше. Если в разных — через разделитель «·»: `120,000 ฿ · 45,000 ₽`.

Если нет счетов вообще — показать `0 {defaultCurrency}`.

### 4.3 Метка последнего обновления
**Файл**: `BudgetOverviewView.tsx`

Вычислить дату последнего обновления любого счёта:

```typescript
const lastUpdated = useMemo(() => {
  const allAccounts = [...myAccounts, ...partnerAccounts]
  if (allAccounts.length === 0) return null
  return allAccounts.reduce((latest, acc) => {
    const d = new Date(acc.updated_at)
    return d > latest ? d : latest
  }, new Date(0))
}, [myAccounts, partnerAccounts])
```

Форматирование в relative time:

```typescript
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин назад`
  if (diffHours < 24) {
    // Сегодня — показать время
    return `сегодня в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (diffDays === 1) return 'вчера'
  if (diffDays < 7) return `${pluralDays(diffDays)} назад`
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}
```

Показать метку в заголовке блока баланса, справа от слова «Баланс» (или под ним):

```tsx
<div className="flex items-center gap-2">
  <Wallet size={14} className="text-[var(--color-text-tertiary)]" />
  <div>
    <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Баланс</p>
    {lastUpdated && (
      <p className="text-[10px] text-[var(--color-text-tertiary)]">
        Обновлено: {formatRelativeTime(lastUpdated)}
      </p>
    )}
  </div>
</div>
```

### 4.4 Раскрытый блок — детали по пользователям

Сохранить текущую структуру collapsible блока. Убрать блок «Per-user balances» с плашками `myBalance`/`partnerBalance` (он тоже суммировал без учёта валют). Вместо него — сразу список счетов по пользователям (уже есть). Функциональность inline-edit баланса и удаления счёта — оставить как есть.

### 4.5 Очистка
- Удалить неиспользуемые переменные `myBalance`, `partnerBalance`, `totalBalance` после замены на `balanceByCurrency`.
- Если `partnerAccounts` пуст (solo user) — блок партнёра не рендерится (уже так).

**✅ Чекпоинт**: баланс показывает суммы по валютам через разделитель, метка «Обновлено» отображает relative time, collapsible раскрытие работает, inline-edit баланса счёта работает.

---

## ШАГ 5: Верификация

1. `pnpm build` проходит без ошибок.
2. Ни одного `console.log` / `console.error` в изменённых файлах.
3. Все новые тексты UI на русском.
4. Все цвета через `var(--color-*)` — light/dark совместимость.
5. Типы: нет `any`, все новые функции и props типизированы.
6. Фильтры сбрасываются при смене месяца (кроме category filter).
7. Фильтры сочетаются друг с другом корректно (search + amount + category одновременно).
8. Insight не ломает flow при отсутствии лимитов (возвращает null, toast не показывается).
9. Undo в toast работает — транзакция удаляется, список обновляется.
10. Баланс: счета в одной валюте → одна сумма. Счета в разных валютах → суммы через «·». Нет счетов → `0 {defaultCurrency}`.
11. Баланс: метка «Обновлено» показывает корректное relative time, обновляется при inline-edit баланса счёта.
12. Баланс: неиспользуемые переменные `myBalance`, `partnerBalance`, `totalBalance` удалены, нет TS warnings.

</task_sequence>

<stop_conditions>
Остановиться и спросить, если:
- Нужно менять схему БД (таблицы/колонки Supabase).
- `addTransaction` в `budgetDatabaseService` не возвращает вставленную запись — нужно решить: менять сервис или обходить.
- `toast()` из Sonner не поддерживает `action` с `onClick` — нужно альтернативное решение для undo.
- Возникает конфликт между date range фильтром и month navigation (загрузка данных привязана к `budgetSelectedMonth` — date range за пределами месяца не найдёт данные).
- Ошибка не решается за 2 попытки.
- Изменение требует правок файлов за пределами scope.
</stop_conditions>

<checkpoints>
После каждого шага вывести: ✅ [что сделано, какие файлы изменены]
В конце — полный список всех изменённых и созданных файлов.
</checkpoints>

<constraints>
- Все стили — Tailwind utility classes + CSS Variables `var(--color-*)`.
- Анимации — только через tokens из `src/lib/animations.ts` (transitions.smooth, variants.collapse, и т.д.).
- Иконки — только Lucide React (Search, SlidersHorizontal, X, Repeat2, Wallet, ChevronUp, ChevronDown).
- Toast — только Sonner (`toast()` из `sonner`).
- Не использовать `React.FC` (coding style).
- Не использовать `any`.
- Не добавлять console.log/console.error.
- Русская локализация для всех текстов.
</constraints>
