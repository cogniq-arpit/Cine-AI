/**
 * CINE AI - THEMES SYSTEM
 * 
 * Complete theme object that combines all design system tokens
 * into a single, cohesive exportable theme object.
 * 
 * This becomes the single source of truth for ALL design decisions.
 */

import { colors } from '../colors';
import { typography } from '../typography';
import { spacing } from '../spacing';
import { motion } from '../motion';
import { shadows } from '../shadows';
import { gradients } from '../gradients';
import { surfaces } from '../surfaces';
import { blur } from '../blur';
import { icons } from '../icons';
import { haptics } from '../haptics';
import { layout } from '../layout';
import { borders } from '../borders';
import { opacity } from '../opacity';
import { radius } from '../radius';
import { animationPresets } from '../animation-presets';
import { accessibility } from '../accessibility';

// ============================================================
// COMPLETE THEME OBJECT - The Design System
// ============================================================

export const theme = {
  // Visual Foundation
  colors,
  gradients,
  
  // Typography System
  typography,
  
  // Spacing & Layout
  spacing,
  layout,
  
  // Component Geometry
  borders,
  radius,
  opacity,
  
  // Surface & Effects
  surfaces,
  shadows,
  blur,
  
  // Motion & Animation
  motion,
  animationPresets,
  
  // Interactive Elements
  icons,
  haptics,
  
  // Accessibility
  accessibility,
  
  // Metadata
  meta: {
    name: 'Cine AI',
    version: '2.0',
    type: 'Premium Cinematic Design System',
    designer: 'AI-Powered Design System',
    philosophy: 'Luxury Cafe × Cinematic AI',
  },
} as const;

// ============================================================
// THEME METADATA & DOCUMENTATION
// ============================================================

export const themeMetadata = {
  philosophy: 'Luxury cafe atmosphere at night - warm, elegant, cinematic',
  
  colorPalette: {
    backgrounds: ['#09090B', '#0C0C14', '#111114'],
    accents: ['#F59E0B', '#7C3AED', '#3B82F6'],
  },
  
  fontFamilies: {
    display: 'Outfit',
    body: 'Inter',
  },
  
  motion: {
    strategy: 'Spring physics + Easing curves',
    philosophy: 'Physically believable, emotionally paced, restrained',
  },
  
  accessibility: {
    wcagLevel: 'AAA',
    contrastMinimum: 4.5,
    touchTargetMinimum: 44,
  },
} as const;

// ============================================================
// HOOKS FOR THEME ACCESS - Future Implementation
// ============================================================

export const useTheme = () => theme;

export const useColors = () => theme.colors;
export const useTypography = () => theme.typography;
export const useSpacing = () => theme.spacing;
export const useMotion = () => theme.motion;
export const useShadows = () => theme.shadows;
export const useGradients = () => theme.gradients;
export const useSurfaces = () => theme.surfaces;
export const useBlur = () => theme.blur;
export const useIcons = () => theme.icons;
export const useHaptics = () => theme.haptics;
export const useLayout = () => theme.layout;
export const useBorders = () => theme.borders;
export const useOpacity = () => theme.opacity;
export const useRadius = () => theme.radius;
export const useAnimationPresets = () => theme.animationPresets;
export const useAccessibility = () => theme.accessibility;

// ============================================================
// COMPLETE THEMES EXPORT
// ============================================================

export default theme;
