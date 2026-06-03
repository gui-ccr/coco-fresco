# Webhook PagBank — Edge Function

## O que foi feito

Criação de uma Supabase Edge Function em TypeScript para receber notificações automáticas (webhooks) da maquininha do PagBank sempre que um pagamento for confirmado.

A função resolve um problema central: a maquininha só informa o **valor total cobrado**, sem saber quais produtos foram vendidos. A função tenta descobrir isso automaticamente.

---

## Fluxo completo

```
Cliente paga na maquininha
        ↓
PagBank envia POST para a URL da Edge Function
        ↓
Função valida o token secreto
        ↓
Extrai gross_amount, net_amount, fee_amount do payload
        ↓
Lê os preços atuais de `app_settings.preco_venda`
        ↓
Algoritmo de matching tenta deduzir quais produtos foram vendidos
        ↓
Insere registro em `vendas_maquininha` com status:
  - "conciliado"             → combinação única encontrada
  - "ambiguo"                → múltiplas combinações possíveis (salva a mais simples)
  - "pendente_conciliacao"   → nenhuma combinação bate com o valor
```

---

## Algoritmo de matching

Usa **backtracking com poda** — essencialmente um problema de troco (coin change):

1. Converte o valor recebido para centavos (evita imprecisão de ponto flutuante)
2. Para cada produto, testa quantidades de 1 até `floor(total / preço)`
3. Se o restante chega a zero → solução válida encontrada
4. Limites de segurança: máximo 20 itens no total e 10 soluções encontradas
5. Se sobrar múltiplas soluções, ordena por menos tipos de produto (mais provável)

**Exemplos:**
| Valor bruto | Resultado |
|-------------|-----------|
| R$ 25,00 | conciliado → 1x Garrafa 1L |
| R$ 39,00 | conciliado → 1x Garrafa 1L + 1x Garrafa 500ml |
| R$ 12,00 | conciliado → 2x Copo (R$6) |
| R$ 20,00 | ambiguo → pode ser 2x G300 ou 1x G500 + 1x Copo |
| R$ 13,00 | pendente_conciliacao → nenhuma combinação bate |

---

## Tabela `vendas_maquininha`

Criada diretamente no Supabase (não via migration neste repositório).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK gerado automaticamente |
| `created_at` | timestamptz | Data/hora do registro |
| `pagbank_id` | text UNIQUE | ID do pedido no PagBank (evita duplicatas) |
| `gross_amount` | integer | Valor bruto em centavos |
| `net_amount` | integer | Valor líquido em centavos (após taxa) |
| `fee_amount` | integer | Valor da taxa em centavos |
| `itens_deduzidos` | jsonb | Array de `{ cat, nome, quantidade, preco_unitario, subtotal }` |
| `status` | text | `conciliado` / `ambiguo` / `pendente_conciliacao` |
| `payload_raw` | jsonb | Payload original completo do PagBank |

O campo `cat` dentro de `itens_deduzidos` usa os mesmos valores do enum `category` já existente no banco (`venda_copo`, `venda_g300`, `venda_g500`, `venda_g1l`), facilitando a integração futura com a tabela `transactions`.

---

## Segurança

A função valida um **token secreto** enviado pelo PagBank no header `x-pagbank-token`.

- Em desenvolvimento: sem token configurado, a validação é ignorada
- Em produção: token configurado via `supabase secrets set PAGBANK_WEBHOOK_TOKEN=...` — nunca vai para o repositório

Webhooks duplicados (PagBank às vezes reenvia) são tratados pelo `UNIQUE` em `pagbank_id`: retorna `200 ok` sem criar duplicata.

---

## Preços dinâmicos

A função **não tem preços fixos no código**. Ela lê `app_settings.preco_venda` antes de cada matching. Isso significa que se os preços mudarem no app, o webhook passa a usar os novos valores automaticamente — sem necessidade de redeploy.

---

## Arquivos criados

```
supabase/
└── functions/
    └── pagbank-webhook/
        ├── index.ts        ← Edge Function principal
        ├── .env.example    ← template de variáveis de ambiente locais
        └── CONTEXTO.md     ← este documento
.gitignore                  ← adicionado: supabase/functions/**/.env
```

---

## Como rodar localmente

```bash
# 1. Copie o template de variáveis
cp supabase/functions/pagbank-webhook/.env.example supabase/functions/pagbank-webhook/.env
# Preencha SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e PAGBANK_WEBHOOK_TOKEN

# 2. Sobe o ambiente local do Supabase (se ainda não estiver rodando)
supabase start

# 3. Serve a função com hot reload
supabase functions serve pagbank-webhook --env-file supabase/functions/pagbank-webhook/.env
```

Testes via curl — exemplos no final deste doc ou na conversa de criação.

---

## Como fazer o deploy

```bash
# Deploy da função
supabase functions deploy pagbank-webhook --no-verify-jwt

# Configura o token secreto no projeto remoto
supabase secrets set PAGBANK_WEBHOOK_TOKEN=<token_real_do_pagbank>
```

URL para cadastrar no painel do PagBank (Configurações → Webhooks):
```
https://<seu-projeto>.supabase.co/functions/v1/pagbank-webhook
```

---

## Próximos passos sugeridos

- [ ] Tela no frontend para listar `vendas_maquininha` com `status = 'pendente_conciliacao'` e permitir conciliação manual
- [ ] Botão de "confirmar itens" para registros `ambiguo`
- [ ] Após conciliação manual, criar entradas correspondentes na tabela `transactions`
- [ ] Considerar webhook de cancelamento/estorno do PagBank (evento `CANCELED`)
