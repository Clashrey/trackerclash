<objective>
Реализовать пакет улучшений бюджетного модуля TrackerClash: баг-фиксы, переработку блока обязательных расходов, полный редизайн экрана аналитики, UX-улучшения остальных экранов, и архитектурные оптимизации. Только изменения, описанные ниже. Никаких дополнительных фич, рефакторинга или файлов сверх указанного.
</objective>

<starting_state>

## Стек
React 18 + TypeScript 5.8 + Vite, Supabase (PostgreSQL + RLS), Zustand 5, Tailwind CSS 4 (CSS Variables для тем light/dark), Framer Motion 12, Recharts 2.15, shadcn/ui (New York), Lucide React icons, Sonner toasts, pnpm.

## Архитектура
SPA без роутера. Навигация — `currentCategory` в Zustand store. Два режима: `tracker` (задачи) и `budget` (бюджет). Budget имеет два контекста: `personal` (THB) и `work` (RUB). Поддержка валют: THB, RUB, USD, EUR. Все view lazy-loaded. API-key auth через Supabase. Русская локализация.

## Файловая карта бюджетного модуля

### Views
- `src/components/views/BudgetOverviewView.tsx` — Обзор: collapsible баланс (счета, партнёр), траты (сегодня/неделя/месяц), обязательные расходы (bills + subscriptions с paidMap), лидеры категорий (progress bars), прогресс лимитов, последние 5 транзакций
- `src/components/views/BudgetTransactionsView.tsx` — Список транзакций, группировка по дням, фильтр категорий (horizontal chips), навигация по месяцам (ChevronLeft/Right)
- `src/components/views/BudgetAnalyticsView.tsx` — Pie chart по категориям (donut 128×128 + legend), bar chart 6 мес (waterfall загрузка), прогресс лимитов (дублирует Overview), split по партнёрам (маленький pie)
- `src/components/views/BudgetSettingsView.tsx` — Связка пары (invite code), CRUD категорий (emoji + color picker, GripVertical без d&d), лимиты по категориям

### Компоненты
- `src/components/budget/AddTransactionSheet.tsx` — Bottom sheet: ввод суммы, CategoryPicker, валюта/тип/дата, описание. FAB "+"
- `src/components/budget/CategoryPicker.tsx` — Grid 5×N, emoji + имя, animated border (layoutId)
- `src/components/BudgetContextSwitcher.tsx` — Toggle Личный/Рабочий с animated pill
- `src/components/ModeSwitcher.tsx` — Toggle Трекер/Бюджет

### Логика
- `src/hooks/useBudget.ts` — Все CRUD + `formatAmount()` + `CURRENCY_SYMBOLS`. Обёртка над budgetDatabaseService, Zustand state, toast
- `src/lib/budget-database.ts` — BudgetDatabaseService: все Supabase-запросы
- `src/store/index.ts` — Zustand: appMode, budgetContext, couple, budgetCategories, transactions, budgetLimits, accounts, recurringExpenses, exchangeRates, budgetSelectedMonth
- `src/types/budget.ts` — Couple, BudgetCategory, Transaction, BudgetLimit, Account, RecurringExpense, ExchangeRate, CoupleBalance, MonthlySummary, Currency, BudgetContext, TransactionType, RecurringExpenseType

### Инфраструктура
- `src/components/Layout.tsx` — switch по currentCategory, lazy-load budget views
- `src/components/Navigation.tsx` — Табы desktop, BottomNavigation mobile
- `src/lib/animations.ts` — Tokens: transitions.spring/smooth/slow, variants.listItem/staggerContainer/collapse/viewTransition/fadeIn

</starting_state>

<target_state>

Когда всё готово:

1. Все баги из Группы 1 исправлены (двойной sheet, defaultType, console.error)
2. Блок обязательных расходов в Overview переработан: collapsible bills/subscriptions, 3 визуальных состояния, относительные даты, авто-коллапс оплаченных, CategoryPicker для bills
3. Экран аналитики полностью переписан по новому дизайну (6 блоков: KPI, категории, динамика, лимиты, сравнение, партнёры)
4. UX-улучшения применены: month picker на Overview, confirm при удалении, мультивалютный баланс, fade на скролле, drag-and-drop категорий
5. Архитектура: загрузка данных централизована в Layout.tsx, waterfall в Analytics заменён на Promise.all
6. Проект собирается без ошибок (`pnpm build` проходит)

