export type ColorPreset = {
  id: string;
  label: string;
  accent: string;
  bg: string;
  isGradient: boolean;
};

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'orange', label: 'Orange', accent: '#FF6B35', bg: '#FF6B35', isGradient: false },
  { id: 'red', label: 'Red', accent: '#e11d48', bg: '#e11d48', isGradient: false },
  { id: 'blue', label: 'Blue', accent: '#3b82f6', bg: '#3b82f6', isGradient: false },
  { id: 'violet', label: 'Violet', accent: '#8b5cf6', bg: '#8b5cf6', isGradient: false },
  { id: 'green', label: 'Green', accent: '#10b981', bg: '#10b981', isGradient: false },
  { id: 'gold', label: 'Gold', accent: '#f59e0b', bg: '#f59e0b', isGradient: false },
  {
    id: 'sunset',
    label: 'Sunset',
    accent: '#f97316',
    bg: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
    isGradient: true,
  },
  {
    id: 'ocean',
    label: 'Ocean',
    accent: '#06b6d4',
    bg: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    isGradient: true,
  },
  {
    id: 'aurora',
    label: 'Aurora',
    accent: '#10b981',
    bg: 'linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)',
    isGradient: true,
  },
  {
    id: 'fire',
    label: 'Fire',
    accent: '#ef4444',
    bg: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
    isGradient: true,
  },
];

export type ColorPresetId = (typeof COLOR_PRESETS)[number]['id'];
