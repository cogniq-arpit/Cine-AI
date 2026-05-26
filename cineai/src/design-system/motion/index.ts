/**
 * CINE AI - MOTION SYSTEM
 * 
 * Premium motion design philosophy:
 * - Physically believable spring physics
 * - Emotionally paced transitions
 * - Restrained & premium
 * - Cinematic choreography
 * - Gesture-driven interactions
 */

// ============================================================
// SPRING PHYSICS - Reanimated Spring Config
// ============================================================

export const springs = {
  // Instant interaction - snappy, immediate
  snap: {
    damping: 20,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
  },
  
  // Standard interaction - smooth, responsive
  standard: {
    damping: 10,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
  },
  
  // Gentle animation - slow, dreamy
  gentle: {
    damping: 12,
    mass: 1.2,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
  },
  
  // Cinematic motion - luxurious, slow
  cinematic: {
    damping: 8,
    mass: 1.5,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
  },
  
  // Bouncy animation - playful, energetic
  bouncy: {
    damping: 6,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
  },
  
  // Subtle ambient - barely noticeable
  subtle: {
    damping: 15,
    mass: 1.3,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
  },
} as const;

// ============================================================
// TIMING PRESETS - Duration & Delay
// ============================================================

export const timings = {
  // Instant - no delay
  instant: 0,
  
  // Micro - very quick
  micro: 100,
  
  // Quick - snappy interactions
  quick: 150,
  
  // Standard - normal transitions
  standard: 250,
  
  // Moderate - deliberate pacing
  moderate: 350,
  
  // Slow - cinematic feel
  slow: 450,
  
  // Leisurely - ambient movement
  leisurely: 600,
  
  // Thoughtful - serious animations
  thoughtful: 750,
  
  // Meditative - very slow
  meditative: 1000,
  
  // Stagger timing for sequences
  stagger: 50,          // Time between sequential items
  staggerMedium: 75,
  staggerLarge: 100,
} as const;

// ============================================================
// EASING CURVES - Bezier Functions
// ============================================================

export const easings = {
  // Linear - no easing
  linear: [0.0, 0.0, 1.0, 1.0],
  
  // Ease In - slow start
  easeIn: [0.42, 0.0, 1.0, 1.0],
  
  // Ease Out - slow end
  easeOut: [0.0, 0.0, 0.58, 1.0],
  
  // Ease In Out - slow both ends
  easeInOut: [0.42, 0.0, 0.58, 1.0],
  
  // Cubic In - strong ease in
  cubicIn: [0.55, 0.055, 0.675, 0.19],
  
  // Cubic Out - strong ease out
  cubicOut: [0.215, 0.61, 0.355, 1.0],
  
  // Cubic In Out - strong both ends
  cubicInOut: [0.645, 0.045, 0.355, 1.0],
  
  // Quad In - gentle ease in
  quadIn: [0.25, 0.46, 0.45, 0.94],
  
  // Quad Out - gentle ease out
  quadOut: [0.25, 0.46, 0.45, 0.94],
  
  // Quart In - smooth in
  quartIn: [0.895, 0.03, 0.685, 0.22],
  
  // Quart Out - smooth out
  quartOut: [0.165, 0.84, 0.44, 1.0],
} as const;

// ============================================================
// GESTURE PHYSICS - Touch & Swipe Behavior
// ============================================================

export const gesture = {
  // Scroll friction
  scrollFriction: 0.95,
  
  // Swipe velocity thresholds
  swipeVelocityThreshold: 0.5,
  swipeDistanceThreshold: 50,
  
  // Pinch limits
  minScale: 1.0,
  maxScale: 3.0,
  
  // Pan resistance
  panSlowdown: 0.98,
  
  // Tap feedback
  tapScale: 0.95,
  tapDuration: 150,
} as const;

// ============================================================
// TRANSITION CATEGORIES - Named Motion Patterns
// ============================================================

