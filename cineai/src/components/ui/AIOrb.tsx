/**
 * AIOrb
 * 
 * The soul and heart of Cine AI.
 * 
 * This component represents the AI's presence and emotional state.
 * It must feel alive, intelligent, premium, and restrained—never gimmicky.
 * 
 * Design Philosophy:
 * - Ambient and breathing (idle state)
 * - Emotionally aware (responds to context)
 * - Premium animation (spring physics)
 * - Tactile feedback integration
 * - Minimal visual noise (restrained)
 * - OLED-optimized glow
 * - Handcrafted presence
 * 
 * States:
 * - idle: Subtle breathing, ambient presence
 * - listening: Audio-reactive responsiveness
 * - thinking: Contemplative animation
 * - success: Confirmation pulse
 * - error: Alert state
 */

import React, { useEffect } from 'react';
import {
  View,
  ViewStyle,
  StyleSheet,
  AccessibilityRole,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSpring,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Colors } from '../../constants/theme';

/**
 * AI states for emotional representation
 */
export type AIState = 'idle' | 'listening' | 'thinking' | 'success' | 'error';

/**
 * Props for AIOrb component
 */
export interface AIOrbProps {
  /** Current state of the AI */
  state?: AIState;

  /** Size of the orb (diameter in pixels) */
  size?: number;

  /** Whether the orb is active/visible */
  active?: boolean;

  /** Callback when animation completes (for success/error) */
  onAnimationComplete?: (state: AIState) => void;

  /** Custom style overrides */
  style?: ViewStyle;

  /** Accessibility label */
  accessibilityLabel?: string;

  /** Whether this is interactive */
  interactive?: boolean;

  /** Callback on press */
  onPress?: () => void;
}

/**
 * AIOrb animation speeds (milliseconds)
 */
const ANIMATION_SPEEDS = {
  breathe: 3200, // Slow, meditative breathing
  listen: 400, // Responsive audio reactivity
  think: 2400, // Contemplative thinking
  success: 1200, // Celebratory confirmation
  error: 800, // Alert responsiveness
};

/**
 * AIOrb Component
 * 
 * Premium animated orb representing the AI's presence.
 * Communicates state through restrained, physically believable motion.
 */
