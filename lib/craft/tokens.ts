// Базовые токены — общие для ВСЕХ Tron-компонентов
interface BaseTokens {
  bg: string;
  text: string;
  textSecondary: string;
  border: string;
  cardBg: string;
}

// Расширения — используются только некоторыми компонентами
interface GridTokens extends BaseTokens {
  gridColor: string;
}

interface InputTokens extends GridTokens {
  inputBg: string;
  inputBorder: string;
}

type ThemeTokens<T extends BaseTokens = BaseTokens> = {
  dark: T;
  light: T;
};

// Базовая палитра (без gridColor)
function buildBaseTokens(darkBg: string, lightBg: string): ThemeTokens<BaseTokens> {
  return {
    dark: {
      bg: darkBg ?? '#0a0a0a',
      text: '#ffffff',
      textSecondary: '#a1a1aa',
      border: 'rgba(255,255,255,0.08)',
      cardBg: 'rgba(255,255,255,0.03)',
    },
    light: {
      bg: lightBg ?? '#ffffff',
      text: '#0a0a0a',
      textSecondary: '#52525b',
      border: 'rgba(0,0,0,0.08)',
      cardBg: 'rgba(0,0,0,0.02)',
    },
  };
}

// С gridColor — для компонентов с фоновой сеткой
function buildGridTokens(darkBg: string, lightBg: string): ThemeTokens<GridTokens> {
  const base = buildBaseTokens(darkBg, lightBg);
  return {
    dark: { ...base.dark, gridColor: 'rgba(255,255,255,0.03)' },
    light: { ...base.light, gridColor: 'rgba(0,0,0,0.06)' },
  };
}

// С inputBg/inputBorder — для TronHub
function buildInputTokens(darkBg: string, lightBg: string): ThemeTokens<InputTokens> {
  const grid = buildGridTokens(darkBg, lightBg);
  return {
    dark: { ...grid.dark, inputBg: 'rgba(255,255,255,0.06)', inputBorder: 'rgba(255,255,255,0.12)' },
    light: { ...grid.light, inputBg: 'rgba(0,0,0,0.04)', inputBorder: 'rgba(0,0,0,0.12)' },
  };
}

export { buildBaseTokens, buildGridTokens, buildInputTokens };
export type { BaseTokens, GridTokens, InputTokens, ThemeTokens };
