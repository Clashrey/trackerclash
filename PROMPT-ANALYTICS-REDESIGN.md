<objective>
Полностью переписать экран аналитики бюджетного модуля (`BudgetAnalyticsView.tsx`). Текущий код заменяется целиком. Новый экран состоит из 6 блоков, каждый отвечает на конкретный вопрос пользователя о его расходах.
</objective>

<starting_state>

## Стек
React 18 + TypeScript 5.8 + Vite, Supabase (PostgreSQL + RLS), Zustand 5, Tailwind CSS 4 (CSS Variables light/dark), Framer Motion 12, Recharts 2.15, shadcn/ui, Lucide React icons, Sonner toasts.

## Текущий файл
`src/components/views/BudgetAnalyticsView.tsx` — 4 блока: маленький donut (128×128) + cramped legend, bar chart 6 мес (waterfall загрузка), прогресс лимитов (дублирует Overview), split по партнёрам (маленький pie). Нет навигации по месяцам, нет сравнения, нет процентов, нет инсайтов.

## Зависимости которые УЖЕ установлены и доступны
framer-motion, recharts (PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine), lucide-react, sonner.

## Файлы которые нужно прочитать перед началом работы
- `src/components/views/BudgetAnalyticsView.tsx` — текущий код (заменяем)
- `src/hooks/useBudget.ts` — хук: `formatAmount(amount, currency)`, `CURRENCY_SYMBOLS`, `loadBudgetData()`
- `src/store/index.ts` — Zustand: `couple`, `budgetContext`, `budgetCategories`, `transactions`, `budgetLimits`, `budgetSelectedMonth`, `setBudgetSelectedMonth`, `userId`
- `src/types/budget.ts` — типы: `Currency`, `Transaction`, `BudgetCategory`, `BudgetLimit`, `BudgetContext`, `Couple`
- `src/lib/budget-database.ts` — `budgetDatabaseService.getTransactions(coupleId, { month, context })` — нужен для загрузки прошлого месяца и 6-мес истории
- `src/lib/animations.ts` — tokens: `transitions.smooth`, `transitions.slow`, `variants.listItem`, `variants.staggerContainer`
- `src/components/BudgetContextSwitcher.tsx` — toggle Личный/Рабочий
- `src/components/budget/AddTransactionSheet.tsx` — FAB кнопка "+"

## Контекст приложения
Бюджет для пары. Два контекста: `personal` (дефолтная валюта THB) и `work` (дефолтная валюта RUB). `couple.user1_id` и `couple.user2_id` — два партнёра. `userId` — текущий пользователь. Транзакции имеют `user_id`, `category_id`, `amount`, `currency`, `date`, `type` (shared/personal). Все тексты на русском.

## Важно: загрузка данных
Загрузка `loadBudgetData()` происходит централизованно в Layout.tsx при смене `budgetContext` и `budgetSelectedMonth`. НЕ добавлять `useEffect` с `loadBudgetData` в этот компонент. Текущие `transactions`, `budgetCategories`, `budgetLimits` уже в store. Компонент ДОЛЖЕН загружать дополнительные данные самостоятельно: транзакции прошлого месяца и 6-месячную историю.

</starting_state>

<target_state>
Файл `src/components/views/BudgetAnalyticsView.tsx` переписан целиком. Содержит 6 блоков (описаны ниже), навигацию по месяцам, загрузку доп. данных через Promise.all. TypeScript strict, никаких `any`. Все цвета через CSS variables (кроме semantic amber/red/emerald и CHART_COLORS). Тексты на русском. Компонент собирается без ошибок.
</target_state>

<task>

Перепиши `src/components/views/BudgetAnalyticsView.tsx` целиком. Структура нового компонента:

## Данные

Из store (уже загружены):
```typescript
const { couple, budgetContext, budgetCategories, transactions, budgetLimits, budgetSelectedMonth, setBudgetSelectedMonth, userId } = useAppStore()
```

Локальный state — загружать в useEffect при смене `couple`, `budgetContext`, `budgetSelectedMonth`:

