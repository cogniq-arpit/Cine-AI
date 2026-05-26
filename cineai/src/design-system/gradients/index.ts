/**
 * CINE AI - GRADIENTS SYSTEM
 * 
 * Premium gradient definitions for:
 * - Cinematic hero banners
 * - Atmospheric overlays
 * - Emotional depth
 * - Luxury feel
 */

// ============================================================
// HERO GRADIENTS - Screen & Banner Backgrounds
// ============================================================

export const heroGradients = {
  // Warm amber to dark
  amberToDark: {
    colors: ['#F59E0B', '#09090B'],
    locations: [0, 1],
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 1 },
  },
  
  // Purple to dark - AI themed
  purpleToDark: {
    colors: ['#7C3AED', '#09090B'],
    locations: [0, 1],
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 1 },
  },
  
  // Blue to dark - Fresh feel
  blueToDark: {
    colors: ['#3B82F6', '#09090B'],
    locations: [0, 1],
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 1 },
  },
  
  // Diagonal warm gradient
  diagonalWarm: {
    colors: ['#F59E0B', '#7C3AED'],
    locations: [0, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  },
  
  // Diagonal cool gradient
  diagonalCool: {
    colors: ['#3B82F6', '#0C0C14'],
    locations: [0, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  },
} as const;

// ============================================================
// OVERLAY GRADIENTS - Content Over Images
// ============================================================

export const overlayGradients = {
  // Bottom dark overlay - for posters
  darkBottom: {
    colors: ['transparent', '#09090B'],
    locations: [0, 1],
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 1 },
  },
  
  // Strong bottom overlay
  darkBottomStrong: {
    colors: ['rgba(9, 9, 11, 0)', '#09090B'],
    locations: [0, 1],
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 1 },
  },
  
  // Vignette - edges darken
  vignette: {
    colors: ['transparent', 'rgba(0, 0, 0, 0.4)'],
    locations: [0, 1],
    startPoint: { x: 0.5, y: 0.5 },
    endPoint: { x: 1, y: 1 },
  },
  
  // Soft top overlay
  softTop: {
    colors: ['rgba(0, 0, 0, 0.3)', 'transparent'],
    locations: [0, 1],
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 0.3 },
  },
} as const;

// ============================================================
// AMBIENT GRADIENTS - Subtle Background Motion
// ============================================================

export const ambientGradients = {
  // Warm ambient
  warmAmbient: {
    colors: ['rgba(245, 158, 11, 0.05)', 'rgba(9, 9, 11, 0)'],
    locations: [0, 1],
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 1 },
  },
  
  // Purple ambient glow
  purpleAmbient: {
    colors: ['rgba(124, 58, 237, 0.04)', 'rgba(9, 9, 11, 0)'],
    locations: [0, 1],
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 1 },
  },
  
  // Blue ambient glow
  blueAmbient: {
    colors: ['rgba(59, 130, 246, 0.04)', 'rgba(9, 9, 11, 0)'],
    locations: [0, 1],
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 1 },
  },
} as const;

// ============================================================
// ACCENT GRADIENTS - Interactive Elements
// ============================================================

export const accentGradients = {
  // Amber primary gradient
  amberAccent: {
    colors: ['#F59E0B', '#D97706'],
    locations: [0, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  },
  
  // Purple secondary gradient
  purpleAccent: {
    colors: ['#7C3AED', '#5B21B6'],
    locations: [0, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  },
  
  // Blue tertiary gradient
  blueAccent: {
    colors: ['#3B82F6', '#1E40AF'],
    locations: [0, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  },
  
  // Rainbow gradient - fun moments
  rainbow: {
    colors: ['#F59E0B', '#7C3AED', '#3B82F6'],
    locations: [0, 0.5, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  },
} as const;

// ============================================================
// CARD GRADIENTS - Surface Depth
// ============================================================

export const cardGradients = {
  // Subtle elevation gradient
  subtle: {
    colors: ['#111114', '#0F0F13'],
    locations: [0, 1],
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 1 },
  },
  
  // Glass effect gradient
  glass: {
    colors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.04)'],
    locations: [0, 1],
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 1 },
  },
  
  // Premium card
  premium: {
    colors: ['#16161C', '#111114'],
    locations: [0, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  },
} as const;

// ============================================================
// COMPLETE GRADIENTS EXPORT
// ============================================================

export const gradients = {
  heroGradients,
  overlayGradients,
  ambientGradients,
  accentGradients,
  cardGradients,
} as const;

export default gradients;
