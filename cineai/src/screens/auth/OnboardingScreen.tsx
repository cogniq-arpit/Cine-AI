import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import {
  AUTH_BACKDROPS,
  GENRE_OPTIONS,
  LANGUAGE_OPTIONS,
  ONBOARDING_PREFS_KEY,
  VIBE_OPTIONS,
} from './constants';

type StepId = 0 | 1 | 2;

const STEP_META = [
  { title: 'Pick your core genres', subtitle: 'Choose up to five for your first home rails.' },
  { title: 'Choose your current vibe', subtitle: 'This guides tone and pacing recommendations.' },
  { title: 'Set your viewing languages', subtitle: 'We prioritize these in discovery sections.' },
];

export const OnboardingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, completeOnboarding } = useAuthStore();

  const [step, setStep] = useState<StepId>(0);
  const [genres, setGenres] = useState<number[]>(profile?.favorite_genres || []);
  const [vibes, setVibes] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(profile?.preferred_languages || ['en']);
  const [submitting, setSubmitting] = useState(false);

  const fade = useSharedValue(0);
  const slide = useSharedValue(18);

  useEffect(() => {
    fade.value = withDelay(80, withTiming(1, { duration: 400 }));
    slide.value = withDelay(80, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, [fade, slide]);

  useEffect(() => {
    let active = true;
    const hydrateDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(ONBOARDING_PREFS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { genres?: number[]; vibes?: string[] };
        if (!active) return;
        if (Array.isArray(parsed.genres) && parsed.genres.length > 0) {
          setGenres(parsed.genres.slice(0, 5));
        }
        if (Array.isArray(parsed.vibes) && parsed.vibes.length > 0) {
          setVibes(parsed.vibes.slice(0, 3));
        }
      } catch {
        // ignore invalid temp payload
      }
    };
    hydrateDraft().catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: slide.value }],
  }));

  const stepMeta = useMemo(() => STEP_META[step], [step]);

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStep(current => {
      if (current === 0) return 1;
      if (current === 1) return 2;
      return 2;
    });
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStep(current => {
      if (current === 2) return 1;
      if (current === 1) return 0;
      return 0;
    });
  };

  const finish = async () => {
    if (submitting) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await updateProfile({
        favorite_genres: genres.length > 0 ? genres : [18, 53],
        preferred_languages: languages.length > 0 ? languages : ['en'],
        ai_taste_profile: vibes.length > 0
          ? `Mood profile: ${vibes.join(', ')}`
          : profile?.ai_taste_profile || 'Cinematic AI Profile',
      });
      await AsyncStorage.removeItem(ONBOARDING_PREFS_KEY);
      await completeOnboarding();
    } finally {
      setSubmitting(false);
    }
  };

  const skipForNow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await AsyncStorage.removeItem(ONBOARDING_PREFS_KEY);
    await completeOnboarding();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Image source={{ uri: AUTH_BACKDROPS.onboarding[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(9,12,18,0.28)', 'rgba(9,12,18,0.72)', '#070709']}
        locations={[0, 0.5, 0.88]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}
      >
        <Animated.View style={[styles.panel, panelStyle]}>
          <View style={styles.topRow}>
            <Text style={styles.stepText} allowFontScaling={false}>Personalization {step + 1}/3</Text>
            <Pressable onPress={skipForNow}>
              <Text style={styles.skipText} allowFontScaling={false}>Skip for now</Text>
            </Pressable>
          </View>

          <Text style={styles.title} allowFontScaling={false}>{stepMeta.title}</Text>
          <Text style={styles.subtitle} allowFontScaling={false}>{stepMeta.subtitle}</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} />
          </View>

          {step === 0 ? (
            <View style={styles.chipWrap}>
              {GENRE_OPTIONS.map(option => {
                const active = genres.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setGenres(prev => (prev.includes(option.id)
                      ? prev.filter(id => id !== option.id)
                      : [...prev, option.id].slice(0, 5)))}
                  >
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]} allowFontScaling={false}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.chipWrap}>
              {VIBE_OPTIONS.map(option => {
                const active = vibes.includes(option);
                return (
                  <Pressable
                    key={option}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setVibes(prev => (prev.includes(option)
                      ? prev.filter(item => item !== option)
                      : [...prev, option].slice(0, 3)))}
                  >
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]} allowFontScaling={false}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.chipWrap}>
              {LANGUAGE_OPTIONS.map(option => {
                const active = languages.includes(option.code);
                return (
                  <Pressable
                    key={option.code}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setLanguages(prev => (prev.includes(option.code)
                      ? prev.filter(code => code !== option.code)
                      : [...prev, option.code].slice(0, 4)))}
                  >
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]} allowFontScaling={false}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.footerRow}>
            <Pressable style={[styles.navBtn, step === 0 && styles.navBtnDisabled]} onPress={prevStep} disabled={step === 0}>
              <Ionicons name="chevron-back" size={15} color={step === 0 ? '#6D7788' : '#D6E3F5'} />
              <Text style={[styles.navBtnText, step === 0 && styles.navBtnTextDisabled]} allowFontScaling={false}>Back</Text>
            </Pressable>

            {step < 2 ? (
              <Pressable style={styles.nextBtn} onPress={nextStep}>
                <LinearGradient colors={['#DCEBFF', '#B8D3FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextGradient}>
                  <Text style={styles.nextText} allowFontScaling={false}>Next</Text>
                  <Ionicons name="arrow-forward" size={14} color="#0B1526" />
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable style={styles.nextBtn} onPress={finish}>
                <LinearGradient colors={['#DCEBFF', '#B8D3FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextGradient}>
                  {submitting ? (
                    <Text style={styles.nextText} allowFontScaling={false}>Saving...</Text>
                  ) : (
                    <>
                      <Text style={styles.nextText} allowFontScaling={false}>Enter CineAI</Text>
                      <Ionicons name="checkmark" size={14} color="#0B1526" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.void,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  panel: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(220,235,255,0.16)',
    backgroundColor: 'rgba(8,12,20,0.84)',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepText: {
    color: '#AFC2E0',
    fontFamily: Typography.fontMedium,
    fontSize: 11,
    letterSpacing: 0.9,
  },
  skipText: {
    color: '#C7D7EF',
    fontFamily: Typography.fontMedium,
    fontSize: 12,
  },
  title: {
    color: Colors.text.primary,
    fontFamily: Typography.fontDisplay,
    fontSize: 29,
    lineHeight: 36,
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subtitle: {
    color: '#A5B2C5',
    fontFamily: Typography.fontPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  progressTrack: {
    marginTop: 14,
    marginBottom: 15,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(191,211,240,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6E8FF',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 150,
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
  footerRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  navBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(199,214,237,0.26)',
    backgroundColor: 'rgba(13,18,28,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtnDisabled: {
    borderColor: 'rgba(140,154,180,0.2)',
  },
  navBtnText: {
    color: '#D6E3F5',
    fontFamily: Typography.fontMedium,
    fontSize: 13,
  },
  navBtnTextDisabled: {
    color: '#6D7788',
  },
  nextBtn: {
    flex: 1,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  nextGradient: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  nextText: {
    color: '#0B1526',
    fontFamily: Typography.fontSemiBold,
    fontSize: 14,
  },
});

export default OnboardingScreen;
