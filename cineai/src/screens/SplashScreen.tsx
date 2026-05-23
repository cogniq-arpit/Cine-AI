import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const taglineOpacity = useSharedValue(0);
  const shimmerX = useSharedValue(-width);
  const screenOpacity = useSharedValue(1);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  useEffect(() => {
    // Logo reveal animation
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    logoScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 200 }));

    // Tagline fade in
    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));

    // Shimmer effect on logo
    shimmerX.value = withDelay(500, withTiming(width * 2, { duration: 800 }));

    // Fade out and finish
    screenOpacity.value = withDelay(
      2200,
      withTiming(0, { duration: 600 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      })
    );
  }, []);

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <LinearGradient
        colors={[Colors.background, '#0F0F1A', '#14141F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow */}
      <View style={styles.glowContainer}>
        <View style={styles.glowRed} />
        <View style={styles.glowIndigo} />
      </View>

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoIcon}
          contentFit="contain"
        />
        <View style={styles.logoBox}>
          {/* Shimmer overlay */}
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
          <Text style={styles.logoC}>C</Text>
          <Text style={styles.logoRest}>INE</Text>
        </View>
        <View style={styles.logoAIBadge}>
          <Text style={styles.logoAIText}>AI</Text>
        </View>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineContainer, taglineStyle]}>
        <Text style={styles.tagline}>Your Personal AI Movie Companion</Text>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRed: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(230, 57, 70, 0.08)',
    transform: [{ translateX: -80 }],
  },
  glowIndigo: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    transform: [{ translateX: 80 }, { translateY: 40 }],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  logoIcon: {
    width: 110,
    height: 110,
    borderRadius: 24,
    marginBottom: Spacing.md,
  },
  logoBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ skewX: '-20deg' }],
    zIndex: 10,
  },
  logoC: {
    fontSize: 72,
    fontFamily: 'Poppins_700Bold',
    color: Colors.primary,
    letterSpacing: -2,
    lineHeight: 80,
  },
  logoRest: {
    fontSize: 72,
    fontFamily: 'Poppins_700Bold',
    color: Colors.textPrimary,
    letterSpacing: -2,
    lineHeight: 80,
  },
  logoAIBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: 100,
    marginTop: -Spacing.xs,
    alignSelf: 'flex-end',
    marginLeft: Spacing.sm,
  },
  logoAIText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  taglineContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 80,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 20,
    borderRadius: 3,
  },
});

export default SplashScreen;
