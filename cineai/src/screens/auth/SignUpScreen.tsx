import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { AUTH_BACKDROPS, GENRE_OPTIONS, ONBOARDING_PREFS_KEY, VIBE_OPTIONS } from './constants';

type SignUpNav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

type SignUpStep = 'account' | 'taste';

const makeUsername = (rawName: string, email: string): string => {
  const source = rawName.trim() || email.split('@')[0] || 'cineuser';
  const cleaned = source.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
  return cleaned.length >= 3 ? cleaned : `${cleaned}cine`.slice(0, 12);
};

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpNav>();
  const insets = useSafeAreaInsets();
  const { signUp, signInAsGuest, isLoading } = useAuthStore();

  const [step, setStep] = useState<SignUpStep>('account');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const fade = useSharedValue(0);
  const slide = useSharedValue(18);

  useEffect(() => {
    fade.value = withDelay(100, withTiming(1, { duration: 420 }));
    slide.value = withDelay(100, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [fade, slide]);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: slide.value }],
  }));

  const progressText = useMemo(() => (step === 'account' ? 'Step 1 of 2' : 'Step 2 of 2'), [step]);

  const validateAccountStep = (): string => {
    if (!name.trim()) return 'Please enter your name.';
    if (!email.trim() || !email.includes('@')) return 'Please enter a valid email.';
    if (password.length < 8) return 'Use at least 8 characters for password.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const onNext = () => {
    const validation = validateAccountStep();
    if (validation) {
      setError(validation);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStep('taste');
  };

  const onCreate = async () => {
    setError('');
    const username = makeUsername(name, email);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      await AsyncStorage.setItem(
        ONBOARDING_PREFS_KEY,
        JSON.stringify({
          genres: selectedGenres,
          vibes: selectedVibes,
        }),
      );
      await signUp(name.trim(), username, email.trim(), password);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Unable to create account now.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id].slice(0, 5)));
  };

  const toggleVibe = (value: string) => {
    setSelectedVibes(prev => (prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value].slice(0, 3)));
  };

  const onGuest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    signInAsGuest();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Image source={{ uri: AUTH_BACKDROPS.signup[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(9,12,18,0.32)', 'rgba(9,12,18,0.78)', '#070709']}
        locations={[0, 0.52, 0.9]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => (step === 'account' ? navigation.goBack() : setStep('account'))}
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
          <Text style={styles.progress} allowFontScaling={false}>{progressText}</Text>
          <Text style={styles.title} allowFontScaling={false}>
            {step === 'account' ? 'Create your CineAI profile.' : 'Shape your cinematic taste.'}
          </Text>
          <Text style={styles.subtitle} allowFontScaling={false}>
            {step === 'account'
              ? 'A quick setup, then we personalize your first home rails.'
              : 'Optional picks help us tune recommendations from your first session.'}
          </Text>

          {!!error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={Colors.semantic.error} />
              <Text style={styles.errorText} allowFontScaling={false}>{error}</Text>
            </View>
          ) : null}

          {step === 'account' ? (
            <>
              <AuthInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                icon="person-outline"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              <AuthInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                icon="mail-outline"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                inputRef={emailRef}
              />
              <AuthInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                icon="lock-closed-outline"
                secureTextEntry
                autoComplete="password-new"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                inputRef={passwordRef}
              />
              <AuthInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                icon="shield-checkmark-outline"
                secureTextEntry
                autoComplete="password-new"
                returnKeyType="done"
                onSubmitEditing={onNext}
                inputRef={confirmRef}
              />

              <Pressable style={({ pressed }) => [styles.submitBtn, pressed && styles.submitPressed]} onPress={onNext}>
                <LinearGradient colors={['#DCEBFF', '#B8D3FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                  <Text style={styles.submitText} allowFontScaling={false}>Continue</Text>
                  <Ionicons name="arrow-forward" size={14} color="#0B1526" />
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel} allowFontScaling={false}>Favorite genres</Text>
              <View style={styles.chipWrap}>
                {GENRE_OPTIONS.map(genre => {
                  const active = selectedGenres.includes(genre.id);
                  return (
                    <Pressable
                      key={genre.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleGenre(genre.id)}
                    >
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]} allowFontScaling={false}>
                        {genre.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 12 }]} allowFontScaling={false}>Tonight's vibe</Text>
              <View style={styles.chipWrap}>
                {VIBE_OPTIONS.map(vibe => {
                  const active = selectedVibes.includes(vibe);
                  return (
                    <Pressable
                      key={vibe}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleVibe(vibe)}
                    >
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]} allowFontScaling={false}>
                        {vibe}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={({ pressed }) => [styles.submitBtn, pressed && styles.submitPressed]} onPress={onCreate} disabled={isLoading}>
                <LinearGradient colors={['#DCEBFF', '#B8D3FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#0B1526" />
                  ) : (
                    <>
                      <Text style={styles.submitText} allowFontScaling={false}>Create Account</Text>
                      <Ionicons name="checkmark" size={15} color="#0B1526" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </>
          )}

          <Pressable style={styles.guestBtn} onPress={onGuest}>
            <Ionicons name="sparkles-outline" size={14} color="#D1DDF0" />
            <Text style={styles.guestText} allowFontScaling={false}>Continue as Guest</Text>
          </Pressable>

          <Pressable style={styles.switchRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.switchPrompt} allowFontScaling={false}>Already have an account?</Text>
            <Text style={styles.switchLink} allowFontScaling={false}> Sign in</Text>
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
    backgroundColor: 'rgba(8,12,20,0.84)',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  progress: {
    color: '#AFC2E0',
    fontFamily: Typography.fontMedium,
    fontSize: 10,
    letterSpacing: 1,
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
  sectionLabel: {
    color: '#D5E2F4',
    fontFamily: Typography.fontSemiBold,
    fontSize: 13,
    marginBottom: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 36,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(198,216,241,0.22)',
    backgroundColor: 'rgba(13,18,28,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: 'rgba(220,236,255,0.65)',
    backgroundColor: 'rgba(153,193,255,0.22)',
  },
  chipLabel: {
    color: '#B6C4D8',
    fontFamily: Typography.fontMedium,
    fontSize: 12,
  },
  chipLabelActive: {
    color: '#EAF3FF',
  },
  submitBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: 16,
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
  guestBtn: {
    marginTop: 12,
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

export default SignUpScreen;

