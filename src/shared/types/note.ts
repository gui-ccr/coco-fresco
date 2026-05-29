export type NoteColor = 'default' | 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface Note {
  id:        string;
  title:     string;
  content:   string;
  color:     NoteColor;
  pinned:    boolean;
  createdAt: string;
  updatedAt: string;
}

export const NOTE_COLOR_META: Record<NoteColor, {
  bg:     string;
  border: string;
  accent: string;
  text:   string;
}> = {
  default: { bg: '#ffffff', border: '#e2e8f0', accent: '#f1f5f9', text: '#0f172a' },
  yellow:  { bg: '#fefce8', border: '#fde047', accent: '#fef08a', text: '#713f12' },
  green:   { bg: '#f0fdf4', border: '#86efac', accent: '#bbf7d0', text: '#14532d' },
  blue:    { bg: '#eff6ff', border: '#93c5fd', accent: '#bfdbfe', text: '#1e3a5f' },
  pink:    { bg: '#fdf2f8', border: '#f0abfc', accent: '#f5d0fe', text: '#701a75' },
  orange:  { bg: '#fff7ed', border: '#fed7aa', accent: '#fdba74', text: '#7c2d12' },
};
