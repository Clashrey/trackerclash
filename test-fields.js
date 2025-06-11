import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mszntxpdgnuvthjypkih.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zem50eHBkZ251dnRoanlwa2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NjM4NDIsImV4cCI6MjA2NTEzOTg0Mn0.2zfcQ7qJ3wLlt1e4ONwp5Thd75SYppSoufGEd0wtqnY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFields() {
  console.log('Тестирование полей таблицы users...')

  try {
    // Попробуем вставить пользователя только с user_id (как в старой схеме)
    const { data: userData1, error: userError1 } = await supabase
      .from('users')
      .insert([
        { 
          user_id: 'test_user_123'
        }
      ])
      .select()

    if (userError1) {
      console.error('Ошибка с user_id:', userError1.message)
    } else {
      console.log('Пользователь с user_id создан:', userData1)
    }

    // Попробуем вставить пользователя с id
    const { data: userData2, error: userError2 } = await supabase
      .from('users')
      .insert([
        { 
          id: '550e8400-e29b-41d4-a716-446655440000'
        }
      ])
      .select()

    if (userError2) {
      console.error('Ошибка с id:', userError2.message)
    } else {
      console.log('Пользователь с id создан:', userData2)
    }

  } catch (error) {
    console.error('Общая ошибка:', error)
  }
}

testFields()

