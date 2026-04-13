-- ============================================================================
-- МИГРАЦИЯ: Обновление RLS-политик для работы через request.header.x-user-id
-- ============================================================================
-- Приложение использует API-key авторизацию (не Supabase Auth),
-- поэтому userId передаётся в HTTP-заголовке x-user-id.
-- PostgREST делает его доступным как current_setting('request.header.x-user-id')
-- ============================================================================

-- Вспомогательная функция: получить user_id из заголовка запроса
CREATE OR REPLACE FUNCTION get_request_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN coalesce(
    current_setting('request.header.x-user-id', true),
    ''
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────
-- COUPLES
-- ─────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS couples_select ON couples;
DROP POLICY IF EXISTS couples_update ON couples;
DROP POLICY IF EXISTS couples_insert ON couples;

CREATE POLICY couples_select ON couples FOR SELECT
  USING (
    user1_id = get_request_user_id() OR
    user2_id = get_request_user_id()
  );

CREATE POLICY couples_update ON couples FOR UPDATE
  USING (
    user1_id = get_request_user_id() OR
    user2_id = get_request_user_id()
  );

CREATE POLICY couples_insert ON couples FOR INSERT
  WITH CHECK (
    user1_id = get_request_user_id()
  );

-- ─────────────────────────────────────────────────────────────────────────
-- BUDGET_CATEGORIES
-- ─────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS budget_categories_select ON budget_categories;
DROP POLICY IF EXISTS budget_categories_update ON budget_categories;
DROP POLICY IF EXISTS budget_categories_insert ON budget_categories;
DROP POLICY IF EXISTS budget_categories_delete ON budget_categories;

CREATE POLICY budget_categories_select ON budget_categories FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couples
      WHERE user1_id = get_request_user_id()
         OR user2_id = get_request_user_id()
    )
  );

CREATE POLICY budget_categories_update ON budget_categories FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couples
      WHERE user1_id = get_request_user_id()
         OR user2_id = get_request_user_id()
    )
  );

CREATE POLICY budget_categories_insert ON budget_categories FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples
      WHERE user1_id = get_request_user_id()
         OR user2_id = get_request_user_id()
    )
  );

CREATE POLICY budget_categories_delete ON budget_categories FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM couples
      WHERE user1_id = get_request_user_id()
         OR user2_id = get_request_user_id()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS transactions_select ON transactions;
DROP POLICY IF EXISTS transactions_insert ON transactions;
DROP POLICY IF EXISTS transactions_update ON transactions;
DROP POLICY IF EXISTS transactions_delete ON transactions;

CREATE POLICY transactions_select ON transactions FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couples
      WHERE user1_id = get_request_user_id()
         OR user2_id = get_request_user_id()
    )
    AND (
      type = 'shared'
      OR (type = 'personal' AND user_id = get_request_user_id())
    )
  );

CREATE POLICY transactions_insert ON transactions FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples
      WHERE user1_id = get_request_user_id()
         OR user2_id = get_request_user_id()
    )
    AND user_id = get_request_user_id()
  );

CREATE POLICY transactions_update ON transactions FOR UPDATE
  USING (user_id = get_request_user_id())
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples
      WHERE user1_id = get_request_user_id()
         OR user2_id = get_request_user_id()
    )
    AND user_id = get_request_user_id()
  );

CREATE POLICY transactions_delete ON transactions FOR DELETE
  USING (user_id = get_request_user_id());

-- ─────────────────────────────────────────────────────────────────────────
-- BUDGET_LIMITS
-- ─────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS budget_limits_select ON budget_limits;
DROP POLICY IF EXISTS budget_limits_update ON budget_limits;
DROP POLICY IF EXISTS budget_limits_insert ON budget_limits;
DROP POLICY IF EXISTS budget_limits_delete ON budget_limits;

CREATE POLICY budget_limits_select ON budget_limits FOR SELECT
  USING (
    couple_id IN (
      SELECT id FROM couples
      WHERE user1_id = get_request_user_id()
         OR user2_id = get_request_user_id()
    )
  );

CREATE POLICY budget_limits_update ON budget_limits FOR UPDATE
  USING (
    couple_id IN (
      SELECT id FROM couples
      WHERE user1_id = get_request_user_id()
         OR user2_id = get_request_user_id()
    )
  );

CREATE POLICY budget_limits_insert ON budget_limits FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples
      WHERE user1_id = get_request_user_id()
         OR user2_id = get_request_user_id()
    )
  );

CREATE POLICY budget_limits_delete ON budget_limits FOR DELETE
  USING (
    couple_id IN (
      SELECT id FROM couples
      WHERE user1_id = get_request_user_id()
         OR user2_id = get_request_user_id()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- EXCHANGE_RATES — оставляем как есть (публичное чтение)
-- ─────────────────────────────────────────────────────────────────────────

-- Политики уже корректны: SELECT = true, INSERT/UPDATE = false (только сервер)

-- ============================================================================
-- ГОТОВО. RLS теперь использует x-user-id из HTTP-заголовка запроса.
-- ============================================================================
