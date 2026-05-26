/**
 * CINE AI - SPACING SYSTEM
 * 
 * Premium spacing philosophy designed for:
 * - Breathing room & calm
 * - Editorial composition
 * - Cinematic rhythm
 * - Luxury feel
 * - Intentional hierarchy
 */

// ============================================================
// MICRO SPACING - Fine Details
// ============================================================

export const micro = {
  xs: 2,      // Minimal gaps
  sm: 4,      // Small separations
  md: 6,      // Subtle spacing
  lg: 8,      // Standard micro
  xl: 12,     // Large micro
} as const;

// ============================================================
// COMPONENT SPACING - UI Elements
// ============================================================

export const component = {
  // Button & Badge Padding
  buttonPadding: {
    vertical: 12,
    horizontal: 16,
  },
  
  // Small Button
  smallButtonPadding: {
    vertical: 8,
    horizontal: 12,
  },
  
  // Large Button
  largeButtonPadding: {
    vertical: 16,
    horizontal: 20,
  },
  
  // Input Field Padding
  inputPadding: {
    vertical: 12,
    horizontal: 14,
  },
  
  // Card Padding
  cardPadding: {
    vertical: 16,
    horizontal: 16,
  },
  
  // Sheet/Modal Padding
  modalPadding: {
    vertical: 24,
    horizontal: 20,
  },
  
  // Badge Padding
  badgePadding: {
    vertical: 4,
    horizontal: 8,
  },
  
  // Tag Padding
  tagPadding: {
    vertical: 6,
    horizontal: 10,
  },
} as const;

// ============================================================
// SECTION SPACING - Content Flow
// ============================================================

export const section = {
  xs: 12,     // Tight sections
  sm: 16,     // Small sections
  md: 20,     // Regular sections
  lg: 24,     // Large sections
  xl: 32,     // Extra large sections
  xxl: 40,    // Cinematic sections
} as const;

// ============================================================
// LAYOUT SPACING - Screen-Level Spacing
// ============================================================

export const layout = {
  screenEdge: 16,           // Screen edge padding
  screenEdgeLarge: 20,      // Large screen padding
  containerGap: 16,         // Container spacing
  contentGap: 12,           // Content spacing
  sectionGap: 24,           // Section gaps
  cinemaGap: 32,            // Cinematic spacing
} as const;

// ============================================================
// SAFE AREA & INSETS - System-Aware
// ============================================================

export const safeArea = {
  // Standard safe areas
  topInset: 16,             // Below status bar
  bottomInset: 20,          // Above home indicator/nav
  sideInset: 16,            // Left/right margins
  
  // Modal safe area
  modalInset: {
    top: 24,
    bottom: 24,
    horizontal: 20,
  },
  
  // Fullscreen safe area
  fullscreenInset: {
    top: 8,
    bottom: 8,
    horizontal: 12,
  },
} as const;

// ============================================================
// MODAL SPACING - Overlay Components
// ============================================================

export const modal = {
  topOffset: 48,            // Distance from top
  horizontalMargin: 16,     // Side margins
  borderRadius: 20,         // Corner radius
  contentPadding: 24,       // Internal padding
  spacing: 16,              // Element spacing
} as const;

// ============================================================
// FLOATING ELEMENTS - Keyboard & Composers
// ============================================================

export const floating = {
  composerPadding: {
    vertical: 12,
    horizontal: 14,
  },
  composerMargin: 12,
  floatingRadius: 20,
  floatingElevation: 12,
} as const;

// ============================================================
// GRID & CAROUSEL SPACING - Content Grids
// ============================================================

export const grid = {
  // Two-column grid
  doubleColumnGap: 12,
  
  // Triple column grid
  tripleColumnGap: 10,
  
  // Carousel item spacing
  carouselItemGap: 12,
  carouselEdgeInset: 16,
  
  // List spacing
  listItemGap: 12,
  listSectionGap: 20,
} as const;

// ============================================================
// HERO & BANNER SPACING - Featured Content
// ============================================================

export const hero = {
  bannerHeight: 240,
  bannerHeightSmall: 160,
  posterHeight: 280,
  posterWidth: 180,
  
  overlayGradientHeight: 100,
  contentPadding: 20,
  textSpacing: 8,
} as const;

// ============================================================
// CARD SPACING PRESETS - Common Patterns
// ============================================================

export const cardSpacing = {
  // Movie card
  movieCard: {
    imageHeight: 240,
    padding: 12,
    spacing: 8,
  },
  
  // Recommendation card
  recommendationCard: {
    padding: 16,
    spacing: 12,
    imageHeight: 180,
  },
  
  // Compact card
  compactCard: {
    padding: 12,
    spacing: 6,
  },
  
  // Large card
  largeCard: {
    padding: 20,
    spacing: 16,
  },
} as const;

// ============================================================
// INTERACTION SPACING - Touch & Gesture
// ============================================================

export const interaction = {
  minTouchHeight: 44,       // Minimum touch target
  minTouchWidth: 44,
  pressedInset: 2,          // Visual press feedback
  focusRingWidth: 3,        // Focus ring thickness
} as const;

// ============================================================
// TYPOGRAPHY SPACING - Text Relationships
// ============================================================

export const typographySpacing = {
  // Heading to body spacing
  headingToBody: 8,
  
  // Body to subtext spacing
  bodyToMeta: 4,
  
  // Line spacing for body text
  bodyLineGap: 6,
  
  // Paragraph gap
  paragraphGap: 12,
} as const;

// ============================================================
// COMPLETE SPACING EXPORT
// ============================================================

export const spacing = {
  micro,
  component,
  section,
  layout,
  safeArea,
  modal,
  floating,
  grid,
  hero,
  cardSpacing,
  interaction,
  typographySpacing,
} as const;

export default spacing;
