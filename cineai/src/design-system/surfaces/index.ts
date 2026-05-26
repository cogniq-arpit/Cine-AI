/**
 * CINE AI - SURFACES SYSTEM
 * 
 * Reusable surface definitions for:
 * - Glass surfaces
 * - Elevated cards
 * - Editorial panels
 * - Floating composers
 * - Modal surfaces
 * - Overlay surfaces
 */

// ============================================================
// GLASS SURFACES - Blur & Transparency
// ============================================================

export const glassSurfaces = {
  // Subtle glass - barely visible
  subtle: {
    backgroundColor: 'rgba(12, 12, 20, 0.4)',
    backdropFilter: 'blur(10px)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  
  // Standard glass - balanced
  standard: {
    backgroundColor: 'rgba(12, 12, 20, 0.5)',
    backdropFilter: 'blur(20px)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  
  // Strong glass - prominent
  strong: {
    backgroundColor: 'rgba(12, 12, 20, 0.6)',
    backdropFilter: 'blur(30px)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
  },
  
  // Premium glass - luxury
  premium: {
    backgroundColor: 'rgba(12, 12, 20, 0.55)',
    backdropFilter: 'blur(25px)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
} as const;

// ============================================================
// ELEVATED SURFACES - Depth Layers
// ============================================================

export const elevatedSurfaces = {
  // Level 1 - Minimal elevation
  level1: {
    backgroundColor: '#111114',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  
  // Level 2 - Standard elevation
  level2: {
    backgroundColor: '#131318',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  
  // Level 3 - Premium elevation
  level3: {
    backgroundColor: '#16161C',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
  },
} as const;

// ============================================================
// CARD SURFACES - Content Containers
// ============================================================

export const cardSurfaces = {
  // Standard card
  standard: {
    backgroundColor: '#111114',
    borderRadius: 16,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  
  // Premium card
  premium: {
    backgroundColor: '#131318',
    borderRadius: 16,
    borderColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
  },
  
  // Movie poster card
  posterCard: {
    backgroundColor: '#0C0C14',
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
  },
  
  // Recommendation card
  recommendationCard: {
    backgroundColor: '#131318',
    borderRadius: 16,
    borderColor: 'rgba(124, 58, 237, 0.1)',
    borderWidth: 1,
  },
} as const;

// ============================================================
// PANEL SURFACES - Editorial Layouts
// ============================================================

export const panelSurfaces = {
  // Header panel
  header: {
    backgroundColor: 'rgba(9, 9, 11, 0.3)',
    backdropFilter: 'blur(10px)',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomWidth: 1,
  },
  
  // Content panel
  content: {
    backgroundColor: '#09090B',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
  },
  
  // Footer panel
  footer: {
    backgroundColor: 'rgba(9, 9, 11, 0.3)',
    backdropFilter: 'blur(10px)',
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    borderTopWidth: 1,
  },
} as const;

// ============================================================
// FLOATING SURFACES - Composers & Floating Elements
// ============================================================

export const floatingSurfaces = {
  // Floating composer
  composer: {
    backgroundColor: 'rgba(12, 12, 20, 0.5)',
    backdropFilter: 'blur(20px)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 20,
  },
  
  // Floating action button
  fab: {
    backgroundColor: '#F59E0B',
    borderRadius: 28,
  },
  
  // Floating tab bar
  tabBar: {
    backgroundColor: 'rgba(12, 12, 20, 0.5)',
    backdropFilter: 'blur(20px)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  
  // Floating menu
  menu: {
    backgroundColor: 'rgba(12, 12, 20, 0.6)',
    backdropFilter: 'blur(25px)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
  },
} as const;

// ============================================================
// MODAL SURFACES - Overlay Components
// ============================================================

export const modalSurfaces = {
  // Standard modal
  standard: {
    backgroundColor: '#111114',
    borderRadius: 20,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  
  // Glass modal
  glass: {
    backgroundColor: 'rgba(12, 12, 20, 0.5)',
    backdropFilter: 'blur(25px)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 20,
  },
  
  // Bottom sheet
  bottomSheet: {
    backgroundColor: '#111114',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopWidth: 1,
  },
} as const;

// ============================================================
// INTERACTIVE SURFACES - Buttons & Controls
// ============================================================

export const interactiveSurfaces = {
  // Primary button
  primaryButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
  },
  
  // Primary button pressed
  primaryButtonPressed: {
    backgroundColor: '#D97706',
    borderRadius: 12,
  },
  
  // Secondary button
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  
  // Secondary button pressed
  secondaryButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
  },
  
  // Tertiary button
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  
  // Input field
  inputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  
  // Input field focused
  inputFieldFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
} as const;

// ============================================================
// BADGE & TAG SURFACES - Small Accent Surfaces
// ============================================================

export const badgeSurfaces = {
  // Rating badge
  rating: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 8,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
  },
  
  // Genre tag
  genre: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: 8,
    borderColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
  },
  
  // Status badge
  status: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
  },
} as const;

// ============================================================
// COMPLETE SURFACES EXPORT
// ============================================================

export const surfaces = {
  glassSurfaces,
  elevatedSurfaces,
  cardSurfaces,
  panelSurfaces,
  floatingSurfaces,
  modalSurfaces,
  interactiveSurfaces,
  badgeSurfaces,
} as const;

export default surfaces;
