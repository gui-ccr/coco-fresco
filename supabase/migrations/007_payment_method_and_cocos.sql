-- Adiciona forma de pagamento nas transações
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Adiciona contagem de cocos no início do dia e conciliação ao final
ALTER TABLE daily_stock ADD COLUMN IF NOT EXISTS cocos_inicio INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily_stock ADD COLUMN IF NOT EXISTS cocos_sobrou INTEGER;
