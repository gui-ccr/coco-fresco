import { createClient } from "@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Taxas por maquininha → método → bandeira
const FEE_TABLE: Record<string, Record<string, Record<string, number>>> = {
  stone: {
    debit: { mastercard: 0.012, visa: 0.012, default: 0.0199 },
    credit: { mastercard: 0.031, visa: 0.031, default: 0.0349 },
  },
  pagbank: {
    debit: { mastercard: 0.0139, visa: 0.0139, default: 0.0199 },
    credit: { mastercard: 0.0319, visa: 0.0319, default: 0.0349 },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Apenas POST permitido", {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  try {
    const url = new URL(req.url);
    const origin = url.searchParams.get("maquininha") ?? "stone";
    const currentRates = FEE_TABLE[origin] ?? FEE_TABLE["stone"];

    const payload = await req.json();
    const status = (
      payload.status ??
      payload.current_status ??
      ""
    ).toLowerCase();

    if (status === "approved" || status === "paid") {
      let bruto: number = payload.amount;
      // Stone envia centavos (2500 = R$25,00); PagBank envia reais (25.00)
      if (bruto > 5000) bruto = bruto / 100;

      const method = (
        payload.payment_method_type ??
        payload.type ??
        "credit"
      ).includes("debit")
        ? "debit"
        : "credit";
      const brand = (
        payload.payment_method_brand ??
        payload.brand ??
        "default"
      ).toLowerCase();

      const taxaPercentual =
        currentRates[method][brand] ?? currentRates[method]["default"];
      const feeLost = bruto * taxaPercentual;
      const netValue = bruto - feeLost;
      const dbMethod = method === "debit" ? "card_debit" : "card_credit";

      // Em produção na nuvem o Supabase injeta SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
      // Localmente via Docker usamos as variáveis customizadas (sem o prefixo bloqueado pela CLI).
      const supabaseUrl =
        Deno.env.get("MY_SUPA_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey =
        Deno.env.get("MY_SUPA_KEY") ??
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
        "";
      // ID da dona do negócio — obrigatório para respeitar o user_id NOT NULL da tabela.
      // Configure via: supabase secrets set MY_OWNER_USER_ID=<uuid>

      console.log("URL:", supabaseUrl);
      console.log("KEY length:", supabaseKey.length);

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase.from("transactions").insert([
        {
          cat: "venda",
          value: bruto,
          net_value: netValue,
          fee_lost: feeLost,
          payment_method: dbMethod,
          when: payload.created_at ?? new Date().toISOString(),
          note: `${origin.toUpperCase()} (${brand.toUpperCase()})`,
        },
      ]);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
