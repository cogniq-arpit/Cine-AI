/**
 * CINE AI - LAYOUT SYSTEM
 * 
 * Layout patterns & structures for:
 * - Screen containers
 * - Content flows
 * - Safe areas
 * - Responsive scaling
 */

// ============================================================
// SCREEN LAYOUTS - Page-Level Structures
// ============================================================

export const screenLayouts = {
  // Full bleed screen
  fullBleed: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  
  // Standard screen with edge padding
  standard: {
    flex: 1,
    backgroundColor: '#09090B',
    paddingHorizontal: 16,
  },
  
  // Large padding screen
  spacious: {
    flex: 1,
    backgroundColor: '#09090B',
    paddingHorizontal: 20,
  },
  
  // Minimal padding
  compact: {
    flex: 1,
    backgroundColor: '#09090B',
    paddingHorizontal: 12,
  },
} as const;

// ============================================================
// CONTENT CONTAINERS - Inner Content Flow
// ============================================================

export const contentContainers = {
  // Hero container
  hero: {
    minHeight: 240,
    marginBottom: 32,
  },
  
  // Section container
  section: {
    marginVertical: 24,
  },
  
  // Subsection container
  subsection: {
    marginVertical: 16,
  },
  
  // Content area - main scrollable region
  contentArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
} as const;

// ============================================================
// GRID LAYOUTS - Multi-Column Grids
// ============================================================

export const gridLayouts = {
  // Single column - full width
  singleColumn: {
    numColumns: 1,
    itemSpacing: 12,
  },
  
  // Two column grid
  twoColumn: {
    numColumns: 2,
    itemSpacing: 12,
  },
  
  // Three column grid
  threeColumn: {
    numColumns: 3,
    itemSpacing: 10,
  },
  
  // Flexible grid - auto-sizing
  flexible: {
    minItemWidth: 160,
    spacing: 12,
  },
} as const;

// ============================================================
// CAROUSEL LAYOUTS - Scrollable Sequences
// ============================================================

export const carouselLayouts = {
  // Horizontal carousel
  horizontal: {
    scrollEnabled: true,
    horizontal: true,
    pagingEnabled: false,
    showsHorizontalScrollIndicator: false,
  },
  
  // Paging carousel
  paging: {
    scrollEnabled: true,
    horizontal: true,
    pagingEnabled: true,
    showsHorizontalScrollIndicator: false,
  },
  
  // Snap carousel
  snap: {
    scrollEnabled: true,
    horizontal: true,
    pagingEnabled: false,
    showsHorizontalScrollIndicator: false,
    snapToAlignment: 'start',
  },
} as const;

// ============================================================
// MODAL LAYOUTS - Overlay Positioning
// ============================================================

export const modalLayouts = {
  // Center modal
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  
  // Bottom sheet
  bottomSheet: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  
  // Top modal
  top: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 48,
  },
} as const;

// ============================================================
// SAFE AREA LAYOUTS - System-Aware Positioning
// ============================================================

export const safeAreaLayouts = {
  // Full safe area
  full: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  
  // With floating bottom
  withFloating: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,  // Space for floating tab bar
  },
  
  // Minimal safe area
  minimal: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
} as const;

// ============================================================
// FLEX LAYOUTS - Alignment Patterns
// ============================================================

export const flexLayouts = {
  // Row - horizontal flex
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Column - vertical flex
  column: {
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  
  // Center - centered content
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Space between
  spaceBetween: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Space around
  spaceAround: {
    justifyContent: 'space-around',
    alignItems: 'center',
  },
} as const;

// ============================================================
// SPECIAL LAYOUTS - Specific Patterns
// ============================================================

export const specialLayouts = {
  // Hero with content overlay
  heroOverlay: {
    position: 'relative' as const,
    minHeight: 240,
    overflow: 'hidden',
  },
  
  // Floating bottom area
  floatingBottom: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  
  // Sticky header
  stickyHeader: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  },
  
  // Absolute full cover
  absoluteFullCover: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
} as const;

// ============================================================
// RESPONSIVE BREAKPOINTS - Screen Size Handling
// ============================================================

export const breakpoints = {
  // Small phones
  sm: 320,
  
  // Standard phones
  md: 375,
  
  // Large phones
  lg: 414,
  
  // Extra large phones
  xl: 480,
  
  // Tablets
  tablet: 768,
  
  // Large tablets
  tabletLarge: 1024,
} as const;

// ============================================================
// COMPLETE LAYOUT EXPORT
// ============================================================

export const layout = {
  screenLayouts,
  contentContainers,
  gridLayouts,
  carouselLayouts,
  modalLayouts,
  safeAreaLayouts,
  flexLayouts,
  specialLayouts,
  breakpoints,
} as const;

export default layout;
