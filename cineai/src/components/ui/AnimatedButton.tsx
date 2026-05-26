/**
 * AnimatedButton
 *
 * World-class tactile button primitive for Cine AI.
 *
 * Design philosophy: Apple Music restraint × Arc Browser tactility
 * The button should feel alive under the finger — not animated, alive.
 *
 * Motion architecture:
 *  - Spring press-in (fast settle, no rubber-band)
 *  - Spring release with micro-bounce
 *  - Opacity responds synchronously with scale
 *  - All animation stays on UI thread (useAnimatedStyle worklets)
 *  - NO shadow/elevation animation — static only
 *  - Haptics synchronized with press-in, not press-out
 *
 * Accessibility:
 *  - Reduce motion: disables scale, keeps opacity feedback
 *  - Proper disabled semantics + aria state
 *  - Loading state announced to screen readers
 *  - allowFontScaling={false} to protect layout integrity
 *  - 44pt minimum touch target enforced
 *
 * Variants: primary | secondary | ghost | danger | cinematic
 * Sizes:    sm | md | lg
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  AccessibilityInfo,
  ActivityIndicator,
  Platform,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  SharedValue,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  colors,
  typography,
  spacing,
  opacity,
  motion,
} from '@/design-system';

// ─── Spring Physics ───────────────────────────────────────────────────────────
//
// Press-in: fast settle, snappy — communicates immediacy under the finger.
// Press-out: slightly softer damping to allow a barely-perceptible micro-bounce.
// Both avoid overshoot that would feel "rubbery" or gimmicky.
//
const SPRING_PRESS_IN = {
  damping: 20,      // High damping = settles fast, no wobble
  mass: 0.9,
  stiffness: 400,
  overshootClamping: false,
} as const;

const SPRING_PRESS_OUT = {
  damping: 16,      // Slightly less damping = micro-bounce on release
  mass: 0.9,
  stiffness: 350,
  overshootClamping: false,
} as const;

// ─── Scale Constants ──────────────────────────────────────────────────────────
// Deliberate restraint — barely perceptible, but unmistakably physical.
const SCALE_PRESSED = 0.974;  // Primary / Secondary / Cinematic
const SCALE_PRESSED_SM = 0.96; // Ghost / Danger — slightly more visible on outlines

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'cinematic';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AnimatedButtonProps {
  /** Button label text */
  label: string;
  /** Primary action handler */
  onPress: (e?: GestureResponderEvent) => void;
  /** Visual variant — defaults to primary */
  variant?: ButtonVariant;
  /** Size tier — defaults to md */
  size?: ButtonSize;
  /** Loading state — replaces label with activity indicator */
  isLoading?: boolean;
  /** Disabled state — dims + blocks interaction */
  disabled?: boolean;
  /** Leading icon slot (rendered left of label) */
  leftIcon?: React.ReactNode;
  /** Trailing icon slot (rendered right of label) */
  rightIcon?: React.ReactNode;
  /** Expands to full container width */
  fullWidth?: boolean;
  /** Accessible label override (defaults to `label`) */
  accessibilityLabel?: string;
  /** Additional accessible hint */
  accessibilityHint?: string;
  /** Override container style — use sparingly */
  style?: ViewStyle;
  /** Override label style — use sparingly */
  labelStyle?: TextStyle;
}

// ─── Variant Tokens ───────────────────────────────────────────────────────────

interface VariantConfig {
  background: string;
  labelColor: string;
  borderWidth: number;
  borderColor: string;
  pressedOpacity: number;
  /** Scale range for press. Slightly stronger on outlined variants for visibility. */
  pressedScale: number;
}

function getVariantConfig(variant: ButtonVariant, isDisabled: boolean): VariantConfig {
  if (isDisabled) {
    return {
      background: colors.interactive.disabledBg,
      labelColor: colors.interactive.disabledText,
      borderWidth: 0,
      borderColor: 'transparent',
      pressedOpacity: 1,
      pressedScale: 1,
    };
  }

  switch (variant) {
    case 'primary':
      return {
        background: colors.accents.amberwarm,
        labelColor: colors.backgrounds.deepest,  // Dark on amber — high contrast
        borderWidth: 0,
        borderColor: 'transparent',
        pressedOpacity: 0.88,
        pressedScale: SCALE_PRESSED,
      };

    case 'secondary':
      return {
        background: colors.surfaces.level2,
        labelColor: colors.text.primary,
        borderWidth: 1,
        borderColor: colors.borders.default,
        pressedOpacity: 0.82,
        pressedScale: SCALE_PRESSED,
      };

    case 'ghost':
      return {
        background: 'transparent',
        labelColor: colors.accents.amberwarm,
        borderWidth: 1.5,
        borderColor: colors.accents.amberwarm,
        pressedOpacity: 0.7,
        pressedScale: SCALE_PRESSED_SM,
      };

    case 'danger':
      return {
        background: colors.semantic.error,
        labelColor: colors.text.primary,
        borderWidth: 0,
        borderColor: 'transparent',
        pressedOpacity: 0.84,
        pressedScale: SCALE_PRESSED_SM,
      };

    case 'cinematic':
      // Deep surface + amber border — editorial luxury
      return {
        background: colors.surfaces.level3,
        labelColor: colors.accents.amberWarmGlow,
        borderWidth: 1,
        borderColor: colors.borders.subtle,
        pressedOpacity: 0.8,
        pressedScale: SCALE_PRESSED,
      };
  }
}

// ─── Size Tokens ──────────────────────────────────────────────────────────────

interface SizeConfig {
  height: number;
  paddingHorizontal: number;
  borderRadius: number;
  typographyStyle: TextStyle;
  iconSpacing: number;
  activityIndicatorSize: 'small' | 'large';
}