1. `prevMonthTransactions: Transaction[]` — один запрос:
```typescript
const [y, m] = budgetSelectedMonth.split('-').map(Number)
const prevDate = new Date(y, m - 2)
const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
const txns = await budgetDatabaseService.getTransactions(couple.id, { month: prevMonth, context: budgetContext })
```

2. `monthlyHistory: { month: string; total: number }[]` — 6 месяцев через Promise.all (НЕ waterfall):
```typescript
const promises = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(y, m - 1 - (5 - i))
  const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return budgetDatabaseService.getTransactions(couple.id, { month: monthStr, context: budgetContext })
    .then(txns => ({ month: d.toLocaleDateString('ru-RU', { month: 'short' }), total: txns.reduce((s, t) => s + Number(t.amount), 0) }))
    .catch(() => ({ month: monthStr, total: 0 }))
})
const history = await Promise.all(promises)
```

Производные (useMemo):
```
defaultCurrency = budgetContext === 'personal' ? 'THB' : 'RUB'
totalSpent = transactions.reduce(sum amount)
prevTotalSpent = prevMonthTransactions.reduce(sum amount)
categoryTotals: Record<string, number> — текущий месяц
prevCategoryTotals: Record<string, number> — прошлый месяц
categoryData: отсортированный массив { id, name, emoji, color, value, pct }
avgPerDay = totalSpent / (кол-во уникальных дат в transactions, или прошедших дней если месяц текущий)
```

## Навигация по месяцам

Сразу после заголовка — ChevronLeft / месяц / ChevronRight:
```tsx
<div className="flex items-center justify-center gap-4">
  <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
    <ChevronLeft size={18} />
  </button>
  <span className="text-sm font-medium text-[var(--color-text-primary)] capitalize min-w-[140px] text-center">
    {monthLabel}
  </span>
  <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
    <ChevronRight size={18} />
  </button>
</div>
```

## БЛОК 1: Сводка месяца

`grid grid-cols-3 gap-2`. Каждая ячейка: `p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)]`.

| Ячейка | Лейбл text-[10px] tertiary | Значение text-lg font-bold primary | Доп. |
|---|---|---|---|
| Расходы | `Расходы` | `formatAmount(totalSpent, defaultCurrency)` | — |
| vs прошлый | `vs прошлый` | `▲ +12%` или `▼ -8%` или `—` | Под значением: абс. разница text-[10px] |
| В среднем/день | `В среднем/день` | `formatAmount(avgPerDay, defaultCurrency)` | — |

Цвет второй ячейки (значение):
- Рост > 5%: `text-red-500 dark:text-red-400`
- Снижение > 5%: `text-emerald-500 dark:text-emerald-400`
- ±5%: `text-[var(--color-text-secondary)]`

Если prevTotalSpent === 0 — показать `—` серым.

## БЛОК 2: Категории

Карточка `p-4 rounded-xl bg-[var(--color-bg-elevated)] border`. Заголовок: `Расходы по категориям` text-xs tertiary.

**Donut** — по центру, 160×160:
```tsx
<div className="flex justify-center mb-4 relative">
  <div className="w-40 h-40">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
          {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  </div>
  {/* Сумма в центре donut */}
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <span className="text-sm font-bold text-[var(--color-text-primary)]">{formatAmount(totalSpent, defaultCurrency)}</span>
  </div>
</div>
```

**Список ПОД donut** (не рядом). Каждая строка:
```tsx
<div className="flex items-center gap-2 py-1">
  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
  <span className="text-sm text-[var(--color-text-primary)] truncate">{d.emoji} {d.catName}</span>
  <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden mx-1">
    <div className="h-full rounded-full" style={{ width: `${(d.value / categoryData[0].value) * 100}%`, backgroundColor: d.color }} />
  </div>
  <span className="text-xs text-[var(--color-text-tertiary)] flex-shrink-0 w-8 text-right">{d.pct}%</span>
  <span className="text-xs font-medium text-[var(--color-text-secondary)] flex-shrink-0">{formatAmount(d.value, defaultCurrency)}</span>
</div>
```

