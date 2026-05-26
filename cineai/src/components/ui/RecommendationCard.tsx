/**
 * RecommendationCard
 *
 * The emotional intelligence layer of Cine AI.
 *
 * This is NOT a movie grid tile. It is a curated AI editorial card.
 * The layout communicates: "The AI selected this carefully for you."
 *
 * Composition philosophy:
 *  - Poster is framing, not the hero — the AI's reasoning is the hero
 *  - Typography pacing creates editorial calm, not information density
 *  - Metadata hierarchy: title → mood → genre → reasoning → confidence
 *  - Visual depth through layering: surface → poster → gradient → content
 *  - Restrained motion: spring press-in, calm reveal, no gratuitous animation
 *
 * Performance contract:
 *  - Virtualization-safe: no internal ScrollViews, no unbounded heights
 *  - Static shadow — never animated
 *  - expo-image for blurhash placeholder + progressive load
 *  - useMemo for all derived config — no inline object churn
 *  - useCallback for stable event handlers
 *
 * Accessibility:
 *  - accessibilityRole="button" + full label construction
 *  - Confidence percentage readable by screen readers
 *  - Reduce-motion: only opacity feedback, no scale
 *  - allowFontScaling={false} on all display text
 *  - 44pt minimum touch target
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  AccessibilityInfo,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  typography,
  spacing,
  opacity,
  motion,
} from '@/design-system';

// ─── Motion Constants ─────────────────────────────────────────────────────────

const SPRING_PRESS_IN = {
  damping: 22,
  mass: 1.0,
  stiffness: 380,
  overshootClamping: false,
} as const;

const SPRING_PRESS_OUT = {
  damping: 18,
  mass: 1.0,
  stiffness: 320,
  overshootClamping: false,
} as const;

const SCALE_PRESSED = 0.975;

// ─── Data Types ───────────────────────────────────────────────────────────────

/** Mood category — defines the card's emotional register */
export type MovieMood =
  | 'thrilling'
  | 'heartwarming'
  | 'mind-bending'
  | 'darkly funny'
  | 'epic'
  | 'haunting'
  | 'romantic'
  | 'unsettling'
  | 'inspiring'
  | 'meditative';

export interface RecommendationMovie {
  /** Unique identifier (IMDb ID preferred) */
  id: string;
  /** Film title */
  title: string;
  /** Poster image URI — supports any URL format */
  posterUrl: string;
  /**
   * Blurhash string for progressive poster loading.
   * Optional — falls back to dark surface placeholder.
   */
  blurhash?: string;
  /** Release year */
  year: number | string;
  /** Primary genre string — e.g. "Drama" or "Drama · Thriller" */
  genre?: string;
  /** IMDb rating as number 0–10 */
  rating?: number;
  /** AI confidence score 0–100 */
  confidenceScore?: number;
  /**
   * The AI's reasoning for this recommendation.
   * 1–2 sentences. Reads as editorial copy, not metadata.
   */
  aiReasoning?: string;
  /** Mood descriptors for this film (1–3) */
  moods?: MovieMood[];
  /** Director name */
  director?: string;
  /** Whether already in user's watchlist */
  isInWatchlist?: boolean;
}

export interface RecommendationCardProps {
  /** Movie data */
  movie: RecommendationMovie;
  /** Card press — navigate to detail */
  onPress?: (movieId: string, e?: GestureResponderEvent) => void;
  /** Watchlist toggle */
  onWatchlistPress?: (movieId: string, isAdding: boolean) => void;
  /**
   * Display mode:
   *  - "full"    → poster left + full editorial content right (default)
   *  - "compact" → same layout, less vertical padding, no AI reasoning
   */
  mode?: 'full' | 'compact';
  /** Whether this card's entry should be animated on mount */
  animateEntry?: boolean;
  /** Stagger delay in ms for list contexts (used with animateEntry) */
  entryDelay?: number;
  /** Additional container style — use sparingly */
  style?: ViewStyle;
  /** Accessibility label override */
  accessibilityLabel?: string;
}

