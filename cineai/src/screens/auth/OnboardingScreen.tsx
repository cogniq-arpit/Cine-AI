import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
import { useLanguageStore } from '../../store/languageStore';
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

  const localizedStep = useCallback((stepIndex: number, field: 'title' | 'subtitle') => {
    const onboardingTranslations: Record<string, Array<{ title: string; subtitle: string }>> = {
      en: [
        { title: 'Pick your core genres', subtitle: 'Choose up to five for your first home rails.' },
        { title: 'Choose your current vibe', subtitle: 'This guides tone and pacing recommendations.' },
        { title: 'Set your viewing languages', subtitle: 'We prioritize these in discovery sections.' },
      ],
      es: [
        { title: 'Elige tus géneros principales', subtitle: 'Elige hasta cinco para tus primeras listas.' },
        { title: 'Elige tu vibra actual', subtitle: 'Esto guía el tono y el ritmo de las recomendaciones.' },
        { title: 'Elige tus idiomas de visualización', subtitle: 'Los priorizamos en las secciones de descubrimiento.' },
      ],
      fr: [
        { title: 'Choisissez vos genres', subtitle: 'Choisissez jusqu\'à cinq pour vos premiers rails.' },
        { title: 'Choisissez votre ambiance', subtitle: 'Cela guide le ton et le rythme des recommandations.' },
        { title: 'Choisissez vos langues', subtitle: 'Nous les priorisons dans les sections de découverte.' },
      ],
      de: [
        { title: 'Wähle deine Lieblingsgenres', subtitle: 'Wähle bis zu fünf für deine ersten Listen aus.' },
        { title: 'Wähle deine aktuelle Stimmung', subtitle: 'Dies bestimmt Ton und Pacing der Empfehlungen.' },
        { title: 'Wähle deine Mediensprachen', subtitle: 'Diese werden in den Suchbereichen bevorzugt.' },
      ],
      hi: [
        { title: 'अपने मुख्य शैलियों को चुनें', subtitle: 'अपने पहले होम रेल के लिए पांच तक चुनें।' },
        { title: 'अपना वर्तमान वाइब चुनें', subtitle: 'यह सिफारिशों के टोन और गति को निर्देशित करता है।' },
        { title: 'भाषाएं चुनें', subtitle: 'हम इन्हें खोज अनुभागों में प्राथमिकता देते हैं।' },
      ],
      ja: [
        { title: 'ジャンルを選択', subtitle: 'ホーム画面のおすすめ用に最大5つ選択してください。' },
        { title: '今の気分を選択', subtitle: 'おすすめ作品のトーンやテンポに反映されます。' },
        { title: '視聴言語を選択', subtitle: '選択した言語の作品が優先的に表示されます。' },
      ],
      ko: [
        { title: '선호하는 장르 선택', subtitle: '홈 화면 추천에 반영할 장르를 최대 5개 선택하세요.' },
        { title: '현재 감정 분위기 선택', subtitle: '추천작의 어조와 템포를 결정하는 기준이 됩니다.' },
        { title: '시청 언어 선택', subtitle: '둘러보기 목록에서 이 언어의 작품이 우선 노출됩니다.' },
      ],
    };
    const activeLanguage = useLanguageStore.getState().language;
    const list = onboardingTranslations[activeLanguage] || onboardingTranslations.en;
    return list[stepIndex]?.[field] || STEP_META[stepIndex][field];
  }, []);

  const tOnboarding = useCallback((key: string, defaultValue: string) => {
    const dictionary: Record<string, Record<string, string>> = {
      en: {
        personalization: 'Personalization',
        skip: 'Skip for now',
        back: 'Back',
        next: 'Next',
        enter: 'Enter CineAI',
        saving: 'Saving...',
      },
      es: {
        personalization: 'Personalización',
        skip: 'Omitir por ahora',
        back: 'Atrás',
        next: 'Siguiente',
        enter: 'Entrar a CineAI',
        saving: 'Guardando...',
      },
      fr: {
        personalization: 'Personnalisation',
        skip: 'Passer pour le moment',
        back: 'Retour',
        next: 'Suivant',
        enter: 'Entrer dans CineAI',
        saving: 'Enregistrement...',
      },
      de: {
        personalization: 'Personalisierung',
        skip: 'Jetzt überspringen',
        back: 'Zurück',
        next: 'Weiter',
        enter: 'CineAI starten',
        saving: 'Speichert...',
      },
      hi: {
        personalization: 'वैयक्तिकरण',
        skip: 'अभी छोड़ें',
        back: 'पीछे',
        next: 'आगे',
        enter: 'सिने AI में प्रवेश करें',
        saving: 'सुरक्षित हो रहा है...',
      },
      ja: {
        personalization: 'パーソナライズ',
        skip: 'スキップする',
        back: '戻る',
        next: '次へ',
        enter: 'シネAIを始める',
        saving: '保存中...',
      },
      ko: {
        personalization: '개인맞춤',
        skip: '건너뛰기',
        back: '이전',
        next: '다음',
        enter: '시네AI 시작하기',
        saving: '저장 중...',
      },
    };
    const activeLanguage = useLanguageStore.getState().language;
    return dictionary[activeLanguage]?.[key] || defaultValue;
  }, []);

  const localizedGenre = useCallback((id: number, defaultLabel: string) => {
    const genreTranslations: Record<string, Record<number, string>> = {
      en: { 28: 'Action', 12: 'Adventure', 878: 'Sci-Fi', 80: 'Crime', 53: 'Thriller', 18: 'Drama', 9648: 'Mystery', 10749: 'Romance', 14: 'Fantasy', 16: 'Animation' },
      es: { 28: 'Acción', 12: 'Aventura', 878: 'Sci-Fi', 80: 'Crimen', 53: 'Thriller', 18: 'Drama', 9648: 'Misterio', 10749: 'Romance', 14: 'Fantasía', 16: 'Animación' },
      fr: { 28: 'Action', 12: 'Aventure', 878: 'Sci-Fi', 80: 'Crime', 53: 'Thriller', 18: 'Drame', 9648: 'Mystère', 10749: 'Romance', 14: 'Fantasy', 16: 'Animation' },
      de: { 28: 'Action', 12: 'Abenteuer', 878: 'Sci-Fi', 80: 'Krimi', 53: 'Thriller', 18: 'Drama', 9648: 'Mystery', 10749: 'Romanze', 14: 'Fantasy', 16: 'Animation' },
      hi: { 28: 'एक्शन', 12: 'रोमांच', 878: 'साइंस-फिक्शन', 80: 'अपराध', 53: 'थ्रिलर', 18: 'ड्रामा', 9648: 'रहस्य', 10749: 'रोमांस', 14: 'काल्पनिक', 16: 'एनिमेशन' },
      ja: { 28: 'アクション', 12: 'アドベンチャー', 878: 'SF', 80: 'クライム', 53: 'スリラー', 18: 'ドラマ', 9648: 'ミステリー', 10749: 'ロマンス', 14: 'ファンタジー', 16: 'アニメーション' },
      ko: { 28: '액션', 12: '모험', 878: 'SF', 80: '범죄', 53: '스릴러', 18: '드라마', 9648: '미스터리', 10749: '로맨스', 14: '판타지', 16: '애니메이션' },
    };
    const activeLanguage = useLanguageStore.getState().language;
    return genreTranslations[activeLanguage]?.[id] || defaultLabel;
  }, []);

  const localizedVibe = useCallback((vibe: string) => {
    const vibeTranslations: Record<string, Record<string, string>> = {
      en: { 'Mind-Bending': 'Mind-Bending', 'Dark & Tense': 'Dark & Tense', 'Epic Worlds': 'Epic Worlds', 'Emotional': 'Emotional', 'Feel Good': 'Feel Good', 'Late Night Thrills': 'Late Night Thrills' },
      es: { 'Mind-Bending': 'Mente Compleja', 'Dark & Tense': 'Oscuro y Tenso', 'Epic Worlds': 'Mundos Épicos', 'Emotional': 'Emocional', 'Feel Good': 'Buen Rollo', 'Late Night Thrills': 'Suspenso Nocturno' },
      fr: { 'Mind-Bending': 'Esprit tordu', 'Dark & Tense': 'Sombre et Tendu', 'Epic Worlds': 'Mondes épiques', 'Emotional': 'Émouvant', 'Feel Good': 'Sensationnel', 'Late Night Thrills': 'Frissons nocturnes' },
      de: { 'Mind-Bending': 'Mind-Bending', 'Dark & Tense': 'Düster & Packend', 'Epic Worlds': 'Epische Welten', 'Emotional': 'Gefühlvoll', 'Feel Good': 'Gute Laune', 'Late Night Thrills': 'Nacht-Thrill' },
      hi: { 'Mind-Bending': 'दिमाग हिलाने वाला', 'Dark & Tense': 'डार्क और सस्पेंस', 'Epic Worlds': 'अद्भुत दुनिया', 'Emotional': 'भावनात्मक', 'Feel Good': 'अच्छा वाइब', 'Late Night Thrills': 'देर रात के रोमांच' },
      ja: { 'Mind-Bending': 'マインドベンディング', 'Dark & Tense': 'ダーク＆緊迫', 'Epic Worlds': '壮大な世界', 'Emotional': '感動的', 'Feel Good': 'ほっこり・心地よい', 'Late Night Thrills': '真夜中のスリル' },
      ko: { 'Mind-Bending': '마인드벤딩', 'Dark & Tense': '어둡고 긴장감 넘치는', 'Epic Worlds': '웅장한 세계관', 'Emotional': '감성적인', 'Feel Good': '기분 좋은', 'Late Night Thrills': '심야 스릴' },
    };
    const activeLanguage = useLanguageStore.getState().language;
    return vibeTranslations[activeLanguage]?.[vibe] || vibe;
  }, []);

  const localizedLangOption = useCallback((code: string, defaultLabel: string) => {
    const langTranslations: Record<string, Record<string, string>> = {
      en: { en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ko: 'Korean', ja: 'Japanese' },
      es: { en: 'Inglés', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ko: 'Coreano', ja: 'Japonés' },
      fr: { en: 'Anglais', hi: 'Hindi', ta: 'Tamoul', te: 'Télougou', ko: 'Coréen', ja: 'Japonais' },
      de: { en: 'Englisch', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ko: 'Koreanisch', ja: 'Japanisch' },
      hi: { en: 'अंग्रेज़ी', hi: 'हिन्दी', ta: 'तमिल', te: 'तेलुगु', ko: 'कोरियाई', ja: 'जापानी' },
      ja: { en: '英語', hi: 'ヒンディー語', ta: 'タミル語', te: 'テルグ語', ko: '韓国語', ja: '日本語' },
      ko: { en: '영어', hi: '힌디어', ta: '타밀어', te: '텔루구어', ko: '한국어', ja: '일본어' },
    };
    const activeLanguage = useLanguageStore.getState().language;
    return langTranslations[activeLanguage]?.[code] || defaultLabel;
  }, []);

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
            <Text style={styles.stepText} allowFontScaling={false}>{tOnboarding('personalization', 'Personalization')} {step + 1}/3</Text>
            <Pressable onPress={skipForNow}>
              <Text style={styles.skipText} allowFontScaling={false}>{tOnboarding('skip', 'Skip for now')}</Text>
            </Pressable>
          </View>

          <Text style={styles.title} allowFontScaling={false}>{localizedStep(step, 'title')}</Text>
          <Text style={styles.subtitle} allowFontScaling={false}>{localizedStep(step, 'subtitle')}</Text>

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
                      {localizedGenre(option.id, option.label)}
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
                      {localizedVibe(option)}
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
                      {localizedLangOption(option.code, option.label)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.footerRow}>
            <Pressable style={[styles.navBtn, step === 0 && styles.navBtnDisabled]} onPress={prevStep} disabled={step === 0}>
              <Ionicons name="chevron-back" size={15} color={step === 0 ? '#6D7788' : '#D6E3F5'} />
              <Text style={[styles.navBtnText, step === 0 && styles.navBtnTextDisabled]} allowFontScaling={false}>{tOnboarding('back', 'Back')}</Text>
            </Pressable>

            {step < 2 ? (
              <Pressable style={styles.nextBtn} onPress={nextStep}>
                <LinearGradient colors={['#DCEBFF', '#B8D3FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextGradient}>
                  <Text style={styles.nextText} allowFontScaling={false}>{tOnboarding('next', 'Next')}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#0B1526" />
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable style={styles.nextBtn} onPress={finish}>
                <LinearGradient colors={['#DCEBFF', '#B8D3FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextGradient}>
                  {submitting ? (
                    <Text style={styles.nextText} allowFontScaling={false}>{tOnboarding('saving', 'Saving...')}</Text>
                  ) : (
                    <>
                      <Text style={styles.nextText} allowFontScaling={false}>{tOnboarding('enter', 'Enter CineAI')}</Text>
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
