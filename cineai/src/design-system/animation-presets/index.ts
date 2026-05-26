/**
 * CINE AI - ANIMATION PRESETS
 * 
 * Pre-built animation patterns for:
 * - Component reveals
 * - Screen transitions
 * - AI behavior
 * - Ambient effects
 */

// ============================================================
// COMPONENT ANIMATIONS - Element Entrance/Exit
// ============================================================

export const componentAnimations = {
  // Fade in - simple opacity
  fadeIn: {
    type: 'timing',
    duration: 250,
    property: 'opacity',
    from: 0,
    to: 1,
  },
  
  // Fade out - opacity exit
  fadeOut: {
    type: 'timing',
    duration: 250,
    property: 'opacity',
    from: 1,
    to: 0,
  },
  
  // Scale in - grow appearance
  scaleIn: {
    type: 'spring',
    duration: 350,
    property: 'scale',
    from: 0.8,
    to: 1,
    damping: 10,
  },
  
  // Scale out - shrink disappearance
  scaleOut: {
    type: 'spring',
    duration: 300,
    property: 'scale',
    from: 1,
    to: 0.8,
    damping: 12,
  },
  
  // Slide in right
  slideInRight: {
    type: 'timing',
    duration: 350,
    property: 'translateX',
    from: 100,
    to: 0,
  },
  
  // Slide in left
  slideInLeft: {
    type: 'timing',
    duration: 350,
    property: 'translateX',
    from: -100,
    to: 0,
  },
  
  // Slide in up
  slideInUp: {
    type: 'timing',
    duration: 300,
    property: 'translateY',
    from: 100,
    to: 0,
  },
  
  // Slide in down
  slideInDown: {
    type: 'timing',
    duration: 300,
    property: 'translateY',
    from: -100,
    to: 0,
  },
  
  // Bounce in
  bounceIn: {
    type: 'spring',
    duration: 500,
    property: 'scale',
    from: 0,
    to: 1,
    damping: 6,
  },
} as const;

// ============================================================
// SCREEN ANIMATIONS - Navigation Transitions
// ============================================================

export const screenAnimations = {
  // Push - slide from right
  push: {
    type: 'slide',
    duration: 400,
    direction: 'horizontal',
    distance: 200,
  },
  
  // Pop - slide to right
  pop: {
    type: 'slide',
    duration: 350,
    direction: 'horizontal',
    distance: -200,
  },
  
  // Fade cross-fade
  fade: {
    type: 'fade',
    duration: 300,
  },
  
  // Vertical - slide up
  verticalUp: {
    type: 'slide',
    duration: 400,
    direction: 'vertical',
    distance: 200,
  },
  
  // Vertical reverse - slide down
  verticalDown: {
    type: 'slide',
    duration: 350,
    direction: 'vertical',
    distance: -200,
  },
} as const;

// ============================================================
// MODAL ANIMATIONS - Overlay Reveals
// ============================================================

export const modalAnimations = {
  // Modal appear - scale + fade
  appear: {
    type: 'combo',
    duration: 350,
    animations: [
      { property: 'scale', from: 0.8, to: 1 },
      { property: 'opacity', from: 0, to: 1 },
    ],
  },
  
  // Modal disappear
  disappear: {
    type: 'combo',
    duration: 250,
    animations: [
      { property: 'scale', from: 1, to: 0.8 },
      { property: 'opacity', from: 1, to: 0 },
    ],
  },
  
  // Bottom sheet reveal - slide up
  slideUp: {
    type: 'slide',
    duration: 400,
    direction: 'vertical',
    distance: 600,
  },
  
  // Bottom sheet dismiss - slide down
  slideDown: {
    type: 'slide',
    duration: 350,
    direction: 'vertical',
    distance: -600,
  },
} as const;

// ============================================================
// AI BEHAVIOR ANIMATIONS - Orb & Intelligence Effects
// ============================================================

