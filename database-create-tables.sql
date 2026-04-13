-- ============================================================================
-- СОЗДАНИЕ ТАБЛИЦ БЮДЖЕТНОГО МОДУЛЯ
-- ============================================================================

-- ─── COUPLES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id TEXT NOT NULL,
  user2_id TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- ─── BUDGET_CATEGORIES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📦',
  color TEXT,
  context TEXT NOT NULL CHECK (context IN ('personal', 'work')),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- ─── TRANSACTIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('RUB', 'THB', 'USD', 'EUR')) DEFAULT 'RUB',
  context TEXT NOT NULL CHECK (context IN ('personal', 'work')),
  type TEXT NOT NULL CHECK (type IN ('shared', 'personal')) DEFAULT 'personal',
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ─── BUDGET_LIMITS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('RUB', 'THB', 'USD', 'EUR')) DEFAULT 'RUB',
  month TEXT NOT NULL, -- YYYY-MM
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(couple_id, category_id, month)
);

ALTER TABLE budget_limits ENABLE ROW LEVEL SECURITY;

-- ─── EXCHANGE_RATES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_currency, to_currency)
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Публичное чтение курсов
CREATE POLICY exchange_rates_select ON exchange_rates FOR SELECT USING (true);
-- Только серверные вставки/обновления — без user-facing policies для INSERT/UPDATE

-- ============================================================================
-- ГОТОВО. Таблицы бюджетного модуля созданы.
-- ============================================================================