export const AIOrb = React.forwardRef<View, AIOrbProps>(
  (
    {
      state = 'idle',
      size = 72,
      active = true,
      onAnimationComplete,
      style,
      accessibilityLabel = 'AI Assistant',
      interactive = false,
      onPress,
    },
    ref
  ) => {
    // Animation shared values
    const breatheScale = useSharedValue(1);
    const glowScale = useSharedValue(0.8);
    const glowOpacity = useSharedValue(0.3);
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0);
    const listenBars = useSharedValue([
      { scale: 0.3 },
      { scale: 0.5 },
      { scale: 0.7 },
      { scale: 0.5 },
      { scale: 0.3 },
    ]);
    const thinkRotation = useSharedValue(0);
    const errorShake = useSharedValue(0);

    /**
     * Initialize animations based on state
     */
    useEffect(() => {
      if (!active) {
        breatheScale.value = 1;
        glowOpacity.value = 0;
        return;
      }

      switch (state) {
        case 'idle':
          startIdleAnimation();
          break;
        case 'listening':
          startListeningAnimation();
          break;
        case 'thinking':
          startThinkingAnimation();
          break;
        case 'success':
          startSuccessAnimation();
          break;
        case 'error':
          startErrorAnimation();
          break;
      }

      return () => {
        // Cleanup
        breatheScale.value = 1;
        glowOpacity.value = 0;
      };
    }, [state, active]);

    /**
     * Idle state: Subtle breathing animation
     * Communicates peaceful, ambient presence
     */
    const startIdleAnimation = () => {
      // Breathing cycle: expand → contract → repeat
      breatheScale.value = withRepeat(
        withSpring(1.15, {
          damping: 10,
          mass: 1,
          overshootClamping: false,
        }),
        -1,
        true
      );

      // Glow pulses gently
      glowOpacity.value = withRepeat(
        withTiming(0.5, {
          duration: ANIMATION_SPEEDS.breathe,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );

      glowScale.value = withRepeat(
        withTiming(1.4, {
          duration: ANIMATION_SPEEDS.breathe,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    };

    /**
     * Listening state: Audio-reactive responsiveness
     * Communicates active engagement
     */
    const startListeningAnimation = () => {
      // Pulsing presence
      breatheScale.value = withRepeat(
        withSpring(1.08, {
          damping: 8,
          mass: 0.8,
        }),
        -1,
        true
      );

      // Energetic glow
      glowOpacity.value = withRepeat(
        withTiming(0.8, {
          duration: ANIMATION_SPEEDS.listen,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      );

      glowScale.value = withRepeat(
        withTiming(1.6, {
          duration: ANIMATION_SPEEDS.listen,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      );
    };

    /**
     * Thinking state: Contemplative animation
     * Communicates processing and consideration
     */
    const startThinkingAnimation = () => {
      // Gentle subtle breathing
      breatheScale.value = withRepeat(
        withSpring(1.05, {
          damping: 12,
          mass: 1,
          overshootClamping: true,
        }),
        -1,
        true
      );

      // Slow rotation
      thinkRotation.value = withRepeat(
        withTiming(360, {
          duration: ANIMATION_SPEEDS.think,
          easing: Easing.linear,
        }),
        -1
      );

      // Thoughtful glow
      glowOpacity.value = withRepeat(
        withTiming(0.6, {
          duration: ANIMATION_SPEEDS.think / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    };

    /**
     * Success state: Confirmation pulse
     * Communicates achievement and satisfaction
     */
    const startSuccessAnimation = () => {
      // Strong expansion pulse
      pulseScale.value = withSpring(1.4, {
        damping: 6,
        mass: 1.2,
        overshootClamping: true,
      });

      pulseOpacity.value = withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      });

      // Brief glow spike
      glowOpacity.value = 1;
      glowScale.value = 1.8;

      glowOpacity.value = withTiming(0.3, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      });

      // Settle back
      setTimeout(() => {
        breatheScale.value = withSpring(1, {
          damping: 10,
          mass: 1,
        });
        onAnimationComplete?.('success');
      }, 800);
    };

    /**
     * Error state: Alert animation
     * Communicates issues or problems
     */
    const startErrorAnimation = () => {
      // Urgent shake
      errorShake.value = withRepeat(
        withTiming(10, {
          duration: 100,
          easing: Easing.in(Easing.ease),
        }),
        6,
        true
      );

      // Red glow
      glowOpacity.value = 0.8;
      glowScale.value = 1.6;

      // Fade out alert
      setTimeout(() => {
        glowOpacity.value = withTiming(0.3, {
          duration: 500,
          easing: Easing.out(Easing.ease),
        });
        onAnimationComplete?.('error');
      }, 800);
    };

    /**
     * Main orb animated style
     */
    const orbAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: breatheScale.value },
        { rotateZ: `${thinkRotation.value}deg` },
        { translateX: errorShake.value },
      ],
    }));

    /**
     * Glow layer animated style
     */
    const glowAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: glowScale.value }],
      opacity: glowOpacity.value,
    }));

    /**
     * Pulse wave animated style (for success)
     */
    const pulseAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
    }));

    // Calculate radius
    const radius = size / 2;
    const coreSize = size * 0.6; // Core is 60% of total size
    const glowSize = size * 1.6; // Glow expands beyond orb

    return (
      <View
        ref={ref}
        accessible={interactive || !!accessibilityLabel}
        accessibilityRole={interactive ? 'button' : 'none'}
        accessibilityLabel={accessibilityLabel}
        style={[
          {
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
        onTouchEnd={interactive ? onPress : undefined}
      >
        {/* Background glow layer - always present */}
        <Animated.View
          style={[
            glowAnimatedStyle,
            {
              width: glowSize,
              height: glowSize,
              borderRadius: glowSize / 2,
              position: 'absolute',
              backgroundColor: Colors.accent.crimsonGlow,
            },
          ]}
        />

        {/* Pulse wave layer - for success state */}
        {state === 'success' && (
          <Animated.View
            style={[
              pulseAnimatedStyle,
              {
                width: size * 1.3,
                height: size * 1.3,
                borderRadius: size * 0.65,
                position: 'absolute',
                backgroundColor: Colors.semantic.successMuted,
              },
            ]}
          />
        )}

        {/* Main orb - premium gradient core */}
        <Animated.View
          style={[
            orbAnimatedStyle,
            {
              width: coreSize,
              height: coreSize,
              borderRadius: coreSize / 2,
              backgroundColor: Colors.accent.crimson,
              shadowColor: Colors.accent.crimsonGlow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          {/* Inner highlight for depth */}
          <View
            style={{
              position: 'absolute',
              width: coreSize * 0.35,
              height: coreSize * 0.35,
              borderRadius: coreSize * 0.175,
              backgroundColor: Colors.accent.crimsonLight,
              top: coreSize * 0.15,
              left: coreSize * 0.15,
              opacity: 0.4,
            }}
          />
        </Animated.View>

        {/* Listening state indicator bars */}
        {state === 'listening' && (
          <View
            style={{
              position: 'absolute',
              width: size * 0.8,
              height: size * 0.8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              gap: size * 0.08,
            }}
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <ListeningBar key={index} index={index} size={size} />
            ))}
          </View>
        )}
      </View>
    );
  }
);

AIOrb.displayName = 'AIOrb';

/**
 * Listening state indicator bar component
 */
const ListeningBar: React.FC<{ index: number; size: number }> = ({
  index,
  size,
}) => {
  const barScale = useSharedValue(0.3);
  const barWidth = size * 0.12;
  const barMaxHeight = size * 0.45;

  useEffect(() => {
    // Staggered animation for each bar
    const delay = index * 80;
    const duration = 400;

    const animate = () => {
      barScale.value = withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      );
    };

    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(
      barScale.value,
      [0.3, 1],
      [barMaxHeight * 0.2, barMaxHeight],
      Extrapolate.CLAMP
    ),
  }));

  return (
    <Animated.View
      style={[
        barAnimatedStyle,
        {
          width: barWidth,
          backgroundColor: Colors.accent.crimson,
          borderRadius: barWidth / 2,
          shadowColor: Colors.accent.crimsonGlow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
          elevation: 4,
        },
      ]}
    />
  );
};

/**
 * Preset configurations for common use cases
 */
export const AIOrbPresets = {
  /**
   * Compact size for headers and inline use
   */
  compact: { size: 48 },

  /**
   * Standard size for main screens
   */
  standard: { size: 72 },

  /**
   * Large size for hero and feature sections
   */
  large: { size: 96 },

  /**
   * Extra large for immersive experiences
   */
  xlarge: { size: 128 },
};

export default AIOrb;
