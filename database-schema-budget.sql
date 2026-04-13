-- Бюджетный модуль для TaskTracker
-- Включает управление расходами для личных и рабочих бюджетов пары

-- ============================================================================
-- 1. ТАБЛИЦА COUPLES - связь между двумя пользователями
-- ============================================================================

CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  user2_id TEXT REFERENCES users(user_id) ON DELETE CASCADE, -- NULL пока партнёр не принял инвайт
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Убедиться, что user1_id != user2_id (если user2_id заполнен)
  CONSTRAINT different_users CHECK (user2_id IS NULL OR user1_id != user2_id)
);

CREATE INDEX idx_couples_user1_id ON couples(user1_id);
CREATE INDEX idx_couples_user2_id ON couples(user2_id);
CREATE INDEX idx_couples_invite_code ON couples(invite_code);

-- ============================================================================
-- 2. ТАБЛИЦА BUDGET_CATEGORIES - категории расходов
-- ============================================================================

CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT,
  context TEXT NOT NULL CHECK (context IN ('personal', 'work')),
  order_index INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_category_name_per_couple_context UNIQUE (couple_id, name, context)
);

CREATE INDEX idx_budget_categories_couple_id ON budget_categories(couple_id);
CREATE INDEX idx_budget_categories_context ON budget_categories(context);
CREATE INDEX idx_budget_categories_couple_context ON budget_categories(couple_id, context);

-- Триггер для обновления updated_at
CREATE TRIGGER update_budget_categories_updated_at
  BEFORE UPDATE ON budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. ТАБЛИЦА TRANSACTIONS - главная таблица расходов
-- ============================================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL CHECK (currency IN ('RUB', 'THB', 'USD', 'EUR')),
  context TEXT NOT NULL CHECK (context IN ('personal', 'work')),
  type TEXT NOT NULL CHECK (type IN ('shared', 'personal')),
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_couple_id ON transactions(couple_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_context ON transactions(context);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_couple_date ON transactions(couple_id, date);
CREATE INDEX idx_transactions_couple_context ON transactions(couple_id, context);

-- Триггер для обновления updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ТАБЛИЦА BUDGET_LIMITS - месячные лимиты по категориям
-- ============================================================================

CREATE TABLE budget_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL CHECK (currency IN ('RUB', 'THB', 'USD', 'EUR')),
  month TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_month_format CHECK (month ~ '^\d{4}-\d{2}$'),
  CONSTRAINT unique_budget_limit UNIQUE (couple_id, category_id, month)
);

CREATE INDEX idx_budget_limits_couple_id ON budget_limits(couple_id);
CREATE INDEX idx_budget_limits_category_id ON budget_limits(category_id);
CREATE INDEX idx_budget_limits_month ON budget_limits(month);
CREATE INDEX idx_budget_limits_couple_month ON budget_limits(couple_id, month);

-- Триггер для обновления updated_at
CREATE TRIGGER update_budget_limits_updated_at
  BEFORE UPDATE ON budget_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ТАБЛИЦА EXCHANGE_RATES - кэшированные курсы обмена
-- ============================================================================

CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(12, 6) NOT NULL CHECK (rate > 0),
  fetched_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT unique_exchange_rate UNIQUE (from_currency, to_currency)
);

CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_fetched_at ON exchange_rates(fetched_at);

-- ============================================================================
-- RLS ПОЛИТИКИ - УПРАВЛЕНИЕ ДОСТУПОМ
-- ============================================================================

-- Включить RLS для всех таблиц
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────
-- COUPLES - политики
-- ─────────────────────────────────────────────────────────────────────────

-- Пользователь может читать свою пару
CREATE POLICY couples_select ON couples FOR SELECT
  USING (
    user1_id = current_setting('app.current_user_id', true) OR
    user2_id = current_setting('app.current_user_id', true)
  );

-- Пользователь может обновлять свою пару
CREATE POLICY couples_update ON couples FOR UPDATE
  USING (
    user1_id = current_setting('app.current_user_id', true) OR
    user2_id = current_setting('app.current_user_id', true)
  );

-- Пользователь может создавать пару
CREATE POLICY couples_insert ON couples FOR INSERT
  WITH CHECK (
    user1_id = current_setting('app.current_user_id', true) OR
    user2_id = current_setting('app.current_user_id', true)
  );

-- ─────────────────────────────────────────────────────────────────────────
-- BUDGET_CATEGORIES - политики
-- ─────────────────────────────────────────────────────────────────────────

