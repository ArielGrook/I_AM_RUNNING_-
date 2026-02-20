export const COLOR_PRESETS = [
  { id: 'orange', label: 'Orange', bg: '#FF6B35' },
  { id: 'red', label: 'Red', bg: '#e11d48' },
  { id: 'blue', label: 'Blue', bg: '#3b82f6' },
  { id: 'green', label: 'Green', bg: '#22c55e' },
  { id: 'purple', label: 'Purple', bg: '#a855f7' },
  { id: 'pink', label: 'Pink', bg: '#ec4899' },
] as const;

export type ColorPresetId = (typeof COLOR_PRESETS)[number]['id'];
