-- ============================================================
-- Coco Fresco — Tabela de Dias de Trabalho
-- Execute no SQL Editor do Supabase APÓS 001_initial_schema.sql
-- ============================================================

CREATE TABLE work_days (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE        NOT NULL UNIQUE,
  capital_init NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sem RLS por enquanto (app pessoal, usuário único)
-- Para habilitar auth no futuro: adicionar user_id e policies

-- Índice para consultas por data
CREATE INDEX work_days_date_idx ON work_days (date DESC);

-- ── Permissões para uso sem autenticação ──────────────────────
-- Permite acesso pela chave anon do Supabase
GRANT SELECT, INSERT, UPDATE, DELETE ON work_days    TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_settings TO anon, authenticated;

-- Desabilita RLS para acesso direto (app pessoal)
ALTER TABLE work_days    DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- Remove políticas RLS que dependem de user_id (precisam ir antes das colunas)
DROP POLICY IF EXISTS "users_own_transactions" ON transactions;
DROP POLICY IF EXISTS "users_own_settings"     ON app_settings;

-- Remove coluna user_id (não usada sem auth)
ALTER TABLE transactions DROP COLUMN IF EXISTS user_id;
ALTER TABLE app_settings DROP COLUMN  IF EXISTS user_id;