-- Пользователь может читать категории своей пары
CREATE POLICY budget_categories_select ON budget_categories FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE
        user1_id = current_setting('app.current_user_id', true) OR
        user2_id = current_setting('app.current_user_id', true)
    )
  );

-- Пользователь может обновлять категории своей пары
CREATE POLICY budget_categories_update ON budget_categories FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE
        user1_id = current_setting('app.current_user_id', true) OR
        user2_id = current_setting('app.current_user_id', true)
    )
  );

-- Пользователь может создавать категории в своей паре
CREATE POLICY budget_categories_insert ON budget_categories FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples WHERE
        user1_id = current_setting('app.current_user_id', true) OR
        user2_id = current_setting('app.current_user_id', true)
    )
  );

-- Пользователь может удалять категории своей пары
CREATE POLICY budget_categories_delete ON budget_categories FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE
        user1_id = current_setting('app.current_user_id', true) OR
        user2_id = current_setting('app.current_user_id', true)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- TRANSACTIONS - политики
-- ─────────────────────────────────────────────────────────────────────────

-- Пользователь может читать транзакции своей пары
-- Для личных транзакций (type='personal') видны только собственные
CREATE POLICY transactions_select ON transactions FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE
        user1_id = current_setting('app.current_user_id', true) OR
        user2_id = current_setting('app.current_user_id', true)
    ) AND
    (
      type = 'shared' OR
      (type = 'personal' AND user_id = current_setting('app.current_user_id', true))
    )
  );

-- Пользователь может создавать транзакции в своей паре
CREATE POLICY transactions_insert ON transactions FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples WHERE
        user1_id = current_setting('app.current_user_id', true) OR
        user2_id = current_setting('app.current_user_id', true)
    ) AND
    user_id = current_setting('app.current_user_id', true)
  );

-- Пользователь может обновлять только свои транзакции
CREATE POLICY transactions_update ON transactions FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples WHERE
        user1_id = current_setting('app.current_user_id', true) OR
        user2_id = current_setting('app.current_user_id', true)
    ) AND
    user_id = current_setting('app.current_user_id', true)
  );

-- Пользователь может удалять только свои транзакции
CREATE POLICY transactions_delete ON transactions FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- ─────────────────────────────────────────────────────────────────────────
-- BUDGET_LIMITS - политики
-- ─────────────────────────────────────────────────────────────────────────

-- Пользователь может читать лимиты своей пары
CREATE POLICY budget_limits_select ON budget_limits FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE
        user1_id = current_setting('app.current_user_id', true) OR
        user2_id = current_setting('app.current_user_id', true)
    )
  );

-- Пользователь может обновлять лимиты своей пары
CREATE POLICY budget_limits_update ON budget_limits FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE
        user1_id = current_setting('app.current_user_id', true) OR
        user2_id = current_setting('app.current_user_id', true)
    )
  );

-- Пользователь может создавать лимиты в своей паре
CREATE POLICY budget_limits_insert ON budget_limits FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples WHERE
        user1_id = current_setting('app.current_user_id', true) OR
        user2_id = current_setting('app.current_user_id', true)
    )
  );

-- Пользователь может удалять лимиты своей пары
CREATE POLICY budget_limits_delete ON budget_limits FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM couples WHERE
        user1_id = current_setting('app.current_user_id', true) OR
        user2_id = current_setting('app.current_user_id', true)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- EXCHANGE_RATES - политики
-- ─────────────────────────────────────────────────────────────────────────

-- Все пользователи могут читать курсы обмена (публичные данные)
CREATE POLICY exchange_rates_select ON exchange_rates FOR SELECT USING (true);

-- Только серверный процесс может обновлять курсы обмена
-- В production должна быть функция с переопределением RLS
CREATE POLICY exchange_rates_insert ON exchange_rates FOR INSERT
  WITH CHECK (false);

CREATE POLICY exchange_rates_update ON exchange_rates FOR UPDATE
  USING (false);

-- ============================================================================
-- ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОЙ ВСТАВКИ СТАНДАРТНЫХ КАТЕГОРИЙ
-- ============================================================================

-- Комментарий: Эта функция должна вызываться при создании новой пары
-- Пример использования в приложении:
--   1. Создать запись в couples
--   2. Вызвать SELECT create_default_categories(couple_id)

CREATE OR REPLACE FUNCTION create_default_categories(p_couple_id UUID)
RETURNS INT AS $$
DECLARE
  count INT := 0;
