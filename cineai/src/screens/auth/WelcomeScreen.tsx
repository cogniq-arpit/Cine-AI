import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';

const { width, height } = Dimensions.get('window');

type WelcomeNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

// Cinematic hero poster images
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1280&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1280&auto=format&fit=crop',
];

// Floating poster card data
const FLOATING_POSTERS = [
  { uri: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00ODYzLTk4ODgtOWMzODg0YjdlYmRmXkFtZTcwMTI5OTM0Mw@@._V1_SX300.jpg', x: -30, y: 60, rotation: -8, delay: 0 },
  { uri: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg', x: width - 110, y: 90, rotation: 7, delay: 150 },
  { uri: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5OTRlYWYyXkFtZTgwMDUwMDI0MjE@._V1_SX300.jpg', x: -20, y: height * 0.35, rotation: 5, delay: 300 },
  { uri: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg', x: width - 100, y: height * 0.28, rotation: -6, delay: 200 },
];

interface FloatingPosterProps {
  uri: string;
  x: number;
  y: number;
  rotation: number;
  delay: number;
}

const FloatingPoster: React.FC<FloatingPosterProps> = ({ uri, x, y, rotation, delay }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const floatY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay + 600, withTiming(1, { duration: 800 }));
    translateY.value = withDelay(delay + 600, withSpring(0, { damping: 14 }));
    floatY.value = withDelay(delay + 1400, withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000 + delay * 0.5 }),
        withTiming(8, { duration: 2000 + delay * 0.5 }),
      ),
      -1,
      true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value + floatY.value },
      { rotate: `${rotation}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        left: x,
        top: y,
        width: 80,
        height: 120,
        borderRadius: Radius.md,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
      }, style]}
    >
      <Image source={{ uri }} style={{ flex: 1 }} contentFit="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)']}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

// Particle dot component
interface ParticleDotProps {
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}

const ParticleDot: React.FC<ParticleDotProps> = ({ x, y, size, delay, color }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1500 }),
        withTiming(0.1, { duration: 1500 }),
      ),
      -1,
      true
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000 }),
        withTiming(0.4, { duration: 2000 }),
      ),
      -1,
      true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }, style]}
    />
  );
};

const PARTICLES = [
  { x: 40, y: height * 0.15, size: 4, delay: 0, color: 'rgba(230,57,70,0.6)' },
  { x: width * 0.6, y: 80, size: 3, delay: 400, color: 'rgba(108,99,255,0.5)' },
  { x: width * 0.8, y: height * 0.5, size: 5, delay: 200, color: 'rgba(230,57,70,0.4)' },
  { x: 80, y: height * 0.6, size: 3, delay: 600, color: 'rgba(108,99,255,0.6)' },
  { x: width * 0.45, y: height * 0.2, size: 4, delay: 100, color: 'rgba(212,175,55,0.4)' },
  { x: width * 0.3, y: height * 0.75, size: 3, delay: 800, color: 'rgba(230,57,70,0.5)' },
  { x: width * 0.9, y: height * 0.7, size: 4, delay: 300, color: 'rgba(108,99,255,0.4)' },
];

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeNavigationProp>();
  const [currentImage, setCurrentImage] = React.useState(0);

  const heroOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(40);
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const glowPulse = useSharedValue(0.3);

  const heroStyle = useAnimatedStyle(() => ({ opacity: heroOpacity.value }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 1000 });
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    logoScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 150 }));
    contentOpacity.value = withDelay(600, withTiming(1, { duration: 700 }));
    contentY.value = withDelay(600, withSpring(0, { damping: 15 }));
    glowPulse.value = withDelay(1000, withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2500 }),
        withTiming(0.25, { duration: 2500 }),
      ),
      -1, true
    ));

    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGuestLogin = () => {
    useAuthStore.getState().signInAsGuest();
  };

  return (
    <View style={styles.container}>
      {/* Cinematic Hero Background */}
      <Animated.View style={[StyleSheet.absoluteFill, heroStyle]}>
        <Image
          source={{ uri: HERO_IMAGES[currentImage] }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={1200}
        />
      </Animated.View>

      {/* Multi-layer gradient overlay — cinematic depth */}
      <LinearGradient
        colors={['rgba(10,10,15,0.2)', 'rgba(10,10,15,0.5)', 'rgba(10,10,15,0.85)', Colors.background]}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient color glow */}
      <Animated.View style={[styles.ambientGlowRed, glowStyle]} />
      <Animated.View style={[styles.ambientGlowIndigo, glowStyle]} />

      {/* Floating Particle System */}
      {PARTICLES.map((p, i) => (
        <ParticleDot key={i} {...p} />
      ))}

      {/* Floating Movie Posters */}
      {FLOATING_POSTERS.map((poster, i) => (
        <FloatingPoster key={i} {...poster} />
      ))}

      {/* Top Logo Bar */}
      <Animated.View style={[styles.topBar, logoStyle]}>
        <View style={styles.logoRow}>
          <View style={styles.logoIconContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.logoIconGradient}
            >
              <Ionicons name="film" size={16} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.logoText}>
            <Text style={styles.logoC}>C</Text>INE{' '}
          </Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiText}>AI</Text>
          </View>
        </View>
      </Animated.View>

      {/* Main Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Feature Pills */}
        <View style={styles.featurePillsRow}>
          {[
            { icon: 'sparkles' as const, text: 'AI-Powered' },
            { icon: 'mic-outline' as const, text: 'Voice Search' },
            { icon: 'film-outline' as const, text: '10M+ Movies' },
          ].map((feat, i) => (
            <View key={i} style={styles.featurePill}>
              <Ionicons name={feat.icon} size={11} color={Colors.primary} />
              <Text style={styles.featurePillText}>{feat.text}</Text>
            </View>
          ))}
        </View>

        {/* Hero Headline */}
        <Text style={styles.headline}>Cinema{'\n'}Intelligence,{'\n'}Reimagined.</Text>

        <Text style={styles.subHeadline}>
          Discover movies that match your mood, personality, and passion — powered by advanced AI.
        </Text>

        {/* CTA Buttons */}
        <View style={styles.buttonGroup}>
          {/* Primary CTA */}
          <Pressable
            onPress={() => navigation.navigate('SignUp')}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Ionicons name="rocket-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Get Started Free</Text>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </Pressable>

          {/* Secondary CTA */}
          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
          >
            <BlurView intensity={20} style={styles.secondaryBtnBlur} tint="dark">
              <Text style={styles.secondaryBtnText}>I already have an account</Text>
            </BlurView>
          </Pressable>

          {/* Guest CTA */}
          <Pressable
            onPress={handleGuestLogin}
            hitSlop={15}
            style={({ pressed }) => [styles.guestBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="eye-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.guestBtnText}>Continue as Guest</Text>
          </Pressable>
        </View>

        <Text style={styles.legalText}>
          Free to use · No credit card required · Privacy protected
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  ambientGlowRed: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(230,57,70,0.12)',
    bottom: height * 0.25,
    left: -100,
  },
  ambientGlowIndigo: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(108,99,255,0.08)',
    bottom: height * 0.15,
    right: -80,
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: Spacing.xl,
    right: Spacing.xl,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  logoIconContainer: {
    marginRight: 2,
  },
  logoIconGradient: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: Typography.xl,
    fontFamily: 'Poppins_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  logoC: {
    color: Colors.primary,
  },
  aiBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  aiText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 48,
  },
  featurePillsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  featurePillText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontFamily: 'Inter_500Medium',
  },
  headline: {
    fontSize: 42,
    fontFamily: 'Poppins_700Bold',
    color: Colors.white,
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: Spacing.base,
  },
  subHeadline: {
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: Typography.base * 1.65,
    marginBottom: Spacing['2xl'],
    maxWidth: 340,
  },
  buttonGroup: {
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  primaryBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: Spacing.sm,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: Typography.lg,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
    textAlign: 'center',
    marginLeft: -22,
  },
  secondaryBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryBtnBlur: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: 'Inter_500Medium',
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  guestBtnText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'underline',
    textDecorationColor: Colors.textMuted,
  },
  legalText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: Typography.xs,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default WelcomeScreen;
