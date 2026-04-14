# Промт: Бюджетный модуль для TrackerClash

## Контекст проекта

Существующее приложение — персональный трекер задач для пары (я и моя девушка). Развёрнут на Vercel. Нужно добавить полноценный раздел управления бюджетом на тот же сайт.

<context>
## Стек
- React 18.2 + TypeScript 5.8 + Vite 6.3
- Supabase (PostgreSQL, RLS)
- Zustand 5.0 (стейт-менеджмент)
- Tailwind CSS 4.1 + CSS Variables (светлая/тёмная тема)
- shadcn/ui (New York style) — компоненты в src/components/ui/
- Framer Motion 12.15 (анимации)
- Recharts 2.15 (графики)
- Sonner (тосты)
- date-fns 3.6 (даты)
- React Day Picker (календарь)
- pnpm 10.4.1

## Структура проекта
```
src/
├── App.tsx                    # Главный компонент
├── main.tsx                   # Entry point с AuthProvider
├── index.css                  # Глобальные стили + CSS переменные (тема)
├── components/
│   ├── Layout.tsx             # Роутинг по currentCategory через switch
│   ├── Navigation.tsx         # Верхние табы (desktop)
│   ├── BottomNavigation.tsx   # Нижняя навигация (mobile)
│   ├── AuthForm.tsx           # Логин/регистрация
│   ├── CommandPalette.tsx     # Cmd+K
│   ├── views/
│   │   ├── TodayView.tsx
│   │   ├── TasksView.tsx
│   │   ├── IdeasView.tsx
│   │   ├── RecurringView.tsx
│   │   └── AnalyticsView.tsx
│   └── ui/                    # shadcn компоненты
├── hooks/
│   ├── useAuth.tsx            # API-key авторизация
│   ├── useDatabase.ts         # Обёртка над DatabaseService
│   └── useKeyboardShortcuts.ts
├── lib/
│   ├── supabase.ts            # Supabase клиент + типы БД
│   ├── database.ts            # DatabaseService класс (CRUD)
│   ├── animations.ts          # Токены анимаций Framer Motion
│   └── utils.ts
├── store/
│   └── index.ts               # Zustand store
└── types/
    ├── index.ts               # Типы задач
    └── budget.ts              # ✅ УЖЕ СОЗДАН — типы бюджета
```

## Как работает навигация сейчас
- НЕТ роутера. Переключение через Zustand: `currentCategory: TaskCategory`
- TaskCategory = 'today' | 'tasks' | 'ideas' | 'recurring' | 'analytics'
- Layout.tsx рендерит View по switch(currentCategory)
- Desktop: верхние табы (Navigation.tsx)
- Mobile: нижняя навигация (BottomNavigation.tsx) — 5 иконок

## Как работает авторизация
- API-key (формат tk_ + 32 символа)
- Хранится в localStorage (tracker_api_key)
- userId в Zustand store
- Supabase RLS через current_setting('app.current_user_id')

## Что УЖЕ готово для бюджета
1. `database-schema-budget.sql` — полная SQL-схема (couples, budget_categories, transactions, budget_limits, exchange_rates + RLS + функция дефолтных категорий)
2. `src/types/budget.ts` — все TypeScript типы (BudgetCategory, Transaction, BudgetLimit, ExchangeRate, TransactionFormData, CoupleBalance, MonthlySummary, AppMode, BudgetView, BudgetContext, Currency, TransactionType)
</context>

<task>
Реализуй полный бюджетный модуль, интегрированный в существующее приложение. Модуль ДОЛЖЕН:

## 1. Навигация и режимы приложения

Добавить верхнеуровневый переключатель режимов **Трекер / Бюджет** (pill-toggle) в шапку приложения. При переключении:
- Нижняя навигация (mobile) и верхние табы (desktop) меняют свои пункты
- Режим "Трекер": существующие 5 табов без изменений
- Режим "Бюджет": 4 таба — Обзор, Транзакции, Аналитика, Настройки

Обнови тип в types/index.ts:
```typescript
export type TaskCategory = 'today' | 'tasks' | 'ideas' | 'recurring' | 'analytics'
  | 'budget_overview' | 'budget_transactions' | 'budget_analytics' | 'budget_settings'
```

Добавь в Zustand store:
```typescript
appMode: AppMode // 'tracker' | 'budget'
setAppMode: (mode: AppMode) => void
budgetContext: BudgetContext // 'personal' | 'work'
setBudgetContext: (ctx: BudgetContext) => void
```

## 2. Переключатель Личный / Рабочий бюджет

Внутри режима "Бюджет" — pill-toggle сверху: **Личный / Рабочий**. Хранится в `budgetContext`. Влияет на:
- Какие категории показываются
- Какие транзакции отображаются
- Валюту по умолчанию (Личный = THB, Рабочий = RUB)
- В рабочем бюджете нет split/баланса между партнёрами — только общий котёл

## 3. Быстрый ввод транзакции (КРИТИЧНЫЙ UX)

