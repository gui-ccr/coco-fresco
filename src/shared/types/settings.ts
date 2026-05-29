export interface AppSettings {
  precoVenda: {
    venda_copo: number;
    venda_g300: number;
    venda_g500: number;
    venda_g1l:  number;
  };
  custoUnit: {
    coco:       number;
    gelo:       number;
    copo:       number;
    garrafa300: number;
    garrafa500: number;
    garrafa1l:  number;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  precoVenda: { venda_copo: 6, venda_g300: 10, venda_g500: 14, venda_g1l: 25 },
  custoUnit:  { coco: 0, gelo: 0, copo: 0, garrafa300: 0, garrafa500: 1.20, garrafa1l: 1.96 },
};
