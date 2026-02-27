// Единые стили для всех Settings компонентов

export const labelCls =
  'block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-1.5';

export const inputCls =
  'w-full px-3 py-2 rounded-md text-sm ' +
  'bg-zinc-100 dark:bg-zinc-800 ' +
  'border border-zinc-200 dark:border-zinc-700 ' +
  'text-zinc-900 dark:text-zinc-100 ' +
  'focus:outline-none focus:border-orange-500 ' +
  'placeholder:text-zinc-400 dark:placeholder:text-zinc-600 ' +
  'mb-3';

export const sectionCls =
  'border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4';

export const itemCardCls =
  'rounded-lg p-3 mb-2 ' +
  'bg-zinc-100 dark:bg-zinc-800/60 ' +
  'border border-zinc-200 dark:border-zinc-700/60';

// Слайдер — применять через className settings-slider (globals.css)
export const sliderCls = 'settings-slider';

// Color picker превью — без белого ободка
export const colorPreviewCls =
  'w-8 h-8 rounded-md cursor-pointer ' +
  'border border-zinc-300 dark:border-zinc-600 ' +
  'outline-none ' +
  'p-0.5';

// Pill кнопки (для выбора columns, cardStyle и т.д.)
export const pillActiveCls =
  'px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-0 ' +
  'bg-orange-500/15 text-orange-500 ' +
  'ring-1 ring-orange-500/40';

export const pillInactiveCls =
  'px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-0 ' +
  'bg-zinc-100 dark:bg-zinc-800 ' +
  'text-zinc-500 dark:text-zinc-400 ' +
  'hover:text-zinc-700 dark:hover:text-zinc-200';

// Toggle checkbox замена — красивый свитч
export const toggleContainerCls = 'flex justify-between items-center mb-3';

export const toggleLabelCls = 'text-sm text-zinc-700 dark:text-zinc-300';
