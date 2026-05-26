/**
 * CINE AI - DESIGN SYSTEM MAIN EXPORT
 * 
 * This is the central hub for the entire design system.
 * All design tokens and systems are re-exported here for convenient access.
 * 
 * Import directly from this file:
 * import { colors, spacing, motion, theme } from '@/design-system';
 */

// ============================================================
// DESIGN SYSTEM IMPORTS - All Systems
// ============================================================

export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { motion } from './motion';
export { shadows } from './shadows';
export { gradients } from './gradients';
export { surfaces } from './surfaces';
export { blur } from './blur';
export { icons } from './icons';
export { haptics } from './haptics';
export { layout } from './layout';
export { borders } from './borders';
export { opacity } from './opacity';
export { radius } from './radius';
export { animationPresets } from './animation-presets';
export { accessibility } from './accessibility';

// ============================================================
// COMPLETE THEME - The Single Source of Truth
// ============================================================

export { theme, useTheme, themeMetadata } from './themes';
export {
  useColors,
  useTypography,
  useSpacing,
  useMotion,
  useShadows,
  useGradients,
  useSurfaces,
  useBlur,
  useIcons,
  useHaptics,
  useLayout,
  useBorders,
  useOpacity,
  useRadius,
  useAnimationPresets,
  useAccessibility,
} from './themes';

// ============================================================
// DESIGN SYSTEM VERSION & INFO
// ============================================================

export const DESIGN_SYSTEM_VERSION = '2.0.0';
export const DESIGN_SYSTEM_NAME = 'Cine AI Premium Cinematic Design System';
export const DESIGN_SYSTEM_PHILOSOPHY = 'Luxury Cafe × Cinematic AI × Global Excellence';

// ============================================================
// CONVENIENCE EXPORTS FOR COMMON TASKS
// ============================================================

// Color convenience
export { colors as colorTokens } from './colors';

// Typography convenience
export { typography as typographyTokens } from './typography';

// Spacing convenience
export { spacing as spacingTokens } from './spacing';

// Motion convenience
export { motion as motionTokens } from './motion';

// Complete design system
export * from './themes';

// ============================================================
// DEFAULT EXPORT - The Complete Design System
// ============================================================

import { theme } from './themes';

export default theme;
