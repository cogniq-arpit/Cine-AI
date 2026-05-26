/**
 * CINE AI V3 — DESIGN SYSTEM CONSTANTS
 *
 * The single source of truth for all visual tokens.
 * Every screen, component, and animation must reference these values.
 *
 * Identity: Premium AI-native cinema platform
 * Feel: Disney+ meets Perplexity meets Arc Browser
 */

// ─── Color Palette ─────────────────────────────────────────────────────────
export const Colors = {
  // ── Backgrounds (OLED-first black spectrum)
  bg: {
    void: '#070709',        // Absolute OLED black — splash, overlays
    deep: '#0D0D12',        // Primary screen background
    surface: '#12121A',     // Cards, panels, bottom sheets
    raised: '#181824',      // Elevated elements, modals
    overlay: 'rgba(7,7,9,0.7)',
    overlayDark: 'rgba(7,7,9,0.9)',
  },

  // ── Accent System
  accent: {
    crimson: '#E63946',        // Primary CTA, active states, AI indicators
    crimsonLight: '#FF5563',   // Hover, glow
    crimsonDeep: '#C1121F',    // Pressed states
    crimsonMuted: 'rgba(230,57,70,0.12)',
    crimsonGlow: 'rgba(230,57,70,0.35)',

    gold: '#F0B429',           // Ratings, premium badges
    goldLight: '#FFD166',
    goldMuted: 'rgba(240,180,41,0.12)',
    goldGlow: 'rgba(240,180,41,0.3)',

    electric: '#6C63FF',       // AI gradients, futuristic elements
    electricLight: '#9B94FF',
    electricMuted: 'rgba(108,99,255,0.12)',
    electricGlow: 'rgba(108,99,255,0.3)',

    // AI Orb gradient stops
    orbStart: '#E63946',
    orbMid: '#A855F7',
    orbEnd: '#6C63FF',
  },

  // ── Text hierarchy
  text: {
    primary: '#F7F7FA',      // Main readable text
    secondary: '#9090A8',    // Metadata, descriptions
    tertiary: '#5A5A70',     // Placeholders, disabled
    inverse: '#070709',      // Text on light surfaces
    onAccent: '#FFFFFF',     // Text on crimson buttons
  },

  // ── Glass system
  glass: {
    subtle: 'rgba(255,255,255,0.04)',
    light: 'rgba(255,255,255,0.07)',
    medium: 'rgba(255,255,255,0.10)',
    strong: 'rgba(255,255,255,0.14)',
    border: 'rgba(255,255,255,0.08)',
    borderActive: 'rgba(255,255,255,0.16)',
  },

  // ── Semantic
  semantic: {
    success: '#2DBD8C',
    successMuted: 'rgba(45,189,140,0.12)',
    warning: '#F4A261',
    warningMuted: 'rgba(244,162,97,0.12)',
    error: '#E63946',
    errorMuted: 'rgba(230,57,70,0.12)',
    info: '#4CC9F0',
    infoMuted: 'rgba(76,201,240,0.12)',
  },

  // ── Legacy aliases (keep for backwards compatibility with existing screens)
  background: '#0D0D12',
  backgroundSecondary: '#12121A',
  backgroundTertiary: '#181824',
  surface: '#12121A',
  surfaceElevated: '#181824',
  card: '#12121A',
  cardHover: '#181824',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  textPrimary: '#F7F7FA',
  textSecondary: '#9090A8',
  textTertiary: '#5A5A70',
  textMuted: '#44444F',
  primary: '#E63946',
  primaryLight: '#FF5563',
  primaryDark: '#C1121F',
  primaryMuted: 'rgba(230, 57, 70, 0.15)',
  gold: '#F0B429',
  goldLight: '#FFD166',
  goldMuted: 'rgba(240, 180, 41, 0.15)',
  indigo: '#6C63FF',
  indigoLight: '#9B94FF',
  indigoMuted: 'rgba(108, 99, 255, 0.15)',
  success: '#2DBD8C',
  warning: '#F4A261',
  error: '#E63946',
  info: '#4CC9F0',
  gradientDark: ['#0D0D12', 'transparent'] as string[],
  gradientCard: ['rgba(26,26,36,0.95)', 'rgba(7,7,9,0.98)'] as string[],
  white: '#FFFFFF',
  whiteAlpha10: 'rgba(255,255,255,0.10)',
  whiteAlpha20: 'rgba(255,255,255,0.20)',
  whiteAlpha5: 'rgba(255,255,255,0.05)',
  overlay: 'rgba(0,0,0,0.65)',
  overlayDark: 'rgba(0,0,0,0.85)',
} as const;

