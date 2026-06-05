export const Colors = {
  // Base grays — design system palette
  gray50: '#F8F8F7',
  gray100: '#EBEBEA',
  gray200: '#D4D4D2',
  gray300: '#B0B0AE',
  gray400: '#888887',
  gray500: '#6B6B69',
  gray600: '#4E4E4C',
  gray700: '#3A3A38',
  gray800: '#2A2A28',
  gray900: '#1C1C1A',

  // Functional aliases
  background: {
    light: '#F8F8F7',
    dark: '#1C1C1A',
  },
  surface: {
    light: '#FFFFFF',
    dark: '#2A2A28',
  },
  surfaceSecondary: {
    light: '#EBEBEA',
    dark: '#3A3A38',
  },
  border: {
    light: '#D4D4D2',
    dark: '#3A3A38',
  },
  text: {
    primary: { light: '#1C1C1A', dark: '#F8F8F7' },
    secondary: { light: '#6B6B69', dark: '#888887' },
    tertiary: { light: '#B0B0AE', dark: '#6B6B69' },
  },

  // Accent — used sparingly
  accent: '#3A3A38',
  accentDark: '#F8F8F7',

  // Status
  success: '#4A7C59',
  error: '#8B3A3A',
  warning: '#8B6A3A',
} as const;

export type ColorScheme = 'light' | 'dark';
