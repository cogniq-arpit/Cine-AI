/**
 * GlassSurface
 * 
 * The foundational atmospheric surface system for Cine AI.
 * 
 * This component creates cinematic, luxurious frosted glass surfaces
 * that feel restrained, elegant, and premium—NOT cheap glassmorphism.
 * 
 * Used for:
 * - Cinematic overlays
 * - Floating panels
 * - Modal surfaces
 * - Navigation surfaces
 * - AI composer backgrounds
 * - Content containers with depth
 * 
 * Design Philosophy:
 * - Subtle blur that enhances, not overwhelms
 * - Sophisticated color layering
 * - Depth through lighting, not just blur
 * - OLED-optimized dark tones
 * - Tactile, handcrafted feel
 */

import React, { useMemo } from 'react';
import {
  View,
  ViewStyle,
  StyleSheet,
  AccessibilityRole,
  StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import {
  colors,
  surfaces,
  opacity,
  borders,
  spacing,
  shadows,
  blur,
} from '@/design-system';

/**
 * Blur intensity levels optimized for glass surfaces
 */
export type GlassBlurIntensity = 'subtle' | 'balanced' | 'intense';

/**
 * Tint color options for glass overlays
 */
export type GlassTint = 'none' | 'dark' | 'accent' | 'secondary' | 'success' | 'warning';

/**
 * Elevation levels for stacking surfaces
 */
export type GlassElevation = 'base' | 'raised' | 'floating' | 'modal';

/**
 * Animation preset options
 */
export type GlassAnimation = 'fadeIn' | 'slideUp' | 'scaleIn' | 'none';

/**
 * Props for GlassSurface component
 */
export interface GlassSurfaceProps {
  /** Children to render inside the glass surface */
  children?: React.ReactNode;

  /** Blur intensity - controls depth perception */
  blurIntensity?: GlassBlurIntensity;

  /** Tint color overlay for semantic meaning */
  tint?: GlassTint;

  /** Elevation level for layering multiple surfaces */
  elevation?: GlassElevation;

  /** Border radius customization */
  borderRadius?: number;

  /** Padding inside the surface */
  padding?: number;

  /** Additional style overrides */
  style?: StyleProp<ViewStyle>;

  /** Animation on mount */
  animationPreset?: GlassAnimation;

  /** Whether to show a subtle border */
  showBorder?: boolean;

  /** Opacity of the entire surface (0-1) */
  opacity?: number;

  /** Accessibility label */
  accessibilityLabel?: string;

  /** Whether this is an interactive element */
  interactive?: boolean;

  /** Callback when pressed (if interactive) */
  onPress?: () => void;
}

/**
 * Map blur intensity to expo-blur intensity
 */
const getBlurAmount = (intensity: GlassBlurIntensity): number => {
  const mapping: Record<GlassBlurIntensity, number> = {
    subtle: 10,
    balanced: 20,
    intense: 40,
  };
  return mapping[intensity];
};

/**
 * Get glass surface background color based on tint
 */
const getTintColor = (tint: GlassTint): string => {
  const tintMapping: Record<GlassTint, string> = {
    none: 'rgba(12, 12, 20, 0.4)',
    dark: 'rgba(9, 9, 11, 0.6)',
    accent: `${colors.accents.amberwarm}${opacity.surface.glass}`,
    secondary: `${colors.accents.royalPurple}${opacity.surface.glass}`,
    success: `${colors.semantic.success}${opacity.surface.glass}`,
    warning: `${colors.semantic.warning}${opacity.surface.glass}`,
  };
  return tintMapping[tint];
};

/**
 * Get shadow configuration based on elevation
 */
const getShadowConfig = (elevation: GlassElevation): ViewStyle | null => {
  const shadowMapping: Record<GlassElevation, ViewStyle | null> = {
    base: null,
    raised: {
      shadowColor: colors.system.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    floating: {
      shadowColor: colors.system.black,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    modal: {
      shadowColor: colors.system.black,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 32,
      elevation: 16,
    },
  };
  return shadowMapping[elevation];
};

/**
 * GlassSurface Component
 * 
 * Creates a premium frosted glass surface with subtle depth and
 * sophisticated color layering. Optimized for OLED screens.
 */
export const GlassSurface = React.forwardRef<View, GlassSurfaceProps>(
  (
    {
      children,
      blurIntensity = 'balanced',
      tint = 'none',
      elevation = 'base',
      borderRadius = borders.componentRadii.card,
      padding = spacing.section.xs,
      style,
      animationPreset = 'fadeIn',
      showBorder = true,
      opacity: opacityValue = 1,
      accessibilityLabel,
      interactive = false,
      onPress,
    },
    ref
  ) => {
    // Animation states
    const animatedOpacity = useSharedValue(animationPreset === 'none' ? opacityValue : 0);
    const animatedScale = useSharedValue(animationPreset === 'scaleIn' ? 0.9 : 1);
    const animatedTranslateY = useSharedValue(
      animationPreset === 'slideUp' ? 16 : 0
    );

    // Trigger animations on mount
    React.useEffect(() => {
      if (animationPreset !== 'none') {
        animatedOpacity.value = withSpring(opacityValue, {
          damping: 12,
          mass: 1,
          overshootClamping: false,
        });

        if (animationPreset === 'scaleIn') {
          animatedScale.value = withSpring(1, {
            damping: 12,
            mass: 1,
          });
        }

        if (animationPreset === 'slideUp') {
          animatedTranslateY.value = withSpring(0, {
            damping: 14,
            mass: 1,
          });
        }
      }
    }, [animationPreset, opacityValue]);

    // Animated styles
    const animatedContainerStyle = useAnimatedStyle(() => ({
      opacity: animatedOpacity.value,
      transform: [
        { scale: animatedScale.value },
        { translateY: animatedTranslateY.value },
      ],
    }));

    // Memoize shadow config
    const shadowConfig = useMemo(() => getShadowConfig(elevation), [elevation]);

    // Base container style
    const containerStyle: ViewStyle = {
      borderRadius,
      overflow: 'hidden',
      ...shadowConfig,
    };

    // Glass surface style
    const glassStyle: ViewStyle = {
      flex: 1,
      padding,
      backgroundColor: getTintColor(tint),
    };

    // Border style (if enabled)
    const borderStyle: ViewStyle = showBorder
      ? {
          borderWidth: 1,
          borderColor: colors.borders.subtle,
        }
      : {};

    // Accessibility role
    const a11yRole: AccessibilityRole = interactive ? 'button' : 'none';

    return (
      <Animated.View style={[animatedContainerStyle, containerStyle, style]}>
        <BlurView intensity={getBlurAmount(blurIntensity)} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View
          ref={ref}
          style={[glassStyle, borderStyle]}
          accessible={interactive || !!accessibilityLabel}
          accessibilityRole={a11yRole}
          accessibilityLabel={accessibilityLabel}
          onTouchEnd={interactive ? onPress : undefined}
        >
          {children}
        </View>
      </Animated.View>
    );
  }
);

GlassSurface.displayName = 'GlassSurface';

/**
 * Preset configurations for common use cases
 */
export const GlassSurfacePresets = {
  /**
   * Overlay for modals - maximum depth and blur
   */
  modal: {
    blurIntensity: 'intense' as GlassBlurIntensity,
    elevation: 'modal' as GlassElevation,
    showBorder: false,
  },

  /**
   * Floating panel - subtle blur with minimal elevation
   */
  floating: {
    blurIntensity: 'balanced' as GlassBlurIntensity,
    elevation: 'floating' as GlassElevation,
    showBorder: true,
  },

  /**
   * Navigation surface - restrained blur
   */
  navigation: {
    blurIntensity: 'subtle' as GlassBlurIntensity,
    elevation: 'raised' as GlassElevation,
    showBorder: true,
  },

  /**
   * Content container - minimal blur
   */
  content: {
    blurIntensity: 'subtle' as GlassBlurIntensity,
    elevation: 'base' as GlassElevation,
    showBorder: false,
  },

  /**
   * AI composer background - balanced presence
   */
  composer: {
    blurIntensity: 'balanced' as GlassBlurIntensity,
    elevation: 'raised' as GlassElevation,
    tint: 'accent' as GlassTint,
    showBorder: true,
  },
};

/**
 * Convenience component for modal surfaces
 */
export const ModalGlassSurface = (props: Omit<GlassSurfaceProps, keyof typeof GlassSurfacePresets.modal>) => (
  <GlassSurface {...GlassSurfacePresets.modal} {...props} />
);

/**
 * Convenience component for floating panels
 */
export const FloatingGlassSurface = (props: Omit<GlassSurfaceProps, keyof typeof GlassSurfacePresets.floating>) => (
  <GlassSurface {...GlassSurfacePresets.floating} {...props} />
);

/**
 * Convenience component for navigation surfaces
 */
export const NavigationGlassSurface = (props: Omit<GlassSurfaceProps, keyof typeof GlassSurfacePresets.navigation>) => (
  <GlassSurface {...GlassSurfacePresets.navigation} {...props} />
);

export default GlassSurface;
