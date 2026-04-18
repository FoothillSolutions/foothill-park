export const theme = {
  colors: {
    primary: '#2D6DB5',   // buttons, headers, active states
    dark: '#1A1A2E',      // text, navigation
    accent: '#5BA4E6',    // highlights, secondary actions
    white: '#FFFFFF',     // backgrounds, card surfaces

    // Semantic aliases
    background: '#FFFFFF',
    surface: '#F5F8FC',
    border: '#D6E4F5',
    textPrimary: '#1A1A2E',
    textSecondary: '#5BA4E6',
    error: '#D9534F',
    success: '#28A745',
  },
  typography: {
    fontSizeXS: 12,
    fontSizeSM: 14,
    fontSizeMD: 16,
    fontSizeLG: 20,
    fontSizeXL: 24,
    fontSizeXXL: 32,

    fontWeightRegular: '400' as const,
    fontWeightMedium: '500' as const,
    fontWeightSemibold: '600' as const,
    fontWeightBold: '700' as const,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
} as const;

export type Theme = typeof theme;
