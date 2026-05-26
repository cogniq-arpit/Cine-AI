/**
 * CINE AI - RADIUS SYSTEM (Dedicated)
 * 
 * Comprehensive radius system for:
 * - Geometric consistency
 * - Component scaling
 * - Handcrafted feel
 */

// ============================================================
// RADIUS SCALE - Complete Scale
// ============================================================

export const radiusScale = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  xxxl: 20,
  huge: 24,
  massive: 32,
  full: 9999,
} as const;

// ============================================================
// COMPONENT SPECIFIC RADII
// ============================================================

export const componentSpecificRadii = {
  button: {
    small: 8,
    medium: 12,
    large: 14,
  },
  
  card: {
    small: 12,
    medium: 16,
    large: 20,
  },
  
  input: {
    default: 12,
    focused: 12,
  },
  
  avatar: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
  },
  
  image: {
    small: 8,
    medium: 12,
    large: 16,
  },
  
  badge: {
    small: 6,
    medium: 8,
    large: 10,
  },
  
  modal: {
    standard: 20,
    sheet: 24,
  },
  
  tab: {
    icon: 12,
    pill: 20,
  },
  
  chip: {
    standard: 8,
    large: 12,
  },
} as const;

// ============================================================
// CORNER RADIUS COMBINATIONS - Multi-corner Specs
// ============================================================

export const cornerCombinations = {
  // All corners equal
  uniform: (radius: number) => ({
    borderRadius: radius,
  }),
  
  // Top corners only
  topOnly: (radius: number) => ({
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
  }),
  
  // Bottom corners only
  bottomOnly: (radius: number) => ({
    borderBottomLeftRadius: radius,
    borderBottomRightRadius: radius,
  }),
  
  // Left corners only
  leftOnly: (radius: number) => ({
    borderTopLeftRadius: radius,
    borderBottomLeftRadius: radius,
  }),
  
  // Right corners only
  rightOnly: (radius: number) => ({
    borderTopRightRadius: radius,
    borderBottomRightRadius: radius,
  }),
} as const;

// ============================================================
// COMPLETE RADIUS EXPORT
// ============================================================

export const radius = {
  scale: radiusScale,
  components: componentSpecificRadii,
  corners: cornerCombinations,
} as const;

export default radius;
