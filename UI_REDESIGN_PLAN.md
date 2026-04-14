# UI/UX Redesign Plan — Трекер задач

> **Дата:** 2026-04-03
> **Статус:** Черновик, требует согласования
> **Стек:** React 18 · Tailwind CSS 4 · shadcn/ui (Radix) · Zustand · Framer Motion · Supabase

---

## Содержание

1. [Аудит текущего состояния](#1-аудит-текущего-состояния)
2. [Дизайн-система](#2-дизайн-система)
3. [Компонент-по-компонент](#3-компонент-по-компонент)
4. [Новые компоненты](#4-новые-компоненты)
5. [UX-потоки](#5-ux-потоки)
6. [Порядок выполнения (спринты)](#6-порядок-выполнения-спринты)

---

## 1. Аудит текущего состояния

### 1.1 Общие проблемы

| Категория | Проблема | Влияние |
|---|---|---|
| **Консистентность** | Дублирование заголовка «Трекер задач» — и в Layout.tsx (h1), и в Navigation.tsx (h1). Два h1 на странице — нарушение семантики | Высокое |
| **Консистентность** | Разные border-radius: `rounded-md` (AuthForm), `rounded-xl` (TaskItem, AddTaskForm), `rounded-lg` (Navigation tabs). Нет единой шкалы | Среднее |
| **Консистентность** | Разные padding: p-4 (TaskItem), p-6 (RecurringView form, AnalyticsView cards). Нет spacing-системы | Среднее |
| **Типографика** | Заголовки views: все `text-2xl font-bold` — нет иерархии между секциями внутри view | Низкое |
| **Цвет** | Единственный акцентный цвет — `blue-600`. Нет семантических цветов для success/warning/danger помимо inline-использований | Среднее |
| **Dark mode** | Реализован через ручные классы `dark:*` повсюду. tailwind.config.js пустой (нет кастомных токенов). Нет CSS-переменных — сложно менять палитру | Высокое |
| **Адаптивность** | Navigation tabs используют `flex-wrap gap-2` — на узких экранах ломаются на 2 строки без визуального приоритета. Нет bottom-navigation для мобильных | Высокое |
| **Accessibility** | Кнопки в TaskItem не имеют aria-label (только title). Screen reader не может отличить кнопки Toggle/Delete | Высокое |
| **Accessibility** | DatePickerModal: overlay закрывается по клику, но нет закрытия по Escape. Нет focus trap | Среднее |
| **Анимации** | Framer Motion подключён, но НЕ используется ни в одном компоненте. Все transition через CSS `transition-all` | Высокое |
| **Пустые состояния** | Есть базовые empty states (emoji + текст), но нет CTA-кнопок внутри, нет иллюстраций, нет onboarding | Среднее |
| **Обратная связь** | Sonner (toast) подключён в package.json, но не используется нигде. Нет уведомлений при создании/удалении задач | Высокое |
| **Loading** | Нет skeleton loaders. Только один LoadingSpinner для начальной загрузки | Среднее |
| **Command palette** | cmdk подключён в package.json, но не используется | Среднее |

### 1.2 Покомпонентный аудит

#### Layout.tsx
- Двойной заголовок (совместно с Navigation) — избыточно
- Подзаголовок «Организуйте свои дела эффективно» занимает место, не несёт функции
- `pb-safe` — хорошо для iOS, но `container mx-auto max-w-4xl` ограничивает ширину на десктопе

#### Navigation.tsx
- Tabs: плоские кнопки без визуального индикатора активной вкладки (только цвет фона). Нет анимации перехода
- Счётчики задач вычисляются прямо в render — дублируют логику из views
- На мобильных 5 вкладок не помещаются в одну строку — flex-wrap ломает визуальную иерархию
- Кнопка «Выйти» визуально конкурирует с навигацией

#### AuthForm.tsx
- 294 строки — слишком большой компонент, 3 экрана в одном (login, register, generated)
- Нет анимации перехода между экранами
- `window.location.reload()` при логине — жёсткий UX, теряется состояние
- Нет валидации в реальном времени (только при submit)
- Хорошо: есть label, htmlFor, placeholder. Нет autocomplete атрибутов

#### TaskItem.tsx
- 340 строк — самый большой компонент. Управляет и задачей, и подзадачами, и редактированием
- Кнопки действий (✓, ✕) занимают много горизонтального пространства — 3-4 кнопки в ряд
- Кнопки перемещения (↑↓) — неинтуитивны. Drag-and-drop заявлен в README, но реализован через кнопки
- Нет swipe-to-complete/delete на мобильных
- Inline-редактирование работает, но визуально неотличимо от обычного состояния (только по клику)
- Подзадачи: кастомный checkbox (div с border) вместо shadcn Checkbox

#### AddTaskForm.tsx
- Хороший UX: кнопка-placeholder → раскрытие формы → автофокус
- Нет поддержки Enter для submit (есть только Escape для отмены)
- Console.log в production коде (строки 28, 48, 50)
- Нет возможности добавить дату или приоритет при создании задачи

#### DateNavigation.tsx
- Хорошо: backdrop-blur, aria-label на кнопках
- Кнопка «Сегодня» появляется только когда не текущий день — можно добавить swipe-навигацию
- Нет индикатора наличия задач на текущем дне (dot indicator)

#### ProgressBar.tsx
- Использует CSS-переменные shadcn (`text-foreground`, `bg-muted`, `bg-primary`) — единственный компонент с ними
- Анимация `animate-pulse` на shine effect — слишком агрессивная, отвлекает
- Completion message (🎉) хорошая идея, но стилизация отличается от остальных компонентов

#### DatePickerModal.tsx
- Кастомная реализация календаря, хотя react-day-picker уже в зависимостях
- Нет focus trap (Tab уходит за пределы модалки)
- Нет закрытия по Escape
- Отключены прошедшие даты — хорошо, но нет визуального объяснения

#### TodayView.tsx
- Лучший из views: разделение на регулярные и обычные задачи, empty states
- 265 строк — много callback-ов, но структура чистая
- ProgressBar получает prop `progress` который не определён в ProgressBarProps

#### TasksView.tsx / IdeasView.tsx
- Почти идентичные компоненты (копипаст ~80% кода)
- Отличия: TasksView имеет onMoveToToday, IdeasView — нет
- Нужна абстракция общего ListView

#### RecurringView.tsx
- Информационный блок (ℹ️) — хорошая практика, но стиль отличается от общих info-boxes
- Форма добавления inline — отличается от AddTaskForm по паттерну (нет раскрытия)
- Radio buttons не стилизованы через shadcn

#### AnalyticsView.tsx
- Recharts подключён, но НЕ используется — всё нарисовано вручную div-ами
- Нет графиков, только текстовая статистика с mini progress bars
- Вычисления в useEffect без мемоизации — пересчитываются при любом изменении store
- Нет empty state для «нет данных за период»

---

## 2. Дизайн-система

### 2.1 Цветовая палитра

Определяем через CSS-переменные в `index.css` для простой смены тем.

```css
/* Light theme */
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;    /* slate-50 */
  --color-bg-tertiary: #f1f5f9;     /* slate-100 */
  --color-bg-elevated: #ffffff;

  --color-text-primary: #0f172a;     /* slate-900 */
  --color-text-secondary: #475569;   /* slate-500 */
  --color-text-tertiary: #94a3b8;    /* slate-400 */
  --color-text-inverse: #ffffff;

  --color-border-primary: #e2e8f0;   /* slate-200 */
  --color-border-secondary: #f1f5f9; /* slate-100 */
  --color-border-focus: #3b82f6;     /* blue-500 */

  --color-accent: #3b82f6;           /* blue-500 */
  --color-accent-hover: #2563eb;     /* blue-600 */
  --color-accent-light: #eff6ff;     /* blue-50 */

  --color-success: #22c55e;          /* green-500 */
  --color-success-light: #f0fdf4;    /* green-50 */
  --color-warning: #f59e0b;          /* amber-500 */
  --color-warning-light: #fffbeb;    /* amber-50 */
  --color-danger: #ef4444;           /* red-500 */
  --color-danger-light: #fef2f2;     /* red-50 */
}

/* Dark theme */
.dark {
  --color-bg-primary: #0f172a;       /* slate-900 */
  --color-bg-secondary: #1e293b;     /* slate-800 */
  --color-bg-tertiary: #334155;      /* slate-700 */
  --color-bg-elevated: #1e293b;      /* slate-800 */

  --color-text-primary: #f8fafc;     /* slate-50 */
  --color-text-secondary: #94a3b8;   /* slate-400 */
  --color-text-tertiary: #64748b;    /* slate-500 */
  --color-text-inverse: #0f172a;

  --color-border-primary: #334155;   /* slate-700 */
  --color-border-secondary: #1e293b; /* slate-800 */
  --color-border-focus: #60a5fa;     /* blue-400 */

  --color-accent: #60a5fa;           /* blue-400 */
  --color-accent-hover: #3b82f6;     /* blue-500 */
  --color-accent-light: #1e3a5f;

  --color-success: #4ade80;          /* green-400 */
  --color-success-light: #14532d33;
  --color-warning: #fbbf24;          /* amber-400 */
  --color-warning-light: #78350f33;
  --color-danger: #f87171;           /* red-400 */
  --color-danger-light: #7f1d1d33;
}
```

### 2.2 Типографика

| Роль | Классы Tailwind | Пример |
|---|---|---|
| **Page title** | `text-2xl sm:text-3xl font-bold tracking-tight` | «Сегодня» |
| **Section heading** | `text-lg font-semibold` | «Регулярные задачи» |
| **Card title** | `text-base font-medium` | Название задачи |
| **Body** | `text-sm` | Описание, мета-данные |
| **Caption** | `text-xs text-[var(--color-text-tertiary)]` | Счётчики, даты |
| **Label** | `text-sm font-medium` | Label формы |

### 2.3 Spacing scale

| Токен | Значение | Использование |
|---|---|---|
| `gap-1` / `p-1` | 4px | Внутри кнопок-иконок |
| `gap-2` / `p-2` | 8px | Между мелкими элементами |
| `gap-3` / `p-3` | 12px | Padding карточек (compact) |
| `gap-4` / `p-4` | 16px | Padding карточек (default) |
| `gap-6` / `p-6` | 24px | Между секциями внутри view |
| `gap-8` / `py-8` | 32px | Между крупными блоками |
| `space-y-3` | 12px | Между элементами списка задач |
| `space-y-6` | 24px | Между секциями view |

### 2.4 Border-radius scale

| Токен | Значение | Использование |
|---|---|---|
| `rounded-md` | 6px | Inputs, checkboxes |
| `rounded-lg` | 8px | Кнопки, tags, badges |
| `rounded-xl` | 12px | Карточки задач, модальные окна |
| `rounded-2xl` | 16px | Модальные окна (большие), контейнеры |
| `rounded-full` | 9999px | Badges, avatar, pill-buttons |

### 2.5 Shadow scale

| Токен | Использование |
|---|---|
| `shadow-none` | Дефолтное состояние карточек |
| `shadow-sm` | Hover-состояние карточек |
| `shadow-md` | Active/focused карточки, модальные окна |
| `shadow-lg` | Dropdown menus, floating elements |
| `shadow-xl` | Модальные окна (overlay) |

### 2.6 Анимационные токены (Framer Motion)

```typescript
// src/lib/animations.ts — единая конфигурация анимаций

export const transitions = {
  spring: { type: 'spring', stiffness: 500, damping: 30 },
  smooth: { type: 'tween', duration: 0.2, ease: 'easeInOut' },
  slow: { type: 'tween', duration: 0.3, ease: 'easeOut' },
}

export const variants = {
  // Появление элемента в списке
  listItem: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -16, height: 0, marginBottom: 0 },
  },

  // Раскрытие секции (подзадачи, форма)
  collapse: {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto' },
  },

  // Переход между views
  viewTransition: {
    enter: { opacity: 0, x: 16 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
  },

  // Модальное окно
  modal: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },

  // Fade in (для секций)
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },

  // Tab indicator slide
  tabIndicator: {
    // layoutId="activeTab" — Framer Motion layout animation
  },
}
```

---

## 3. Компонент-по-компонент

### 3.1 Layout.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Заголовок | Дублируется с Navigation (два h1) | Удалить h1 и подзаголовок из Layout. Единственный header — в Navigation | P0 |
| Background | `bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100` — едва заметный градиент | `bg-[var(--color-bg-secondary)]` — чистый фон через CSS-переменную | P1 |
| View transition | Жёсткая замена компонентов (switch-case) | Обернуть в `<AnimatePresence mode="wait">`, каждый view с `motion.div` и `variants.viewTransition` | P1 |
| Container | `max-w-4xl` | Оставить, но добавить `lg:max-w-5xl` для десктопа | P2 |
| Мобильный layout | Нет bottom navigation | Добавить fixed bottom-bar на мобильных (`sm:hidden`) с 5 иконками вкладок | P0 |

**Конкретные изменения:**
```tsx
// Удалить:
<h1 className="text-2xl sm:text-3xl ...">Трекер задач</h1>
<p className="text-sm ...">Организуйте свои дела эффективно</p>

// Добавить AnimatePresence:
<AnimatePresence mode="wait">
  <motion.div
    key={currentCategory}
    initial="enter"
    animate="center"
    exit="exit"
    variants={variants.viewTransition}
    transition={transitions.smooth}
  >
    {renderCurrentView()}
  </motion.div>
</AnimatePresence>
```

### 3.2 Navigation.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Tabs | `flex flex-wrap gap-2` — переносятся на 2 строки | Desktop: горизонтальный scroll с `overflow-x-auto scrollbar-hide`. Mobile: скрыть, заменить bottom-nav | P0 |
| Active indicator | Только `bg-blue-600 text-white` | Добавить animated underline через Framer Motion `layoutId="activeTab"` — sliding indicator | P1 |
| Счётчики | Inline badge внутри кнопки | Вынести в отдельный `<Badge>` компонент из shadcn. Для «Аналитика» не показывать count | P2 |
| Header row | Заголовок + user info + logout в одной строке | Разделить: верхняя строка (logo + user menu), вторая строка (tabs). User menu — через Dropdown (Radix) | P1 |
| Dark mode toggle | Отдельная кнопка рядом с «Выйти» | Перенести в user dropdown menu | P2 |
| Семантика | `<div>` для навигации | `<nav aria-label="Основная навигация">` и `role="tablist"` для tabs | P0 |

**Tailwind-классы для обновлённых tabs:**
```
// Tab container (desktop)
flex gap-1 overflow-x-auto scrollbar-hide border-b border-[var(--color-border-primary)] pb-px

// Tab item (inactive)
px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)]
hover:text-[var(--color-text-primary)] relative whitespace-nowrap transition-colors

// Tab item (active) — через relative + motion.div indicator
text-[var(--color-accent)] font-semibold

// Animated indicator (Framer Motion layoutId)
absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)] rounded-full
```

### 3.3 AuthForm.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Структура | 294 строки, 3 экрана в одном компоненте | Разбить на 3 компонента: `LoginForm`, `RegisterForm`, `KeyGenerated`. Обернуть в `AnimatePresence` для переходов | P1 |
| Login redirect | `window.location.reload()` | Использовать `setUserId()` из store — без перезагрузки | P0 |
| Валидация | Только при submit | Добавить real-time: `apiKey.startsWith('tk_')` — зелёная/красная обводка при вводе | P1 |
| Autocomplete | Нет | Добавить `autoComplete="current-password"` на поле API-ключа | P1 |
| Transition | Нет | `motion.div` с `variants.fadeIn` для переключения login/register | P2 |
| Console.log | Нет (но есть в AddTaskForm) | N/A | — |

### 3.4 TaskItem.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Размер | 340 строк с подзадачами | Вынести подзадачи в `<SubtaskList>`. TaskItem — ~150 строк | P1 |
| Checkbox | Кнопка `<Check>` с фоном | Заменить на круглый checkbox (как Todoist): пустой circle → filled circle с checkmark. Использовать `<motion.div>` для анимации заполнения | P0 |
| Кнопки действий | 3-4 кнопки видны всегда (✓, ✕, Calendar, Move) | Показывать только на hover. Mobile: swipe actions (swipe left → delete, swipe right → complete) | P0 |
| Move buttons (↑↓) | Кнопки ChevronUp/ChevronDown | Убрать кнопки. Drag handle (⋮⋮ grip dots) слева. Использовать drag через Framer Motion `Reorder.Group`/`Reorder.Item` | P0 |
| Edit mode | Клик на текст → input | Добавить subtle pencil icon при hover. Double-click → edit. Transition с `motion.div` | P2 |
| Completion | `line-through text-gray-400` | Добавить `motion.animate` на checkmark + слегка fade text. Completed задачи — перемещать вниз с анимацией | P1 |
| Recurring badge | `🔄 регулярная` emoji badge | Иконка `<Repeat>` из lucide вместо emoji. `bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full` | P2 |
| Accessibility | `title` на кнопках | Добавить `aria-label` на все interactive elements. `role="checkbox"` на toggle button | P0 |

**Обновлённая структура TaskItem:**
```
┌──────────────────────────────────────────────┐
│ ⋮⋮  ○  Task title                    [hover] │
│      ├─ ○ Subtask 1                  actions  │
│      └─ ● Subtask 2 (done)                   │
│      + Add subtask                            │
└──────────────────────────────────────────────┘

⋮⋮ = drag handle (visible on hover/touch)
○ = unchecked circle
● = checked circle (green fill + white checkmark)
[hover] actions = calendar icon, delete icon (появляются при hover)
```

### 3.5 AddTaskForm.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Enter submit | Не обработан (только handleKeyPress для Escape) | Добавить: `if (e.key === 'Enter') handleSubmit(e)` | P0 |
| Console.log | 3 console.log в production | Удалить строки 28, 48, 50 | P0 |
| Quick actions | Только ввод текста | Добавить inline-иконки: 📅 (date picker), ⭐ (priority), 🔄 (сделать регулярной) | P2 |
| Expanded state | Кнопка → форма (без анимации) | Обернуть в `motion.div` с `variants.collapse` | P1 |
| Cancel text | «Нажмите Escape или кликните здесь для отмены» — длинный | Сократить: просто показывать X рядом с input | P2 |

### 3.6 DateNavigation.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Backdrop | `bg-white/50 backdrop-blur-sm` — хорошо | Оставить | — |
| Swipe | Нет | Добавить swipe left/right для смены дня (через Framer Motion `drag="x"` + `onDragEnd`) | P1 |
| Today dot | Нет индикатора задач | Добавить dot indicator (красная точка) если на дне есть невыполненные задачи | P2 |
| Transition | Нет | Анимация смены даты: `<AnimatePresence>` + slide left/right в зависимости от направления | P1 |

### 3.7 ProgressBar.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Shine effect | `animate-pulse` — слишком агрессивный | Убрать pulse. Заменить на однократный `motion.div` shimmer при изменении percentage | P1 |
| Height | `h-6` — высокий | Сделать `h-2` (thin bar) — современнее, как в Linear/Todoist | P1 |
| Percentage text | Overlay внутри бара | Показывать рядом с label: `3/7 (43%)` текстом, не внутри тонкого бара | P1 |
| Completion message | 🎉 блок с градиентом | Заменить на subtle toast (sonner) при достижении 100% | P2 |
| CSS vars | Единственный компонент с shadcn CSS vars (`bg-primary`, `text-foreground`) | Хорошо, остальные компоненты привести к той же системе | — |

### 3.8 DatePickerModal.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Реализация | Кастомный календарь (174 строки) | Заменить на `react-day-picker` (уже в dependencies) + shadcn Dialog | P1 |
| Focus trap | Нет | Radix Dialog из shadcn автоматически обеспечивает focus trap | P0 |
| Escape | Нет обработки Escape | Radix Dialog закрывается по Escape из коробки | P0 |
| Animation | Нет | `motion.div` с `variants.modal` для входа/выхода | P2 |
| Past dates | Отключены, но без объяснения | Добавить tooltip: «Нельзя выбрать прошедшую дату» | P2 |

### 3.9 AnalyticsView.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Графики | Ручные div-ы с inline progress bars | Использовать recharts `<BarChart>` для недельной статистики. `<AreaChart>` для тренда за 30 дней | P1 |
| Вычисления | `useEffect` без мемоизации | Вынести в `useMemo` с зависимостями `[tasks, recurringTasks, taskCompletions]` | P0 |
| Карточки | `rounded-lg` | Привести к единому `rounded-xl` с остальными компонентами | P1 |
| Empty state | Нет (кроме «most failed task») | Добавить общий empty state: «Начните отмечать задачи, чтобы увидеть статистику» | P1 |
| Новые метрики | Только 3 карточки | Добавить: streak (дней подряд все выполнены), best day of week, completion trend arrow (↑↓) | P2 |

### 3.10 LoadingSpinner.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Design | CSS `animate-spin` border circle | Оставить для inline usage. Для full-page loading — добавить skeleton screens вместо spinner | P1 |

### 3.11 TodayView.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Структура | 265 строк, callback-ы в одном файле. ProgressBar получает несуществующий prop `progress` | Убрать prop `progress` (ProgressBar сам вычисляет). Вынести callback-ы в кастомный хук `useTodayActions` | P0 |
| Секции | Регулярные и обычные задачи разделены заголовками с emoji (`🔄`, `📝`) | Заменить emoji на иконки lucide (`<Repeat>`, `<ListTodo>`). Добавить `<motion.div layout>` для анимации при выполнении задач | P1 |
| Empty state | `<div className="text-center py-8 ...">` с emoji + текст | Заменить на `<EmptyState icon={<CalendarCheck />} title="Задач на день пока нет" action={...} />` | P1 |
| Анимация списка | Нет | Обернуть список в `<Reorder.Group>` + `<AnimatePresence>`. При выполнении задача с анимацией уходит вниз | P1 |
| Tailwind | `space-y-6` + `space-y-3` + `space-y-4` — непоследовательно | Унифицировать: `space-y-6` между секциями, `space-y-3` между карточками задач | P2 |

### 3.12 TasksView.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Дублирование | ~80% кода идентично IdeasView (callbacks, handlers, JSX-структура) | Извлечь общий `<ListView>` компонент, принимающий `category`, `emptyIcon`, `emptyTitle`, `showMoveToToday` как props | P1 |
| Заголовок | `text-2xl font-bold` + emoji `📝` | Заменить emoji на `<ListTodo>` icon. `text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]` | P2 |
| Count badge | `bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full` | `bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] px-2.5 py-0.5 rounded-full text-xs font-medium` | P2 |
| Фильтрация | Нет — только полный список | Добавить toggle «Показать выполненные / Скрыть выполненные». Completed задачи — в отдельной свёрнутой секции | P2 |

### 3.13 IdeasView.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Дублирование | Копия TasksView без `onMoveToToday` | Заменить на `<ListView category="ideas" emptyIcon={<Lightbulb />} emptyTitle="Идей пока нет" />` | P1 |
| Визуальный стиль | Идентичен TasksView — нет визуального отличия при переключении | Добавить subtle accent: карточки идей с левым бордером `border-l-4 border-amber-400` для визуальной дифференциации | P2 |
| Действия | Нет «Перенести в Сегодня» | Добавить аналогично TasksView — идею можно превратить в задачу на день | P2 |

### 3.14 RecurringView.tsx

| Параметр | Текущее | Обновление | Приоритет |
|---|---|---|---|
| Info box | `bg-blue-50 ... ℹ️` — стиль отличается от остальных alert-ов | Привести к единой системе: `bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20 rounded-xl p-4` | P1 |
| Форма добавления | Inline-форма с radio buttons (native, не стилизованные) | Использовать shadcn `RadioGroup` из `@radix-ui/react-radio-group`. Обернуть форму в `<motion.div>` с `variants.collapse` | P1 |
| Дни недели | `px-4 py-2 text-sm rounded-lg` — pill buttons | Использовать shadcn `ToggleGroup` для дней. `rounded-full` pill style, animated selection | P2 |
| Карточки задач | Кастомная карточка (не TaskItem) — другой визуальный стиль | Привести к общему стилю с TaskItem: одинаковый `rounded-xl`, padding, hover state. Добавить drag handle | P1 |
| Удаление | Только кнопка X, нет подтверждения | Добавить `AlertDialog` (из shadcn) для подтверждения удаления регулярной задачи | P2 |

---

## 4. Новые компоненты

### 4.1 EmptyState

Универсальный компонент для всех views.

```tsx
interface EmptyStateProps {
  icon: React.ReactNode    // lucide icon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}
```

| View | Icon | Title | Description | Action |
|---|---|---|---|---|
| TodayView | `<CalendarCheck>` | «День свободен» | «Добавьте задачи или перенесите из Задач» | «Добавить задачу» |
| TasksView | `<ListTodo>` | «Список задач пуст» | «Создайте задачи для долгосрочного планирования» | «Создать задачу» |
| IdeasView | `<Lightbulb>` | «Идей пока нет» | «Записывайте мысли, чтобы не забыть» | «Добавить идею» |
| RecurringView | `<Repeat>` | «Нет регулярных задач» | «Задачи, которые повторяются каждый день» | «Создать» |
| AnalyticsView | `<BarChart3>` | «Нет данных» | «Начните выполнять задачи для статистики» | — |

**Tailwind-классы:**
```
// Container
flex flex-col items-center justify-center py-16 text-center

// Icon
w-12 h-12 text-[var(--color-text-tertiary)] mb-4

// Title
text-lg font-semibold text-[var(--color-text-primary)] mb-2

// Description
text-sm text-[var(--color-text-secondary)] max-w-xs mb-6

// Action button
px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg
text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors
```

**Приоритет:** P1

### 4.2 SkeletonLoader

Компоненты-скелетоны для каждого view при загрузке данных.

```tsx
// TaskSkeleton — одна карточка
<div className="animate-pulse flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border-secondary)]">
  <div className="w-5 h-5 rounded-full bg-[var(--color-bg-tertiary)]" />
  <div className="flex-1 space-y-2">
    <div className="h-4 bg-[var(--color-bg-tertiary)] rounded-md w-3/4" />
  </div>
</div>

// TodayViewSkeleton — набор из 5 TaskSkeleton + ProgressBarSkeleton
// TasksViewSkeleton — набор из 4 TaskSkeleton
// AnalyticsSkeleton — 3 карточки с пульсирующими блоками
```

**Приоритет:** P1

### 4.3 Toast-уведомления (sonner)

Sonner уже подключён. Нужно:

1. Добавить `<Toaster>` в `App.tsx`:
```tsx
import { Toaster } from 'sonner'
// В JSX:
<Toaster position="bottom-center" richColors />
```

2. Вызывать toast при ключевых действиях:

| Действие | Toast | Тип |
|---|---|---|
| Задача создана | «Задача добавлена» | `toast.success()` |
| Задача выполнена | «✓ Выполнено» (с undo) | `toast.success()` с action |
| Задача удалена | «Задача удалена» (с undo) | `toast()` с action |
| Ошибка загрузки | «Не удалось загрузить данные» | `toast.error()` |
| Задача перенесена | «Перенесено на {дату}» | `toast.success()` |

**Undo-паттерн:**
```tsx
toast('Задача удалена', {
  action: {
    label: 'Отменить',
    onClick: () => restoreTask(taskId),
  },
  duration: 5000,
})
```

**Приоритет:** P0

### 4.4 CommandPalette (cmdk)

cmdk уже в зависимостях. Реализовать глобальный Command Palette:

**Хоткей:** `Cmd+K` (Mac) / `Ctrl+K` (Windows)

**Команды:**
| Группа | Команда | Действие |
|---|---|---|
| **Навигация** | «Сегодня» | setCurrentCategory('today') |
| | «Задачи» | setCurrentCategory('tasks') |
| | «Идеи» | setCurrentCategory('ideas') |
| | «Регулярные» | setCurrentCategory('recurring') |
| | «Аналитика» | setCurrentCategory('analytics') |
| **Действия** | «Новая задача» | Открыть AddTaskForm |
| | «Новая идея» | setCurrentCategory('ideas') + фокус на AddTaskForm |
| | «Новая регулярная задача» | setCurrentCategory('recurring') + open form |
| **Тема** | «Тёмная тема» / «Светлая тема» | toggleDarkMode() |
| **Поиск** | Текст → | Фильтрация задач по названию |

**Стилизация:** Radix Dialog + cmdk. Классы:
```
// Overlay
fixed inset-0 bg-black/50 backdrop-blur-sm z-50

// Command container
fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg
bg-[var(--color-bg-elevated)] rounded-2xl shadow-xl
border border-[var(--color-border-primary)] overflow-hidden

// Input
px-4 py-3 text-base w-full bg-transparent outline-none
border-b border-[var(--color-border-primary)]
placeholder:text-[var(--color-text-tertiary)]

// Item
px-4 py-3 flex items-center gap-3 cursor-pointer
hover:bg-[var(--color-bg-tertiary)] transition-colors
data-[selected]:bg-[var(--color-accent-light)]
```

**Приоритет:** P2

### 4.5 BottomNavigation (мобильная навигация)

Фиксированная нижняя панель для мобильных (`sm:hidden`).

```tsx
interface BottomNavItem {
  id: TaskCategory
  icon: LucideIcon
  label: string
}

const items: BottomNavItem[] = [
  { id: 'today', icon: CalendarDays, label: 'Сегодня' },
  { id: 'tasks', icon: ListTodo, label: 'Задачи' },
  { id: 'ideas', icon: Lightbulb, label: 'Идеи' },
  { id: 'recurring', icon: Repeat, label: 'Регулярные' },
  { id: 'analytics', icon: BarChart3, label: 'Аналитика' },
]
```

**Tailwind-классы:**
```
// Container
fixed bottom-0 left-0 right-0 z-40
bg-[var(--color-bg-elevated)]/95 backdrop-blur-md
border-t border-[var(--color-border-primary)]
pb-safe sm:hidden

// Item container
flex justify-around items-center h-14

// Item (inactive)
flex flex-col items-center gap-0.5 py-1 px-3
text-[var(--color-text-tertiary)]

// Item (active)
text-[var(--color-accent)] font-medium

// Icon
w-5 h-5

// Label
text-[10px]
```

**Приоритет:** P0

### 4.6 SubtaskList (вынесенный из TaskItem)

Отдельный компонент для списка подзадач с собственными анимациями.

```tsx
interface SubtaskListProps {
  subtasks: Subtask[]
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, title: string) => void
  onAdd: (title: string) => void
}
```

Использует `Reorder.Group` из Framer Motion для drag-and-drop подзадач.

**Приоритет:** P1

### 4.7 UserMenu (выпадающее меню пользователя)

Заменяет текущие разрозненные элементы (username + logout + dark mode toggle).

Реализация: `@radix-ui/react-dropdown-menu` (уже в зависимостях).

**Содержимое:**
- Avatar/initial пользователя
- Username
- Separator
- «Тёмная тема» — Switch
- «Клавиатурные сочетания» — открывает справку
- Separator
- «Выйти» — destructive

**Приоритет:** P1

---

## 5. UX-потоки

### 5.1 Добавление задачи

**Текущий поток:**
1. Нажать кнопку «+ Добавить задачу»
2. Появляется input
3. Ввести текст
4. Нажать кнопку «+» (Enter не работает!)
5. Нет обратной связи (нет toast)

**Обновлённый поток:**
1. Нажать «+ Добавить задачу» ИЛИ `Cmd+N`
2. Input раскрывается с `motion.div` анимацией (collapse)
3. Ввести текст. При вводе — опциональные inline-иконки (📅 дата, ⭐ приоритет)
4. `Enter` → задача добавлена
5. `toast.success('Задача добавлена')` — subtile toast снизу
6. Input остаётся открытым для серийного ввода (как в Todoist)
7. `Escape` или клик вне → закрыть input

**Изменения:**
- Добавить Enter → submit в `handleKeyPress`
- Не закрывать форму после добавления (убрать `setIsExpanded(false)` из handleSubmit)
- Подключить toast
- Добавить `Cmd+N` глобальный хоткей

### 5.2 Переключение между вкладками

**Текущий поток:**
1. Клик на вкладку
2. View меняется мгновенно (нет transition)

**Обновлённый поток:**
1. Клик на вкладку ИЛИ клавиатурная навигация (←→ по tabs) ИЛИ swipe на мобильных
2. Animated sliding indicator перемещается к активной вкладке
3. View transition: текущий view уходит влево, новый приходит справа (или наоборот, в зависимости от направления)
4. На мобильных: bottom-nav с haptic feedback (если поддерживается)

**Изменения:**
- `AnimatePresence mode="wait"` в Layout
- Framer Motion `layoutId` для tab indicator
- `aria-selected`, `role="tab"`, `role="tabpanel"` для accessibility
- Keyboard navigation: `onKeyDown` для ArrowLeft/ArrowRight

### 5.3 Мобильный опыт

**Текущие проблемы:**
- 5 вкладок переносятся на 2 строки
- Кнопки действий на TaskItem слишком мелкие
- Нет swipe gestures
- Нет bottom sheet для форм

**Решения:**

| Проблема | Решение | Компонент |
|---|---|---|
| Навигация | Bottom navigation bar (fixed, 5 иконок) | `BottomNavigation` |
| Кнопки действий | Swipe actions на карточках (swipe left = delete, right = complete) | Framer Motion `drag="x"` в TaskItem |
| Формы | Vaul bottom sheet (уже в dependencies) для AddTaskForm и DatePicker на мобильных | `<Drawer>` из vaul |
| Мелкие таппы | Увеличить touch targets до 44×44px минимум | Все кнопки: `min-h-[44px] min-w-[44px]` |
| Прокрутка вкладок | Desktop: `overflow-x-auto`. Mobile: скрыть, заменить bottom-nav | Breakpoint `sm:` |

### 5.4 Клавиатурные сочетания

| Сочетание | Действие |
|---|---|
| `Cmd+K` / `Ctrl+K` | Открыть Command Palette |
| `Cmd+N` / `Ctrl+N` | Новая задача (открыть AddTaskForm) |
| `1` – `5` | Переключение на вкладки (1=Сегодня, 2=Задачи, ...) |
| `←` / `→` | Предыдущий/следующий день (в TodayView) |
| `Escape` | Закрыть модалку / отменить ввод |
| `T` | Перейти к «Сегодня» |
| `D` | Toggle dark mode |

**Реализация:** `useEffect` с `keydown` listener в `App.tsx`. Отключать когда фокус в input/textarea.

**Приоритет:** P2

---

## 6. Порядок выполнения (спринты)

### Спринт 1: Фундамент (3–4 дня)

> **Цель:** Дизайн-система + критичные фиксы. После этого спринта приложение выглядит чище, хотя ещё не переделано полностью.

| # | Задача | Файлы | Effort |
|---|---|---|---|
| 1.1 | CSS-переменные: добавить палитру light/dark в `index.css` | `src/index.css` | 1ч |
| 1.2 | Создать `src/lib/animations.ts` с токенами Framer Motion | новый файл | 0.5ч |
| 1.3 | Удалить дублирующий заголовок из Layout.tsx | `Layout.tsx` | 0.25ч |
| 1.4 | Добавить `<Toaster>` из sonner в App.tsx | `App.tsx` | 0.25ч |
| 1.5 | Fix: Enter submit в AddTaskForm | `AddTaskForm.tsx` | 0.25ч |
| 1.6 | Fix: Удалить console.log из AddTaskForm | `AddTaskForm.tsx` | 0.1ч |
| 1.7 | Fix: `aria-label` на все кнопки TaskItem | `TaskItem.tsx` | 0.5ч |
| 1.8 | Fix: `<nav>` + `role="tablist"` в Navigation | `Navigation.tsx` | 0.5ч |
| 1.9 | Fix: useMemo в AnalyticsView вместо useEffect | `AnalyticsView.tsx` | 0.5ч |
| 1.10 | Создать компонент `BottomNavigation` (mobile nav) | новый файл, `Layout.tsx` | 2ч |
| 1.11 | Создать компонент `EmptyState` (универсальный) | новый файл | 1ч |
| 1.12 | Интегрировать toast при создании/удалении задач | `useDatabase.ts`, views | 1.5ч |

**Итого:** ~8.5ч

### Спринт 2: Обновление views (4–5 дней)

> **Цель:** Все views обновлены визуально, анимации работают, recharts подключены.

| # | Задача | Файлы | Effort |
|---|---|---|---|
| 2.1 | Navigation: animated tab indicator (layoutId) + scroll | `Navigation.tsx` | 3ч |
| 2.2 | Layout: AnimatePresence view transitions | `Layout.tsx` | 1.5ч |
| 2.3 | TaskItem: круглый checkbox вместо кнопки Check | `TaskItem.tsx` | 2ч |
| 2.4 | TaskItem: скрытые action buttons (show on hover) | `TaskItem.tsx` | 2ч |
| 2.5 | ProgressBar: thin bar (h-2) + убрать pulse | `ProgressBar.tsx` | 1ч |
| 2.6 | DateNavigation: swipe gesture + анимация смены | `DateNavigation.tsx` | 2ч |
| 2.7 | DatePickerModal: переписать на react-day-picker + Radix Dialog | `DatePickerModal.tsx` | 3ч |
| 2.8 | AnalyticsView: подключить recharts (BarChart + AreaChart) | `AnalyticsView.tsx` | 4ч |
| 2.9 | AnalyticsView: добавить streak, best day, trend arrow | `AnalyticsView.tsx` | 2ч |
| 2.10 | Заменить EmptyState во всех views на новый компонент | все views | 1ч |
| 2.11 | UserMenu dropdown (вместо inline logout + dark toggle) | новый + `Navigation.tsx` | 2ч |

**Итого:** ~23.5ч

### Спринт 3: Новые компоненты и UX (3–4 дня)

> **Цель:** Drag-and-drop, command palette, skeleton loaders, мобильные улучшения.

| # | Задача | Файлы | Effort |
|---|---|---|---|
| 3.1 | TaskItem: Framer Motion drag-and-drop (`Reorder.Group`) | `TaskItem.tsx`, все views | 4ч |
| 3.2 | Вынести SubtaskList из TaskItem | новый файл, `TaskItem.tsx` | 2ч |
| 3.3 | SkeletonLoader компоненты (Task, Analytics, Progress) | новые файлы | 2ч |
| 3.4 | Command Palette (cmdk) | новый файл, `App.tsx` | 4ч |
| 3.5 | Mobile swipe actions на TaskItem (swipe-to-complete/delete) | `TaskItem.tsx` | 3ч |
| 3.6 | Vaul bottom sheet для AddTaskForm (mobile) | `AddTaskForm.tsx` | 2ч |
| 3.7 | Клавиатурные сочетания (useHotkeys hook) | новый hook, `App.tsx` | 2ч |
| 3.8 | AuthForm: разбить на 3 компонента + AnimatePresence | `AuthForm.tsx` → 3 файла | 2ч |
| 3.9 | Абстрагировать TasksView/IdeasView в общий `ListView` | новый файл, refactor views | 2ч |

**Итого:** ~23ч

### Спринт 4: Полировка (2–3 дня)

> **Цель:** Тёмная тема идеальна, анимации отполированы, production-ready.

| # | Задача | Файлы | Effort |
|---|---|---|---|
| 4.1 | Dark mode polish: проверить все компоненты на контрасты | все файлы | 3ч |
| 4.2 | Micro-interactions: completion confetti (subtle), button press scale | `TaskItem.tsx`, buttons | 2ч |
| 4.3 | AddTaskForm: серийный ввод (не закрывать после добавления) | `AddTaskForm.tsx` | 0.5ч |
| 4.4 | ProgressBar → celebration toast при 100% | `ProgressBar.tsx`, toast | 0.5ч |
| 4.5 | Accessibility audit: tab order, focus rings, screen reader testing | все файлы | 3ч |
| 4.6 | Performance: lazy load AnalyticsView (React.lazy) | `Layout.tsx` | 1ч |
| 4.7 | RecurringView: shadcn Radio вместо native | `RecurringView.tsx` | 1ч |
| 4.8 | Убрать `window.location.reload()` из AuthForm | `AuthForm.tsx` | 1ч |
| 4.9 | Onboarding: первый визит — подсветить ключевые функции (tooltip tour) | новый компонент | 3ч |
| 4.10 | Final QA: cross-browser, responsive, performance audit | — | 2ч |

**Итого:** ~17ч

---

## Общая оценка

| Спринт | Фокус | Оценка |
|---|---|---|
| 1 | Фундамент | ~8.5ч |
| 2 | Обновление views | ~23.5ч |
| 3 | Новые компоненты и UX | ~23ч |
| 4 | Полировка | ~17ч |
| **Итого** | | **~72ч** |

---

## Принципы при реализации

1. **Не добавлять новые зависимости.** Всё реализуемо текущим стеком (Framer Motion, shadcn/ui, cmdk, vaul, sonner, recharts, react-day-picker).
2. **CSS-переменные вместо hard-coded цветов.** Переход от `dark:bg-gray-800` к `bg-[var(--color-bg-elevated)]` — проще менять тему.
3. **Motion по умолчанию, static по необходимости.** Framer Motion уже в bundle — используем его везде.
4. **Mobile-first.** Bottom navigation, swipe gestures, touch targets ≥ 44px.
5. **Progressive enhancement.** Command palette и клавиатурные сочетания — бонус для power users, не блокер для основного UX.
