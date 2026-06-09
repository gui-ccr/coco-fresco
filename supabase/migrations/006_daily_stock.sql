-- Cria a tabela daily_stock caso não exista, com todas as colunas necessárias.
-- Se já existir, adiciona apenas as colunas que estiverem faltando.

CREATE TABLE IF NOT EXISTS daily_stock (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date       date        NOT NULL UNIQUE,
  copos      integer     NOT NULL DEFAULT 0,
  g1l        integer     NOT NULL DEFAULT 0,
  g500       integer     NOT NULL DEFAULT 0,
  g300       integer     NOT NULL DEFAULT 0,
  copos_gratis integer   NOT NULL DEFAULT 0,
  g1l_gratis   integer   NOT NULL DEFAULT 0,
  g500_gratis  integer   NOT NULL DEFAULT 0,
  g300_gratis  integer   NOT NULL DEFAULT 0,
  copos_sobrou integer   NULL,
  g1l_sobrou   integer   NULL,
  g500_sobrou  integer   NULL,
  g300_sobrou  integer   NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Adiciona colunas novas caso a tabela já exista sem elas
ALTER TABLE daily_stock ADD COLUMN IF NOT EXISTS copos_gratis integer NOT NULL DEFAULT 0;
ALTER TABLE daily_stock ADD COLUMN IF NOT EXISTS g1l_gratis   integer NOT NULL DEFAULT 0;
ALTER TABLE daily_stock ADD COLUMN IF NOT EXISTS g500_gratis  integer NOT NULL DEFAULT 0;
ALTER TABLE daily_stock ADD COLUMN IF NOT EXISTS g300_gratis  integer NOT NULL DEFAULT 0;
ALTER TABLE daily_stock ADD COLUMN IF NOT EXISTS copos_sobrou integer NULL;
ALTER TABLE daily_stock ADD COLUMN IF NOT EXISTS g1l_sobrou   integer NULL;
ALTER TABLE daily_stock ADD COLUMN IF NOT EXISTS g500_sobrou  integer NULL;
ALTER TABLE daily_stock ADD COLUMN IF NOT EXISTS g300_sobrou  integer NULL;

-- Garante RLS habilitado e política permissiva (sem autenticação)
ALTER TABLE daily_stock ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_stock' AND policyname = 'allow_all_daily_stock'
  ) THEN
    EXECUTE 'CREATE POLICY allow_all_daily_stock ON daily_stock FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END$$;