Если категорий > 5 — показать первые 5, кнопка `ещё {n}` через AnimatePresence раскрывает остальные.

## БЛОК 3: Динамика расходов

Карточка. Заголовок: `Динамика расходов` text-xs tertiary. Подпись справа: `Средний: {formatAmount(avgMonthly, defaultCurrency)}/мес` text-[10px] tertiary.

Bar chart h-40:
- Текущий месяц (последний столбик) — `fillOpacity={1}`, остальные `fillOpacity={0.35}`
- `<ReferenceLine y={avgMonthly} stroke="var(--color-text-tertiary)" strokeDasharray="4 4" />` — пунктирная линия среднего
- XAxis: fontSize 10, fill tertiary, без axisLine/tickLine
- YAxis: hide
- Tooltip: текущий стиль (bg-elevated, border, borderRadius 8, fontSize 12)

```tsx
<Bar dataKey="total" radius={[4, 4, 0, 0]}>
  {monthlyHistory.map((_, i) => (
    <Cell key={i} fill="var(--color-accent)" fillOpacity={i === monthlyHistory.length - 1 ? 1 : 0.35} />
  ))}
</Bar>
```

## БЛОК 4: Лимиты — только проблемные

НЕ показывать все лимиты. Только ≥ 80%.

```typescript
const problematicLimits = budgetLimits
  .map(limit => {
    const spent = categoryTotals[limit.category_id] || 0
    const pct = (spent / Number(limit.amount)) * 100
    const cat = budgetCategories.find(c => c.id === limit.category_id)
    return { limit, spent, pct, cat }
  })
  .filter(l => l.pct >= 80)
  .sort((a, b) => b.pct - a.pct)

const okLimitsCount = budgetLimits.length - problematicLimits.length
```

Рендер:
- `pct > 100`: progress bar `var(--color-danger)`, текст суммы `text-[var(--color-danger)]`
- `80 <= pct <= 100`: progress bar `#F59E0B`, текст суммы `text-amber-500`
- Под списком: `✅ Остальные {okLimitsCount} в норме` text-xs tertiary
- Если все в норме: одна строка `✅ Все {budgetLimits.length} лимитов в порядке` text-xs emerald-500
- Если лимитов нет — НЕ рендерить блок

## БЛОК 5: Сравнение с прошлым месяцем

Карточка. Заголовок: `vs прошлый месяц` text-xs tertiary.

Для каждой категории с тратами в текущем ИЛИ прошлом месяце:

```typescript
const comparisonData = budgetCategories
  .map(cat => {
    const current = categoryTotals[cat.id] || 0
    const prev = prevCategoryTotals[cat.id] || 0
    if (current === 0 && prev === 0) return null
    const diff = current - prev
    const pctChange = prev > 0 ? Math.round((diff / prev) * 100) : (current > 0 ? 100 : 0)
    return { cat, current, prev, diff, pctChange }
  })
  .filter(Boolean)
  .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
```

Каждая строка:
```
emoji название     сумма          ▲ +3 200 (+29%)
```

Цвет индикатора:
- `diff > 0` и `|pctChange| > 5`: `▲` text-red-500 (тратишь больше = плохо)
- `diff < 0` и `|pctChange| > 5`: `▼` text-emerald-500 (тратишь меньше = хорошо)
- `|pctChange| <= 5`: `—` text-tertiary

Если `prevMonthTransactions.length === 0` — показать `Нет данных за прошлый месяц` text-xs tertiary.

## БЛОК 6: Кто тратит

Рендерить ТОЛЬКО если `budgetContext === 'personal'` И `couple.user2_id` существует.

Карточка. Заголовок: `Расходы по партнёрам` text-xs tertiary.