// ─── Typography ────────────────────────────────────────────────────────────
export const Typography = {
  // Font families
  fontDisplay: 'Poppins_700Bold',         // Hero titles, splash screen
  fontDisplaySemiBold: 'Poppins_600SemiBold',
  fontPrimary: 'Inter_400Regular',        // Body text
  fontMedium: 'Inter_500Medium',          // Captions, badges
  fontSemiBold: 'Inter_600SemiBold',      // Subheadings
  fontBold: 'Inter_700Bold',             // Headings, screen titles

  // Legacy aliases
  fontPoppins: 'Poppins_600SemiBold',
  fontPoppinsBold: 'Poppins_700Bold',

  // Size scale (px)
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
  '7xl': 48,
  '8xl': 56,

  // Line heights
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
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
  '6xl': 80,
  '7xl': 96,
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
  '4xl': 40,
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
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 32,
    elevation: 16,
  },
  glow: {
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  glowGold: {
    shadowColor: '#F0B429',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  glowElectric: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// ─── Motion Presets ────────────────────────────────────────────────────────
export const Motion = {
  // Spring physics configs for react-native-reanimated
  springs: {
    snappy: { damping: 16, stiffness: 350, mass: 1 },    // Button feedback, immediate
    gentle: { damping: 20, stiffness: 180, mass: 1 },     // Modals, overlays
    hero: { damping: 14, stiffness: 120, mass: 1 },       // Page entrances
    bounce: { damping: 10, stiffness: 300, mass: 1 },     // Playful micro-interactions
    slow: { damping: 22, stiffness: 100, mass: 1.2 },     // Cinematic slow motion
  },
  // Duration in ms
  durations: {
    instant: 100,
    fast: 180,
    medium: 300,
    slow: 500,
    cinematic: 700,
  },
} as const;

// ─── Gradient Definitions ──────────────────────────────────────────────────
export const Gradients = {
  // Vertical screen gradients
  screenFade: ['transparent', 'rgba(7,7,9,0.6)', '#070709'] as string[],
  heroOverlay: ['rgba(7,7,9,0)', 'rgba(7,7,9,0.5)', '#070709'] as string[],
  subtleHero: ['rgba(7,7,9,0)', 'rgba(7,7,9,0.8)'] as string[],

  // AI Orb gradient
  aiOrb: ['#E63946', '#A855F7', '#6C63FF'] as string[],

  // Card gradients
  cardBottom: ['rgba(7,7,9,0)', 'rgba(7,7,9,0.95)'] as string[],
  cardFull: ['rgba(18,18,26,0.95)', 'rgba(7,7,9,0.98)'] as string[],

  // Accent gradients
  crimsonGlow: ['#E63946', '#C1121F'] as string[],
  goldGlow: ['#F0B429', '#D4860A'] as string[],
  electricGlow: ['#6C63FF', '#4338CA'] as string[],

  // Background ambient gradients
  ambient: ['rgba(230,57,70,0.06)', 'rgba(108,99,255,0.04)', 'rgba(7,7,9,0)'] as string[],
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

// ─── Animation Durations (legacy) ──────────────────────────────────────────
export const Animations = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
} as const;