FAB-кнопка "+" в правом нижнем углу на ВСЕХ экранах бюджета. По нажатию — Sheet/Drawer снизу:

```
┌─────────────────────────────┐
│  ₿ 0                       │  ← Крупный инпут суммы, inputMode="decimal"
│                             │
│  [🍕][🏠][🚗][🎬][👕]     │  ← Grid категорий (emoji-кнопки)
│  [💊][📱][✈️][🎓][💸][📦] │     Тап = выбор. Подсвеченная = текущая.
│                             │
│  THB ▾ | Общая ▾ | Сегодня │  ← Валюта, тип, дата (дефолты из контекста)
│                             │
│  Описание (опционально)     │  ← Текстовое поле
│                             │
│  [ Добавить ✓ ]             │  ← Primary кнопка
└─────────────────────────────┘
```

Категории отображаются как grid эмодзи-кнопок (3-4 в ряду на мобиле). При наведении/фокусе показывается название. Выбранная категория подсвечена цветом из `budget_categories.color`.

Дефолты автоматические:
- Валюта: THB для личного, RUB для рабочего
- Тип: "shared" для рабочего (нельзя менять), для личного — toggle "Общая / Моя"  
- Дата: сегодня
- Категория: последняя использованная (хранить в localStorage)

После добавления: тост "Добавлено: 🍕 1,500 ฿", sheet закрывается, данные обновляются.

## 4. Экран "Обзор" (budget_overview)

Дэшборд текущего месяца:

**Для личного бюджета:**
- Карточка "Потрачено в этом месяце" — общая сумма
- Карточка "Баланс" — кто кому сколько должен (только shared транзакции: разница потраченного / 2). Формат: "Катя должна Данилу 3,500 ฿" или "Вы квиты ✓"
- Прогресс-бары лимитов по категориям (если заданы) — цветные, с % заполнения
- Список последних 5 транзакций (с иконкой категории, суммой, датой)

**Для рабочего бюджета:**
- Карточка "Расходы за месяц" — общая сумма в RUB
- Top-3 категории по расходам (мини donut chart или progress bars)
- Список последних 5 транзакций

## 5. Экран "Транзакции" (budget_transactions)

Полный список транзакций за выбранный период:
- Фильтр по месяцу (стрелки ← →, как DateNavigation в трекере)
- Фильтр по категории (горизонтальный скролл эмодзи-чипов)
- Каждая транзакция: эмодзи + название категории, сумма, описание, дата, кто добавил (для shared)
- Свайп влево = удалить (или кнопка удаления)
- Тап на транзакцию = редактирование (тот же Sheet что для добавления, но с заполненными данными)
- Итого за выбранный период внизу

## 6. Экран "Аналитика" (budget_analytics)

Используй Recharts (уже в проекте):
- **Donut chart** — расходы по категориям за месяц (с легендой: эмодзи + название + сумма)
- **Bar chart** — помесячная динамика расходов (последние 6 месяцев)
- **Прогресс лимитов** — по каждой категории с лимитом: прогресс-бар + "потрачено / лимит"
- Для личного бюджета: дополнительно split chart — сколько потратил каждый партнёр

## 7. Экран "Настройки" (budget_settings)

### 7a. Управление категориями (ВАЖНО — удобство!)
- Список категорий с drag-to-reorder (порядок = order_index)
- Каждая категория: эмодзи + название + цвет-точка
- Тап на категорию = редактирование (emoji picker, название, цвет)
- Кнопка "Добавить категорию" 
- Свайп = архивировать (is_archived, не удалять — могут быть транзакции)
- Emoji picker: grid из популярных эмодзи по группам (еда, транспорт, дом, деньги, etc.)

### 7b. Лимиты бюджета
- Список категорий с полем для лимита
- Задаётся на месяц в валюте контекста
- Можно копировать лимиты с прошлого месяца одной кнопкой

### 7c. Связка пары
- Если пара не создана: кнопка "Создать пару" → генерирует invite_code → показать код для отправки партнёру
- Если пара не создана: поле "Ввести код приглашения" → принять инвайт
- Если пара создана: показать статус "Связан с [имя партнёра]"

### 7d. Валюта
- Выбор домашней валюты для отображения итогов
- Текущий курс RUB/THB (из exchange_rates или ввод вручную)

## 8. Database Service

Создай `src/lib/budget-database.ts` — класс `BudgetDatabaseService` в стиле существующего `DatabaseService`:
- Паттерн: метод getCurrentUserId() из Zustand, все запросы через supabase client
- CRUD для: couples, budget_categories, transactions, budget_limits, exchange_rates
- Методы:
  - `getCouple()` — получить пару текущего пользователя
  - `createCouple()` → генерирует invite_code, вызывает create_default_categories
  - `joinCouple(inviteCode)` → добавляет user2_id к паре
  - `getCategories(context)` → категории пары по контексту
  - `addCategory(...)`, `updateCategory(...)`, `archiveCategory(id)`
  - `reorderCategories(ids[])` — массовое обновление order_index
  - `getTransactions(filters)` → с фильтрацией по месяцу, категории, контексту
  - `addTransaction(...)`, `updateTransaction(...)`, `deleteTransaction(id)`
  - `getBudgetLimits(month, context)`, `setBudgetLimit(...)`, `copyLimitsFromPrevMonth(month)`
  - `getMonthlyTotals(month, context)` → агрегат по категориям
  - `getCoupleBalance(month)` → баланс между партнёрами
  - `getExchangeRate(from, to)`, `updateExchangeRate(from, to, rate)`