Расчёт:
```typescript
let myTotal = 0, partnerTotal = 0
const myCategoryTotals: Record<string, number> = {}
const partnerCategoryTotals: Record<string, number> = {}

for (const t of transactions) {
  const isMe = t.user_id === userId
  if (isMe) { myTotal += Number(t.amount); myCategoryTotals[t.category_id] = (myCategoryTotals[t.category_id] || 0) + Number(t.amount) }
  else { partnerTotal += Number(t.amount); partnerCategoryTotals[t.category_id] = (partnerCategoryTotals[t.category_id] || 0) + Number(t.amount) }
}
const grandTotal = myTotal + partnerTotal
const myPct = grandTotal > 0 ? Math.round(myTotal / grandTotal * 100) : 0
const partnerPct = 100 - myPct
```

Stacked bar:
```tsx
<div className="flex h-3 rounded-full overflow-hidden mb-2">
  <div style={{ width: `${myPct}%` }} className="bg-[#4ECDC4]" />
  <div style={{ width: `${partnerPct}%` }} className="bg-[#FF6B6B]" />
</div>
<div className="flex justify-between text-sm">
  <span className="text-[var(--color-text-primary)]"><span className="inline-block w-2 h-2 rounded-full bg-[#4ECDC4] mr-1.5" />Я: {formatAmount(myTotal, defaultCurrency)} ({myPct}%)</span>
  <span className="text-[var(--color-text-primary)]"><span className="inline-block w-2 h-2 rounded-full bg-[#FF6B6B] mr-1.5" />Партнёр: {formatAmount(partnerTotal, defaultCurrency)} ({partnerPct}%)</span>
</div>
```

Топ разница — 3 категории где `|myAmount - partnerAmount|` максимален:
```typescript
const topDiff = budgetCategories
  .map(cat => ({ cat, my: myCategoryTotals[cat.id] || 0, partner: partnerCategoryTotals[cat.id] || 0 }))
  .filter(d => d.my > 0 || d.partner > 0)
  .sort((a, b) => Math.abs(b.my - b.partner) - Math.abs(a.my - a.partner))
  .slice(0, 3)
```
Строка: `emoji название — я: сумма, партнёр: сумма` text-xs tertiary.

## Empty state

Если `transactions.length === 0`:
```tsx
<div className="text-center py-8 text-[var(--color-text-tertiary)]">
  <p className="text-3xl mb-2">📊</p>
  <p className="text-sm">Нет данных для анализа</p>
</div>
```

## Общая обёртка

`motion.div` с `variants.staggerContainer` + каждый блок `motion.div` с `variants.listItem` и `transition={transitions.smooth}`.

Один `<AddTransactionSheet />` в конце (FAB кнопка).

Guard: если `!couple` — ранний return с `Пара не создана`.

</task>

<allowed_actions>

- Перезаписать `src/components/views/BudgetAnalyticsView.tsx` целиком
- Добавить импорт `ReferenceLine` из recharts
- Добавить импорт `ChevronLeft`, `ChevronRight` из lucide-react
- Читать любые файлы проекта для контекста

</allowed_actions>

<forbidden_actions>

- НЕ менять другие файлы (store, hooks, types, другие views)
- НЕ добавлять зависимости
- НЕ добавлять useEffect с loadBudgetData (данные загружаются в Layout.tsx)
- НЕ реализовывать CoupleBalance
- НЕ добавлять фичи сверх 6 описанных блоков

</forbidden_actions>

<stop_conditions>

Остановиться и спросить, если:
- `budgetDatabaseService.getTransactions` не поддерживает нужные параметры
- Recharts `ReferenceLine` требует другой API чем указан
- Нужен доступ к данным, которых нет в store и нельзя загрузить через getTransactions

</stop_conditions>

<constraints>

- Все цвета через `var(--color-*)`. Исключения: `#4ECDC4`/`#FF6B6B` для партнёров, `CHART_COLORS` для графиков, semantic amber/red/emerald для состояний
- Анимации через tokens из `src/lib/animations.ts`
- TypeScript strict, никаких `any`, explicit типы
- Mobile-first, text-xs/text-sm, компактные отступы
- Все тексты на русском
- Один файл — один компонент, без выноса подкомпонентов (всё внутри BudgetAnalyticsView)

</constraints>
