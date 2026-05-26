/**
 * CINE AI - TYPOGRAPHY SYSTEM
 * 
 * Premium typography hierarchy designed for:
 * - Editorial excellence
 * - Cinematic storytelling
 * - Emotional communication
 * - Luxury feel
 * - Perfect readability
 */

import { Platform } from 'react-native';

// ============================================================
// FONT FAMILIES - Premium Typefaces
// ============================================================

export const fonts = {
  outfit: Platform.select({
    ios: 'Outfit',
    android: 'Outfit',
  }),
  inter: Platform.select({
    ios: 'Inter',
    android: 'Inter',
  }),
  outfitBold: Platform.select({
    ios: 'Outfit-Bold',
    android: 'Outfit_700Bold',
  }),
  outfitSemibold: Platform.select({
    ios: 'Outfit-SemiBold',
    android: 'Outfit_600SemiBold',
  }),
  interMedium: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter_500Medium',
  }),
  interSemibold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter_600SemiBold',
  }),
} as const;

// ============================================================
// DISPLAY STYLES - Hero & Impact
// ============================================================

export const display = {
  // XL Display - Maximum Impact
  xl: {
    fontFamily: fonts.outfit,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  
  // Large Display - Section Heroes
  lg: {
    fontFamily: fonts.outfit,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  
  // Display - Major Sections
  md: {
    fontFamily: fonts.outfit,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  
  // Small Display - Important Content
  sm: {
    fontFamily: fonts.outfit,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
} as const;

// ============================================================
// HEADING STYLES - Section Titles
// ============================================================

export const heading = {
  // XL Heading - Screen Titles
  xl: {
    fontFamily: fonts.outfit,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.1,
  },
  
  // Large Heading - Subsections
  lg: {
    fontFamily: fonts.outfit,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: 0,
  },
  
  // Medium Heading - Component Titles
  md: {
    fontFamily: fonts.outfit,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  
  // Small Heading - Subsection Titles
  sm: {
    fontFamily: fonts.outfit,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
} as const;

// ============================================================
// BODY STYLES - Main Content
// ============================================================

export const body = {
  // Large Body - Primary Text
  lg: {
    fontFamily: fonts.inter,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  
  // Regular Body - Standard Text
  md: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  
  // Small Body - Secondary Text
  sm: {
    fontFamily: fonts.inter,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },
  
  // XS Body - Minimal Content
  xs: {
    fontFamily: fonts.inter,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },
} as const;

// ============================================================
// METADATA & CAPTION STYLES - Supporting Text
// ============================================================

export const metadata = {
  // Large Metadata - Important Meta
  lg: {
    fontFamily: fonts.inter,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.4,
  },
  
  // Regular Metadata - Standard Meta
  md: {
    fontFamily: fonts.inter,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },
  
  // Small Metadata - Timestamps, Ratings
  sm: {
    fontFamily: fonts.inter,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
  },
  
  // Micro Metadata - Smallest Hints
  xs: {
    fontFamily: fonts.inter,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
  },
} as const;

// ============================================================
// BUTTON STYLES - Interactive Text
// ============================================================

export const button = {
  // Large Button
  lg: {
    fontFamily: fonts.outfitSemibold,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  
  // Regular Button
  md: {
    fontFamily: fonts.outfitSemibold,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  
  // Small Button
  sm: {
    fontFamily: fonts.outfitSemibold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
} as const;

// ============================================================
// AI & CONVERSATIONAL STYLES - Chat & AI Content
// ============================================================

export const conversational = {
  // AI Response Text - Primary
  aiResponse: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  
  // User Message Text
  userMessage: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  
  // AI Thinking/Typing
  aiThinking: {
    fontFamily: fonts.inter,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
    fontStyle: 'italic' as const,
  },
  
  // Recommendation Text
  recommendation: {
    fontFamily: fonts.outfitSemibold,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
} as const;

// ============================================================
// EDITORIAL STYLES - Special Layouts
// ============================================================

export const editorial = {
  // Movie Title in Details
  movieTitle: {
    fontFamily: fonts.outfit,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  
  // Movie Rating
  movieRating: {
    fontFamily: fonts.outfitSemibold,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  
  // Movie Synopsis
  synopsis: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  
  // Cast Member Name
  castName: {
    fontFamily: fonts.outfitSemibold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  
  // Cast Character Role
  castRole: {
    fontFamily: fonts.inter,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
} as const;

// ============================================================
// FORM & INPUT STYLES - Text Input
// ============================================================

export const form = {
  // Large Input
  lgInput: {
    fontFamily: fonts.inter,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  
  // Regular Input
  mdInput: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  
  // Label Text
  label: {
    fontFamily: fonts.outfitSemibold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  
  // Helper Text
  helper: {
    fontFamily: fonts.inter,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
} as const;

// ============================================================
// COMPLETE TYPOGRAPHY EXPORT
// ============================================================

export const typography = {
  fonts,
  display,
  heading,
  body,
  metadata,
  button,
  conversational,
  editorial,
  form,
} as const;

export default typography;
