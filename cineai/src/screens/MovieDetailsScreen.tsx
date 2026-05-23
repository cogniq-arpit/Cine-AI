import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Linking,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolate,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/theme';
import { MovieDetails, CastMember, WatchProvider, Movie } from '../types';
import { getPosterUrl, getBackdropUrl, getProfileUrl } from '../services/omdbApi';
import omdbApi from '../services/omdbApi';
import { useWatchlistStore } from '../store/watchlistStore';
import { MovieCard } from '../components/movie/MovieCard';
import type { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');
const BACKDROP_HEIGHT = height * 0.50;
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type MovieDetailsRoute = RouteProp<RootStackParamList, 'MovieDetails'>;

// ─── Rating Stars ──────────────────────────────────────────────────────────
const RatingStars: React.FC<{ rating: number }> = ({ rating }) => {
  const stars = Math.round(rating / 2);
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons 
          key={i} 
          name={i <= stars ? "star" : "star-outline"} 
          size={12} 
          color={Colors.gold} 
        />
      ))}
    </View>
  );
};

// ─── Cast Card ─────────────────────────────────────────────────────────────
const CastCard: React.FC<{ member: CastMember }> = ({ member }) => (
  <View style={castStyles.card}>
    <Image
      source={{ uri: getProfileUrl(member.profile_path) }}
      style={castStyles.avatar}
      contentFit="cover"
    />
    <Text style={castStyles.name} numberOfLines={1}>{member.name}</Text>
    <Text style={castStyles.character} numberOfLines={1}>{member.character}</Text>
  </View>
);

const castStyles = StyleSheet.create({
  card: {
    width: 80,
    marginRight: Spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.card,
    marginBottom: Spacing.xs,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  character: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});

// ─── Watch Provider Button ──────────────────────────────────────────────────
const ProviderButton: React.FC<{ provider: WatchProvider; link: string }> = ({ provider, link }) => {
  const logoUri = provider.logo_path
    ? (provider.logo_path.startsWith('http') ? provider.logo_path : `https://image.tmdb.org/t/p/w92${provider.logo_path}`)
    : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=92&auto=format&fit=crop';

  return (
    <Pressable
      onPress={() => link && Linking.openURL(link).catch(console.warn)}
      style={providerStyles.btn}
    >
      <Image
        source={{ uri: logoUri }}
        style={providerStyles.logo}
        contentFit="cover"
      />
      <Text style={providerStyles.name} numberOfLines={1}>{provider.provider_name}</Text>
    </Pressable>
  );
};

const providerStyles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    marginRight: Spacing.md,
    gap: Spacing.xs,
    maxWidth: 72,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
  },
  name: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});

