import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CategoryVenda = "venda_copo" | "venda_g300" | "venda_g500" | "venda_g1l";

interface Produto {
  cat: CategoryVenda;
  nome: string;
  preco: number; // centavos
}

interface ItemDeduzido {
  cat: CategoryVenda;
  nome: string;
  quantidade: number;
  preco_unitario: number; // centavos
  subtotal: number;       // centavos
}

type StatusVenda = "conciliado" | "ambiguo" | "pendente_conciliacao";

// ─── Matching: backtracking com poda ─────────────────────────────────────────

function deduzirProdutos(
  totalCentavos: number,
  produtos: Produto[]
): { status: StatusVenda; itens: ItemDeduzido[] | null } {
  const solucoes: ItemDeduzido[][] = [];

  function backtrack(
    restante: number,
    idx: number,
    atual: Map<CategoryVenda, number>
  ) {
    if (restante === 0) {
      const itens: ItemDeduzido[] = [];
      for (const [cat, qtd] of atual) {
        const p = produtos.find((x) => x.cat === cat)!;
        itens.push({
          cat,
          nome: p.nome,
          quantidade: qtd,
          preco_unitario: p.preco,
          subtotal: p.preco * qtd,
        });
      }
      solucoes.push(itens);
      return;
    }

    const totalItens = [...atual.values()].reduce((a, b) => a + b, 0);
    if (totalItens >= 20 || idx >= produtos.length || solucoes.length > 10) return;

    for (let i = idx; i < produtos.length; i++) {
      const p = produtos[i];
      if (p.preco > restante) continue;

      const maxQtd = Math.floor(restante / p.preco);
      for (let q = 1; q <= maxQtd; q++) {
        atual.set(p.cat, q);
        backtrack(restante - p.preco * q, i + 1, atual);
        atual.delete(p.cat);
        if (solucoes.length > 10) return;
      }
    }
  }

  backtrack(totalCentavos, 0, new Map());

  if (solucoes.length === 0) return { status: "pendente_conciliacao", itens: null };

  // Prefere a solução com menos tipos de produto
  solucoes.sort((a, b) => a.length - b.length);

  return {
    status: solucoes.length === 1 ? "conciliado" : "ambiguo",
    itens: solucoes[0],
  };
}

// ─── Parser do payload PagBank ────────────────────────────────────────────────

interface VendaParsed {
  pagbank_id: string;
  gross_amount: number; // centavos
  net_amount: number;   // centavos
  fee_amount: number;   // centavos
}

function parsePagBank(body: Record<string, unknown>): VendaParsed {
  // Formato moderno: { id, status, charges: [{ id, amount: { value, fees: {...} } }] }
  const charges = body.charges as Array<Record<string, unknown>> | undefined;
  if (charges?.length) {
    const charge = charges[0] as Record<string, unknown>;
    const amount = charge.amount as Record<string, unknown>;
    const fees = amount.fees as Record<string, Record<string, unknown>> | undefined;

    const gross = Number(amount.value ?? 0);
    const fee = fees
      ? Object.values(fees).reduce((acc, f) => acc + Number(f.value ?? 0), 0)
      : 0;

    return {
      pagbank_id: String(body.id ?? charge.id ?? ""),
      gross_amount: gross,
      net_amount: gross - fee,
      fee_amount: fee,
    };
  }

  // Formato simples / legado: { id, gross_amount, net_amount }
  const gross = Number(body.gross_amount ?? 0);
  const net = Number(body.net_amount ?? gross);
  return {
    pagbank_id: String(body.id ?? body.order_id ?? ""),
    gross_amount: gross,
    net_amount: net,
    fee_amount: gross - net,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Validação do token (configurado via `supabase secrets set`)
  const tokenEsperado = Deno.env.get("PAGBANK_WEBHOOK_TOKEN");
  if (tokenEsperado) {
    const tokenRecebido =
      req.headers.get("x-pagbank-token") ??
      req.headers.get("authorization")?.replace("Bearer ", "") ??
      "";
    if (tokenRecebido !== tokenEsperado) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Ignora eventos que não sejam pagamento confirmado
  const eventStatus = String(body.status ?? "");
  if (eventStatus && !["PAID", "AUTHORIZED", ""].includes(eventStatus)) {
    return Response.json({ skipped: true, status: eventStatus });
  }

  const venda = parsePagBank(body);
  if (venda.gross_amount <= 0) {
    return new Response("gross_amount inválido", { status: 422 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Lê os preços cadastrados no app (em reais → converte para centavos)
  const { data: settings } = await supabase
    .from("app_settings")
    .select("preco_venda")
    .limit(1)
    .maybeSingle();

  const precos = settings?.preco_venda ?? {
    venda_copo: 6,
    venda_g300: 10,
    venda_g500: 14,
    venda_g1l: 25,
  };

  const produtos: Produto[] = [
    { cat: "venda_g1l",    nome: "Garrafa 1L",    preco: Math.round(precos.venda_g1l  * 100) },
    { cat: "venda_g500",   nome: "Garrafa 500ml", preco: Math.round(precos.venda_g500 * 100) },
    { cat: "venda_g300",   nome: "Garrafa 300ml", preco: Math.round(precos.venda_g300 * 100) },
    { cat: "venda_copo",   nome: "Copo",           preco: Math.round(precos.venda_copo * 100) },
  ];

  const { status, itens } = deduzirProdutos(venda.gross_amount, produtos);

  const { error } = await supabase.from("vendas_maquininha").insert({
    pagbank_id:      venda.pagbank_id || null,
    gross_amount:    venda.gross_amount,
    net_amount:      venda.net_amount,
    fee_amount:      venda.fee_amount,
    itens_deduzidos: itens,
    status,
    payload_raw:     body,
  });

  if (error) {
    // 23505 = unique_violation → webhook duplicado, PagBank reenvia às vezes
    if (error.code === "23505") {
      return Response.json({ ok: true, duplicado: true });
    }
    console.error("Erro ao inserir venda:", error);
    return new Response("Erro interno", { status: 500 });
  }

  return Response.json({ ok: true, status, itens });
});
