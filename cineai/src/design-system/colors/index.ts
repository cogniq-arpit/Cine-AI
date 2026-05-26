/**
 * CINE AI - COLOR SYSTEM
 * 
 * Premium OLED-first palette designed for:
 * - Luxury cafe atmosphere
 * - Cinematic immersion
 * - Warm premium feel
 * - Emotional depth
 * - Global cinematic standards
 */

// ============================================================
// CORE BACKGROUNDS - The Foundation
// ============================================================

export const backgrounds = {
  deepest: '#09090B',      // The absolute foundation - warmest black
  deep: '#0C0C14',         // Slightly elevated, maintains warmth
  elevated: '#111114',     // For surface layers and elevation
  paper: '#0F0F13',        // For cards and contained areas
} as const;

// ============================================================
// SURFACE ELEVATION SYSTEM - Premium Layering
// ============================================================

export const surfaces = {
  base: backgrounds.deepest,
  level1: backgrounds.deep,
  level2: backgrounds.elevated,
  level3: '#131318',
  level4: '#16161C',
  overlay: 'rgba(9, 9, 11, 0.4)',
  overlayDense: 'rgba(9, 9, 11, 0.7)',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
} as const;

// ============================================================
// PRIMARY ACCENT COLORS - Emotional Soul
// ============================================================

export const accents = {
  amberwarm: '#F59E0B',       // Warm amber glow - primary accent
  amberWarmGlow: '#FCD34D',   // Lighter amber for glow effects
  amberDeep: '#D97706',       // Deeper amber for hierarchy
  
  cinemaRed: '#DC2626',       // Muted cinema red - for critical actions
  cinemaRedDeep: '#991B1B',   // Deep red for emphasis
  cinemaRedGlow: '#EF4444',   // Lighter red for visibility
  
  royalPurple: '#7C3AED',     // Deep royal purple - premium secondary
  purpleDeep: '#5B21B6',      // Deeper purple for hierarchy
  purpleLight: '#A78BFA',     // Light purple for accents
  
  electricBlue: '#3B82F6',    // Elegant electric blue - tertiary
  blueDark: '#1E40AF',        // Deep blue for emphasis
  blueLight: '#60A5FA',       // Light blue for highlights
  
  teelGreen: '#10B981',       // Teal green - success/positive
  greenDeep: '#047857',       // Deep teal
  greenLight: '#6EE7B7',      // Light teal
} as const;

// ============================================================
// TEXT HIERARCHY - Emotional Communication
// ============================================================

export const text = {
  primary: '#FAFAFA',           // Main text - nearly white
  secondary: '#D1D5DB',         // Secondary text - softer
  tertiary: '#9CA3AF',          // Tertiary text - dimmed
  disabled: '#6B7280',          // Disabled state
  inverse: '#111114',           // For light backgrounds
  hint: '#4B5563',              // Hints and help text
  
  aiResponsive: '#E5E7EB',     // For AI responses - slightly warmer
  conversational: '#F3F4F6',   // For conversation threads
  metadata: '#9CA3AF',          // For dates, times, meta
} as const;

// ============================================================
// SEMANTIC COLORS - Purpose-Driven
// ============================================================

export const semantic = {
  success: accents.teelGreen,
  successLight: accents.greenLight,
  
  warning: accents.amberwarm,
  warningLight: accents.amberWarmGlow,
  
  error: accents.cinemaRed,
  errorLight: accents.cinemaRedGlow,
  
  info: accents.electricBlue,
  infoLight: accents.blueLight,
  
  loading: accents.royalPurple,
  loadingLight: accents.purpleLight,
} as const;

// ============================================================
// INTERACTIVE STATES - Premium Feedback
// ============================================================

export const interactive = {
  // Pressed/Active states
  pressed: 'rgba(245, 158, 11, 0.15)',    // Amber with transparency
  pressedSecondary: 'rgba(124, 58, 237, 0.15)',  // Purple with transparency
  
  // Hover states
  hover: 'rgba(255, 255, 255, 0.05)',
  hoverSecondary: 'rgba(245, 158, 11, 0.08)',
  
  // Focus states
  focusRing: accents.amberwarm,
  focusRingSecondary: accents.royalPurple,
  
  // Disabled states
  disabledBg: 'rgba(255, 255, 255, 0.03)',
  disabledText: text.disabled,
} as const;

// ============================================================
// GLOW & AMBIENT EFFECTS - Cinematic Lighting
// ============================================================

export const glows = {
  amberWarm: 'rgba(245, 158, 11, 0.3)',
  amberWarmSubtle: 'rgba(245, 158, 11, 0.15)',
  
  purpleAmbient: 'rgba(124, 58, 237, 0.2)',
  purpleSubtle: 'rgba(124, 58, 237, 0.1)',
  
  blueAmbient: 'rgba(59, 130, 246, 0.2)',
  blueSubtle: 'rgba(59, 130, 246, 0.1)',
  
  whiteAmbient: 'rgba(255, 255, 255, 0.08)',
  whiteSubtle: 'rgba(255, 255, 255, 0.04)',
} as const;

// ============================================================
// BORDERS & DIVIDERS - Subtle Separation
// ============================================================

export const borders = {
  subtle: 'rgba(255, 255, 255, 0.08)',
  default: 'rgba(255, 255, 255, 0.12)',
  strong: 'rgba(255, 255, 255, 0.16)',
  emphasis: accents.amberwarm,
} as const;

// ============================================================
// AI-SPECIFIC COLORS - The Orb & Intelligence
// ============================================================

export const ai = {
  orbGradientStart: accents.amberwarm,
  orbGradientEnd: accents.royalPurple,
  orbGlow: 'rgba(245, 158, 11, 0.4)',
  
  thinkingPulse: accents.purpleLight,
  successPulse: accents.greenLight,
  
  responseHint: 'rgba(124, 58, 237, 0.08)',
  recommendationHighlight: 'rgba(245, 158, 11, 0.12)',
} as const;

// ============================================================
// MOVIE & CONTENT COLORS - Editorial
// ============================================================

export const content = {
  posterOverlay: 'rgba(0, 0, 0, 0.4)',
  posterGradientStart: 'rgba(0, 0, 0, 0)',
  posterGradientEnd: 'rgba(9, 9, 11, 0.9)',
  
  ratingBackground: 'rgba(245, 158, 11, 0.1)',
  ratingText: accents.amberwarm,
  
  tagBackground: 'rgba(124, 58, 237, 0.1)',
  tagText: accents.purpleLight,
  
  metadataText: text.metadata,
  descriptionText: text.secondary,
} as const;

// ============================================================
// SYSTEM COLORS - Feedback & Status
// ============================================================

export const system = {
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
  
  keyboard: 'rgba(255, 255, 255, 0.06)',
  keyboardBorder: 'rgba(255, 255, 255, 0.1)',
} as const;

// ============================================================
// UTILITY FUNCTION - Get Opacity Variant
// ============================================================

export const withOpacity = (color: string, opacity: number): string => {
  // For hex colors, convert to rgba
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

// ============================================================
// COMPLETE COLOR PALETTE EXPORT
// ============================================================

export const colors = {
  backgrounds,
  surfaces,
  accents,
  text,
  semantic,
  interactive,
  glows,
  borders,
  ai,
  content,
  system,
} as const;

export default colors;
