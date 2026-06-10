-- Adiciona colunas para controle financeiro das vendas via maquininha (webhook)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS net_value      NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS fee_lost       NUMERIC(10, 2);