export const aiAnimations = {
  // Orb breathing - subtle pulse
  breathing: {
    type: 'spring',
    duration: 3000,
    property: 'scale',
    from: 0.98,
    to: 1.02,
    repeat: -1,
    damping: 12,
  },
  
  // Thinking pulse - light glow
  thinkingPulse: {
    type: 'timing',
    duration: 800,
    property: 'opacity',
    from: 0.5,
    to: 1,
    repeat: -1,
  },
  
  // Success pulse - confidence animation
  successPulse: {
    type: 'spring',
    duration: 600,
    property: 'scale',
    from: 1,
    to: 1.05,
    damping: 8,
  },
  
  // Response reveal - cinematic
  responseReveal: {
    type: 'combo',
    duration: 500,
    animations: [
      { property: 'scale', from: 0.9, to: 1 },
      { property: 'opacity', from: 0, to: 1 },
    ],
  },
  
  // Recommendation highlight - emphasis
  recommendationHighlight: {
    type: 'spring',
    duration: 350,
    property: 'scale',
    from: 1,
    to: 1.02,
    damping: 10,
  },
} as const;

// ============================================================
// AMBIENT ANIMATIONS - Always-On Effects
// ============================================================

export const ambientAnimations = {
  // Floating - gentle up-down motion
  floating: {
    type: 'spring',
    duration: 4000,
    property: 'translateY',
    from: 0,
    to: 8,
    repeat: -1,
    damping: 15,
  },
  
  // Glow pulse - subtle luminance
  glowPulse: {
    type: 'timing',
    duration: 2000,
    property: 'opacity',
    from: 0.6,
    to: 1,
    repeat: -1,
  },
  
  // Slow rotate - gentle spin
  slowRotate: {
    type: 'timing',
    duration: 8000,
    property: 'rotate',
    from: 0,
    to: 360,
    repeat: -1,
  },
  
  // Background shift - subtle movement
  backgroundShift: {
    type: 'timing',
    duration: 10000,
    property: 'scale',
    from: 1,
    to: 1.05,
    repeat: -1,
  },
} as const;

// ============================================================
// GESTURE ANIMATIONS - Touch Feedback
// ============================================================

export const gestureAnimations = {
  // Press down - scale feedback
  pressDown: {
    type: 'timing',
    duration: 100,
    property: 'scale',
    from: 1,
    to: 0.95,
  },
  
  // Press up - scale release
  pressUp: {
    type: 'spring',
    duration: 200,
    property: 'scale',
    from: 0.95,
    to: 1,
    damping: 8,
  },
  
  // Long press - emphasis
  longPress: {
    type: 'spring',
    duration: 300,
    property: 'scale',
    from: 1,
    to: 1.05,
    damping: 10,
  },
  
  // Swipe feedback
  swipeFeedback: {
    type: 'timing',
    duration: 150,
    property: 'opacity',
    from: 0.7,
    to: 1,
  },
} as const;

// ============================================================
// LOADING STATE ANIMATIONS - Activity Indicators
// ============================================================

export const loadingAnimations = {
  // Spinner - full rotation
  spinner: {
    type: 'timing',
    duration: 1000,
    property: 'rotate',
    from: 0,
    to: 360,
    repeat: -1,
  },
  
  // Pulse - growing circle
  pulse: {
    type: 'timing',
    duration: 1200,
    property: 'scale',
    from: 1,
    to: 1.2,
    repeat: -1,
  },
  
  // Shimmer - slide animation
  shimmer: {
    type: 'timing',
    duration: 2000,
    property: 'translateX',
    from: -100,
    to: 100,
    repeat: -1,
  },
  
  // Dots - fade cascade
  dots: {
    type: 'stagger',
    duration: 1000,
    staggerDelay: 100,
    animation: {
      property: 'opacity',
      from: 0.5,
      to: 1,
    },
  },
} as const;

// ============================================================
// COMPLETE ANIMATION PRESETS EXPORT
// ============================================================

export const animationPresets = {
  components: componentAnimations,
  screens: screenAnimations,
  modals: modalAnimations,
  ai: aiAnimations,
  ambient: ambientAnimations,
  gestures: gestureAnimations,
  loading: loadingAnimations,
} as const;

export default animationPresets;
