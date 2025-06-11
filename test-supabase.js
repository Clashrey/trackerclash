import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mszntxpdgnuvthjypkih.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zem50eHBkZ251dnRoanlwa2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NjM4NDIsImV4cCI6MjA2NTEzOTg0Mn0.2zfcQ7qJ3wLlt1e4ONwp5Thd75SYppSoufGEd0wtqnY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('Создание таблиц в Supabase...')

  try {
    // Проверяем, существует ли таблица users
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (checkError && checkError.code === 'PGRST116') {
      console.log('Таблица users не существует, создаем...')
      
      // Попробуем создать пользователя напрямую, чтобы Supabase создал таблицу
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          { username: 'testuser', password_hash: 'test_hash' }
        ])
        .select()

      if (userError) {
        console.error('Ошибка создания пользователя:', userError)
      } else {
        console.log('Пользователь создан:', userData)
      }
    } else {
      console.log('Таблица users уже существует')
    }

  } catch (error) {
    console.error('Общая ошибка:', error)
  }
}

createTables()

