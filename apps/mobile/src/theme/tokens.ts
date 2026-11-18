// Design tokens from docs/04-design-system.md. Change values there first.
export const colors = {
  bg: '#F4F6F8',
  surface: '#FFFFFF',
  line: '#DCE1E7',
  primary: '#1E3A8A',
  secondary: '#0E7490',
  success: '#047857',
  warning: '#B45309',
  danger: '#B91C1C',
  text: '#0F172A',
  muted: '#475569',
  white: '#FFFFFF',
  tSuccess: '#D1FAE5',
  tPrimary: '#DBEAFE',
  tWarning: '#FEF3C7',
  tNeutral: '#E2E8F0',
  tTeal: '#CFF0F7',
  tDanger: '#FEE2E2',
  slate: '#475569',
  darkSlate: '#334155',
};

export const fonts = {
  regular: 'Hind_400Regular',
  medium: 'Hind_500Medium',
  semibold: 'Hind_600SemiBold',
  bold: 'Hind_700Bold',
} as const;

export type Weight = keyof typeof fonts;

export const radius = { card: 16, button: 16, control: 12, pill: 999 };
export const gutter = 16;

// Soft depth so white cards lift off the grey page. Android uses elevation.
export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  button: (color: string) => ({
    shadowColor: color,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  }),
};
