import { CATEGORY_META, QUICK_SALE_CATS, REPO_CATS } from '@/shared/types/transaction';

export interface FieldConfig {
  key:         string;
  label:       string;
  emoji:       string;
  description: string;
}

export const VENDA_FIELDS: FieldConfig[] = QUICK_SALE_CATS.map(cat => ({
  key:         cat,
  label:       CATEGORY_META[cat].label,
  emoji:       CATEGORY_META[cat].emoji,
  description: 'Quanto você cobra do cliente',
}));

export const REPO_FIELDS: FieldConfig[] = REPO_CATS.map(cat => ({
  key:         cat,
  label:       CATEGORY_META[cat].label,
  emoji:       CATEGORY_META[cat].emoji,
  description: 'Quanto custa cada unidade para você',
}));
