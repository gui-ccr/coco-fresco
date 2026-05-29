-- ============================================================
-- Coco Fresco — Tabela de anotações e lembretes
-- Execute no SQL Editor do Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL DEFAULT '',
  content    TEXT        NOT NULL DEFAULT '',
  color      TEXT        NOT NULL DEFAULT 'default'
                         CHECK (color IN ('default','yellow','green','blue','pink','orange')),
  pinned     BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION notes_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION notes_set_updated_at();

CREATE INDEX IF NOT EXISTS notes_pinned_idx     ON notes (pinned DESC);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes (updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON notes TO anon, authenticated;
