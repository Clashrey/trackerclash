import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mszntxpdgnuvthjypkih.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zem50eHBkZ251dnRoanlwa2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NjM4NDIsImV4cCI6MjA2NTEzOTg0Mn0.2zfcQ7qJ3wLlt1e4ONwp5Thd75SYppSoufGEd0wtqnY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  console.log('Тестирование вставки пользователя...')

  try {
    // Попробуем вставить пользователя с полями username и password_hash
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        { 
          username: 'testuser', 
          password_hash: 'test_hash_123'
        }
      ])
      .select()

    if (userError) {
      console.error('Ошибка вставки пользователя:', userError)
      console.error('Детали ошибки:', JSON.stringify(userError, null, 2))
    } else {
      console.log('Пользователь создан успешно:', userData)
    }

  } catch (error) {
    console.error('Общая ошибка:', error)
  }
}

testInsert()