</target_state>

<task_sequence>

## ШАГ 1: Баг-фиксы

### 1.1 Двойной AddTransactionSheet
**Файл**: `BudgetTransactionsView.tsx`
**Что**: Рендерятся два `<AddTransactionSheet />` — управляемый (для редактирования) и неуправляемый (FAB). Две кнопки "+" наложены.
**Как**: Оставить один экземпляр. Управлять через единый state: `editSheetOpen` + `editingTxn`. Когда `editingTxn === null` и sheet открывается — режим создания. Когда `handleEdit(txn)` — режим редактирования. FAB встроен в сам компонент (уже есть, рендерится когда нет `controlledOnOpenChange`). Нужно убедиться, что один экземпляр обслуживает оба сценария. Передавать `open` и `onOpenChange` всегда, а FAB показывать отдельной кнопкой снаружи, которая ставит `editSheetOpen = true, editingTxn = null`.

### 1.2 defaultType
**Файл**: `AddTransactionSheet.tsx`, строка 38
**Что**: `budgetContext === 'work' ? 'shared' : 'shared'` — обе ветки одинаковые.
**Как**: Заменить на `const defaultType: TransactionType = 'shared'`.

### 1.3 console.error
**Файл**: `useBudget.ts`
**Что**: 15+ вызовов console.error в продакшн-коде.
**Как**: Убрать все. Ошибки уже показываются через toast.error(). Если нужен dev-logging, обернуть: `if (import.meta.env.DEV) console.error(...)`. Предпочтительно — просто удалить.

---

## ШАГ 2: Централизация загрузки данных

**Файл**: `Layout.tsx`
**Что**: Все 4 budget views дублируют `useEffect(() => { loadBudgetData() }, [budgetContext, budgetSelectedMonth])`.
**Как**: В Layout.tsx добавить:
```tsx
const { appMode, budgetContext, budgetSelectedMonth } = useAppStore()
const { loadBudgetData } = useBudget()

useEffect(() => {
  if (appMode === 'budget') {
    loadBudgetData()
  }
}, [appMode, budgetContext, budgetSelectedMonth])
```
Убрать `useEffect` с `loadBudgetData` из всех 4 budget views: BudgetOverviewView, BudgetTransactionsView, BudgetAnalyticsView, BudgetSettingsView. Views только читают из store.

---

## ШАГ 3: Переработка блока обязательных расходов (BudgetOverviewView)

Полная переработка секции recurring expenses в BudgetOverviewView.

### 3.1 Новая структура

Общий хедер: `📅 Обязательные расходы — {totalRecurring}/мес`

**Подблок A: "Счета и оплаты" (bills)** — развёрнут по умолчанию:
- Collapsible хедер: `Счета и оплаты ({bills.length})` + ChevronDown/ChevronUp
- Сортировка: 1) просроченные, 2) ближайшие неоплаченные, 3) оплаченные
- Если оплаченных > 2 — авто-коллапс в строку: `✅ Оплачено: {count} из {total} · {sum}` (тап раскрывает AnimatePresence)
- Неоплаченные — всегда видны, нельзя скрыть
- Кнопка `+ Добавить` внизу

**Подблок B: "Подписки" (subscriptions)** — свёрнут по умолчанию:
- Collapsible хедер: `Подписки ({subscriptions.length}) — {subscriptionsTotal}` + ChevronRight/ChevronDown
- В развёрнутом виде: список без кнопки "Оплачено" (авто-списания)

### 3.2 Три визуальных состояния строки bill

**"скоро"** (≤3 дней до оплаты, не оплачен):
- `rounded-lg bg-amber-50 dark:bg-amber-900/10 border-l-2 border-amber-400 px-3 py-2`
- Дата оранжевым: `text-amber-600 dark:text-amber-400`
- Кнопка "Оплачено" контрастнее: `bg-amber-500 text-white` вместо приглушённой

**"предстоит"** (>3 дней, не оплачен):
- Обычный стиль (текущий дизайн строки)
- Дата серым: `text-[var(--color-text-tertiary)]`

**"оплачено"**:
- Текст: `text-[var(--color-text-tertiary)]`, line-through на названии
- Зелёная галочка (текущее поведение)

### 3.3 Формат даты — относительный

Заменить `{exp.day_of_month}-е число` на relative formatting:

```typescript
function formatBillDate(dayOfMonth: number, isPaid: boolean): { text: string; status: 'overdue' | 'soon' | 'upcoming' | 'paid' } {
  if (isPaid) return { text: 'оплачено', status: 'paid' }
  
  const today = new Date()
  const todayDay = today.getDate()
  
  let daysUntil: number
  if (dayOfMonth >= todayDay) {
    daysUntil = dayOfMonth - todayDay
  } else {
    daysUntil = -1
  }

  if (daysUntil < 0) return { text: 'просрочено', status: 'overdue' }
  if (daysUntil === 0) return { text: 'сегодня', status: 'soon' }
  if (daysUntil === 1) return { text: 'завтра', status: 'soon' }
  if (daysUntil <= 3) return { text: `через ${daysUntil} ${daysUntil >= 2 && daysUntil <= 4 ? 'дня' : 'дней'}`, status: 'soon' }
  if (daysUntil <= 14) return { text: `через ${daysUntil} дней`, status: 'upcoming' }
  
  const targetDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth)
  return { text: targetDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), status: 'upcoming' }
}
```

### 3.4 CategoryPicker для bills

В форме добавления recurring expense:
- Для `expType === 'bill'` — показать `<CategoryPicker categories={budgetCategories} selectedId={expCategoryId} onSelect={setExpCategoryId} />`. Добавить state `expCategoryId`.
- Для `expType === 'subscription'` — НЕ показывать picker, category_id = null (подписки идут без категории, или автоматически в "Подписки" если такая категория есть).
- При вызове `addRecurringExpense` — передавать `category_id: expType === 'bill' ? expCategoryId : null`.
- Проверить `markExpensePaid` в `budget-database.ts` — убедиться, что `expense.category_id` пробрасывается в создаваемую транзакцию.

---

## ШАГ 4: Полный редизайн экрана аналитики (BudgetAnalyticsView)

Полностью переписать `BudgetAnalyticsView.tsx`. Текущий код заменяется целиком.

### Данные

Помимо текущих данных из store (transactions, budgetCategories, budgetLimits), аналитика ДОЛЖНА загружать:
1. **Транзакции прошлого месяца** — один запрос `budgetDatabaseService.getTransactions(couple.id, { month: prevMonth, context: budgetContext })`. Хранить в локальном `useState<Transaction[]>`. Нужен для KPI "vs прошлый" и блока сравнения.
2. **6-месячная история** — через `Promise.all` (НЕ waterfall). Хранить в локальном `useState`.

Вычислить `prevMonth`:
```typescript
const [y, m] = budgetSelectedMonth.split('-').map(Number)
const prevDate = new Date(y, m - 2) // m-1 для текущего, m-2 для предыдущего
const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
```

### Навигация по месяцам

Добавить month picker (ChevronLeft / месяц / ChevronRight) — тот же паттерн что в BudgetTransactionsView. Привязан к `budgetSelectedMonth` из store.

### Блок 1: Сводка месяца (3 KPI-карточки)

`grid grid-cols-3 gap-2`, каждая карточка — `p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]`.

| Карточка | Лейбл (text-[10px] tertiary) | Значение (text-lg font-bold) | Подзначение |
|---|---|---|---|
| Потрачено | `Расходы` | `{totalSpent}` в defaultCurrency | — |
| vs прошлый | `vs прошлый` | `▲ +12%` или `▼ -8%` | абсолютная разница мелко `text-[10px]`: `+4 800 ₿` |
| В день | `В среднем/день` | `{avgPerDay}` | — |

Цвет значения второй карточки:
- Рост > 5%: `text-red-500 dark:text-red-400` (траты выросли = плохо)
- Снижение > 5%: `text-emerald-500 dark:text-emerald-400` (траты снизились = хорошо)
- Изменение ≤ 5%: `text-[var(--color-text-secondary)]` (нейтрально)

Расчёт `avgPerDay`: общая сумма / количество уникальных дат в транзакциях (не календарных дней месяца, а дней с тратами). Если месяц текущий — делить на прошедшие дни, не на 30.

Расчёт `vs прошлый`: `((totalSpent - prevTotalSpent) / prevTotalSpent * 100)`. Если прошлый месяц = 0, показать "—" вместо процента.

### Блок 2: Категории (donut + вертикальный список)

Карточка `p-4 rounded-xl bg-[var(--color-bg-elevated)] border`.

