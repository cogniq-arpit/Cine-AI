// ─── Color Palette ─────────────────────────────────────────────────────────
export const Colors = {
  // Backgrounds
  background: '#0A0A0F',
  backgroundSecondary: '#111118',
  backgroundTertiary: '#1A1A24',
  surface: '#16161F',
  surfaceElevated: '#1E1E2A',
  card: '#1C1C26',
  cardHover: '#22222E',

  // Borders
  border: '#2A2A38',
  borderSubtle: '#1E1E2C',

  // Text
  textPrimary: '#F5F5F7',
  textSecondary: '#A0A0B0',
  textTertiary: '#6B6B80',
  textMuted: '#44444F',

  // Accent - Cinematic Red
  primary: '#E63946',
  primaryLight: '#FF6B75',
  primaryDark: '#C1121F',
  primaryMuted: 'rgba(230, 57, 70, 0.15)',

  // Accent - Soft Gold
  gold: '#D4AF37',
  goldLight: '#F0D060',
  goldMuted: 'rgba(212, 175, 55, 0.15)',

  // Accent - Royal Indigo
  indigo: '#6C63FF',
  indigoLight: '#8B85FF',
  indigoMuted: 'rgba(108, 99, 255, 0.15)',

  // Semantic
  success: '#2DBD8C',
  warning: '#F4A261',
  error: '#E63946',
  info: '#4CC9F0',

  // Gradients (used programmatically)
  gradientDark: ['#0A0A0F', 'transparent'],
  gradientCard: ['rgba(26,26,36,0.95)', 'rgba(10,10,15,0.98)'],

  // White variants
  white: '#FFFFFF',
  whiteAlpha10: 'rgba(255,255,255,0.10)',
  whiteAlpha20: 'rgba(255,255,255,0.20)',
  whiteAlpha5: 'rgba(255,255,255,0.05)',

  // Overlay
  overlay: 'rgba(0,0,0,0.65)',
  overlayDark: 'rgba(0,0,0,0.85)',
} as const;

// ─── Typography ────────────────────────────────────────────────────────────
export const Typography = {
  // Font families
  fontPrimary: 'Inter_400Regular',
  fontMedium: 'Inter_500Medium',
  fontSemiBold: 'Inter_600SemiBold',
  fontBold: 'Inter_700Bold',
  fontPoppins: 'Poppins_600SemiBold',
  fontPoppinsBold: 'Poppins_700Bold',

  // Size scale
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 40,

  // Line heights
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.6,
} as const;

// ─── Spacing ───────────────────────────────────────────────────────────────
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Border Radius ─────────────────────────────────────────────────────────
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ─── Shadows ───────────────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  glow: {
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── TMDB Image Sizes ──────────────────────────────────────────────────────
export const ImageSizes = {
  posterSmall: 'w185',
  posterMedium: 'w342',
  posterLarge: 'w500',
  posterOriginal: 'original',
  backdropSmall: 'w300',
  backdropMedium: 'w780',
  backdropLarge: 'w1280',
  backdropOriginal: 'original',
  profileSmall: 'w45',
  profileMedium: 'w185',
} as const;

// ─── Animation Durations ───────────────────────────────────────────────────
export const Animations = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
} as const;
