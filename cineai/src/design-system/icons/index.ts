/**
 * CINE AI - ICONS SYSTEM
 * 
 * Icon system definitions for:
 * - Navigation icons
 * - Action icons
 * - Status indicators
 * - Interactive hints
 */

// ============================================================
// ICON SIZES - Consistent Scaling
// ============================================================

export const iconSizes = {
  // Micro - tiny indicators
  xs: 16,
  
  // Small - secondary actions
  sm: 20,
  
  // Regular - standard size
  md: 24,
  
  // Large - prominent actions
  lg: 32,
  
  // XL - focal points
  xl: 40,
  
  // 2XL - hero icons
  xxl: 48,
  
  // 3XL - large displays
  xxxl: 64,
} as const;

// ============================================================
// ICON COLORS - Color Variants
// ============================================================

export const iconColors = {
  // Primary - default icon color
  primary: '#FAFAFA',
  
  // Secondary - dimmed icons
  secondary: '#D1D5DB',
  
  // Tertiary - faint icons
  tertiary: '#9CA3AF',
  
  // Disabled - inactive icons
  disabled: '#6B7280',
  
  // Accent - highlighted icons
  accent: '#F59E0B',
  
  // Success - positive actions
  success: '#10B981',
  
  // Warning - alert states
  warning: '#DC2626',
  
  // Info - informational
  info: '#3B82F6',
} as const;

// ============================================================
// ICON STROKE WIDTHS - Line Weight Variants
// ============================================================

export const iconStrokeWidths = {
  // Thin - delicate lines
  thin: 1.5,
  
  // Regular - standard
  regular: 2,
  
  // Medium - bold
  medium: 2.5,
  
  // Bold - prominent
  bold: 3,
} as const;

// ============================================================
// ICON FAMILIES - Icon Set Organization
// ============================================================

export const iconFamilies = {
  // Navigation icons
  navigation: {
    home: 'home',
    search: 'search',
    explore: 'compass',
    chat: 'message-circle',
    profile: 'user',
    watchlist: 'bookmark',
  },
  
  // Action icons
  action: {
    add: 'plus',
    remove: 'minus',
    edit: 'edit-2',
    delete: 'trash-2',
    share: 'share-2',
    settings: 'settings',
    filter: 'sliders',
    sort: 'arrow-up-down',
  },
  
  // Media icons
  media: {
    play: 'play',
    pause: 'pause',
    forward: 'fast-forward',
    backward: 'rewind',
    volume: 'volume-2',
    volumeMuted: 'volume-x',
    fullscreen: 'maximize-2',
  },
  
  // Status icons
  status: {
    check: 'check',
    checkCircle: 'check-circle',
    close: 'x',
    closeCircle: 'x-circle',
    info: 'info',
    warning: 'alert-circle',
    error: 'x-circle',
    loading: 'loader',
  },
  
  // Interaction icons
  interaction: {
    like: 'heart',
    liked: 'heart-filled',
    comment: 'message-square',
    share: 'share-2',
    bookmark: 'bookmark',
    bookmarked: 'bookmark-filled',
    star: 'star',
    starFilled: 'star-filled',
  },
  
  // Input icons
  input: {
    search: 'search',
    clear: 'x-circle',
    password: 'eye',
    passwordHidden: 'eye-off',
    calendar: 'calendar',
    clock: 'clock',
  },
  
  // AI icons
  ai: {
    orb: 'target',
    sparkle: 'sparkles',
    magic: 'wand-2',
    brain: 'brain',
    lightbulb: 'lightbulb',
    zap: 'zap',
  },
  
  // Notification icons
  notification: {
    bell: 'bell',
    bellAlert: 'bell-alert',
    badge: 'badge',
  },
} as const;

// ============================================================
// ICON STATES - Interactive States
// ============================================================

export const iconStates = {
  // Default state
  default: {
    color: iconColors.primary,
    opacity: 1,
    scale: 1,
  },
  
  // Hover state
  hover: {
    color: iconColors.accent,
    opacity: 1,
    scale: 1.1,
  },
  
  // Pressed state
  pressed: {
    color: iconColors.accent,
    opacity: 0.9,
    scale: 0.95,
  },
  
  // Active state
  active: {
    color: iconColors.accent,
    opacity: 1,
    scale: 1,
  },
  
  // Disabled state
  disabled: {
    color: iconColors.disabled,
    opacity: 0.5,
    scale: 1,
  },
} as const;

// ============================================================
// ICON ANIMATIONS - Motion Presets
// ============================================================

export const iconAnimations = {
  // Fade in/out
  fade: {
    duration: 200,
    property: 'opacity',
  },
  
  // Spin animation - loading
  spin: {
    duration: 1000,
    property: 'rotate',
    from: 0,
    to: 360,
  },
  
  // Bounce animation
  bounce: {
    duration: 600,
    property: 'scale',
  },
  
  // Pulse animation - notification
  pulse: {
    duration: 2000,
    property: 'opacity',
  },
  
  // Scale animation
  scale: {
    duration: 300,
    property: 'scale',
  },
  
  // Rotate animation
  rotate: {
    duration: 300,
    property: 'rotate',
  },
} as const;

// ============================================================
// COMPLETE ICONS EXPORT
// ============================================================

export const icons = {
  sizes: iconSizes,
  colors: iconColors,
  strokeWidths: iconStrokeWidths,
  families: iconFamilies,
  states: iconStates,
  animations: iconAnimations,
} as const;

export default icons;
