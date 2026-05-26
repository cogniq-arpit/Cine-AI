/**
 * CineAI V3 — SplashScreen
 * Premium animated logo intro with cinematic startup experience.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Motion } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

const { width: W, height: H } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { loadSession } = useAuthStore();

  // Animation values
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(16);
  const glowOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  // Particle values
  const p1Opacity = useSharedValue(0);
  const p2Opacity = useSharedValue(0);
  const p3Opacity = useSharedValue(0);
  const p1Scale = useSharedValue(0);
  const p2Scale = useSharedValue(0);
  const p3Scale = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const p1Style = useAnimatedStyle(() => ({
    opacity: p1Opacity.value,
    transform: [{ scale: p1Scale.value }],
  }));
  const p2Style = useAnimatedStyle(() => ({
    opacity: p2Opacity.value,
    transform: [{ scale: p2Scale.value }],
  }));
  const p3Style = useAnimatedStyle(() => ({
    opacity: p3Opacity.value,
    transform: [{ scale: p3Scale.value }],
  }));

  useEffect(() => {
    const doLoad = async () => {
      await loadSession();
    };
    doLoad();

    // Logo entrance
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, Motion.springs.hero);

    // Glow burst
    glowOpacity.value = withDelay(400, withSequence(
      withTiming(0.8, { duration: 400 }),
      withTiming(0.3, { duration: 600 })
    ));

    // Particles burst
    p1Opacity.value = withDelay(350, withSequence(withTiming(0.6, { duration: 200 }), withTiming(0, { duration: 800 })));
    p1Scale.value = withDelay(350, withTiming(2.5, { duration: 1000, easing: Easing.out(Easing.quad) }));

    p2Opacity.value = withDelay(420, withSequence(withTiming(0.5, { duration: 200 }), withTiming(0, { duration: 700 })));
    p2Scale.value = withDelay(420, withTiming(2, { duration: 900, easing: Easing.out(Easing.quad) }));

    p3Opacity.value = withDelay(480, withSequence(withTiming(0.4, { duration: 200 }), withTiming(0, { duration: 600 })));
    p3Scale.value = withDelay(480, withTiming(1.8, { duration: 800, easing: Easing.out(Easing.quad) }));

    // Tagline
    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    taglineY.value = withDelay(700, withSpring(0, Motion.springs.gentle));

    // Exit
    const dismiss = () => {
      screenOpacity.value = withDelay(2200, withTiming(0, { duration: 500 }, () => {
        if (onFinish) runOnJS(onFinish)();
      }));
    };
    dismiss();
  }, []);

  return (
    <Animated.View style={[styles.root, screenStyle]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.void} />

      {/* Deep void background */}
      <View style={StyleSheet.absoluteFill} />

      {/* Ambient gradient */}
      <LinearGradient
        colors={['rgba(230,57,70,0.08)', 'rgba(108,99,255,0.06)', 'rgba(7,7,9,0)']}
        locations={[0, 0.5, 1]}
        style={styles.ambientGradient}
      />

      {/* Particle rings */}
      <Animated.View style={[styles.particle, styles.particle1, p1Style]} />
      <Animated.View style={[styles.particle, styles.particle2, p2Style]} />
      <Animated.View style={[styles.particle, styles.particle3, p3Style]} />

      {/* Glow halo */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* Logo group */}
      <Animated.View style={[styles.logoGroup, logoStyle]}>
        {/* CineAI wordmark */}
        <View style={styles.wordmarkRow}>
          <Animated.Text style={styles.wordmarkCine}>CINE</Animated.Text>
          <View style={styles.aiPill}>
            <Animated.Text style={styles.wordmarkAI}>AI</Animated.Text>
          </View>
        </View>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Your AI Cinema Companion
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.void,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.accent.crimsonGlow,
  },
  particle: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.accent.crimson,
  },
  particle1: {
    width: 100,
    height: 100,
  },
  particle2: {
    width: 80,
    height: 80,
    borderColor: Colors.accent.electric,
  },
  particle3: {
    width: 60,
    height: 60,
    borderColor: Colors.accent.gold,
  },
  logoGroup: {
    alignItems: 'center',
    gap: 0,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmarkCine: {
    fontSize: 44,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
    letterSpacing: 4,
  },
  aiPill: {
    backgroundColor: Colors.accent.crimson,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: Colors.accent.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  wordmarkAI: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.onAccent,
    letterSpacing: 2,
  },
  tagline: {
    position: 'absolute',
    bottom: H * 0.18,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.tertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default SplashScreen;
