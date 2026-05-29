-- ============================================================
-- Coco Fresco — Reset completo sem autenticação
-- Execute este script no SQL Editor do Supabase.
-- Ele recria tudo do zero, sem user_id, sem RLS.
-- ============================================================

-- 1. Remove tabelas antigas (se existirem)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS work_days    CASCADE;

-- 2. Remove tipo enum antigo (se existir)
DROP TYPE IF EXISTS category CASCADE;

-- 3. Recria o enum de categorias
CREATE TYPE category AS ENUM (
  'venda_copo', 'venda_g300', 'venda_g500', 'venda_g1l',
  'venda',
  'coco', 'gelo', 'copo', 'garrafa300', 'garrafa500', 'garrafa1l',
  'luz', 'agua', 'aluguel', 'mercado',
  'lanche', 'compra', 'outros'
);

-- 4. Tabela de transações
CREATE TABLE transactions (
  id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  cat        category       NOT NULL,
  value      NUMERIC(10, 2) NOT NULL CHECK (value > 0),
  "when"     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  note       TEXT,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX transactions_when_idx ON transactions ("when" DESC);

-- 5. Tabela de dias de trabalho
CREATE TABLE work_days (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE           NOT NULL UNIQUE,
  capital_init NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX work_days_date_idx ON work_days (date DESC);

-- 6. Tabela de configurações (uma única linha)
CREATE TABLE app_settings (
  id          SERIAL         PRIMARY KEY,
  preco_venda JSONB          NOT NULL DEFAULT '{"venda_copo":6,"venda_g300":10,"venda_g500":14,"venda_g1l":25}'::jsonb,
  custo_unit  JSONB          NOT NULL DEFAULT '{"coco":0,"gelo":0,"copo":0,"garrafa300":0,"garrafa500":1.20,"garrafa1l":1.96}'::jsonb,
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Insere linha padrão de settings
INSERT INTO app_settings (id) VALUES (1);

-- 7. Permissões para acesso sem autenticação (chave anon)
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON work_days    TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE            ON app_settings TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE app_settings_id_seq TO anon, authenticated;