// ─── Internal sub-types ───────────────────────────────────────────────────────

interface MoodConfig {
  label: string;
  color: string;
  background: string;
}

// ─── Mood Token Map ───────────────────────────────────────────────────────────
// Each mood gets its own restrained color treatment.
// Colors are taken from the design system palette — no raw hex.

const MOOD_CONFIG: Record<MovieMood, MoodConfig> = {
  thrilling:      { label: 'Thrilling',      color: colors.accents.cinemaRedGlow,  background: 'rgba(239, 68, 68, 0.10)' },
  heartwarming:   { label: 'Heartwarming',   color: colors.accents.amberWarmGlow,  background: 'rgba(252, 211, 77, 0.10)' },
  'mind-bending': { label: 'Mind-Bending',   color: colors.accents.purpleLight,    background: 'rgba(167, 139, 250, 0.10)' },
  'darkly funny': { label: 'Darkly Funny',   color: colors.accents.amberDeep,      background: 'rgba(217, 119, 6, 0.10)' },
  epic:           { label: 'Epic',           color: colors.accents.electricBlue,   background: 'rgba(59, 130, 246, 0.10)' },
  haunting:       { label: 'Haunting',       color: colors.accents.purpleDeep,     background: 'rgba(91, 33, 182, 0.12)' },
  romantic:       { label: 'Romantic',       color: colors.accents.cinemaRedGlow,  background: 'rgba(239, 68, 68, 0.08)' },
  unsettling:     { label: 'Unsettling',     color: colors.text.tertiary,          background: 'rgba(156, 163, 175, 0.10)' },
  inspiring:      { label: 'Inspiring',      color: colors.accents.teelGreen,      background: 'rgba(16, 185, 129, 0.10)' },
  meditative:     { label: 'Meditative',     color: colors.accents.blueLight,      background: 'rgba(96, 165, 250, 0.10)' },
};

// ─── Rating helpers ───────────────────────────────────────────────────────────

function getRatingColor(rating: number): string {
  if (rating >= 8.0) return colors.accents.teelGreen;
  if (rating >= 6.5) return colors.accents.amberwarm;
  return colors.text.tertiary;
}

