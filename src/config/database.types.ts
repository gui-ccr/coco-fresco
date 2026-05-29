// Tipos do banco de dados — sem imports circulares

type Category =
  | 'venda_copo' | 'venda_g300' | 'venda_g500' | 'venda_g1l'
  | 'venda'
  | 'coco' | 'gelo' | 'copo' | 'garrafa300' | 'garrafa500' | 'garrafa1l'
  | 'luz' | 'agua' | 'aluguel' | 'mercado'
  | 'lanche' | 'compra' | 'outros';

interface PrecoVenda {
  venda_copo: number; venda_g300: number; venda_g500: number; venda_g1l: number;
}

interface CustoUnit {
  coco: number; gelo: number; copo: number;
  garrafa300: number; garrafa500: number; garrafa1l: number;
}

export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          id:         string;
          user_id:    string;
          cat:        Category;
          value:      number;
          when:       string;
          note:       string | null;
          created_at: string;
        };
        Insert: {
          id?:      string;
          user_id?: string;
          cat:      Category;
          value:    number;
          when?:    string;
          note?:    string | null;
        };
        Update: {
          cat?:   Category;
          value?: number;
          when?:  string;
          note?:  string | null;
        };
      };
      app_settings: {
        Row: {
          user_id:     string;
          preco_venda: PrecoVenda;
          custo_unit:  CustoUnit;
          updated_at:  string;
        };
        Insert: {
          user_id?:     string;
          preco_venda?: PrecoVenda;
          custo_unit?:  CustoUnit;
        };
        Update: {
          preco_venda?: PrecoVenda;
          custo_unit?:  CustoUnit;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      category: Category;
    };
  };
}
