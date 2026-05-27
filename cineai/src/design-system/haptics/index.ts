/**
 * CINE AI - HAPTICS SYSTEM
 * 
 * Haptic feedback definitions for:
 * - Subtle interactions
 * - Confirmation feedback
 * - Selection states
 * - Error handling
 */

import * as Haptics from 'expo-haptics';

// ============================================================
// HAPTIC TYPES - Available Feedbacks
// ============================================================

export const hapticTypes = {
  // Light tap - subtle feedback
  light: 'light',
  
  // Medium impact - standard feedback
  medium: 'medium',
  
  // Heavy impact - strong feedback
  heavy: 'heavy',
  
  // Selection - scroll feedback
  selection: 'selection',
  
  // Success - positive confirmation
  success: 'success',
  
  // Warning - alert feedback
  warning: 'warning',
  
  // Error - error feedback
  error: 'error',
} as const;

// ============================================================
// INTERACTION HAPTICS - Common UI Interactions
// ============================================================

export const interactionHaptics = {
  // Button tap
  buttonTap: {
    type: 'medium',
    intensity: 0.7,
  },
  
  // Button press
  buttonPress: {
    type: 'heavy',
    intensity: 0.8,
  },
  
  // Selection change
  selection: {
    type: 'selection',
    intensity: 0.5,
  },
  
  // Scroll bounce
  scrollBounce: {
    type: 'light',
    intensity: 0.4,
  },
  
  // Gesture complete
  gestureComplete: {
    type: 'medium',
    intensity: 0.6,
  },
} as const;

// ============================================================
// AI-SPECIFIC HAPTICS - AI Orb & Intelligence
// ============================================================

export const aiHaptics = {
  // Thinking started
  thinkingStart: {
    type: 'medium',
    intensity: 0.6,
  },
  
  // Thinking pulse
  thinkingPulse: {
    type: 'light',
    intensity: 0.3,
  },
  
  // Response received
  responseReceived: {
    type: 'success',
    intensity: 0.7,
  },
  
  // Recommendation revealed
  recommendationReveal: {
    type: 'medium',
    intensity: 0.65,
  },
  
  // AI success
  aiSuccess: {
    type: 'success',
    intensity: 0.8,
  },
  
  // AI error
  aiError: {
    type: 'error',
    intensity: 0.7,
  },
} as const;

// ============================================================
// CONFIRMATION HAPTICS - Validation Feedback
// ============================================================

export const confirmationHaptics = {
  // Success confirmation
  success: {
    type: 'success',
    intensity: 0.8,
  },
  
  // Error confirmation
  error: {
    type: 'error',
    intensity: 0.8,
  },
  
  // Warning confirmation
  warning: {
    type: 'warning',
    intensity: 0.7,
  },
  
  // Action confirmed
  actionConfirmed: {
    type: 'medium',
    intensity: 0.75,
  },
} as const;

// ============================================================
// MODAL HAPTICS - Overlay Component Feedback
// ============================================================

export const modalHaptics = {
  // Modal appeared
  modalAppear: {
    type: 'medium',
    intensity: 0.6,
  },
  
  // Modal dismissed
  modalDismiss: {
    type: 'light',
    intensity: 0.4,
  },
  
  // Choice made
  choiceMade: {
    type: 'medium',
    intensity: 0.7,
  },
} as const;

// ============================================================
// COMPOSITION HAPTICS - Text Input & Keyboard
// ============================================================

export const compositionHaptics = {
  // Message ready to send
  messageReady: {
    type: 'medium',
    intensity: 0.6,
  },
  
  // Message sent
  messageSent: {
    type: 'success',
    intensity: 0.7,
  },
  
  // Keyboard appears
  keyboardAppear: {
    type: 'light',
    intensity: 0.3,
  },
  
  // Character typed
  characterTyped: {
    type: 'light',
    intensity: 0.2,
  },
} as const;

// ============================================================
// GESTURE HAPTICS - Touch & Gesture Feedback
// ============================================================

export const gestureHaptics = {
  // Swipe detected
  swipeDetected: {
    type: 'light',
    intensity: 0.4,
  },
  
  // Long press
  longPress: {
    type: 'medium',
    intensity: 0.7,
  },
  
  // Double tap
  doubleTap: {
    type: 'light',
    intensity: 0.5,
  },
  
  // Pinch
  pinch: {
    type: 'light',
    intensity: 0.3,
  },
} as const;

// ============================================================
// HAPTIC UTILITIES - Helper Functions
// ============================================================

export const hapticUtils = {
  // Trigger light feedback
  triggerLight: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  },
  
  // Trigger medium feedback
  triggerMedium: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  },
  
  // Trigger heavy feedback
  triggerHeavy: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  },
  
  // Trigger success feedback
  triggerSuccess: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  },
  
  // Trigger warning feedback
  triggerWarning: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  },
  
  // Trigger error feedback
  triggerError: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  },
} as const;

// ============================================================
// COMPLETE HAPTICS EXPORT
// ============================================================

export const haptics = {
  types: hapticTypes,
  interactions: interactionHaptics,
  ai: aiHaptics,
  confirmations: confirmationHaptics,
  modals: modalHaptics,
  composition: compositionHaptics,
  gestures: gestureHaptics,
  utils: hapticUtils,
} as const;

export default haptics;