function formatRating(rating: number): string {
  return rating.toFixed(1);
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
// Animated fill bar. Width animates from 0 → score on mount.

const ConfidenceBar: React.FC<{
  score: number;  // 0–100
  reduceMotion: boolean;
}> = ({ score, reduceMotion }) => {
  const fillWidth = useSharedValue(reduceMotion ? score : 0);

  useEffect(() => {
    if (!reduceMotion) {
      fillWidth.value = withDelay(
        400,
        withTiming(score, { duration: 600 }),
      );
    }
  }, [score, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%` as any,
  }));

  const fillColor =
    score >= 85
      ? colors.accents.teelGreen
      : score >= 70
      ? colors.accents.amberwarm
      : colors.accents.electricBlue;

  return (
    <View style={styles.confidenceBar}>
      <View style={styles.confidenceTrack}>
        <Animated.View
          style={[
            styles.confidenceFill,
            { backgroundColor: fillColor },
            fillStyle,
          ]}
        />
      </View>
      <Text
        style={[styles.confidenceLabel, { color: fillColor }]}
        allowFontScaling={false}
        accessibilityLabel={`${score} percent confidence match`}
      >
        {score}%
      </Text>
    </View>
  );
};

// ─── Mood Tag ─────────────────────────────────────────────────────────────────

const MoodTag: React.FC<{ mood: MovieMood }> = ({ mood }) => {
  const config = MOOD_CONFIG[mood];
  return (
    <View style={[styles.moodTag, { backgroundColor: config.background }]}>
      <Text
        style={[styles.moodText, { color: config.color }]}
        allowFontScaling={false}
      >
        {config.label}
      </Text>
    </View>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  movie,
  onPress,
  onWatchlistPress,
  mode = 'full',
  animateEntry = false,
  entryDelay = 0,
  style,
  accessibilityLabel,
}) => {
  // ── Reduce motion ────────────────────────────────────────────────────────────
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // ── Watchlist state ──────────────────────────────────────────────────────────
  const [inWatchlist, setInWatchlist] = useState(movie.isInWatchlist ?? false);

  // ── Entry animation ──────────────────────────────────────────────────────────
  const entryOpacity = useSharedValue(animateEntry ? 0 : 1);
  const entryTranslateY = useSharedValue(animateEntry ? 16 : 0);

  useEffect(() => {
    if (animateEntry && !reduceMotion) {
      entryOpacity.value = withDelay(entryDelay, withTiming(1, { duration: 400 }));
      entryTranslateY.value = withDelay(
        entryDelay,
        withSpring(0, { damping: 20, stiffness: 280 }),
      );
    } else if (animateEntry) {
      entryOpacity.value = withDelay(entryDelay, withTiming(1, { duration: 300 }));
    }
  }, [animateEntry, entryDelay, reduceMotion]);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: reduceMotion ? [] : [{ translateY: entryTranslateY.value }],
  }));

  // ── Press animation ──────────────────────────────────────────────────────────
  const scale = useSharedValue<number>(1);
  const pressOpacity = useSharedValue<number>(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: reduceMotion ? [] : [{ scale: scale.value }],
    opacity: pressOpacity.value,
  }));

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handlePressIn = useCallback(() => {
    if (!reduceMotion) {
      scale.value = withSpring(SCALE_PRESSED, SPRING_PRESS_IN);
    }
    pressOpacity.value = withTiming(0.88, { duration: 80 });

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { /* silently degrade */ }
  }, [reduceMotion]);

  const handlePressOut = useCallback(() => {
    if (!reduceMotion) {
      scale.value = withSpring(1, SPRING_PRESS_OUT);
    }
    pressOpacity.value = withTiming(1, { duration: 120 });
  }, [reduceMotion]);

  const handlePress = useCallback(
    (e?: GestureResponderEvent) => {
      onPress?.(movie.id, e);
    },
    [movie.id, onPress],
  );

  const handleWatchlistPress = useCallback(
    (e: GestureResponderEvent) => {
      e.stopPropagation();

      const next = !inWatchlist;
      setInWatchlist(next);
      onWatchlistPress?.(movie.id, next);

      try {
        Haptics.impactAsync(
          next
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light,
        );
      } catch { /* silently degrade */ }
    },
    [inWatchlist, movie.id, onWatchlistPress],
  );

  // ── Derived display values ───────────────────────────────────────────────────
  const isCompact = mode === 'compact';
  const hasReasoning = !!movie.aiReasoning && !isCompact;
  const hasConfidence = typeof movie.confidenceScore === 'number';
  const displayMoods = useMemo(
    () => (movie.moods ?? []).slice(0, 2),
    [movie.moods],
  );
  const ratingColor = useMemo(
    () => (movie.rating != null ? getRatingColor(movie.rating) : colors.text.tertiary),
    [movie.rating],
  );

  // Full accessible label — describes the recommendation context
  const a11yLabel = useMemo(() => {
    if (accessibilityLabel) return accessibilityLabel;

    const parts: string[] = [`${movie.title}, ${movie.year}`];
    if (movie.genre) parts.push(movie.genre);
    if (movie.rating != null) parts.push(`rated ${formatRating(movie.rating)} out of 10`);
    if (hasConfidence) parts.push(`${movie.confidenceScore}% match`);
    if (movie.aiReasoning) parts.push(movie.aiReasoning);
    parts.push('Double tap to view details');
    return parts.join('. ');
  }, [movie, hasConfidence, accessibilityLabel]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Animated.View style={[entryStyle, styles.entryWrapper, style]}>
      <Animated.View style={[pressStyle, styles.cardWrapper]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessible
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          style={styles.pressable}
        >
          {/* ── Surface ─────────────────────────────────────────────── */}
          <View style={styles.surface}>

            {/* ── Poster column ─────────────────────────────────────── */}
            <View style={isCompact ? styles.posterCompact : styles.poster}>
              {/* Poster image with blurhash placeholder */}
              <Image
                source={{ uri: movie.posterUrl }}
                placeholder={movie.blurhash}
                contentFit="cover"
                transition={300}
                style={StyleSheet.absoluteFill}
                accessibilityIgnoresInvertColors
              />

              {/* Bottom gradient — pulls poster into card surface */}
              <LinearGradient
                colors={['transparent', colors.surfaces.level3]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 0, y: 1 }}
                style={styles.posterGradient}
                pointerEvents="none"
              />

              {/* Rating badge — anchored top-left of poster */}
              {movie.rating != null && (
                <View style={styles.ratingBadge}>
                  <MaterialCommunityIcons
                    name="star"
                    size={9}
                    color={ratingColor}
                  />
                  <Text
                    style={[styles.ratingText, { color: ratingColor }]}
                    allowFontScaling={false}
                  >
                    {formatRating(movie.rating)}
                  </Text>
                </View>
              )}

              {/* Watchlist button — anchored top-right of poster */}
              <Pressable
                onPress={handleWatchlistPress}
                accessible
                accessibilityRole="button"
                accessibilityLabel={
                  inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'
                }
                accessibilityState={{ checked: inWatchlist }}
                style={styles.watchlistButton}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name={inWatchlist ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                  color={inWatchlist ? colors.accents.amberwarm : colors.text.secondary}
                />
              </Pressable>
            </View>

            {/* ── Content column ────────────────────────────────────── */}
            <View style={[styles.content, isCompact && styles.contentCompact]}>

              {/* AI source line — restrained editorial label */}
              <View style={styles.sourceRow}>
                <MaterialCommunityIcons
                  name="creation"
                  size={10}
                  color={colors.accents.amberwarm}
                />
                <Text
                  style={styles.sourceLabel}
                  allowFontScaling={false}
                >
                  CINE AI PICK
                </Text>
              </View>

              {/* Title — primary editorial hierarchy */}
              <Text
                style={styles.title}
                numberOfLines={isCompact ? 1 : 2}
                allowFontScaling={false}
              >
                {movie.title}
              </Text>

              {/* Meta row: year · director */}
              <View style={styles.metaRow}>
                <Text style={styles.metaText} allowFontScaling={false}>
                  {movie.year}
                </Text>
                {movie.director ? (
                  <>
                    <View style={styles.metaDot} />
                    <Text
                      style={styles.metaText}
                      numberOfLines={1}
                      allowFontScaling={false}
                    >
                      {movie.director}
                    </Text>
                  </>
                ) : null}
              </View>

              {/* Genre */}
              {movie.genre ? (
                <Text
                  style={styles.genre}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {movie.genre}
                </Text>
              ) : null}

              {/* Mood tags — at most 2, rendered inline */}
              {displayMoods.length > 0 && (
                <View style={styles.moodRow}>
                  {displayMoods.map((mood) => (
                    <MoodTag key={mood} mood={mood} />
                  ))}
                </View>
              )}

              {/* AI reasoning — editorial copy, not metadata */}
              {hasReasoning ? (
                <Text
                  style={styles.reasoning}
                  numberOfLines={3}
                  allowFontScaling={false}
                >
                  {movie.aiReasoning}
                </Text>
              ) : null}

              {/* Confidence bar — visual AI confidence readout */}
              {hasConfidence && (
                <View style={styles.confidenceSection}>
                  <Text style={styles.confidenceHeading} allowFontScaling={false}>
                    Match
                  </Text>
                  <ConfidenceBar
                    score={movie.confidenceScore!}
                    reduceMotion={reduceMotion}
                  />
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

RecommendationCard.displayName = 'RecommendationCard';

// ─── Styles ───────────────────────────────────────────────────────────────────
//
// Sizing philosophy:
//   Poster: fixed 96px wide — editorial column, not the hero.
//   Content: flex: 1 — the reasoning and hierarchy expand naturally.
//   Card: minHeight 130 — virtualization-safe, no intrinsic size dependency.
//

const POSTER_WIDTH = 96;
const POSTER_ASPECT = 3 / 4; // Taller than movie ratio — more editorial
const POSTER_HEIGHT = POSTER_WIDTH / POSTER_ASPECT;

const styles = StyleSheet.create({
  entryWrapper: {
    // Outer wrapper holds entry animation transform
  },
  cardWrapper: {
    // Inner wrapper holds press animation transform
    // Static shadow — not animated
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
    borderRadius: 16,
  },
  pressable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  surface: {
    flexDirection: 'row',
    backgroundColor: colors.surfaces.level2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borders.subtle,
    minHeight: POSTER_HEIGHT,
    overflow: 'hidden',
  },

  // ── Poster ──────────────────────────────────────────────────────────────────
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
  },
  posterCompact: {
    width: POSTER_WIDTH - 12,
    height: POSTER_HEIGHT - 16,
  },
  posterGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 9, 11, 0.72)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 3,
    // Margin spacing via position, not margin — virtualization safe
  },
  ratingText: {
    ...typography.metadata.xs,
    fontWeight: '600',
    marginLeft: 2,
  },
  watchlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(9, 9, 11, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Content ─────────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    paddingLeft: spacing.section.xs,    // 12px — breathing room between poster and text
    paddingRight: spacing.section.sm,   // 16px
    paddingTop: spacing.section.xs,     // 12px
    paddingBottom: spacing.section.xs,  // 12px
  },
  contentCompact: {
    paddingTop: spacing.micro.xl,   // 12px — same but explicit for compact
    paddingBottom: spacing.micro.xl,
  },

  // Source label: "CINE AI PICK"
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.micro.sm,   // 4px
  },
  sourceLabel: {
    ...typography.metadata.xs,
    color: colors.accents.amberwarm,
    letterSpacing: 1.0,
    marginLeft: 4,
    fontSize: 9,
    fontWeight: '600',
  },

  // Title
  title: {
    ...typography.heading.sm,
    color: colors.text.primary,
    marginBottom: spacing.micro.sm,   // 4px
    lineHeight: 21,
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.micro.sm,   // 4px
  },
  metaText: {
    ...typography.metadata.sm,
    color: colors.text.tertiary,
    flexShrink: 1,
  },
  metaDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: colors.text.hint,
    marginHorizontal: 5,
  },

  // Genre
  genre: {
    ...typography.metadata.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.micro.md,   // 6px
  },

  // Mood tags
  moodRow: {
    flexDirection: 'row',
    marginBottom: spacing.micro.lg,   // 8px
    flexWrap: 'nowrap',
  },
  moodTag: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: spacing.micro.sm,    // 4px — margin replaces gap for RN compat
  },
  moodText: {
    fontSize: 9,
    fontFamily: typography.fonts.interSemibold,
    letterSpacing: 0.3,
  },

  // AI reasoning
  reasoning: {
    ...typography.body.xs,
    color: colors.text.secondary,
    lineHeight: 17,
    marginBottom: spacing.micro.lg,  // 8px
    opacity: 0.88,
  },

  // Confidence section
  confidenceSection: {
    marginTop: 'auto',
  },
  confidenceHeading: {
    ...typography.metadata.xs,
    color: colors.text.hint,
    marginBottom: spacing.micro.sm,  // 4px
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontSize: 8,
  },
  confidenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceTrack: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borders.subtle,
    borderRadius: 1,
    overflow: 'hidden',
    marginRight: spacing.micro.md,   // 6px
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 1,
  },
  confidenceLabel: {
    ...typography.metadata.xs,
    fontWeight: '600',
    fontSize: 10,
    minWidth: 30,
    textAlign: 'right',
  },
});

export default RecommendationCard;
