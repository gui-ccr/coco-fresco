// src/utils/webhookParser.ts
import { type PaymentMethod, CARD_FEES } from '@/types/database';

// Interface do que geralmente chega das principais adquirentes (Stone, Ton, PagSeguro)
export interface MaquininhaWebhookPayload {
  transaction_id: string;
  amount: number;             // Algumas mandam em centavos (ex: 800 para R$ 8,00)
  status: 'approved' | 'paid' | 'declined';
  payment_method_type: 'debit' | 'credit';
  created_at: string;
}

export function processMaquininhaTransaction(payload: MaquininhaWebhookPayload) {
  // 1. Validar se a transação foi paga/aprovada
  if (payload.status !== 'approved' && payload.status !== 'paid') {
    return null;
  }

  // 2. Tratar o valor (se vier em centavos, divide por 100)
  const bruto = payload.amount > 5000 ? payload.amount / 100 : payload.amount;

  // 3. Mapear o método de pagamento
  const method: PaymentMethod = payload.payment_method_type === 'debit' ? 'card_debit' : 'card_credit';

  // 4. Calcular a taxa exata cadastrada no sistema
  const feePercent = CARD_FEES[method];
  const feeLost = bruto * feePercent;
  const netValue = bruto - feeLost;

  return {
    cat: 'venda',
    value: bruto,
    net_value: netValue,
    fee_lost: feeLost,
    payment_method: method,
    when: payload.created_at || new Date().toISOString(),
    note: `Maquininha Aut. (${payload.transaction_id.slice(-6)})`
  };
}