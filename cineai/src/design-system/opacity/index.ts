/**
 * CINE AI - OPACITY SYSTEM
 * 
 * Opacity levels for:
 * - Text hierarchy
 * - Interactive states
 * - Disabled states
 * - Transparency effects
 */

// ============================================================
// OPACITY SCALE - Linear Transparency
// ============================================================

export const opacityScale = {
  // Fully transparent
  none: 0,
  
  // Extremely faint
  xs: 0.05,
  
  // Very faint
  sm: 0.1,
  
  // Faint
  md: 0.2,
  
  // Moderate
  lg: 0.4,
  
  // Strong
  xl: 0.6,
  
  // Very strong
  xxl: 0.8,
  
  // Nearly opaque
  almost: 0.95,
  
  // Fully opaque
  full: 1,
} as const;

// ============================================================
// TEXT OPACITY - Typography Hierarchy
// ============================================================

export const textOpacity = {
  // Primary text - fully visible
  primary: 1,
  
  // Secondary text - slightly faded
  secondary: 0.85,
  
  // Tertiary text - faded
  tertiary: 0.65,
  
  // Hint text - very faded
  hint: 0.45,
  
  // Disabled text - nearly invisible
  disabled: 0.3,
} as const;

// ============================================================
// INTERACTIVE OPACITY - Button & Control States
// ============================================================

export const interactiveOpacity = {
  // Default state
  default: 1,
  
  // Hover state
  hover: 0.9,
  
  // Pressed state
  pressed: 0.7,
  
  // Active state
  active: 1,
  
  // Disabled state
  disabled: 0.4,
  
  // Loading state
  loading: 0.6,
} as const;

// ============================================================
// OVERLAY OPACITY - Background Darkening
// ============================================================

export const overlayOpacity = {
  // Subtle overlay
  subtle: 0.2,
  
  // Light overlay
  light: 0.3,
  
  // Medium overlay
  medium: 0.4,
  
  // Standard overlay
  standard: 0.5,
  
  // Strong overlay
  strong: 0.6,
  
  // Heavy overlay
  heavy: 0.7,
  
  // Very heavy overlay
  veryHeavy: 0.8,
  
  // Nearly opaque overlay
  almost: 0.95,
} as const;

// ============================================================
// SURFACE OPACITY - Card & Container Transparency
// ============================================================

export const surfaceOpacity = {
  // Glass surface - very transparent
  glass: 0.4,
  
  // Light surface - mostly transparent
  light: 0.5,
  
  // Medium surface - balanced
  medium: 0.6,
  
  // Heavy surface - mostly opaque
  heavy: 0.7,
  
  // Solid surface - fully opaque
  solid: 1,
} as const;

// ============================================================
// ICON OPACITY - Icon States
// ============================================================

export const iconOpacity = {
  // Default icon
  default: 1,
  
  // Secondary icon
  secondary: 0.8,
  
  // Tertiary icon
  tertiary: 0.6,
  
  // Disabled icon
  disabled: 0.3,
  
  // Hover icon
  hover: 1,
  
  // Active icon
  active: 1,
} as const;

// ============================================================
// GLOW OPACITY - Ambient Effects
// ============================================================

export const glowOpacity = {
  // Subtle glow
  subtle: 0.1,
  
  // Light glow
  light: 0.15,
  
  // Standard glow
  standard: 0.2,
  
  // Strong glow
  strong: 0.3,
  
  // Very strong glow
  veryStrong: 0.4,
} as const;

// ============================================================
// ANIMATION OPACITY - Motion Transitions
// ============================================================

export const animationOpacity = {
  // Enter animation - fade in from 0
  enter: {
    from: 0,
    to: 1,
  },
  
  // Exit animation - fade out from 1
  exit: {
    from: 1,
    to: 0,
  },
  
  // Pulse animation
  pulse: {
    min: 0.6,
    max: 1,
  },
  
  // Shimmer animation
  shimmer: {
    min: 0.5,
    max: 1,
  },
} as const;

// ============================================================
// COMPLETE OPACITY EXPORT
// ============================================================

export const opacity = {
  scale: opacityScale,
  text: textOpacity,
  interactive: interactiveOpacity,
  overlay: overlayOpacity,
  surface: surfaceOpacity,
  icon: iconOpacity,
  glow: glowOpacity,
  animation: animationOpacity,
} as const;

export default opacity;
