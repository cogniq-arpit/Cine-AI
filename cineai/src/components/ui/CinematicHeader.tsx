/**
 * CinematicHeader
 *
 * Premium screen header with cinematic composition, subtle motion,
 * and integration with the design system. Designed to be used as a
 * reusable screen header across Cine AI.
 *
 * Production refinements applied:
 *  - Back Pressable disabled + dimmed when no handler is provided
 *  - `gap` replaced with marginLeft for RN < 0.71 safety
 *  - Animated shadow/elevation removed; only transform + opacity animated
 *  - Explicit SharedValue<number> typing on collapseProgress
 *  - accessibilityRole="header" on outer container
 *  - accessibilityLabel derived from title
 *  - allowFontScaling={false} on display text
 *  - Scale collapse eased from 0.94 → 0.97 (calmer cinematic pacing)
 *  - Reduce-motion: collapses to opacity-only fade when user prefers reduced motion
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ViewStyle,
  StyleSheet,
  AccessibilityInfo,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  SharedValue,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassSurface } from './GlassSurface';
import { AIOrb } from './AIOrb';
import {
  colors,
  spacing,
  typography,
  opacity,
} from '@/design-system';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CinematicHeaderProps {
  /** Primary screen title */
  title?: string;
  /** Optional editorial subtitle — fades on collapse */
  subtitle?: string;
  /** Show AI Orb in right slot */
  showAI?: boolean;
  /** When absent, back button is rendered disabled + dimmed */
  onBack?: (e?: GestureResponderEvent) => void;
  /** Custom right-side accessory (overrides AI orb) */
  rightAccessory?: React.ReactNode;
  /**
   * External collapse progress shared value.
   * 0 = fully expanded, 1 = fully collapsed.
   * Explicit typing prevents runtime SharedValue type confusion.
   */
  collapseProgress?: SharedValue<number>;
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CinematicHeader: React.FC<CinematicHeaderProps> = ({
  title = '',
  subtitle,
  showAI = false,
  onBack,
  rightAccessory,
  collapseProgress,
  style,
}) => {
  // Respect user's "reduce motion" system preference
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Query current preference
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    // Listen for preference changes
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);

  // Internal fallback when no external progress is supplied
  const defaultProgress = useSharedValue<number>(0);
  const progress: SharedValue<number> = collapseProgress ?? defaultProgress;

  // ── Animated styles ─────────────────────────────────────────────────────────

  /**
   * Container: only translateY + opacity are animated.
   * Shadow/elevation are STATIC — no animated elevation mutations,
   * which cause expensive GPU recomposites on Android.
   */
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const p = progress.value;

    if (reduceMotion) {
      // Reduce-motion: simple opacity fade only, no positional shift
      return {
        opacity: interpolate(p, [0, 1], [1, 0.85], Extrapolate.CLAMP),
      } as ViewStyle;
    }

    return {
      transform: [
        {
          translateY: interpolate(p, [0, 1], [0, -10], Extrapolate.CLAMP),
        },
      ],
      // Opacity of the entire container subtly dims when collapsed
      opacity: interpolate(p, [0, 1], [1, 0.9], Extrapolate.CLAMP),
    } as ViewStyle;
  });

  /**
   * Title block: scale + translateY. Scale collapsed to 0.97 (calmer).
   * Previous value 0.94 felt jarring on OLED screens; 0.97 is barely
   * perceptible but still communicates hierarchy.
   */
  const titleAnimatedStyle = useAnimatedStyle(() => {
    const p = progress.value;

    if (reduceMotion) {
      return {} as ViewStyle;
    }

    return {
      transform: [
        { scale: interpolate(p, [0, 1], [1, 0.97], Extrapolate.CLAMP) },
        {
          translateY: interpolate(p, [0, 1], [0, -4], Extrapolate.CLAMP),
        },
      ],
    } as ViewStyle;
  });

  /** Subtitle fades out early in the collapse range */
  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? 1
      : interpolate(progress.value, [0, 0.6, 1], [1, 0.3, 0], Extrapolate.CLAMP),
  }));

  // ── Back button helpers ──────────────────────────────────────────────────────
  const hasBack = typeof onBack === 'function';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={[styles.container, containerAnimatedStyle, style]}
      // Marks this region as a navigation header for screen readers
      accessibilityRole="header"
      accessibilityLabel={title ? `${title} screen header` : 'Screen header'}
    >
      <GlassSurface
        blurIntensity="subtle"
        elevation="raised"
        borderRadius={0}
        padding={spacing.micro.lg}
        tint="none"
        showBorder={false}
        style={styles.glassWrapper}
      >
        <View style={styles.row}>
          {/* ── Back button ──────────────────────────────────────── */}
          <Pressable
            onPress={hasBack ? onBack : undefined}
            disabled={!hasBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint={hasBack ? 'Navigates to the previous screen' : undefined}
            accessibilityState={{ disabled: !hasBack }}
            style={[styles.backButton, !hasBack && styles.backButtonDisabled]}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={hasBack ? colors.text.primary : colors.text.primary}
              style={!hasBack ? styles.backIconDisabled : undefined}
            />
          </Pressable>

          {/* ── Title block ──────────────────────────────────────── */}
          <View style={styles.titleBlock}>
            <Animated.View style={titleAnimatedStyle}>
              <Text
                style={[typography.heading.md, styles.title]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {title}
              </Text>
            </Animated.View>

            {subtitle ? (
              <Animated.Text
                style={[typography.metadata.sm, styles.subtitle, subtitleAnimatedStyle]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {subtitle}
              </Animated.Text>
            ) : null}
          </View>

          {/* ── Right accessory / AI Orb ─────────────────────────── */}
          <View style={styles.rightBlock}>
            {rightAccessory ?? null}
            {showAI && !rightAccessory ? (
              <AIOrb state="idle" size={44} />
            ) : null}
          </View>
        </View>
      </GlassSurface>
    </Animated.View>
  );
};

CinematicHeader.displayName = 'CinematicHeader';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    // Static shadow — not animated, prevents GPU recomposites
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  glassWrapper: {
    width: '100%',
    borderRadius: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Back button — margin replaces `gap` for RN compatibility
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.micro.lg, // 8px — replaces gap
  },
  backButtonDisabled: {
    opacity: opacity.interactive.disabled,
  },
  backIconDisabled: {
    opacity: 0, // Icon invisible; button still occupies layout space for alignment
  },

  // Title block
  titleBlock: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: spacing.micro.xl, // 12px
  },
  title: {
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Right block — marginLeft on children replaces `gap`
  rightBlock: {
    width: 72,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

export default CinematicHeader;
