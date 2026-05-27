/**
 * CineAI V3 — WelcomeScreen (Flagship Luxury Edition)
 * Reconstructed to match the premium gold-accented cinematic mockup exactly.
 * Features a luxury Georgia serif headline, top-right "1 device" status radar,
 * elegant horizontal dividing line with golden flare dot, circular portal masking,
 * and high-tactile premium vertical stacked buttons with exact mockup arrow alignments.
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Radius, Motion } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { AuthStackParamList } from '../../types';

const { width: W, height: H } = Dimensions.get('window');

type WelcomeNav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const PORTAL_ART = require('../../../assets/hero.png');



export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeNav>();
  const { signInAsGuest } = useAuthStore();

  // Entrance animations
  const backdropOpacity = useSharedValue(0);
  const portalScale = useSharedValue(0.92);
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(24);

  // Shimmer Sweep
  const shimmerTranslate = useSharedValue(-W);

  // Radar Pulse animation
  const radarScale = useSharedValue(1);
  const radarOpacity = useSharedValue(0.6);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const portalStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    transform: [{ scale: portalScale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value }],
  }));

  const radarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: radarScale.value }],
    opacity: radarOpacity.value,
  }));

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
    portalScale.value = withSpring(1, Motion.springs.gentle);
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    contentY.value = withDelay(400, withSpring(0, Motion.springs.gentle));

    // Dynamic light shimmer reflection sweep cycle
    shimmerTranslate.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(W, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
          withTiming(-W, { duration: 0 })
        ),
        -1,
        false
      )
    );

    // Radar pulse loop
    radarScale.value = withRepeat(
      withTiming(1.8, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    radarOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 0 }),
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('Login');
  };

  const handleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('SignUp');
  };

  const handleGuest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    signInAsGuest();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Cinematic Golden Ratio Portal Art on the right side */}
      <Animated.View style={[styles.portalContainer, portalStyle]}>
        <Image
          source={PORTAL_ART}
          style={styles.portalImg}
          resizeMode="cover"
        />

        {/* Deep vignette overlays on the portal to blend it seamlessly */}
        <LinearGradient
          colors={['rgba(7,7,9,0.1)', 'rgba(7,7,9,0.5)', '#070709']}
          locations={[0, 0.45, 0.95]}
          style={StyleSheet.absoluteFill}
        />
        {/* Soft Golden Circular Edge Overlay */}
        <View style={styles.portalGlowRing} />
      </Animated.View>

      {/* Main Void Black Backdrop Layer */}
      <LinearGradient
        colors={['rgba(7,7,9,0.05)', 'rgba(7,7,9,0.6)', '#070709']}
        locations={[0, 0.35, 0.85]}
        style={StyleSheet.absoluteFill}
      />

      {/* Luxury Golden Atmospheric Glitter Bar */}
      <LinearGradient
        colors={['transparent', 'rgba(212, 175, 55, 0.05)', '#070709']}
        locations={[0, 0.6, 1]}
        style={styles.bottomGoldGlow}
      />

      {/* Header Container (Logo left) */}
      <Animated.View style={[styles.headerRow, backdropStyle]}>
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmarkCine} allowFontScaling={false}>CINE</Text>
          <View style={styles.aiPill}>
            <Text style={styles.wordmarkAI} allowFontScaling={false}>AI</Text>
          </View>
        </View>
      </Animated.View>

      {/* Editorial Content Container */}
      <Animated.View style={[styles.heroContent, contentStyle]}>
        <View style={styles.textGroup}>
          {/* Tracked subheading */}
          <Text style={styles.heroLabel} allowFontScaling={false}>
            POWERED BY INTELLIGENCE
          </Text>

          {/* Luxury Georgia Serif Title with exact line breaks */}
          <Text style={styles.heroTitle} allowFontScaling={false}>
            Where{'\n'}Cinema{'\n'}Meets{'\n'}<Text style={{ color: '#dfb887' }}>Intelligence</Text>
          </Text>

          {/* Subtext description */}
          <Text style={styles.heroSubtitle} allowFontScaling={false}>
            Discover films curated to your mood, taste, and moment.
          </Text>

          {/* Divider Line with Gold Flare Dot */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <View style={styles.flareDot} />
          </View>
        </View>

        {/* CTA Stack (Full Width Stacked Buttons aligned to mockup blueprint) */}
        <View style={styles.btnStack}>
          {/* Get Started Button */}
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
            onPress={handleSignUp}
          >
            <View style={styles.btnPrimarySurface}>
              <LinearGradient
                colors={['#dfb887', '#ab8a5f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              
              {/* Liquid Shimmer Light Reflection Streak */}
              <Animated.View style={[styles.shimmerSweep, shimmerStyle]}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Centered content with icon and text, no arrow */}
              <View style={styles.btnContentCenter}>
                <Ionicons name="sparkles" size={15} color="#1c1c1e" style={{ marginRight: 6 }} />
                <Text style={styles.btnPrimaryText} allowFontScaling={false}>
                  Get Started
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Minimal Elegant Sign In Button */}
          <Pressable
            style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
            onPress={handleSignIn}
          >
            {/* Centered content with icon and text, no arrow */}
            <View style={styles.btnContentCenter}>
              <Ionicons name="lock-closed-outline" size={15} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.btnSecondaryText} allowFontScaling={false}>
                Sign In
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Continue as Guest underline link */}
        <Pressable style={styles.guestBtn} onPress={handleGuest}>
          <Ionicons name="person-circle-outline" size={15} color="#8e8e93" />
          <Text style={styles.guestText} allowFontScaling={false}>
            Continue as Guest
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070709',
  },
  portalContainer: {
    position: 'absolute',
    top: -H * 0.05,
    right: -W * 0.38,
    width: H * 0.78,
    height: H * 0.78,
    borderRadius: (H * 0.78) / 2,
    overflow: 'hidden',
    zIndex: 1,
  },
  portalImg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.65,
  },
  portalGlowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: (H * 0.78) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.18)',
  },
  bottomGoldGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 2,
    opacity: 0.75,
  },
  headerRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 64 : 44,
    left: 28,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordmarkCine: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  aiPill: {
    borderWidth: 1.2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  wordmarkAI: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#dfb887',
    letterSpacing: 0.5,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  devicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#dfb887',
  },
  deviceText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#a0a0a5',
  },
  radarContainer: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarWave: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#dfb887',
  },
  radarCore: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#dfb887',
    zIndex: 2,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 52 : 36,
    gap: 22,
    zIndex: 5,
  },
  textGroup: {
    alignSelf: 'flex-start',
    maxWidth: W - 56,
  },
  heroLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: '#bfa07a',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: W < 380 ? 38 : 46,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: W < 380 ? 44 : 52,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#a0a0a5',
    lineHeight: 18,
    marginBottom: 12,
  },
  dividerContainer: {
    width: 140,
    height: 6,
    justifyContent: 'center',
    position: 'relative',
    marginTop: 4,
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.22)',
  },
  flareDot: {
    position: 'absolute',
    left: '50%',
    marginLeft: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#dfb887',
    shadowColor: '#dfb887',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  btnStack: {
    gap: 12,
    alignSelf: 'stretch',
  },
  btnPrimary: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    height: 48,
    shadowColor: '#dfb887',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  btnPrimarySurface: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  shimmerSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: W * 0.55,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  btnContentCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    height: '100%',
    width: '100%',
  },
  btnLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#1c1c1e',
    letterSpacing: 0.2,
  },
  btnPrimaryArrow: {
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    color: '#1c1c1e',
    marginTop: -2,
  },
  btnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  btnSecondary: {
    borderRadius: Radius.lg,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnSecondaryPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  btnSecondaryArrow: {
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    marginTop: -2,
  },
  guestBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  guestText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#8e8e93',
    letterSpacing: 0.3,
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    textDecorationColor: '#8e8e93',
  },
});

export default WelcomeScreen;