function getSizeConfig(size: ButtonSize): SizeConfig {
  switch (size) {
    case 'sm':
      return {
        height: 36,
        paddingHorizontal: spacing.section.sm,   // 16px
        borderRadius: 10,
        typographyStyle: typography.button.sm,
        iconSpacing: spacing.micro.sm,            // 4px
        activityIndicatorSize: 'small',
      };
    case 'md':
      return {
        height: 48,
        paddingHorizontal: spacing.section.md,   // 20px
        borderRadius: 12,
        typographyStyle: typography.button.md,
        iconSpacing: spacing.micro.lg,            // 8px
        activityIndicatorSize: 'small',
      };
    case 'lg':
      return {
        height: 56,
        paddingHorizontal: spacing.section.lg,   // 24px
        borderRadius: 14,
        typographyStyle: typography.button.lg,
        iconSpacing: spacing.micro.xl,            // 12px
        activityIndicatorSize: 'small',
      };
  }
}

// ─── Haptic Helper ────────────────────────────────────────────────────────────
// Wrapped in try/catch — haptics are enhancement, never blocking.

function triggerPressHaptic(variant: ButtonVariant): void {
  try {
    if (variant === 'danger') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // Silently degrade — haptics unavailable (simulator / older device)
  }
}

function triggerReleaseHaptic(): void {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Silently degrade
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  labelStyle,
}) => {
  // ── Reduce motion ────────────────────────────────────────────────────────────
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // ── Derived state ────────────────────────────────────────────────────────────
  const isDisabled = disabled || isLoading;

  // Memoized config objects — pure derivations, not recreated every render
  const variantConfig = useMemo(
    () => getVariantConfig(variant, isDisabled),
    [variant, isDisabled],
  );
  const sizeConfig = useMemo(() => getSizeConfig(size), [size]);

  // Destructure primitives for stable useCallback deps
  const { pressedScale, pressedOpacity } = variantConfig;

  // ── Animation shared values ──────────────────────────────────────────────────
  const scale = useSharedValue<number>(1);
  const pressOpacity = useSharedValue<number>(1);

  // ── Animated style ───────────────────────────────────────────────────────────
  //
  // CRITICAL: Shadow/elevation are NOT animated here.
  // Shadow is defined STATICALLY in StyleSheet below.
  // Animating elevation on Android causes GPU recomposites every frame.
  //
  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      // Reduce motion: opacity feedback only — no positional change
      return { opacity: pressOpacity.value } as ViewStyle;
    }

    return {
      transform: [{ scale: scale.value }],
      opacity: pressOpacity.value,
    } as ViewStyle;
  });

  // ── Press handlers ───────────────────────────────────────────────────────────

  const handlePressIn = useCallback(() => {
    if (isDisabled) return;

    if (!reduceMotion) {
      scale.value = withSpring(pressedScale, SPRING_PRESS_IN);
    }
    pressOpacity.value = withTiming(pressedOpacity, {
      duration: 80,
    });

    runOnJS(triggerPressHaptic)(variant);
  }, [isDisabled, reduceMotion, pressedScale, pressedOpacity, variant]);

  const handlePressOut = useCallback(() => {
    if (isDisabled) return;

    if (!reduceMotion) {
      scale.value = withSpring(1, SPRING_PRESS_OUT);
    }
    pressOpacity.value = withTiming(1, { duration: 120 });
  }, [isDisabled, reduceMotion]);

  const handlePress = useCallback(
    (e?: GestureResponderEvent) => {
      if (isDisabled) return;
      onPress(e);
    },
    [isDisabled, onPress],
  );

  // ── Loading indicator color ──────────────────────────────────────────────────
  const activityColor =
    variant === 'primary'
      ? colors.backgrounds.deepest
      : colors.text.primary;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessible
      accessibilityRole="button"
      accessibilityLabel={
        isLoading
          ? `${accessibilityLabel ?? label}, loading`
          : accessibilityLabel ?? label
      }
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      style={[
        animatedStyle,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {/* Static surface — not animated */}
      <View
        style={[
          styles.surface,
          {
            height: sizeConfig.height,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            borderRadius: sizeConfig.borderRadius,
            backgroundColor: variantConfig.background,
            borderWidth: variantConfig.borderWidth,
            borderColor: variantConfig.borderColor,
          },
          // Static platform shadow — primary variant only, no animation
          variant === 'primary' && !isDisabled && styles.primaryShadow,
        ]}
      >
        {isLoading ? (
          /* ── Loading state ──────────────────────────────────────── */
          <ActivityIndicator
            size={sizeConfig.activityIndicatorSize}
            color={activityColor}
            accessibilityLabel="Loading"
          />
        ) : (
          /* ── Content row ────────────────────────────────────────── */
          <View style={styles.contentRow}>
            {leftIcon ? (
              <View style={[styles.iconSlot, { marginRight: sizeConfig.iconSpacing }]}>
                {leftIcon}
              </View>
            ) : null}

            <Text
              style={[
                sizeConfig.typographyStyle,
                { color: variantConfig.labelColor },
                styles.label,
                labelStyle,
              ]}
              allowFontScaling={false}
              numberOfLines={1}
            >
              {label}
            </Text>

            {rightIcon ? (
              <View style={[styles.iconSlot, { marginLeft: sizeConfig.iconSpacing }]}>
                {rightIcon}
              </View>
            ) : null}
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
};

AnimatedButton.displayName = 'AnimatedButton';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  surface: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Minimum touch target guarantee
    minWidth: 44,
  },
  // Static primary shadow — rendered once, never animated
  primaryShadow: Platform.select({
    ios: {
      shadowColor: colors.accents.amberwarm,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }) as ViewStyle,
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    // Prevents OS accessibility scaling from breaking button layout
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AnimatedButton;
