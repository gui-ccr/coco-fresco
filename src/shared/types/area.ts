export type AreaId = 'trabalho' | 'casa' | 'aleatorio';

export interface AreaMeta {
  label: string;
  emoji: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

export const AREA_META: Record<AreaId, AreaMeta> = {
  trabalho:  { label: 'Trabalho',      emoji: '🥥', color: '#059669', gradientFrom: '#F97316', gradientTo: '#AB5111' },
  casa:      { label: 'Casa',          emoji: '🏠', color: '#dc2626', gradientFrom: '#991b1b', gradientTo: '#b91c1c' },
  aleatorio: { label: 'Gastos Extras', emoji: '🎲', color: '#db2777', gradientFrom: '#831843', gradientTo: '#9d174d' },
};
