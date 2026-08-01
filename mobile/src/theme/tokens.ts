export const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceRaised: '#F8FAFC',
  surfaceSoft: '#F1F5F9',
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
  borderStrong: '#CBD5E1',
  success: '#059669',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  shadow: '#0F172A',
  overlay: 'rgba(15, 23, 42, 0.56)',
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  display: 48,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const typography = {
  greeting: { fontSize: 14, fontWeight: '600' as const, color: colors.textMuted },
  userName: { fontSize: 26, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.5 },
  sectionTitle: { fontSize: 20, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.3 },
  cardTitle: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  subtitle: { fontSize: 14, fontWeight: '500' as const, color: colors.textMuted, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '600' as const, color: colors.textLight },
};

export const shadow = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  float: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
};

export const iconSize = 20;
export const iconStroke = 2;