export const transitions = {
  // Screen transitions
  screenPush: {
    duration: timings.moderate,
    easing: easings.cubicOut,
    overshoot: 0,
  },
  
  screenPop: {
    duration: timings.moderate,
    easing: easings.cubicIn,
    overshoot: 0,
  },
  
  screenFade: {
    duration: timings.standard,
    easing: easings.easeInOut,
    overshoot: 0,
  },
  
  // Modal reveals
  modalEnter: {
    duration: timings.slow,
    easing: easings.cubicOut,
    overshoot: 0.1,
  },
  
  modalExit: {
    duration: timings.moderate,
    easing: easings.easeIn,
    overshoot: 0,
  },
  
  // Component reveals
  componentEnter: {
    duration: timings.standard,
    easing: easings.easeOut,
    overshoot: 0,
  },
  
  componentExit: {
    duration: timings.quick,
    easing: easings.easeIn,
    overshoot: 0,
  },
} as const;

// ============================================================
// AI BEHAVIOR MOTION - Orb & Intelligence Feedback
// ============================================================

export const aiBehavior = {
  // Orb breathing animation
  breathing: {
    duration: 3000,
    minScale: 0.98,
    maxScale: 1.02,
    easing: easings.easeInOut,
  },
  
  // Thinking pulse
  thinkingPulse: {
    duration: 800,
    fromOpacity: 0.5,
    toOpacity: 1,
    easing: easings.easeInOut,
  },
  
  // Response reveal
  responseReveal: {
    duration: timings.slow,
    easing: easings.cubicOut,
    overshoot: 0.1,
  },
  
  // Recommendation highlight
  recommendationHighlight: {
    duration: timings.moderate,
    easing: easings.easeOut,
    scale: 1.02,
  },
  
  // Success animation
  successAnimation: {
    duration: timings.moderate,
    easing: easings.cubicOut,
    overshoot: 0.15,
  },
} as const;

// ============================================================
// KEYBOARD CHOREOGRAPHY - Composer & Input Motion
// ============================================================

export const keyboard = {
  // Composer rise
  composerRise: {
    duration: timings.moderate,
    easing: easings.cubicOut,
    overshoot: 0,
  },
  
  // Keyboard dismiss
  composerDismiss: {
    duration: timings.standard,
    easing: easings.easeIn,
    overshoot: 0,
  },
  
  // Message expand
  messageExpand: {
    duration: timings.quick,
    easing: easings.easeOut,
    overshoot: 0,
  },
  
  // Input focus
  inputFocus: {
    duration: timings.quick,
    scale: 1.01,
    easing: easings.easeOut,
  },
} as const;

// ============================================================
// PARALLAX MOTION - Depth & Layering
// ============================================================

export const parallax = {
  // Subtle parallax
  subtle: 0.2,
  
  // Standard parallax
  standard: 0.4,
  
  // Strong parallax
  strong: 0.6,
  
  // Hero parallax
  hero: 0.8,
} as const;

// ============================================================
// AMBIENT MOVEMENT - Subtle Always-On Animation
// ============================================================

export const ambient = {
  // Floating animation
  floating: {
    duration: 4000,
    distance: 8,
    easing: easings.easeInOut,
  },
  
  // Subtle glow pulse
  glowPulse: {
    duration: 2000,
    fromOpacity: 0.6,
    toOpacity: 1,
    easing: easings.easeInOut,
  },
  
  // Background shift
  backgroundShift: {
    duration: 8000,
    rotation: 2,
    easing: easings.linear,
  },
} as const;

// ============================================================
// SHARED ELEMENT TRANSITIONS - Cross-Screen Motion
// ============================================================

export const sharedElement = {
  // Movie poster transition
  posterTransition: {
    duration: timings.slow,
    easing: easings.cubicOut,
    overshoot: 0,
  },
  
  // AI Orb transition
  orbTransition: {
    duration: timings.moderate,
    easing: easings.cubicOut,
    overshoot: 0.2,
  },
  
  // Card transformation
  cardTransition: {
    duration: timings.moderate,
    easing: easings.cubicOut,
    overshoot: 0,
  },
} as const;

// ============================================================
// COMPLETE MOTION EXPORT
// ============================================================

export const motion = {
  springs,
  timings,
  easings,
  gesture,
  transitions,
  aiBehavior,
  keyboard,
  parallax,
  ambient,
  sharedElement,
} as const;

export default motion;
