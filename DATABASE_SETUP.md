# Настройка базы данных Supabase

## 1. Создание проекта в Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Скопируйте URL проекта и анонимный ключ

## 2. Настройка схемы базы данных

Выполните SQL-скрипт из файла `database-schema.sql` в SQL Editor вашего проекта Supabase:

```sql
-- Содержимое файла database-schema.sql
```

## 3. Настройка переменных окружения

Обновите файл `src/lib/supabase.ts` с вашими данными:

```typescript
const supabaseUrl = 'https://your-project-id.supabase.co'
const supabaseAnonKey = 'your-anon-key'
```

## 4. Настройка Row Level Security (RLS)

RLS уже настроен в схеме базы данных. Политики безопасности обеспечивают:

- Пользователи могут видеть только свои данные
- Автоматическая фильтрация по user_id
- Защита от несанкционированного доступа

## 5. Структура таблиц

### users
- `id` (UUID) - первичный ключ
- `user_id` (TEXT) - уникальный идентификатор пользователя
- `created_at` (TIMESTAMP) - дата создания

### tasks
- `id` (UUID) - первичный ключ
- `user_id` (TEXT) - ссылка на пользователя
- `title` (TEXT) - название задачи
- `category` (TEXT) - категория: 'today', 'tasks', 'ideas'
- `completed` (BOOLEAN) - статус выполнения
- `date` (DATE) - дата задачи (опционально)
- `order_index` (INTEGER) - порядок сортировки
- `created_at` (TIMESTAMP) - дата создания
- `updated_at` (TIMESTAMP) - дата обновления

### recurring_tasks
- `id` (UUID) - первичный ключ
- `user_id` (TEXT) - ссылка на пользователя
- `title` (TEXT) - название задачи
- `frequency` (TEXT) - частота: 'daily', 'weekly'
- `days_of_week` (INTEGER[]) - дни недели для еженедельных задач
- `created_at` (TIMESTAMP) - дата создания
- `updated_at` (TIMESTAMP) - дата обновления

## 6. Индексы

Созданы индексы для оптимизации производительности:
- `idx_tasks_user_id` - для быстрого поиска задач пользователя
- `idx_tasks_date` - для фильтрации по датам
- `idx_tasks_category` - для фильтрации по категориям
- `idx_recurring_tasks_user_id` - для поиска регулярных задач пользователя