**Donut chart** — по центру блока, 160×160:
```tsx
<ResponsiveContainer width={160} height={160}>
  <PieChart>
    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
    </Pie>
  </PieChart>
</ResponsiveContainer>
```
В центре donut (абсолютное позиционирование): общая сумма `totalSpent` в defaultCurrency, text-sm font-bold.

**Вертикальный список** — ПОД donut (не рядом!). Каждая строка:
```
[●] emoji название ████████░░░░ XX%   сумма
```
- Цветная точка (w-2 h-2 rounded-full) — цвет категории
- Emoji + название (text-sm, truncate)
- Горизонтальный progress bar (h-1.5 rounded-full, flex-1, ширина = процент от максимальной категории)
- Процент (text-xs, tertiary): `{Math.round(d.value / totalSpent * 100)}%`
- Сумма (text-xs font-medium, secondary): `formatAmount(d.value, defaultCurrency)`

Если категорий > 5 — показать первые 5, потом кнопка `ещё {n}` которая через AnimatePresence раскрывает остальные.

### Блок 3: Динамика расходов (bar chart 6 мес)

Карточка с bar chart. Отличия от текущего:

1. **Текущий месяц выделен** — `fill="var(--color-accent)"`. Остальные месяцы — `fill` с opacity 0.35: тот же accent, но через цвет `var(--color-accent)` + opacity на элементе `<Cell>`.
2. **Линия среднего** — `<ReferenceLine y={avg} stroke="var(--color-text-tertiary)" strokeDasharray="4 4" label={false} />`. Подпись среднего отдельным div под chart: `Средний: {formatAmount(avg, defaultCurrency)}/мес` text-[10px] tertiary, text-right.
3. **Tooltip** — тот же стиль что сейчас (работает).

```tsx
const avgMonthly = monthlyHistory.reduce((s, m) => s + m.total, 0) / monthlyHistory.length
```

Для выделения текущего месяца — использовать `<Cell>` внутри `<Bar>`:
```tsx
<Bar dataKey="total" radius={[4, 4, 0, 0]}>
  {monthlyHistory.map((entry, i) => (
    <Cell key={i} fill="var(--color-accent)" fillOpacity={i === monthlyHistory.length - 1 ? 1 : 0.35} />
  ))}
</Bar>
```

### Блок 4: Лимиты — только проблемные

ОТЛИЧИЕ от текущего: НЕ показывать все лимиты. Только те, где потрачено ≥ 80% лимита.

Три зоны:
- `> 100%` — превышен: progress bar красный (`var(--color-danger)`), текст красный
- `80-100%` — скоро превысит: progress bar amber (`#F59E0B`), текст amber
- `< 80%` — НЕ рендерить

Под проблемными (или вместо них если всё ок):
- Если есть проблемные: строка `✅ Остальные {n} в норме` text-xs tertiary
- Если все в норме: карточка с зелёным акцентом: `✅ Все {n} лимитов в порядке`
- Если лимитов нет — не рендерить блок вообще

### Блок 5: Сравнение с прошлым месяцем

Новый блок. Карточка `p-4 rounded-xl bg-[var(--color-bg-elevated)] border`.

Заголовок: `Сравнение с прошлым месяцем` text-xs tertiary.

Для каждой категории, у которой есть траты в текущем ИЛИ прошлом месяце:

```
emoji название     сумма        ▲ +3 200 (+29%)
```

Расчёт:
```typescript
const prevCategoryTotals: Record<string, number> = {}
for (const t of prevMonthTransactions) {
  prevCategoryTotals[t.category_id] = (prevCategoryTotals[t.category_id] || 0) + Number(t.amount)
}

// Для каждой категории:
const currentVal = categoryTotals[cat.id] || 0
const prevVal = prevCategoryTotals[cat.id] || 0
const diff = currentVal - prevVal
const pctChange = prevVal > 0 ? Math.round((diff / prevVal) * 100) : (currentVal > 0 ? 100 : 0)
```

Цвет индикатора разницы:
- `diff > 0` и `|pctChange| > 5`: `▲ +{diff} (+{pct}%)` красным (text-red-500)
- `diff < 0` и `|pctChange| > 5`: `▼ -{|diff|} (-{|pct|}%)` зелёным (text-emerald-500)
- `|pctChange| <= 5`: `— 0` серым (tertiary)

Сортировка: по абсолютному значению `|diff|` по убыванию (самые изменившиеся вверху).

