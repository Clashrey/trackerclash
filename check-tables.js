import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mszntxpdgnuvthjypkih.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zem50eHBkZ251dnRoanlwa2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NjM4NDIsImV4cCI6MjA2NTEzOTg0Mn0.2zfcQ7qJ3wLlt1e4ONwp5Thd75SYppSoufGEd0wtqnY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('Проверка структуры таблиц в Supabase...')

  try {
    // Проверяем таблицу users
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (usersError) {
      console.error('Ошибка при проверке таблицы users:', usersError)
    } else {
      console.log('Структура таблицы users:', usersData)
    }

    // Проверяем таблицу tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1)

    if (tasksError) {
      console.error('Ошибка при проверке таблицы tasks:', tasksError)
    } else {
      console.log('Структура таблицы tasks:', tasksData)
    }

    // Проверяем таблицу recurring_tasks
    const { data: recurringData, error: recurringError } = await supabase
      .from('recurring_tasks')
      .select('*')
      .limit(1)

    if (recurringError) {
      console.error('Ошибка при проверке таблицы recurring_tasks:', recurringError)
    } else {
      console.log('Структура таблицы recurring_tasks:', recurringData)
    }

  } catch (error) {
    console.error('Общая ошибка:', error)
  }
}

checkTables()

