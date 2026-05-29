-- ============================================================
-- Coco Fresco — Tabela de contas (dívidas, cartões, etc.)
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- 1. Cria a tabela
CREATE TABLE IF NOT EXISTS accounts (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT           NOT NULL,
  type        TEXT           NOT NULL DEFAULT 'other'
                             CHECK (type IN ('credit_card','loan','installment','subscription','bill','other')),
  amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  due_date    DATE,
  notes       TEXT,
  is_paid     BOOLEAN        NOT NULL DEFAULT false,
  recurrence  TEXT           NOT NULL DEFAULT 'none'
                             CHECK (recurrence IN ('none','weekly','biweekly','monthly','yearly')),
  group_id    UUID,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS accounts_due_date_idx  ON accounts (due_date);
CREATE INDEX IF NOT EXISTS accounts_group_id_idx  ON accounts (group_id);
CREATE INDEX IF NOT EXISTS accounts_is_paid_idx   ON accounts (is_paid);
CREATE INDEX IF NOT EXISTS accounts_created_at_idx ON accounts (created_at DESC);

-- 3. Permissões para acesso sem autenticação (chave anon)
GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO anon, authenticated;