Если нет данных за прошлый месяц — показать: `Нет данных за прошлый месяц для сравнения` text-xs tertiary.

### Блок 6: Кто тратит (только budgetContext === 'personal')

Не рендерить в work-контексте.

Замена текущего маленького pie chart. Карточка `p-4 rounded-xl bg-[var(--color-bg-elevated)] border`.

Заголовок: `Расходы по партнёрам` text-xs tertiary.

**Горизонтальный stacked bar** (один div, два сегмента):
```tsx
<div className="flex h-3 rounded-full overflow-hidden">
  <div style={{ width: `${user1Pct}%`, backgroundColor: '#4ECDC4' }} />
  <div style={{ width: `${user2Pct}%`, backgroundColor: '#FF6B6B' }} />
</div>
```

Под ним: `Я: 28 000 ₿ (62%) · Партнёр: 17 200 ₿ (38%)` text-sm.

**Секция "Топ разница"** — 2-3 категории, где абсолютная разница между Я и Партнёр максимальна:
```
🍕 Еда — я: 9 200 ₿, партнёр: 5 200 ₿
🎬 Развл. — я: 1 100 ₿, партнёр: 3 000 ₿
```
text-xs, tertiary. Сортировка по `|myAmount - partnerAmount|`.

Если partner не подключен (`!couple.user2_id`) — не рендерить этот блок.

### Empty state

Если `transactions.length === 0`:
```tsx
<div className="text-center py-8 text-[var(--color-text-tertiary)]">
  <p className="text-3xl mb-2">📊</p>
  <p className="text-sm">Нет данных для анализа</p>
</div>
```

### Общая обёртка

Stagger-анимация через `variants.staggerContainer` + `variants.listItem` на каждом блоке (текущий паттерн).

FAB кнопка `<AddTransactionSheet />` внизу (один экземпляр).

---

## ШАГ 5: UX-улучшения остальных экранов

### 5.1 Навигация по месяцам на Overview
**Файл**: `BudgetOverviewView.tsx`
Добавить month picker (ChevronLeft / месяц / ChevronRight) сразу после заголовка, перед блоками. Использовать `budgetSelectedMonth` и `setBudgetSelectedMonth` из store.
Примечание: блок "Траты" (сегодня/неделя/месяц) осмысленен только для текущего месяца. Если `budgetSelectedMonth !== currentMonth()` — скрыть строки "Сегодня" и "Неделя", показать только "Месяц".

### 5.2 Confirm при удалении
**Файлы**: `BudgetTransactionsView.tsx`, `BudgetOverviewView.tsx`
Обернуть все вызовы `deleteTransaction`, `deleteAccount`, `deleteRecurringExpense` в `window.confirm()`:
```typescript
const handleDelete = async (id: string) => {
  if (!window.confirm('Удалить транзакцию?')) return
  await deleteTransaction(id)
}
```
Тексты: "Удалить транзакцию?", "Удалить счёт?", "Удалить расход?"

### 5.3 Мультивалютный баланс
**Файл**: `BudgetOverviewView.tsx`, секция Balance
1. Загрузить `exchangeRates` из store
2. Функция конвертации:
```typescript
function convertToDefault(amount: number, fromCurrency: Currency, toCurrency: Currency, rates: ExchangeRate[]): number | null {
  if (fromCurrency === toCurrency) return amount
  const rate = rates.find(r => r.from_currency === fromCurrency && r.to_currency === toCurrency)
  if (!rate) return null
  return amount * rate.rate
}
```
3. При расчёте `totalBalance` — суммировать только конвертированные. Неконвертируемые (rate не найден) не включать.
4. Если есть неконвертируемые — показать `≈` перед суммой
5. Убедиться, что `exchangeRates` загружаются в `loadBudgetData` (проверить `budget-database.ts`, при необходимости добавить загрузку)

### 5.4 Fade-gradient на скролле категорий
**Файл**: `BudgetTransactionsView.tsx`
Обернуть container chips:
```tsx
<div className="relative">
  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 pr-6">
    {/* chips */}
  </div>
  <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-[var(--color-bg-secondary)] to-transparent pointer-events-none" />
</div>
```

