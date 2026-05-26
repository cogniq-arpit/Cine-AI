/**
 * CINE AI - BLUR SYSTEM
 * 
 * Blur intensity & strategy definitions for:
 * - Glass surfaces
 * - Backdrop darkening
 * - Modal reveals
 * - Ambient effects
 */

// ============================================================
// BLUR INTENSITIES - iOS Vibrancy & Android Blur
// ============================================================

export const blurIntensities = {
  // Barely visible blur - subtle effect
  xs: {
    blurAmount: 4,
    opacity: 0.3,
  },
  
  // Light blur - gentle frosting
  sm: {
    blurAmount: 10,
    opacity: 0.4,
  },
  
  // Medium blur - standard glass
  md: {
    blurAmount: 20,
    opacity: 0.5,
  },
  
  // Strong blur - prominent frosting
  lg: {
    blurAmount: 30,
    opacity: 0.6,
  },
  
  // Extra strong blur - maximum frosting
  xl: {
    blurAmount: 40,
    opacity: 0.7,
  },
} as const;

// ============================================================
// BLUR STRATEGIES - Use Case Presets
// ============================================================

export const blurStrategies = {
  // Header blur - subtle backdrop
  header: {
    blurAmount: 10,
    tintColor: 'rgba(9, 9, 11, 0.3)',
  },
  
  // Card blur - floating elements
  card: {
    blurAmount: 15,
    tintColor: 'rgba(12, 12, 20, 0.4)',
  },
  
  // Modal blur - prominent frosting
  modal: {
    blurAmount: 25,
    tintColor: 'rgba(12, 12, 20, 0.5)',
  },
  
  // Backdrop blur - deep frosting
  backdrop: {
    blurAmount: 30,
    tintColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Composer blur - keyboard interaction
  composer: {
    blurAmount: 20,
    tintColor: 'rgba(12, 12, 20, 0.5)',
  },
  
  // Tab bar blur - bottom navigation
  tabBar: {
    blurAmount: 20,
    tintColor: 'rgba(9, 9, 11, 0.3)',
  },
  
  // Ambient blur - background effect
  ambient: {
    blurAmount: 8,
    tintColor: 'rgba(245, 158, 11, 0.05)',
  },
} as const;

// ============================================================
// PERFORMANCE PRESETS - Optimized Blur
// ============================================================

export const performancePresets = {
  // High performance - minimal blur
  high: {
    blurAmount: 5,
    shouldRasterize: false,
  },
  
  // Balanced - moderate blur
  balanced: {
    blurAmount: 15,
    shouldRasterize: true,
  },
  
  // Quality - full blur
  quality: {
    blurAmount: 25,
    shouldRasterize: true,
  },
} as const;

// ============================================================
// COMPLETE BLUR EXPORT
// ============================================================

export const blur = {
  blurIntensities,
  blurStrategies,
  performancePresets,
} as const;

export default blur;
