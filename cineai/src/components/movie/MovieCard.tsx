import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { Movie } from '../../types';
import { getPosterUrl, getBackdropUrl } from '../../services/tmdbApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getLanguageLabel = (lang: string): string => {
  const map: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    te: 'Telugu',
    ta: 'Tamil',
    ml: 'Malayalam',
    kn: 'Kannada',
    ko: 'Korean',
    ja: 'Japanese',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    zh: 'Chinese',
  };
  return map[lang.toLowerCase()] || lang.toUpperCase();
};

const getCountryLabel = (lang: string): string => {
  const map: Record<string, string> = {
    en: 'USA',
    hi: 'India',
    te: 'India',
    ta: 'India',
    ml: 'India',
    kn: 'India',
    ko: 'Korea',
    ja: 'Japan',
    es: 'Spain',
    fr: 'France',
    de: 'Germany',
    it: 'Italy',
    zh: 'China',
  };
  return map[lang.toLowerCase()] || 'International';
};

const getGenreNames = (genreIds: number[] | undefined): string => {
  if (!genreIds || genreIds.length === 0) return 'Cinema';
  const map: Record<number, string> = {
    28: 'Action',
    12: 'Adventure',
    16: 'Anime',
    35: 'Comedy',
    80: 'Crime',
    18: 'Drama',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Sci-Fi',
    27: 'Horror',
    14: 'Fantasy',
    53: 'Thriller',
    36: 'History',
    10402: 'Musical',
    10751: 'Family',
  };
  return genreIds.map(id => map[id]).filter(Boolean).slice(0, 2).join(' • ');
};

interface MovieCardProps {
  movie: Movie;
  onPress: (movie: Movie) => void;
  width?: number;
  showRating?: boolean;
  variant?: 'portrait' | 'landscape' | 'featured';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPress,
  width = CARD_WIDTH,
  showRating = true,
  variant = 'portrait',
}) => {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.3);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    shadowOpacity.value = withTiming(0.6);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    shadowOpacity.value = withTiming(0.3);
  };

  if (variant === 'featured') {
    return (
      <AnimatedPressable
        onPress={() => onPress(movie)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, styles.featuredCard]}
      >
        <Image
          source={{ uri: getBackdropUrl(movie.backdrop_path) }}
          style={styles.featuredImage}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,15,0.75)', Colors.background]}
          style={styles.featuredGradient}
        />
        <View style={styles.featuredContent}>
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadgeFeatured}>
              <Ionicons name="star" size={10} color={Colors.gold} />
              <Text style={styles.ratingBadgeTextFeatured}>{movie.vote_average.toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>{movie.title}</Text>
          <Text style={styles.featuredYear}>{movie.release_date?.split('-')[0]}</Text>
        </View>
      </AnimatedPressable>
    );
  }

  if (variant === 'landscape') {
    return (
      <AnimatedPressable
        onPress={() => onPress(movie)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, styles.landscapeCard]}
      >
        <Image
          source={{ uri: getBackdropUrl(movie.backdrop_path) }}
          style={styles.landscapeImage}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,15,0.9)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.landscapeContent}>
          <Text style={styles.landscapeTitle} numberOfLines={1}>{movie.title}</Text>
          {showRating && (
            <View style={styles.landscapeRatingRow}>
              <Ionicons name="star" size={10} color={Colors.gold} />
              <Text style={styles.landscapeRating}>{movie.vote_average.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </AnimatedPressable>
    );
  }

  // Portrait (default)
  const year = movie.release_date ? movie.release_date.split('-')[0] : '—';
  const country = getCountryLabel(movie.original_language || 'en');
  const genres = getGenreNames(movie.genre_ids);

  return (
    <AnimatedPressable
      onPress={() => onPress(movie)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, { width }, styles.card]}
    >
      <View style={[styles.imageContainer, { height: width * 1.5 }]}>
        <Image
          source={{ uri: getPosterUrl(movie.poster_path) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,15,0.85)']}
          style={styles.cardGradient}
        />
        {showRating && movie.vote_average > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={8} color={Colors.gold} />
            <Text style={styles.ratingText}>{movie.vote_average.toFixed(1)}</Text>
          </View>
        )}
        {movie.original_language && (
          <View style={styles.langBadge}>
            <Text style={styles.langText}>{(movie.original_language).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{movie.title}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {year} • {country}
        </Text>
        <Text style={styles.cardGenres} numberOfLines={1}>
          {genres}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginRight: Spacing.md,
    ...Shadows.md,
  },
  imageContainer: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    position: 'relative',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.82)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 0.5,
    borderColor: 'rgba(255,183,3,0.3)',
    zIndex: 5,
  },
  ratingText: {
    color: Colors.gold,
    fontSize: Typography.xs - 2,
    fontFamily: 'Inter_600SemiBold',
  },
  langBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.82)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 5,
  },
  langText: {
    color: Colors.white,
    fontSize: Typography.xs - 2.5,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  cardContent: {
    paddingTop: Spacing.xs + 2,
    paddingHorizontal: 2,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.1,
  },
  cardMeta: {
    color: Colors.textMuted,
    fontSize: Typography.xs - 1.5,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  cardGenres: {
    color: Colors.textSecondary,
    fontSize: Typography.xs - 2,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },

  // Featured variant
  featuredCard: {
    width: SCREEN_WIDTH - Spacing.base * 2,
    height: 220,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginRight: Spacing.md,
    ...Shadows.lg,
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  ratingBadgeFeatured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  ratingBadgeTextFeatured: {
    color: Colors.gold,
    fontSize: Typography.xs,
    fontFamily: 'Inter_600SemiBold',
  },
  featuredTitle: {
    color: Colors.white,
    fontSize: Typography['2xl'],
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
    lineHeight: Typography['2xl'] * 1.2,
  },
  featuredYear: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },

  // Landscape variant
  landscapeCard: {
    width: 200,
    height: 120,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  landscapeImage: {
    ...StyleSheet.absoluteFillObject,
  },
  landscapeContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  landscapeTitle: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontFamily: 'Inter_600SemiBold',
  },
  landscapeRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  landscapeRating: {
    color: Colors.gold,
    fontSize: Typography.xs,
    fontFamily: 'Inter_500Medium',
  },
});

export default React.memo(MovieCard);
