import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

const GENRES = [
  { id: 28, name: 'Action', emoji: '💥' },
  { id: 12, name: 'Adventure', emoji: '🗺️' },
  { id: 16, name: 'Animation', emoji: '🎨' },
  { id: 35, name: 'Comedy', emoji: '😂' },
  { id: 80, name: 'Crime', emoji: '🔍' },
  { id: 99, name: 'Documentary', emoji: '📽️' },
  { id: 18, name: 'Drama', emoji: '🎭' },
  { id: 14, name: 'Fantasy', emoji: '✨' },
  { id: 27, name: 'Horror', emoji: '👻' },
  { id: 9648, name: 'Mystery', emoji: '🕵️' },
  { id: 10749, name: 'Romance', emoji: '❤️' },
  { id: 878, name: 'Sci-Fi', emoji: '🚀' },
  { id: 53, name: 'Thriller', emoji: '😰' },
  { id: 37, name: 'Western', emoji: '🤠' },
];

const PLATFORMS = [
  { id: 'netflix', name: 'Netflix', color: '#E50914' },
  { id: 'prime', name: 'Prime Video', color: '#00A8E1' },
  { id: 'disney', name: 'Disney+', color: '#1139A6' },
  { id: 'hbo', name: 'HBO Max', color: '#3C1053' },
  { id: 'hulu', name: 'Hulu', color: '#1CE783' },
  { id: 'apple', name: 'Apple TV+', color: '#555' },
];

const STEPS = ['Genres', 'Platforms', 'Ready'];

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { updateProfile, completeOnboarding } = useAuthStore();

  const [step, setStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const progressWidth = useSharedValue(33);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const nextStep = () => {
    const next = step + 1;
    setStep(next);
    progressWidth.value = withSpring(33 * (next + 1), { damping: 15 });
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        favorite_genres: selectedGenres,
        streaming_platforms: selectedPlatforms,
      });
      await completeOnboarding();
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.background, '#0F0F1A']} style={StyleSheet.absoluteFill} />

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
        <Text style={styles.stepText}>{step + 1} of {STEPS.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <View>
            <Text style={styles.stepLabel}>Step 1</Text>
            <Text style={styles.title}>What genres{'\n'}excite you?</Text>
            <Text style={styles.subtitle}>Pick your favorites — AI uses this to personalize recommendations.</Text>
            <View style={styles.grid}>
              {GENRES.map(genre => (
                <Pressable
                  key={genre.id}
                  onPress={() => toggleGenre(genre.id)}
                  style={[styles.genreChip, selectedGenres.includes(genre.id) && styles.genreChipSelected]}
                >
                  <Text style={styles.genreEmoji}>{genre.emoji}</Text>
                  <Text style={[styles.genreName, selectedGenres.includes(genre.id) && styles.genreNameSelected]}>
                    {genre.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.stepLabel}>Step 2</Text>
            <Text style={styles.title}>Your streaming{'\n'}platforms?</Text>
            <Text style={styles.subtitle}>We'll show you where to watch your recommendations.</Text>
            <View style={styles.platformGrid}>
              {PLATFORMS.map(platform => (
                <Pressable
                  key={platform.id}
                  onPress={() => togglePlatform(platform.id)}
                  style={[
                    styles.platformChip,
                    selectedPlatforms.includes(platform.id) && styles.platformChipSelected,
                    selectedPlatforms.includes(platform.id) && { borderColor: platform.color },
                  ]}
                >
                  <View style={[styles.platformDot, { backgroundColor: platform.color }]} />
                  <Text style={[styles.platformName, selectedPlatforms.includes(platform.id) && { color: Colors.textPrimary }]}>
                    {platform.name}
                  </Text>
                  {selectedPlatforms.includes(platform.id) && (
                    <Text style={[styles.checkmark, { color: platform.color }]}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.readyContainer}>
            <Text style={styles.readyEmoji}>🎬</Text>
            <Text style={styles.title}>You're all set,{'\n'}cinephile!</Text>
            <Text style={styles.subtitle}>
              Cine AI is ready to be your personal movie companion. Start chatting, explore recommendations, and discover your next obsession.
            </Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Your Profile Summary</Text>
              <Text style={styles.summaryItem}>
                🎭 {selectedGenres.length || 0} favorite genres selected
              </Text>
              <Text style={styles.summaryItem}>
                📺 {selectedPlatforms.length || 0} streaming platforms
              </Text>
              <Text style={styles.summaryItem}>
                🤖 AI personalization: Active
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        {step < 2 ? (
          <>
            <Button
              title={step === 0 ? (selectedGenres.length > 0 ? `Continue with ${selectedGenres.length} genres →` : 'Continue →') : `Continue →`}
              onPress={nextStep}
              size="lg"
            />
            <Pressable onPress={nextStep} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </>
        ) : (
          <Button
            title="Start Exploring 🎬"
            onPress={handleFinish}
            isLoading={isLoading}
            size="lg"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  progressBg: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  stepText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontFamily: 'Inter_500Medium',
  },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: 120 },
  stepLabel: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  title: {
    fontSize: Typography['4xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: Typography['4xl'] * 1.2,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: Typography.base * 1.6,
    marginBottom: Spacing['2xl'],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.xs,
    marginBottom: 0,
  },
  genreChipSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  genreEmoji: { fontSize: 14 },
  genreName: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_500Medium',
  },
  genreNameSelected: { color: Colors.primary },
  platformGrid: { gap: Spacing.sm },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  platformChipSelected: {
    backgroundColor: Colors.whiteAlpha5,
  },
  platformDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  platformName: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontFamily: 'Inter_500Medium',
  },
  checkmark: { fontSize: Typography.base, fontFamily: 'Inter_700Bold' },
  readyContainer: { paddingTop: Spacing.lg },
  readyEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  summaryCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing['2xl'],
    gap: Spacing.md,
  },
  summaryTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: 'Inter_700Bold',
    marginBottom: Spacing.xs,
  },
  summaryItem: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    paddingBottom: 40,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  skipBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontFamily: 'Inter_500Medium',
  },
});

export default OnboardingScreen;
