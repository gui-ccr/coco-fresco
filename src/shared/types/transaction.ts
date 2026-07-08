import { type AreaId } from "./area";

export type { AreaId };

export type Category =
  | "venda_copo"
  | "venda_g300"
  | "venda_g500"
  | "venda_g1l"
  | "venda"
  | "recebimento_fiado"
  | "coco"
  | "gelo"
  | "copo"
  | "garrafa300"
  | "garrafa500"
  | "garrafa1l"
  | "luz"
  | "agua"
  | "aluguel"
  | "mercado"
  | "lanche"
  | "compra"
  | "outros";

export interface Transaction {
  id: string;
  cat: Category;
  value: number;
  when: string;
  note?: string;
  payment_method?: 'dinheiro' | 'cartao';
  is_fiado?: boolean;
  no_caixa?: boolean;
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
  venda_copo: {
    label: "Copo",
    emoji: "🥤",
    area: "trabalho",
    isIncome: true,
    isRepo: false,
    color: "#059669",
    bg: "#d1fae5",
  },
  venda_g300: {
    label: "Garrafa 300ml",
    emoji: "🫙",
    area: "trabalho",
    isIncome: true,
    isRepo: false,
    color: "#059669",
    bg: "#d1fae5",
  },
  venda_g500: {
    label: "Garrafa 500ml",
    emoji: "🧃",
    area: "trabalho",
    isIncome: true,
    isRepo: false,
    color: "#059669",
    bg: "#d1fae5",
  },
  venda_g1l: {
    label: "Garrafa 1L",
    emoji: "🍾",
    area: "trabalho",
    isIncome: true,
    isRepo: false,
    color: "#059669",
    bg: "#d1fae5",
  },
  venda: {
    label: "Venda",
    emoji: "🥥",
    area: "trabalho",
    isIncome: true,
    isRepo: false,
    color: "#059669",
    bg: "#d1fae5",
  },
  recebimento_fiado: {
    label: "Recebimento fiado",
    emoji: "🤝",
    area: "trabalho",
    isIncome: true,
    isRepo: false,
    color: "#0891b2",
    bg: "#cffafe",
  },
  coco: {
    label: "Cocos",
    emoji: "🌴",
    area: "trabalho",
    isIncome: false,
    isRepo: true,
    color: "#f97316",
    bg: "#ffedd5",
  },
  gelo: {
    label: "Gelo",
    emoji: "🧊",
    area: "trabalho",
    isIncome: false,
    isRepo: true,
    color: "#f97316",
    bg: "#ffedd5",
  },
  copo: {
    label: "Copo (compra)",
    emoji: "🥤",
    area: "trabalho",
    isIncome: false,
    isRepo: true,
    color: "#f97316",
    bg: "#ffedd5",
  },
  garrafa300: {
    label: "Garrafa 300ml",
    emoji: "🫙",
    area: "trabalho",
    isIncome: false,
    isRepo: true,
    color: "#f97316",
    bg: "#ffedd5",
  },
  garrafa500: {
    label: "Garrafa 500ml",
    emoji: "🧃",
    area: "trabalho",
    isIncome: false,
    isRepo: true,
    color: "#f97316",
    bg: "#ffedd5",
  },
  garrafa1l: {
    label: "Garrafa 1L",
    emoji: "🍾",
    area: "trabalho",
    isIncome: false,
    isRepo: true,
    color: "#f97316",
    bg: "#ffedd5",
  },
  luz: {
    label: "Luz",
    emoji: "💡",
    area: "casa",
    isIncome: false,
    isRepo: false,
    color: "#dc2626",
    bg: "#fee2e2",
  },
  agua: {
    label: "Água",
    emoji: "💧",
    area: "casa",
    isIncome: false,
    isRepo: false,
    color: "#dc2626",
    bg: "#fee2e2",
  },
  aluguel: {
    label: "Aluguel",
    emoji: "🏠",
    area: "casa",
    isIncome: false,
    isRepo: false,
    color: "#dc2626",
    bg: "#fee2e2",
  },
  mercado: {
    label: "Mercado",
    emoji: "🛒",
    area: "casa",
    isIncome: false,
    isRepo: false,
    color: "#dc2626",
    bg: "#fee2e2",
  },
  lanche: {
    label: "Lanche",
    emoji: "🍔",
    area: "aleatorio",
    isIncome: false,
    isRepo: false,
    color: "#db2777",
    bg: "#fce7f3",
  },
  compra: {
    label: "Compra",
    emoji: "🛍️",
    area: "aleatorio",
    isIncome: false,
    isRepo: false,
    color: "#db2777",
    bg: "#fce7f3",
  },
  outros: {
    label: "Outros",
    emoji: "✨",
    area: "aleatorio",
    isIncome: false,
    isRepo: false,
    color: "#db2777",
    bg: "#fce7f3",
  },
};

export const QUICK_SALE_CATS: Category[] = [
  "venda_copo",
  "venda_g300",
  "venda_g500",
  "venda_g1l",
];
export const REPO_CATS: Category[] = [
  "coco",
  "gelo",
  "copo",
  "garrafa300",
  "garrafa500",
  "garrafa1l",
];
