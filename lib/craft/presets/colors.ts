export type ColorPreset = (
  | { id: string; label: string; bg: string }
  | {
      id: string;
      label: string;
      accent: string;
      bg: string;
      isGradient: true;
      gradientFrom: string;
      gradientTo: string;
    }
);

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'orange', label: 'Orange', bg: '#FF6B35' },
  { id: 'red', label: 'Red', bg: '#e11d48' },
  { id: 'blue', label: 'Blue', bg: '#3b82f6' },
  { id: 'green', label: 'Green', bg: '#22c55e' },
  { id: 'purple', label: 'Purple', bg: '#a855f7' },
  { id: 'pink', label: 'Pink', bg: '#ec4899' },
  {
    id: 'sunset',
    label: 'Sunset',
    accent: '#f97316',
    bg: 'linear-gradient(135deg, #f97316, #ec4899)',
    isGradient: true,
    gradientFrom: '#f97316',
    gradientTo: '#ec4899',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    accent: '#06b6d4',
    bg: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    isGradient: true,
    gradientFrom: '#06b6d4',
    gradientTo: '#3b82f6',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    accent: '#10b981',
    bg: 'linear-gradient(135deg, #10b981, #8b5cf6)',
    isGradient: true,
    gradientFrom: '#10b981',
    gradientTo: '#8b5cf6',
  },
  {
    id: 'fire',
    label: 'Fire',
    accent: '#ef4444',
    bg: 'linear-gradient(135deg, #ef4444, #f59e0b)',
    isGradient: true,
    gradientFrom: '#ef4444',
    gradientTo: '#f59e0b',
  },
];

export type ColorPresetId = (typeof COLOR_PRESETS)[number]['id'];