BEGIN
  -- Личные категории
  INSERT INTO budget_categories (couple_id, name, emoji, color, context, order_index) VALUES
    (p_couple_id, 'Еда', '🍕', '#FF6B6B', 'personal', 0),
    (p_couple_id, 'Жильё', '🏠', '#4ECDC4', 'personal', 1),
    (p_couple_id, 'Транспорт', '🚗', '#45B7D1', 'personal', 2),
    (p_couple_id, 'Развлечения', '🎬', '#FFA07A', 'personal', 3),
    (p_couple_id, 'Одежда', '👕', '#F7B801', 'personal', 4),
    (p_couple_id, 'Здоровье', '💊', '#95E1D3', 'personal', 5),
    (p_couple_id, 'Подписки', '📱', '#C6A8FA', 'personal', 6),
    (p_couple_id, 'Путешествия', '✈️', '#87CEEB', 'personal', 7),
    (p_couple_id, 'Образование', '🎓', '#98D8C8', 'personal', 8),
    (p_couple_id, 'Переводы', '💸', '#F7DC6F', 'personal', 9),
    (p_couple_id, 'Другое', '📦', '#BDC3C7', 'personal', 10)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS count = ROW_COUNT;

  -- Рабочие категории
  INSERT INTO budget_categories (couple_id, name, emoji, color, context, order_index) VALUES
    (p_couple_id, 'Реклама', '📢', '#E74C3C', 'work', 0),
    (p_couple_id, 'Подписки/SaaS', '💻', '#3498DB', 'work', 1),
    (p_couple_id, 'Подрядчики', '👤', '#9B59B6', 'work', 2),
    (p_couple_id, 'Контент', '🎨', '#E67E22', 'work', 3),
    (p_couple_id, 'Офис/Оборудование', '🏢', '#1ABC9C', 'work', 4),
    (p_couple_id, 'Налоги/Бухгалтерия', '📊', '#2ECC71', 'work', 5),
    (p_couple_id, 'Другое', '📦', '#95A5A6', 'work', 6)
  ON CONFLICT DO NOTHING;

  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- АЛЬТЕРНАТИВНЫЙ СПОСОБ - ПРЯМЫЕ INSERT STATEMENTS
-- ============================================================================

-- Комментарий: Если функция выше недоступна, используйте эти INSERT statements
-- после создания пары. Замените '{COUPLE_ID}' на фактический UUID пары.

/*
-- Стандартные личные категории (personal)
INSERT INTO budget_categories (couple_id, name, emoji, color, context, order_index)
VALUES
  ('{COUPLE_ID}', 'Еда', '🍕', '#FF6B6B', 'personal', 0),
  ('{COUPLE_ID}', 'Жильё', '🏠', '#4ECDC4', 'personal', 1),
  ('{COUPLE_ID}', 'Транспорт', '🚗', '#45B7D1', 'personal', 2),
  ('{COUPLE_ID}', 'Развлечения', '🎬', '#FFA07A', 'personal', 3),
  ('{COUPLE_ID}', 'Одежда', '👕', '#F7B801', 'personal', 4),
  ('{COUPLE_ID}', 'Здоровье', '💊', '#95E1D3', 'personal', 5),
  ('{COUPLE_ID}', 'Подписки', '📱', '#C6A8FA', 'personal', 6),
  ('{COUPLE_ID}', 'Путешествия', '✈️', '#87CEEB', 'personal', 7),
  ('{COUPLE_ID}', 'Образование', '🎓', '#98D8C8', 'personal', 8),
  ('{COUPLE_ID}', 'Переводы', '💸', '#F7DC6F', 'personal', 9),
  ('{COUPLE_ID}', 'Другое', '📦', '#BDC3C7', 'personal', 10);

-- Стандартные рабочие категории (work)
INSERT INTO budget_categories (couple_id, name, emoji, color, context, order_index)
VALUES
  ('{COUPLE_ID}', 'Реклама', '📢', '#E74C3C', 'work', 0),
  ('{COUPLE_ID}', 'Подписки/SaaS', '💻', '#3498DB', 'work', 1),
  ('{COUPLE_ID}', 'Подрядчики', '👤', '#9B59B6', 'work', 2),
  ('{COUPLE_ID}', 'Контент', '🎨', '#E67E22', 'work', 3),
  ('{COUPLE_ID}', 'Офис/Оборудование', '🏢', '#1ABC9C', 'work', 4),
  ('{COUPLE_ID}', 'Налоги/Бухгалтерия', '📊', '#2ECC71', 'work', 5),
  ('{COUPLE_ID}', 'Другое', '📦', '#95A5A6', 'work', 6);
*/

-- ============================================================================
-- КОНЕЦ СХЕМЫ БЮДЖЕТНОГО МОДУЛЯ
-- ============================================================================
