-- Создание таблицы пользователей без email
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включаем RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть только свои данные
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Политика: пользователи могут обновлять только свои данные  
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Обновляем существующие таблицы для связи с новой системой пользователей
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE recurring_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Политики для задач
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (user_id = auth.uid());

-- Политики для регулярных задач
CREATE POLICY "Users can view own recurring tasks" ON recurring_tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recurring tasks" ON recurring_tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recurring tasks" ON recurring_tasks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own recurring tasks" ON recurring_tasks
  FOR DELETE USING (user_id = auth.uid());

