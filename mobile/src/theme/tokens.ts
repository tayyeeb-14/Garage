export const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  primary: '#1E40AF',
  primaryBright: '#2563EB',
  primarySoft: '#EFF6FF',
  accent: '#DBEAFE',
  secondary: '#F1F5F9',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  borderSoft: '#F1F5F9',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  shadow: '#0F172A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 22,
  xl: 24,
  pill: 999,
};

export const typography = {
  greeting: { fontSize: 14, fontWeight: '600' as const, color: colors.textMuted },
  userName: { fontSize: 26, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
  sectionTitle: { fontSize: 20, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3 },
  cardTitle: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  subtitle: { fontSize: 14, fontWeight: '500' as const, color: colors.textMuted, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '600' as const, color: colors.textLight },
};

export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  float: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
};

export const iconSize = 20;
export const iconStroke = 2;
