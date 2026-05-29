export type Category =
  // ─── Vendas rápidas (preço vem de AppSettings.precoVenda) ───
  | 'venda_copo'
  | 'venda_g300'
  | 'venda_g500'
  | 'venda_g1l'
  // ─── Venda genérica (valor manual) ───
  | 'venda'
  // ─── Reposição de estoque (fluxo de quantidade) ───
  | 'coco'
  | 'gelo'
  | 'copo'
  | 'garrafa300'
  | 'garrafa500'
  | 'garrafa1l'
  // ─── Casa ───
  | 'luz'
  | 'agua'
  | 'aluguel'
  | 'mercado'
  // ─── Gastos extras ───
  | 'lanche'
  | 'compra'
  | 'outros';

export type AreaId = 'trabalho' | 'casa' | 'aleatorio';

export interface Transaction {
  id: string;
  cat: Category;
  value: number;
  when: string;
  note?: string;
}

export interface CategoryMeta {
  label: string;
  emoji: string;
  area: AreaId;
  isIncome: boolean;
  isRepo: boolean;  // reposição: fluxo de quantidade no modal
  color: string;
  bg: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  // Vendas com preço fixo (configurável)
  venda_copo: { label: 'Copo',          emoji: '🥤', area: 'trabalho', isIncome: true,  isRepo: false, color: '#059669', bg: '#d1fae5' },
  venda_g300: { label: 'Garrafa 300ml', emoji: '🫙', area: 'trabalho', isIncome: true,  isRepo: false, color: '#059669', bg: '#d1fae5' },
  venda_g500: { label: 'Garrafa 500ml', emoji: '🧃', area: 'trabalho', isIncome: true,  isRepo: false, color: '#059669', bg: '#d1fae5' },
  venda_g1l:  { label: 'Garrafa 1L',   emoji: '🍾', area: 'trabalho', isIncome: true,  isRepo: false, color: '#059669', bg: '#d1fae5' },
  // Venda genérica
  venda:      { label: 'Venda',         emoji: '🥥', area: 'trabalho', isIncome: true,  isRepo: false, color: '#059669', bg: '#d1fae5' },
  // Reposição de estoque (custo unitário vem de AppSettings.custoUnit)
  coco:       { label: 'Cocos',         emoji: '🌴', area: 'trabalho', isIncome: false, isRepo: true,  color: '#f97316', bg: '#ffedd5' },
  gelo:       { label: 'Gelo',          emoji: '🧊', area: 'trabalho', isIncome: false, isRepo: true,  color: '#f97316', bg: '#ffedd5' },
  copo:       { label: 'Copo (compra)', emoji: '🥤', area: 'trabalho', isIncome: false, isRepo: true,  color: '#f97316', bg: '#ffedd5' },
  garrafa300: { label: 'Garrafa 300ml', emoji: '🫙', area: 'trabalho', isIncome: false, isRepo: true,  color: '#f97316', bg: '#ffedd5' },
  garrafa500: { label: 'Garrafa 500ml', emoji: '🧃', area: 'trabalho', isIncome: false, isRepo: true,  color: '#f97316', bg: '#ffedd5' },
  garrafa1l:  { label: 'Garrafa 1L',   emoji: '🍾', area: 'trabalho', isIncome: false, isRepo: true,  color: '#f97316', bg: '#ffedd5' },
  // Casa
  luz:        { label: 'Luz',           emoji: '💡', area: 'casa',     isIncome: false, isRepo: false, color: '#dc2626', bg: '#fee2e2' },
  agua:       { label: 'Água',          emoji: '💧', area: 'casa',     isIncome: false, isRepo: false, color: '#dc2626', bg: '#fee2e2' },
  aluguel:    { label: 'Aluguel',       emoji: '🏠', area: 'casa',     isIncome: false, isRepo: false, color: '#dc2626', bg: '#fee2e2' },
  mercado:    { label: 'Mercado',       emoji: '🛒', area: 'casa',     isIncome: false, isRepo: false, color: '#f97316', bg: '#ffedd5' },
  // Gastos extras
  lanche:     { label: 'Lanche',        emoji: '🍔', area: 'aleatorio', isIncome: false, isRepo: false, color: '#db2777', bg: '#fce7f3' },
  compra:     { label: 'Compra',        emoji: '🛍️', area: 'aleatorio', isIncome: false, isRepo: false, color: '#db2777', bg: '#fce7f3' },
  outros:     { label: 'Outros',        emoji: '✨', area: 'aleatorio', isIncome: false, isRepo: false, color: '#db2777', bg: '#fce7f3' },
};

export const AREA_META: Record<AreaId, { label: string; emoji: string; gradient: string; color: string }> = {
  trabalho:  { label: 'Trabalho',      emoji: '🥥', gradient: 'from-emerald-600 to-emerald-800', color: '#059669' },
  casa:      { label: 'Casa',          emoji: '🏠', gradient: 'from-red-500 to-red-700',         color: '#dc2626' },
  aleatorio: { label: 'Gastos Extras', emoji: '🎲', gradient: 'from-pink-500 to-pink-700',       color: '#db2777' },
};

// ─── Categorias agrupadas por papel no modal ──────────────────────────────
export const QUICK_SALE_CATS: Category[] = ['venda_copo', 'venda_g300', 'venda_g500', 'venda_g1l'];
export const REPO_CATS:       Category[] = ['coco', 'gelo', 'copo', 'garrafa300', 'garrafa500', 'garrafa1l'];
