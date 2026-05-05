import type { NoteColorName } from '@/types/notes';

export const NOTE_COLOR_HEX: Record<NoteColorName, string> = {
  red: '#E91E63',
  orange: '#FF9800',
  yellow: '#FFC107',
  green: '#4CAF50',
  blue: '#2196F3',
  purple: '#9C27B0',
  pink: '#FF4081',
  gray: '#607D8B',
};

export const NOTE_COLOR_ORDER: NoteColorName[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'gray',
];

export const NOTE_FILE_SIZE_LIMIT = 50 * 1024 * 1024;
export const NOTE_TOTAL_SIZE_LIMIT = 200 * 1024 * 1024;

export const NOTES_ENABLED_ENV = 'ENABLE_NOTES_FOR_USERS';
