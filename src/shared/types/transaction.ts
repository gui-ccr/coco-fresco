export type Category =
  | 'venda_copo' | 'venda_g300' | 'venda_g500' | 'venda_g1l'
  | 'venda'
  | 'coco' | 'gelo' | 'copo' | 'garrafa300' | 'garrafa500' | 'garrafa1l'
  | 'luz' | 'agua' | 'aluguel' | 'mercado'
  | 'lanche' | 'compra' | 'outros';

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
  isRepo: boolean;
  color: string;
  bg: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  venda_copo: { label: 'Copo',          emoji: '🥤', area: 'trabalho',  isIncome: true,  isRepo: false, color: '#059669', bg: '#d1fae5' },
  venda_g300: { label: 'Garrafa 300ml', emoji: '🫙', area: 'trabalho',  isIncome: true,  isRepo: false, color: '#059669', bg: '#d1fae5' },
  venda_g500: { label: 'Garrafa 500ml', emoji: '🧃', area: 'trabalho',  isIncome: true,  isRepo: false, color: '#059669', bg: '#d1fae5' },
  venda_g1l:  { label: 'Garrafa 1L',   emoji: '🍾', area: 'trabalho',  isIncome: true,  isRepo: false, color: '#059669', bg: '#d1fae5' },
  venda:      { label: 'Venda',         emoji: '🥥', area: 'trabalho',  isIncome: true,  isRepo: false, color: '#059669', bg: '#d1fae5' },
  coco:       { label: 'Cocos',         emoji: '🌴', area: 'trabalho',  isIncome: false, isRepo: true,  color: '#f97316', bg: '#ffedd5' },
  gelo:       { label: 'Gelo',          emoji: '🧊', area: 'trabalho',  isIncome: false, isRepo: true,  color: '#f97316', bg: '#ffedd5' },
  copo:       { label: 'Copo (compra)', emoji: '🥤', area: 'trabalho',  isIncome: false, isRepo: true,  color: '#f97316', bg: '#ffedd5' },
  garrafa300: { label: 'Garrafa 300ml', emoji: '🫙', area: 'trabalho',  isIncome: false, isRepo: true,  color: '#f97316', bg: '#ffedd5' },
  garrafa500: { label: 'Garrafa 500ml', emoji: '🧃', area: 'trabalho',  isIncome: false, isRepo: true,  color: '#f97316', bg: '#ffedd5' },
  garrafa1l:  { label: 'Garrafa 1L',   emoji: '🍾', area: 'trabalho',  isIncome: false, isRepo: true,  color: '#f97316', bg: '#ffedd5' },
  luz:        { label: 'Luz',           emoji: '💡', area: 'casa',      isIncome: false, isRepo: false, color: '#dc2626', bg: '#fee2e2' },
  agua:       { label: 'Água',          emoji: '💧', area: 'casa',      isIncome: false, isRepo: false, color: '#dc2626', bg: '#fee2e2' },
  aluguel:    { label: 'Aluguel',       emoji: '🏠', area: 'casa',      isIncome: false, isRepo: false, color: '#dc2626', bg: '#fee2e2' },
  mercado:    { label: 'Mercado',       emoji: '🛒', area: 'casa',      isIncome: false, isRepo: false, color: '#f97316', bg: '#ffedd5' },
  lanche:     { label: 'Lanche',        emoji: '🍔', area: 'aleatorio', isIncome: false, isRepo: false, color: '#db2777', bg: '#fce7f3' },
  compra:     { label: 'Compra',        emoji: '🛍️', area: 'aleatorio', isIncome: false, isRepo: false, color: '#db2777', bg: '#fce7f3' },
  outros:     { label: 'Outros',        emoji: '✨', area: 'aleatorio', isIncome: false, isRepo: false, color: '#db2777', bg: '#fce7f3' },
};

export const AREA_META: Record<AreaId, { label: string; emoji: string; color: string; gradientFrom: string; gradientTo: string }> = {
  trabalho:  { label: 'Trabalho',      emoji: '🥥', color: '#059669', gradientFrom: '#064e3b', gradientTo: '#065f46' },
  casa:      { label: 'Casa',          emoji: '🏠', color: '#dc2626', gradientFrom: '#991b1b', gradientTo: '#b91c1c' },
  aleatorio: { label: 'Gastos Extras', emoji: '🎲', color: '#db2777', gradientFrom: '#831843', gradientTo: '#9d174d' },
};

export const QUICK_SALE_CATS: Category[] = ['venda_copo', 'venda_g300', 'venda_g500', 'venda_g1l'];
export const REPO_CATS:       Category[] = ['coco', 'gelo', 'copo', 'garrafa300', 'garrafa500', 'garrafa1l'];

export interface WorkDay {
  id: string;
  date: string;       // YYYY-MM-DD
  capitalInit: number;
  createdAt: string;
}
