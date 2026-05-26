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
const CARD_HEIGHT = CARD_WIDTH * 1.5;

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
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color={Colors.gold} />
              <Text style={styles.ratingBadgeText}>{movie.vote_average.toFixed(1)}</Text>
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
        {showRating && (
          <View style={styles.ratingBadgeContainer}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color={Colors.gold} />
              <Text style={styles.ratingBadgeText}>{movie.vote_average.toFixed(1)}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{movie.title}</Text>
        <Text style={styles.cardYear} numberOfLines={1}>
          {movie.release_date?.split('-')[0] || '—'}
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
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  ratingBadgeContainer: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  ratingBadgeText: {
    color: Colors.gold,
    fontSize: Typography.xs,
    fontFamily: 'Inter_600SemiBold',
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
  cardYear: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
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