### 5.5 Drag-and-drop категорий
**Файл**: `BudgetSettingsView.tsx`
Подключить Framer Motion `Reorder`:
```tsx
import { Reorder } from 'framer-motion'

<Reorder.Group axis="y" values={budgetCategories} onReorder={(newOrder) => {
  reorderCategories(newOrder.map(c => c.id))
}}>
  {budgetCategories.map(cat => (
    <Reorder.Item key={cat.id} value={cat}>
      {/* текущий контент строки категории */}
    </Reorder.Item>
  ))}
</Reorder.Group>
```
GripVertical уже рендерится — оставить как drag handle.

### 5.6 "Бюджет на день" на Overview
**Файл**: `BudgetOverviewView.tsx`, блок "Траты"
Добавить четвёртую метрику в grid (сделать `grid-cols-2 gap-2` с 4 ячейками, или оставить `grid-cols-3` и добавить отдельную строку).
Расчёт:
```typescript
const totalLimit = budgetLimits.reduce((s, l) => s + Number(l.amount), 0)
const daysLeft = lastDayOfMonth - todayDay + 1
const dailyBudget = totalLimit > 0 ? Math.max(0, (totalLimit - spentThisMonth) / daysLeft) : 0
```
Показывать только если `totalLimit > 0` и месяц текущий. Лейбл: `Можно/день`. Значение: `{formatAmount(dailyBudget, defaultCurrency)}`.

---

## ШАГ 6: Проверка

1. Запустить `pnpm build` — MUST pass без ошибок
2. Проверить TypeScript strict mode — никаких `any`, все типы explicit
3. Убедиться, что CSS variables используются везде (никаких хардкод цветов кроме CHART_COLORS и конкретных amber/red/emerald для semantic states)
4. Убедиться, что все тексты на русском

</task_sequence>

<allowed_actions>

- Редактировать файлы ТОЛЬКО в `src/components/views/`, `src/components/budget/`, `src/components/Layout.tsx`, `src/hooks/useBudget.ts`, `src/lib/budget-database.ts`, `src/store/index.ts`, `src/types/budget.ts`, `src/lib/animations.ts`
- Устанавливать пакеты ТОЛЬКО если они уже есть в `package.json` (framer-motion, recharts, lucide-react — всё уже установлено)
- Создавать новые файлы ТОЛЬКО в `src/components/budget/` если нужны новые подкомпоненты (например, BillRow.tsx)

</allowed_actions>

<forbidden_actions>

- НЕ трогать tracker-часть приложения (TodayView, TasksView, IdeasView, RecurringView, AnalyticsView)
- НЕ трогать auth, supabase config, database schema
- НЕ трогать Navigation.tsx, BottomNavigation.tsx, ModeSwitcher.tsx
- НЕ добавлять новые зависимости в package.json
- НЕ менять localStorage для последней категории в AddTransactionSheet (оставить как есть)
- НЕ менять логику автопометки подписок (isPaid по дню месяца — оставить)
- НЕ реализовывать CoupleBalance (вырезано, не нужно)
- НЕ добавлять features сверх описанных
- НЕ рефакторить файлы, которые не перечислены в задачах
- НЕ пушить в git, НЕ запускать dev server

</forbidden_actions>

<stop_conditions>

Остановиться и спросить, если:
- Нужно изменить database schema (SQL)
- `budget-database.ts` не содержит метод, который требуется (например, getExchangeRates)
- Два валидных варианта реализации с разными trade-offs
- Ошибка не решается за 2 попытки
- Нужно затронуть файл вне allowed scope

</stop_conditions>

<checkpoints>

После завершения каждого ШАГА — вывести:
✅ [Шаг N] — что было сделано, какие файлы изменены

После завершения всех шагов:
📋 Полная сводка: все изменённые файлы, что добавлено, что удалено.

</checkpoints>

<constraints>

- **Стиль**: CSS variables `var(--color-*)` для всех цветов. Исключения: semantic colors (amber-50, red-500, emerald-500) для конкретных состояний, CHART_COLORS для графиков
- **Анимации**: Framer Motion через tokens из `src/lib/animations.ts`. AnimatePresence для collapse/expand. motion.div с variants.listItem для появления
- **Типы**: Explicit TypeScript типы на всех новых функциях, пропсах, state. Никаких `any`
- **Компактность**: Mobile-first. text-xs/text-sm, минимальные отступы, никаких лишних пространств
- **Локализация**: Все UI-тексты на русском
- **Recharts**: Использовать существующие импорты (PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip). Для линии среднего — добавить импорт `ReferenceLine`
- **Порядок**: Выполнять строго по шагам 1→2→3→4→5→6. Не забегать вперёд

</constraints>
