/**
 * CINE AI - BORDERS & RADIUS SYSTEM
 * 
 * Border & radius definitions for:
 * - Component geometry
 * - Surface edges
 * - Handcrafted feel
 */

// ============================================================
// BORDER RADIUS - Curvature System
// ============================================================

export const borderRadius = {
  // Minimal rounding
  xs: 4,
  
  // Small rounding - subtle
  sm: 8,
  
  // Medium rounding - balanced
  md: 12,
  
  // Large rounding - prominent
  lg: 16,
  
  // Extra large rounding - soft edges
  xl: 20,
  
  // 2XL - very soft
  xxl: 24,
  
  // 3XL - maximum softness
  xxxl: 32,
  
  // Full - circles
  full: 9999,
} as const;

// ============================================================
// COMPONENT RADII - Preset Radius Values
// ============================================================

export const componentRadii = {
  // Button radius
  button: 12,
  buttonSmall: 8,
  buttonLarge: 14,
  
  // Card radius
  card: 16,
  cardSmall: 12,
  cardLarge: 20,
  
  // Input radius
  input: 12,
  
  // Modal radius
  modal: 20,
  
  // Sheet radius
  sheet: 24,
  
  // Badge radius
  badge: 8,
  
  // Avatar radius
  avatar: 12,
  avatarLarge: 16,
  
  // Image radius
  image: 12,
  imageLarge: 16,
  
  // Tab radius
  tab: 12,
} as const;

// ============================================================
// BORDER STYLES - Border Definitions
// ============================================================

export const borderStyles = {
  // Subtle border
  subtle: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  
  // Default border
  default: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Strong border
  strong: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  
  // Emphasis border
  emphasis: {
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  
  // Error border
  error: {
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  
  // Success border
  success: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
} as const;

// ============================================================
// COMPONENT BORDER PRESETS - Combined Styles
// ============================================================

export const componentBorders = {
  // Card border
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
  },
  
  // Input border - normal
  inputDefault: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
  },
  
  // Input border - focused
  inputFocused: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
  },
  
  // Input border - error
  inputError: {
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 12,
  },
  
  // Button border
  button: {
    borderRadius: 12,
  },
  
  // Modal border
  modal: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  
  // Bottom sheet border
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
} as const;

// ============================================================
// BORDER RADIUS PRESETS - Use Case Specific
// ============================================================

export const radiusPresets = {
  // Rounded - standard iOS-like
  rounded: {
    borderRadius: 16,
  },
  
  // Extra rounded - softer
  extraRounded: {
    borderRadius: 20,
  },
  
  // Ultra rounded - maximum softness
  ultraRounded: {
    borderRadius: 24,
  },
  
  // Minimal - slight rounding
  minimal: {
    borderRadius: 8,
  },
  
  // None - square
  none: {
    borderRadius: 0,
  },
  
  // Circle - perfect circle
  circle: {
    borderRadius: 9999,
  },
} as const;

// ============================================================
// COMPLETE BORDERS EXPORT
// ============================================================

export const borders = {
  radius: borderRadius,
  componentRadii,
  styles: borderStyles,
  components: componentBorders,
  presets: radiusPresets,
} as const;

export default borders;
