import React, { useEffect } from 'react';
import {
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { AuthStackParamList } from '../../types';
import { AUTH_BACKDROPS } from './constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type WelcomeNav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeNav>();
  const insets = useSafeAreaInsets();
  const { signInAsGuest } = useAuthStore();

  const drift = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(24);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 18000, easing: Easing.linear }),
      -1,
      true,
    );
    contentOpacity.value = withDelay(140, withTiming(1, { duration: 520 }));
    contentY.value = withDelay(140, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [contentOpacity, contentY, drift]);

  const layerOne = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-12, 10], Extrapolate.CLAMP) },
      { translateY: interpolate(drift.value, [0, 1], [-6, 8], Extrapolate.CLAMP) },
      { scale: interpolate(drift.value, [0, 1], [1.08, 1.14], Extrapolate.CLAMP) },
    ],
  }));

  const layerTwo = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [10, -14], Extrapolate.CLAMP) },
      { translateY: interpolate(drift.value, [0, 1], [4, -10], Extrapolate.CLAMP) },
      { scale: interpolate(drift.value, [0, 1], [1.1, 1.16], Extrapolate.CLAMP) },
    ],
  }));

  const layerThree = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-6, 14], Extrapolate.CLAMP) },
      { translateY: interpolate(drift.value, [0, 1], [12, -6], Extrapolate.CLAMP) },
      { scale: interpolate(drift.value, [0, 1], [1.05, 1.12], Extrapolate.CLAMP) },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const onContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('Login');
  };

  const onSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('SignUp');
  };

  const onGuest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    signInAsGuest();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.View style={[styles.backdropLayer, layerOne]}>
        <Image source={{ uri: AUTH_BACKDROPS.landing[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
      </Animated.View>
      <Animated.View style={[styles.backdropLayer, styles.layerBlendA, layerTwo]}>
        <Image source={{ uri: AUTH_BACKDROPS.landing[1] }} style={StyleSheet.absoluteFill} contentFit="cover" />
      </Animated.View>
      <Animated.View style={[styles.backdropLayer, styles.layerBlendB, layerThree]}>
        <Image source={{ uri: AUTH_BACKDROPS.landing[2] }} style={StyleSheet.absoluteFill} contentFit="cover" />
      </Animated.View>

      <LinearGradient
        colors={['rgba(8,11,18,0.35)', 'rgba(8,11,18,0.76)', '#070709']}
        locations={[0, 0.5, 0.9]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(71,98,153,0.18)', 'rgba(7,7,9,0)']}
        locations={[0, 1]}
        style={styles.ambientTop}
      />

      <Animated.View style={[styles.contentWrap, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 22 }, contentStyle]}>
        <View style={styles.brandRow}>
          <Text style={styles.brandWord} allowFontScaling={false}>CINE</Text>
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText} allowFontScaling={false}>AI</Text>
          </View>
        </View>

        <View style={styles.heroBlock}>
          <Text style={styles.kicker} allowFontScaling={false}>PREMIUM CINEMATIC DISCOVERY</Text>
          <Text style={styles.headline} allowFontScaling={false}>
            Your next obsession starts here.
          </Text>
          <Text style={styles.subhead} allowFontScaling={false}>
            Enter a streaming-grade universe shaped by intelligent taste, cinematic depth, and effortless discovery.
          </Text>
        </View>

        <View style={styles.ctaGroup}>
          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]} onPress={onContinue}>
            <LinearGradient
              colors={['#DCEBFF', '#B8D3FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <Ionicons name="log-in-outline" size={15} color="#0B1526" />
              <Text style={styles.primaryLabel} allowFontScaling={false}>Continue</Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]} onPress={onSignUp}>
            <Ionicons name="person-add-outline" size={15} color={Colors.text.primary} />
            <Text style={styles.secondaryLabel} allowFontScaling={false}>Sign Up</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.guestButton, pressed && styles.guestButtonPressed]} onPress={onGuest}>
            <Ionicons name="compass-outline" size={14} color="#C9D6EA" />
            <Text style={styles.guestLabel} allowFontScaling={false}>Continue as Guest</Text>
          </Pressable>
        </View>

        <Text style={styles.footnote} allowFontScaling={false}>
          Guest mode includes full cinematic browsing and AI chat exploration.
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.void,
  },
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  layerBlendA: {
    opacity: 0.78,
  },
  layerBlendB: {
    opacity: 0.56,
  },
  ambientTop: {
    position: 'absolute',
    top: -40,
    left: -30,
    right: -30,
    height: 260,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandWord: {
    color: Colors.text.primary,
    fontFamily: Typography.fontDisplay,
    fontSize: 20,
    letterSpacing: 1.5,
  },
  brandPill: {
    borderWidth: 1,
    borderColor: 'rgba(198,225,255,0.44)',
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(141,189,255,0.14)',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  brandPillText: {
    color: '#DDEBFF',
    fontFamily: Typography.fontSemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  heroBlock: {
    marginTop: 70,
    gap: 14,
  },
  kicker: {
    color: 'rgba(210,229,255,0.82)',
    fontSize: 10,
    fontFamily: Typography.fontMedium,
    letterSpacing: 1.2,
  },
  headline: {
    color: Colors.text.primary,
    fontFamily: Typography.fontDisplay,
    fontSize: SCREEN_WIDTH < 380 ? 36 : 42,
    lineHeight: SCREEN_WIDTH < 380 ? 42 : 48,
    letterSpacing: -0.9,
    maxWidth: 340,
  },
  subhead: {
    color: '#C2CCDA',
    fontFamily: Typography.fontPrimary,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 340,
  },
  ctaGroup: {
    gap: 10,
  },
  primaryButton: {
    height: 52,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  primaryButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.988 }],
  },
  primaryGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  primaryLabel: {
    color: '#0B1526',
    fontFamily: Typography.fontSemiBold,
    fontSize: 15,
  },
  secondaryButton: {
    height: 50,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(222,236,255,0.26)',
    backgroundColor: 'rgba(9,14,24,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  secondaryButtonPressed: {
    backgroundColor: 'rgba(12,20,34,0.72)',
  },
  secondaryLabel: {
    color: Colors.text.primary,
    fontSize: 14,
    fontFamily: Typography.fontSemiBold,
  },
  guestButton: {
    height: 46,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(201,218,242,0.24)',
    backgroundColor: 'rgba(10,14,21,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  guestButtonPressed: {
    backgroundColor: 'rgba(14,20,30,0.66)',
  },
  guestLabel: {
    color: '#D3DEEF',
    fontFamily: Typography.fontMedium,
    fontSize: 13,
  },
  footnote: {
    color: '#8D98A8',
    fontFamily: Typography.fontPrimary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default WelcomeScreen;
