-- Adiciona forma de pagamento nas transações
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Adiciona flags de fiado e reposição sem débito
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_fiado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS no_caixa BOOLEAN NOT NULL DEFAULT FALSE;

-- Adiciona categoria de recebimento de fiado ao enum
ALTER TYPE category ADD VALUE IF NOT EXISTS 'recebimento_fiado';

-- Adiciona contagem de cocos no início do dia e conciliação ao final
ALTER TABLE daily_stock ADD COLUMN IF NOT EXISTS cocos_inicio INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily_stock ADD COLUMN IF NOT EXISTS cocos_sobrou INTEGER;
