-- Создание таблицы для отслеживания выполнения задач
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  recurring_task_id UUID REFERENCES recurring_tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ограничение: либо task_id, либо recurring_task_id должен быть заполнен
  CONSTRAINT check_task_or_recurring CHECK (
    (task_id IS NOT NULL AND recurring_task_id IS NULL) OR
    (task_id IS NULL AND recurring_task_id IS NOT NULL)
  ),
  
  -- Уникальность: одна задача может быть выполнена только один раз в день
  CONSTRAINT unique_task_completion UNIQUE (task_id, date, user_id),
  CONSTRAINT unique_recurring_task_completion UNIQUE (recurring_task_id, date, user_id)
);

-- Включаем RLS
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- Политики для task_completions
CREATE POLICY "Users can view own task completions" ON task_completions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own task completions" ON task_completions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own task completions" ON task_completions
  FOR DELETE USING (user_id = auth.uid());

