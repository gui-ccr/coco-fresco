// supabase/functions/maquininha-webhook/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";

const FEE_TABLE: Record<string, Record<string, Record<string, number>>> = {
  stone: {
    debit: {
      mastercard: 0.012, // 1.20% na Stone
      visa: 0.012,
      default: 0.0199,
    },
    credit: {
      mastercard: 0.031, // 3.10% na Stone
      visa: 0.031,
      default: 0.0349,
    },
  },
  pagbank: {
    debit: {
      mastercard: 0.0139, // 1.39% no PagBank
      visa: 0.0139,
      default: 0.0199,
    },
    credit: {
      mastercard: 0.0319, // 3.19% no PagBank
      visa: 0.0319,
      default: 0.0349,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Apenas POST permitido", { status: 405 });
  }

  try {
    // 1. Descobre qual maquininha está mandando os dados lendo a URL (?maquininha=stone)
    const url = new URL(req.url);
    const origin = url.searchParams.get("maquininha") || "stone"; // Se não vier nada, assume stone

    // Pega a tabela de taxas ESPECÍFICA desta maquininha
    const currentRates = FEE_TABLE[origin] || FEE_TABLE["stone"];

    const payload = await req.json();

    // PagBank e Stone às vezes mandam o status com nomes diferentes (PAID, paid, approved)
    const status = (
      payload.status ||
      payload.current_status ||
      ""
    ).toLowerCase();

    // Filtra apenas o que foi pago com sucesso
    if (status === "approved" || status === "paid") {
      // Ajuste: PagBank costuma mandar o valor bruto exato (10.00), a Stone costuma mandar em centavos (1000)
      // Esta linha garante que o valor fica correto independente de quem mandar
      let bruto = payload.amount;
      if (bruto > 5000) bruto = bruto / 100; // Se vier 8000, vira 80.00

      const method = (
        payload.payment_method_type ||
        payload.type ||
        "credit"
      ).includes("debit")
        ? "debit"
        : "credit";
      const brand = (
        payload.payment_method_brand ||
        payload.brand ||
        "default"
      ).toLowerCase();

      // Busca a taxa na tabela da maquininha correta
      const taxaPercentual =
        currentRates[method][brand] || currentRates[method]["default"];

      const feeLost = bruto * taxaPercentual;
      const netValue = bruto - feeLost;
      const dbMethod = method === "debit" ? "card_debit" : "card_credit";

      const supabase = createClient(
        Deno.env.get("MY_SUPA_URL") ?? "",
        Deno.env.get("MY_SUPA_KEY") ?? "",
      );

      // Salva no banco identificando de qual máquina veio para a sua mãe saber
      const { error } = await supabase.from("transactions").insert([
        {
          cat: "venda",
          value: bruto,
          net_value: netValue,
          fee_lost: feeLost,
          payment_method: dbMethod,
          when: payload.created_at || new Date().toISOString(),
          note: `${origin.toUpperCase()} (${brand.toUpperCase()})`, // Ex: "STONE (VISA)" ou "PAGBANK (MASTERCARD)"
        },
      ]);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
    });
  }
});
