import { supabase } from '../src/lib/supabase.js'

async function createTables() {
  console.log('Создание таблиц в Supabase...')

  try {
    // Создаем таблицу users
    const { data: usersData, error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (usersError) {
      console.error('Ошибка создания таблицы users:', usersError)
    } else {
      console.log('Таблица users создана успешно')
    }

    // Создаем таблицу tasks
    const { data: tasksData, error: tasksError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('today', 'tasks', 'ideas')),
          completed BOOLEAN DEFAULT FALSE,
          date DATE,
          order_index INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (tasksError) {
      console.error('Ошибка создания таблицы tasks:', tasksError)
    } else {
      console.log('Таблица tasks создана успешно')
    }

    // Создаем таблицу recurring_tasks
    const { data: recurringData, error: recurringError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS recurring_tasks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
          days_of_week INTEGER[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (recurringError) {
      console.error('Ошибка создания таблицы recurring_tasks:', recurringError)
    } else {
      console.log('Таблица recurring_tasks создана успешно')
    }

    // Создаем таблицу task_completions
    const { data: completionsData, error: completionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS task_completions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          task_title TEXT NOT NULL,
          task_type TEXT NOT NULL CHECK (task_type IN ('regular', 'recurring')),
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          date DATE DEFAULT CURRENT_DATE
        );
      `
    })

    if (completionsError) {
      console.error('Ошибка создания таблицы task_completions:', completionsError)
    } else {
      console.log('Таблица task_completions создана успешно')
    }

    console.log('Все таблицы созданы!')

  } catch (error) {
    console.error('Общая ошибка:', error)
  }
}

createTables()

