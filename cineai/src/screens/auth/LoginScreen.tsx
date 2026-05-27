import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { AuthStackParamList } from '../../types';
import { AuthInput } from './components/AuthInput';
import { AUTH_BACKDROPS } from './constants';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const socialRows = [
  {
    id: 'apple',
    icon: 'logo-apple' as React.ComponentProps<typeof Ionicons>['name'],
    title: 'Continue with Apple',
    soon: 'Soon',
  },
  {
    id: 'google',
    icon: 'logo-google' as React.ComponentProps<typeof Ionicons>['name'],
    title: 'Continue with Google',
    soon: 'Soon',
  },
  {
    id: 'facebook',
    icon: 'logo-facebook' as React.ComponentProps<typeof Ionicons>['name'],
    title: 'Continue with Facebook',
    soon: 'Soon',
  },
] as const;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNav>();
  const insets = useSafeAreaInsets();
  const { signIn, signInAsGuest, isLoading } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const fade = useSharedValue(0);
  const slide = useSharedValue(16);

  useEffect(() => {
    fade.value = withDelay(80, withTiming(1, { duration: 420 }));
    slide.value = withDelay(80, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [fade, slide]);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: slide.value }],
  }));

  const handleSignIn = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await signIn(identifier.trim(), password);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Unable to sign in right now.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const handleGuest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    signInAsGuest();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Image source={{ uri: AUTH_BACKDROPS.login[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(8,11,18,0.36)', 'rgba(8,11,18,0.8)', '#070709']}
        locations={[0, 0.5, 0.9]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
        hitSlop={12}
      >
        <View style={styles.backPill}>
          <Ionicons name="chevron-back" size={18} color={Colors.text.primary} />
        </View>
      </Pressable>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 22 }]}
      >
        <Animated.View style={[styles.panel, panelStyle]}>
          <Text style={styles.kicker} allowFontScaling={false}>WELCOME BACK</Text>
          <Text style={styles.title} allowFontScaling={false}>Sign in to your cinematic profile.</Text>
          <Text style={styles.subtitle} allowFontScaling={false}>
            Sync your watchlist, AI history, and personalized rails across devices.
          </Text>

          {!!error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={Colors.semantic.error} />
              <Text style={styles.errorText} allowFontScaling={false}>{error}</Text>
            </View>
          ) : null}

          <AuthInput
            label="Email or Username"
            value={identifier}
            onChangeText={setIdentifier}
            icon="person-outline"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <AuthInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            icon="lock-closed-outline"
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
            inputRef={passwordRef}
          />

          <Pressable style={styles.inlineLink} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.inlineLinkText} allowFontScaling={false}>Forgot password?</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.submitBtn, pressed && styles.submitPressed]} onPress={handleSignIn} disabled={isLoading}>
            <LinearGradient colors={['#DCEBFF', '#B8D3FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#0B1526" />
              ) : (
                <>
                  <Ionicons name="arrow-forward" size={14} color="#0B1526" />
                  <Text style={styles.submitText} allowFontScaling={false}>Continue</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText} allowFontScaling={false}>social sign-in</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialStack}>
            {socialRows.map(item => (
              <Pressable key={item.id} style={styles.socialGhostBtn}>
                <View style={styles.socialIconChip}>
                  <Ionicons name={item.icon} size={15} color="#DCE8FB" />
                </View>
                <Text style={styles.socialLabel} allowFontScaling={false}>{item.title}</Text>
                <View style={styles.socialSoonPill}>
                  <Text style={styles.socialSoon} allowFontScaling={false}>{item.soon}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.guestBtn} onPress={handleGuest}>
            <Ionicons name="sparkles-outline" size={14} color="#D1DDF0" />
            <Text style={styles.guestText} allowFontScaling={false}>Continue as Guest</Text>
          </Pressable>

          <Pressable style={styles.switchRow} onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.switchPrompt} allowFontScaling={false}>New to CineAI?</Text>
            <Text style={styles.switchLink} allowFontScaling={false}> Create account</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.void,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
  },
  backPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(220,236,255,0.25)',
    backgroundColor: 'rgba(9,14,24,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 92,
  },
  panel: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(220,235,255,0.16)',
    backgroundColor: 'rgba(8,12,20,0.82)',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  kicker: {
    color: '#BFD2ED',
    fontFamily: Typography.fontMedium,
    fontSize: 10,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  title: {
    color: Colors.text.primary,
    fontFamily: Typography.fontDisplay,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 7,
    marginBottom: 14,
    color: '#A5B2C5',
    fontFamily: Typography.fontPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.35)',
    backgroundColor: 'rgba(230,57,70,0.12)',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    color: Colors.semantic.error,
    fontFamily: Typography.fontPrimary,
    fontSize: 12,
  },
  inlineLink: {
    alignSelf: 'flex-end',
    marginBottom: 14,
    marginTop: -3,
  },
  inlineLinkText: {
    color: '#C5D8F7',
    fontFamily: Typography.fontMedium,
    fontSize: 12,
  },
  submitBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  submitPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.988 }],
  },
  submitGradient: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  submitText: {
    color: '#0B1526',
    fontFamily: Typography.fontSemiBold,
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(201,218,242,0.2)',
  },
  dividerText: {
    color: '#8EA1BF',
    fontFamily: Typography.fontPrimary,
    fontSize: 11,
  },
  socialStack: {
    gap: 8,
  },
  socialGhostBtn: {
    minHeight: 50,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(198,216,241,0.26)',
    backgroundColor: 'rgba(13,18,28,0.72)',
    alignItems: 'center',
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 10,
  },
  socialIconChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(214,228,249,0.26)',
    backgroundColor: 'rgba(162,188,229,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLabel: {
    color: '#D6E2F3',
    fontFamily: Typography.fontMedium,
    fontSize: 13,
    flex: 1,
  },
  socialSoonPill: {
    borderWidth: 1,
    borderColor: 'rgba(184,202,229,0.32)',
    backgroundColor: 'rgba(162,188,229,0.12)',
    borderRadius: Radius.full,
    minHeight: 22,
    paddingHorizontal: 9,
    justifyContent: 'center',
  },
  socialSoon: {
    color: '#AFC1DD',
    fontFamily: Typography.fontPrimary,
    fontSize: 10,
  },
  guestBtn: {
    marginTop: 14,
    minHeight: 45,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(199,214,237,0.24)',
    backgroundColor: 'rgba(13,18,28,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  guestText: {
    color: '#D2DEEE',
    fontFamily: Typography.fontMedium,
    fontSize: 13,
  },
  switchRow: {
    marginTop: 14,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  switchPrompt: {
    color: '#9FB0C8',
    fontFamily: Typography.fontPrimary,
    fontSize: 12,
  },
  switchLink: {
    color: '#D9E8FF',
    fontFamily: Typography.fontSemiBold,
    fontSize: 12,
  },
});

export default LoginScreen;