// ─── Main Screen ────────────────────────────────────────────────────────────
export const MovieDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<MovieDetailsRoute>();
  const { movieId } = route.params;

  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [certification, setCertification] = useState('NR');

  const inWatchlist = movie ? isInWatchlist(movie.id) : false;
  const watchlistScale = useSharedValue(1);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  const backdropStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, BACKDROP_HEIGHT], [0, BACKDROP_HEIGHT * 0.4], Extrapolate.CLAMP) },
    ],
    opacity: interpolate(scrollY.value, [0, BACKDROP_HEIGHT * 0.7], [1, 0.3], Extrapolate.CLAMP),
  }));

  const headerBgStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(10,10,15,${interpolate(scrollY.value, [0, 100], [0, 0.95], Extrapolate.CLAMP)})`,
  }));

  const watchlistBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: watchlistScale.value }],
  }));

  useEffect(() => {
    loadMovieDetails();
  }, [movieId]);

  const loadMovieDetails = async () => {
    setIsLoading(true);
    try {
      const [details, cert] = await Promise.all([
        omdbApi.getMovieDetails(movieId),
        omdbApi.getCertification(movieId),
      ]);
      setMovie(details);
      setCertification(cert);
    } catch (err) {
      console.error('Failed to load movie details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchlistToggle = () => {
    if (!movie) return;
    watchlistScale.value = withSpring(0.85, { damping: 10 }, () => {
      watchlistScale.value = withSpring(1, { damping: 10 });
    });
    if (inWatchlist) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  };

  const navigateToMovie = (m: Movie) => {
    navigation.push('MovieDetails', { movieId: m.id });
  };

  // Extract data
  const trailer = movie?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const director = movie?.credits?.crew?.find(c => c.job === 'Director');
  const cast = movie?.credits?.cast?.slice(0, 15) || [];
  const usProviders = movie?.['watch/providers']?.results?.['US'];
  const providers = [...(usProviders?.flatrate || []), ...(usProviders?.rent?.slice(0, 2) || [])];
  const similarMovies = movie?.similar?.results?.slice(0, 10) || [];
  const runtime = movie?.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : '—';

  const handleWatchNow = () => {
    if (!movie) return;
    const watchLink = usProviders?.link || `https://www.google.com/search?q=where+to+watch+${encodeURIComponent(movie.title)}+movie`;
    Linking.openURL(watchLink).catch(console.warn);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ color: Colors.textSecondary }}>Failed to load movie</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: Colors.primary, marginTop: 16 }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating Header */}
      <Animated.View style={[styles.floatingHeader, headerBgStyle]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={15} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={Colors.white} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>{movie.title}</Text>
            <Animated.View style={watchlistBtnStyle}>
              <Pressable onPress={handleWatchlistToggle} hitSlop={15} style={styles.watchlistBtn}>
                <Ionicons 
                  name={inWatchlist ? "heart" : "heart-outline"} 
                  size={22} 
                  color={inWatchlist ? Colors.primary : Colors.white} 
                />
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* BACKDROP */}
        <View style={styles.backdropContainer}>
          <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
            <Image
              source={{ uri: getBackdropUrl(movie.backdrop_path) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          </Animated.View>
          <LinearGradient
            colors={['transparent', 'rgba(10,10,15,0.6)', Colors.background]}
            style={StyleSheet.absoluteFill}
            locations={[0.3, 0.7, 1]}
          />

          {/* Trailer button overlay */}
          {trailer && (
            <Pressable
              onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`)}
              style={styles.trailerPlayBtn}
            >
              <View style={styles.trailerPlayCircle}>
                <Ionicons name="play" size={32} color={Colors.white} style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.trailerPlayText}>Play Trailer</Text>
            </Pressable>
          )}
        </View>

        {/* MOVIE INFO */}
        <View style={styles.contentContainer}>
          {/* Poster + Meta */}
          <View style={styles.posterRow}>
            <Image
              source={{ uri: getPosterUrl(movie.poster_path) }}
              style={styles.poster}
              contentFit="cover"
            />
            <View style={styles.metaColumn}>
              <Text style={styles.title}>{movie.title}</Text>
              {movie.tagline ? (
                <Text style={styles.tagline}>"{movie.tagline}"</Text>
              ) : null}

              {/* Badges */}
              <View style={styles.badgeRow}>
                <View style={styles.certBadge}>
                  <Text style={styles.certText}>{certification}</Text>
                </View>
                <Text style={styles.runtime}>{runtime}</Text>
                <Text style={styles.year}>{movie.release_date?.split('-')[0]}</Text>
              </View>

              {/* Rating */}
              <View style={styles.ratingRow}>
                <Text style={styles.ratingScore}>{movie.vote_average.toFixed(1)}</Text>
                <View>
                  <RatingStars rating={movie.vote_average} />
                  <Text style={styles.voteCount}>{movie.vote_count.toLocaleString()} reviews</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Genres */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreRow}>
            {movie.genres?.map(g => (
              <View key={g.id} style={styles.genreChip}>
                <Text style={styles.genreText}>{g.name}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Pressable style={styles.primaryAction} onPress={handleWatchNow}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Ionicons name="play" size={18} color={Colors.white} />
                  <Text style={styles.primaryActionText}>Watch Now</Text>
                </View>
              </LinearGradient>
            </Pressable>
            <Pressable 
              onPress={handleWatchlistToggle} 
              hitSlop={12} 
              style={[styles.secondaryAction, inWatchlist && styles.secondaryActionActive]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons 
                  name={inWatchlist ? "heart" : "add-outline"} 
                  size={16} 
                  color={inWatchlist ? Colors.primary : Colors.textSecondary} 
                />
                <Text style={[styles.secondaryActionText, inWatchlist && styles.secondaryActionTextActive]}>
                  {inWatchlist ? 'Saved' : 'Watchlist'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text
              style={styles.overview}
              numberOfLines={isOverviewExpanded ? undefined : 4}
            >
              {movie.overview}
            </Text>
            {movie.overview.length > 200 && (
              <Pressable onPress={() => setIsOverviewExpanded(prev => !prev)}>
                <Text style={styles.readMore}>{isOverviewExpanded ? 'Show less ↑' : 'Read more ↓'}</Text>
              </Pressable>
            )}
          </View>

          {/* Director */}
          {director && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Director</Text>
              <Text style={styles.infoValue}>{director.name}</Text>
            </View>
          )}

          {/* Watch On */}
          {providers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available On</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: Spacing.sm }}>
                {providers.map(p => (
                  <ProviderButton key={p.provider_id} provider={p} link={usProviders?.link || ''} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: Spacing.sm }}>
                {cast.map(member => (
                  <CastCard key={member.id} member={member} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Similar Movies */}
          {similarMovies.length > 0 && (
            <View style={[styles.section, { marginBottom: 100 }]}>
              <Text style={styles.sectionTitle}>More Like This</Text>
              <FlatList
                data={similarMovies}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ paddingVertical: Spacing.sm }}
                renderItem={({ item }) => (
                  <MovieCard movie={item} onPress={navigateToMovie} />
                )}
              />
            </View>
          )}
        </View>
      </AnimatedScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: Colors.white, fontSize: 20 },
  headerTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: 'Inter_600SemiBold',
  },
  watchlistBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchlistIcon: { fontSize: 18 },
  backdropContainer: {
    height: BACKDROP_HEIGHT,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailerPlayBtn: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trailerPlayCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(230,57,70,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  trailerPlayIcon: { color: Colors.white, fontSize: 22, marginLeft: 4 },
  trailerPlayText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  contentContainer: { paddingHorizontal: Spacing.xl },
  posterRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: -80,
    marginBottom: Spacing.lg,
  },
  poster: {
    width: 110,
    height: 165,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    ...Shadows.lg,
  },
  metaColumn: { flex: 1, justifyContent: 'flex-end', paddingBottom: Spacing.xs },
  title: {
    fontSize: Typography['2xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: Typography['2xl'] * 1.2,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  certBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: 4,
  },
  certText: { color: Colors.textSecondary, fontSize: Typography.xs, fontFamily: 'Inter_600SemiBold' },
  runtime: { color: Colors.textSecondary, fontSize: Typography.xs, fontFamily: 'Inter_400Regular' },
  year: { color: Colors.textMuted, fontSize: Typography.xs, fontFamily: 'Inter_400Regular' },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ratingScore: {
    fontSize: Typography['2xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.gold,
  },
  voteCount: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  genreRow: { gap: Spacing.sm, paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
  genreChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genreText: { color: Colors.textSecondary, fontSize: Typography.xs, fontFamily: 'Inter_500Medium' },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  primaryAction: {
    flex: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  actionGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryActionText: { color: Colors.white, fontSize: Typography.base, fontFamily: 'Inter_600SemiBold' },
  secondaryAction: {
    flex: 0.6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryActionActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  secondaryActionText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontFamily: 'Inter_500Medium',
  },
  secondaryActionTextActive: { color: Colors.primary },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: Spacing.sm,
  },
  overview: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
    lineHeight: Typography.base * 1.6,
  },
  readMore: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_600SemiBold',
    marginTop: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontFamily: 'Inter_400Regular',
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_600SemiBold',
  },
});

export default MovieDetailsScreen;
