import { type Category } from '@/shared/types/transaction';
import { REPO_CATS } from '@/shared/types/transaction';

export const EXPENSE_GROUPS: { label: string; cats: Category[] }[] = [
  {
    label: 'REPOSIÇÃO DE ESTOQUE',
    cats: REPO_CATS,
  },
  {
    label: 'CASA',
    cats: ['luz', 'agua', 'aluguel', 'mercado'],
  },
  {
    label: 'GASTOS EXTRAS',
    cats: ['lanche', 'compra', 'outros'],
  },
];