## 9. Zustand Budget Store

Добавь в существующий `src/store/index.ts` (или создай отдельный `src/store/budget.ts` и объедини):

```typescript
// Budget state
appMode: AppMode
setAppMode: (mode: AppMode) => void
budgetContext: BudgetContext
setBudgetContext: (ctx: BudgetContext) => void
couple: Couple | null
setCouple: (couple: Couple | null) => void
budgetCategories: BudgetCategory[]
setBudgetCategories: (cats: BudgetCategory[]) => void
transactions: Transaction[]
setTransactions: (txns: Transaction[]) => void
budgetLimits: BudgetLimit[]
setBudgetLimits: (limits: BudgetLimit[]) => void
exchangeRates: ExchangeRate[]
setExchangeRates: (rates: ExchangeRate[]) => void
budgetSelectedMonth: string // 'YYYY-MM'
setBudgetSelectedMonth: (month: string) => void
```

## 10. Хук useBudget

Создай `src/hooks/useBudget.ts` — аналог существующего useDatabase:
- Загрузка данных при монтировании (пара, категории, транзакции за месяц, лимиты)
- CRUD-операции с оптимистичным обновлением стора + тосты
- Пересчёт баланса при изменении транзакций
- Функция конвертации валют через exchange_rates
</task>

<constraints>
## ОБЯЗАТЕЛЬНО
- Все тексты UI на русском языке
- Стиль кода — как в существующих файлах (DatabaseService паттерн, CSS variables для цветов, Framer Motion для анимаций)
- Использовать shadcn/ui компоненты (Sheet, Dialog, Button, Input, Card, Badge, ScrollArea, Tabs и т.д.) из src/components/ui/
- Мобильный UX в приоритете — всё должно быть удобно на телефоне
- Тёмная тема ДОЛЖНА работать (CSS variables уже настроены)
- Формат чисел: 1,500.00 ₿ или 15,000 ₽ (с разделителем тысяч и символом валюты)
- НЕ ломать существующий функционал трекера задач
- Типы из src/types/budget.ts УЖЕ ГОТОВЫ — использовать их, не создавать заново
- SQL-схема в database-schema-budget.sql УЖЕ ГОТОВА — не менять её

## ЗАПРЕЩЕНО
- НЕ добавлять новые зависимости без крайней необходимости (всё есть в проекте)
- НЕ использовать React Router — навигация через Zustand (как сейчас)
- НЕ трогать существующие Views задач (TodayView, TasksView и т.д.)
- НЕ менять AuthForm.tsx и useAuth.tsx
- НЕ создавать отдельные CSS файлы — всё через Tailwind + CSS variables
- НЕ использовать localStorage для данных — только Supabase (localStorage только для UI preferences типа последней категории)
</constraints>

<stop_conditions>
Остановись и спроси перед:
- Удалением любого существующего файла
- Добавлением npm-зависимости
- Изменением database-schema-budget.sql или src/types/budget.ts
- Изменением AuthForm, useAuth, или supabase.ts
- Если два варианта реализации одинаково хороши и выбор влияет на архитектуру

После каждого крупного шага выводи: ✅ [что сделано]
В конце выведи полный список изменённых и созданных файлов.
</stop_conditions>

<execution_order>
1. src/lib/budget-database.ts — BudgetDatabaseService
2. src/store/index.ts — добавить budget state (или src/store/budget.ts)
3. src/hooks/useBudget.ts
4. src/types/index.ts — расширить TaskCategory
5. src/components/ModeSwitcher.tsx — pill-toggle Трекер/Бюджет
6. src/components/BudgetContextSwitcher.tsx — pill-toggle Личный/Рабочий
7. src/components/budget/AddTransactionSheet.tsx — FAB + quick-add sheet
8. src/components/budget/CategoryPicker.tsx — emoji grid для выбора категории
9. src/components/budget/EmojiPicker.tsx — для настроек категорий
10. src/components/views/BudgetOverviewView.tsx
11. src/components/views/BudgetTransactionsView.tsx
12. src/components/views/BudgetAnalyticsView.tsx
13. src/components/views/BudgetSettingsView.tsx
14. src/components/Layout.tsx — добавить budget views в switch
15. src/components/Navigation.tsx — адаптировать под appMode
16. src/components/BottomNavigation.tsx — адаптировать под appMode
17. src/components/CommandPalette.tsx — добавить budget команды
</execution_order>
