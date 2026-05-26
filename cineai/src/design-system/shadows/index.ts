/**
 * CINE AI - SHADOW & LIGHTING SYSTEM
 * 
 * Premium cinematic lighting designed for:
 * - Soft edge lighting
 * - Localized ambient glow
 * - Subtle depth perception
 * - Warm premium atmosphere
 * - Luxury feel
 */

import { Platform } from 'react-native';

// ============================================================
// SOFT SHADOWS - Subtle Depth
// ============================================================

export const softShadows = {
  // Barely visible shadow
  xs: {
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: Platform.select({
      android: 1,
      ios: undefined,
    }),
  },
  
  // Subtle shadow - for slight elevation
  sm: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: Platform.select({
      android: 2,
      ios: undefined,
    }),
  },
  
  // Standard shadow - for cards
  md: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: Platform.select({
      android: 3,
      ios: undefined,
    }),
  },
} as const;

// ============================================================
// ELEVATED SHADOWS - More Prominent
// ============================================================

export const elevatedShadows = {
  // Moderate elevation - for floating elements
  sm: {
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: Platform.select({
      android: 4,
      ios: undefined,
    }),
  },
  
  // Strong elevation - for modals
  md: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: Platform.select({
      android: 6,
      ios: undefined,
    }),
  },
  
  // Heavy elevation - for overlays
  lg: {
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: Platform.select({
      android: 8,
      ios: undefined,
    }),
  },
} as const;

// ============================================================
// CINEMATIC SHADOWS - Dramatic Depth
// ============================================================

export const cinematicShadows = {
  // Light cinematic - subtle drama
  light: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: Platform.select({
      android: 4,
      ios: undefined,
    }),
  },
  
  // Standard cinematic - balanced drama
  standard: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: Platform.select({
      android: 6,
      ios: undefined,
    }),
  },
  
  // Heavy cinematic - dramatic depth
  heavy: {
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 32,
    elevation: Platform.select({
      android: 8,
      ios: undefined,
    }),
  },
} as const;

// ============================================================
// GLOW EFFECTS - Warm Ambient Lighting
// ============================================================

export const glowEffects = {
  // Subtle amber glow
  amberSubtle: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: Platform.select({
      android: 2,
      ios: undefined,
    }),
  },
  
  // Strong amber glow
  amberStrong: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: Platform.select({
      android: 3,
      ios: undefined,
    }),
  },
  
  // Purple glow - for AI elements
  purpleGlow: {
    shadowColor: '#7C3AED',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: Platform.select({
      android: 3,
      ios: undefined,
    }),
  },
  
  // Blue glow - for interactive elements
  blueGlow: {
    shadowColor: '#3B82F6',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: Platform.select({
      android: 2,
      ios: undefined,
    }),
  },
} as const;

// ============================================================
// INNER SHADOWS - Depth Inset
// ============================================================

export const innerShadows = {
  // Light inner shadow - subtle
  light: {
    insetShadowColor: 'rgba(0, 0, 0, 0.1)',
    insetShadowOffset: { width: 0, height: 1 },
    insetShadowRadius: 3,
  },
  
  // Medium inner shadow
  medium: {
    insetShadowColor: 'rgba(0, 0, 0, 0.15)',
    insetShadowOffset: { width: 0, height: 2 },
    insetShadowRadius: 6,
  },
  
  // Strong inner shadow
  strong: {
    insetShadowColor: 'rgba(0, 0, 0, 0.2)',
    insetShadowOffset: { width: 0, height: 3 },
    insetShadowRadius: 8,
  },
} as const;

// ============================================================
// COMPONENT-SPECIFIC SHADOWS
// ============================================================

export const componentShadows = {
  // Button shadow
  button: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  
  // Button pressed shadow
  buttonPressed: {
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: Platform.select({
      android: 0,
      ios: undefined,
    }),
  },
  
  // Card shadow
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Poster shadow - cinematic
  poster: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: Platform.select({
      android: 5,
      ios: undefined,
    }),
  },
  
  // Floating composer shadow
  floatingComposer: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: Platform.select({
      android: 4,
      ios: undefined,
    }),
  },
  
  // Modal shadow - heavy
  modal: {
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: Platform.select({
      android: 6,
      ios: undefined,
    }),
  },
  
  // Floating tab bar shadow
  floatingTabBar: {
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: Platform.select({
      android: 3,
      ios: undefined,
    }),
  },
  
  // Header shadow - subtle
  header: {
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
} as const;

// ============================================================
// BACKDROP SHADOWS - Background Darkening
// ============================================================

export const backdropShadows = {
  // Subtle backdrop
  subtle: 'rgba(0, 0, 0, 0.3)',
  
  // Standard backdrop
  standard: 'rgba(0, 0, 0, 0.5)',
  
  // Heavy backdrop
  heavy: 'rgba(0, 0, 0, 0.7)',
  
  // Premium backdrop - warm
  premium: 'rgba(0, 0, 0, 0.55)',
} as const;

// ============================================================
// COMPLETE SHADOW EXPORT
// ============================================================

export const shadows = {
  softShadows,
  elevatedShadows,
  cinematicShadows,
  glowEffects,
  innerShadows,
  componentShadows,
  backdropShadows,
} as const;

export default shadows;
