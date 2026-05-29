-- ============================================================
-- Coco Fresco — Schema Inicial
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Tipo enum para categorias de transação
CREATE TYPE category AS ENUM (
  'venda_copo', 'venda_g300', 'venda_g500', 'venda_g1l',
  'venda',
  'coco', 'gelo', 'copo', 'garrafa300', 'garrafa500', 'garrafa1l',
  'luz', 'agua', 'aluguel', 'mercado',
  'lanche', 'compra', 'outros'
);

-- ── Tabela: transactions ─────────────────────────────────────
CREATE TABLE transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cat         category    NOT NULL,
  value       NUMERIC(10, 2) NOT NULL CHECK (value > 0),
  "when"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX transactions_user_id_when_idx ON transactions (user_id, "when" DESC);

-- Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Tabela: app_settings ─────────────────────────────────────
-- Uma linha por usuário; INSERT ou UPDATE via upsert
CREATE TABLE app_settings (
  user_id      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preco_venda  JSONB       NOT NULL DEFAULT '{"venda_copo":6,"venda_g300":10,"venda_g500":14,"venda_g1l":25}'::jsonb,
  custo_unit   JSONB       NOT NULL DEFAULT '{"coco":0,"gelo":0,"copo":0,"garrafa300":0,"garrafa500":1.20,"garrafa1l":1.96}'::jsonb,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_settings" ON app_settings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
