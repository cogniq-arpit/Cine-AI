/**
 * CineAI V3 — HomeScreen
 * Cinematic hero banners, AI-curated sections, horizontal carousels.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList,
  Dimensions, ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, interpolate,
  useAnimatedScrollHandler, Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing, Motion, Gradients } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useWatchlistStore } from '../../store/watchlistStore';
import omdbApi from '../../services/omdbApi';
import type { Movie, RootStackParamList } from '../../types';

const { width: W, height: H } = Dimensions.get('window');
const HERO_HEIGHT = H * 0.58;
type HomeNav = NativeStackNavigationProp<RootStackParamList>;

const POSTER_BASE = 'https://img.omdbapi.com/?apikey=3be0d3d0&i=';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

// Curated collections
const TRENDING_SEARCHES = [
  'Inception', 'Parasite', 'The Dark Knight', 'Interstellar',
  'La La Land', 'Knives Out', 'The Grand Budapest Hotel',
];
const MOOD_CATEGORIES = [
  { id: 'dark', label: 'Dark & Tense', query: 'thriller crime', color: '#1A1A2E', accent: Colors.accent.crimson },
  { id: 'feel', label: 'Feel Good', query: 'feel good comedy', color: '#1A2A1A', accent: Colors.semantic.success },
  { id: 'mind', label: 'Mind-Bending', query: 'mind bending sci-fi', color: '#1A1A2E', accent: Colors.accent.electric },
  { id: 'epic', label: 'Epic & Grand', query: 'epic adventure', color: '#2A1A0E', accent: Colors.accent.gold },
];

// ─── Movie Poster Card ─────────────────────────────────────────────────────
const PosterCard: React.FC<{ movie: Movie; onPress: () => void; rank?: number }> = ({ movie, onPress, rank }) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const poster = movie.poster_path
    ? (movie.poster_path.startsWith('http')
        ? movie.poster_path
        : `https://img.omdbapi.com/?apikey=3be0d3d0&i=${movie.poster_path}&h=400`)
    : null;


  return (
    <Animated.View style={[cardStyles.wrapper, style]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.95, Motion.springs.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, Motion.springs.bounce); }}
        onPress={onPress}
        style={cardStyles.pressable}
      >
        <Image
          source={poster ? { uri: poster } : undefined}
          style={cardStyles.poster}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(7,7,9,0.9)']}
          style={cardStyles.posterGradient}
        />
        {rank && (
          <View style={cardStyles.rankBadge}>
            <Text style={cardStyles.rankText} allowFontScaling={false}>
              {String(rank).padStart(2, '0')}
            </Text>
          </View>
        )}
        <View style={cardStyles.posterMeta}>
          <Text style={cardStyles.posterTitle} numberOfLines={2} allowFontScaling={false}>
            {movie.title}
          </Text>
          {movie.vote_average > 0 && (
            <View style={cardStyles.ratingRow}>
              <Ionicons name="star" size={10} color={Colors.accent.gold} />
              <Text style={cardStyles.ratingText} allowFontScaling={false}>
                {movie.vote_average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const cardStyles = StyleSheet.create({
  wrapper: { marginRight: 12 },
  pressable: { width: 130, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.bg.surface },
  poster: { width: 130, height: 195, borderRadius: Radius.lg },
  posterGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 },
  rankBadge: { position: 'absolute', top: 8, left: 8 },
  rankText: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, opacity: 0.7 },
  posterMeta: { position: 'absolute', bottom: 8, left: 8, right: 8 },
  posterTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.accent.gold },
});

// ─── Section Header ────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; subtitle?: string; onSeeAll?: () => void }> = ({ title, subtitle, onSeeAll }) => (
  <View style={secStyles.row}>
    <View style={secStyles.left}>
      <Text style={secStyles.title} allowFontScaling={false}>{title}</Text>
      {subtitle && <Text style={secStyles.subtitle} allowFontScaling={false}>{subtitle}</Text>}
    </View>
    {onSeeAll && (
      <Pressable onPress={onSeeAll} style={secStyles.seeAllBtn}>
        <Text style={secStyles.seeAllText} allowFontScaling={false}>See all</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.accent.crimson} />
      </Pressable>
    )}
  </View>
);

const secStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  left: { flex: 1 },
  title: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.accent.crimson },
});

// ─── Hero Banner ───────────────────────────────────────────────────────────
const HeroBanner: React.FC<{ movies: Movie[]; onPress: (id: number) => void }> = ({ movies, onPress }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (movies.length < 2) return;
    const timer = setInterval(() => {
      opacity.value = withTiming(0, { duration: 400 });
      scale.value = withTiming(0.97, { duration: 400 });
      setTimeout(() => {
        setActiveIdx(i => (i + 1) % Math.min(movies.length, 5));
        opacity.value = withTiming(1, { duration: 500 });
        scale.value = withTiming(1, { duration: 500 });
      }, 420);
    }, 5000);
    return () => clearInterval(timer);
  }, [movies.length]);

  if (!movies.length) return <View style={{ height: HERO_HEIGHT, backgroundColor: Colors.bg.surface }} />;
  const movie = movies[activeIdx];
  const backdropUrl = `https://image.tmdb.org/t/p/w780${movie.backdrop_path || ''}`;

  return (
    <Animated.View style={[heroStyles.container, heroStyle]}>
      <Pressable onPress={() => onPress(movie.id)} style={{ flex: 1 }}>
        <Image
          source={{ uri: backdropUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={500}
        />
        <LinearGradient
          colors={['transparent', 'rgba(7,7,9,0.4)', 'rgba(7,7,9,0.85)', Colors.bg.void]}
          locations={[0, 0.3, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={heroStyles.content}>
          <View style={heroStyles.aiChip}>
            <Ionicons name="sparkles" size={11} color={Colors.accent.crimson} />
            <Text style={heroStyles.aiChipText} allowFontScaling={false}>AI Pick Tonight</Text>
          </View>
          <Text style={heroStyles.movieTitle} numberOfLines={2} allowFontScaling={false}>
            {movie.title}
          </Text>
          <View style={heroStyles.metaRow}>
            {movie.release_date && (
              <Text style={heroStyles.metaText} allowFontScaling={false}>
                {new Date(movie.release_date).getFullYear()}
              </Text>
            )}
            {movie.vote_average > 0 && (
              <>
                <View style={heroStyles.metaDot} />
                <Ionicons name="star" size={12} color={Colors.accent.gold} />
                <Text style={[heroStyles.metaText, { color: Colors.accent.gold }]} allowFontScaling={false}>
                  {movie.vote_average.toFixed(1)}
                </Text>
              </>
            )}
          </View>
          <View style={heroStyles.actions}>
            <Pressable style={heroStyles.playBtn}>
              <Ionicons name="play" size={16} color={Colors.text.onAccent} />
              <Text style={heroStyles.playText} allowFontScaling={false}>Trailer</Text>
            </Pressable>
            <Pressable style={heroStyles.infoBtn}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.text.primary} />
              <Text style={heroStyles.infoText} allowFontScaling={false}>More Info</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>

      {/* Dot indicators */}
      <View style={heroStyles.dots}>
        {movies.slice(0, 5).map((_, i) => (
          <View
            key={i}
            style={[heroStyles.dot, i === activeIdx && heroStyles.dotActive]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const heroStyles = StyleSheet.create({
  container: { height: HERO_HEIGHT, position: 'relative' },
  content: { position: 'absolute', bottom: 32, left: 20, right: 20 },
  aiChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: `${Colors.accent.crimson}20`, borderRadius: Radius.full,
    borderWidth: 1, borderColor: `${Colors.accent.crimson}40`,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12,
  },
  aiChipText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.accent.crimson, letterSpacing: 0.5 },
  movieTitle: {
    fontSize: 36, fontFamily: 'Poppins_700Bold', color: Colors.text.primary,
    lineHeight: 42, letterSpacing: -0.5, marginBottom: 10,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  metaText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.text.tertiary },
  actions: { flexDirection: 'row', gap: 12 },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent.crimson, borderRadius: Radius.md,
    paddingHorizontal: 20, paddingVertical: 12,
    shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  playText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.onAccent },
  infoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.glass.medium, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.glass.border,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  infoText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  dots: { position: 'absolute', bottom: 8, right: 20, flexDirection: 'row', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.glass.medium },
  dotActive: { width: 16, backgroundColor: Colors.accent.crimson },
});

// ─── HomeScreen ────────────────────────────────────────────────────────────
export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNav>();
  const { profile } = useAuthStore();

  const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0.85], Extrapolate.CLAMP),
    borderBottomColor: `rgba(255,255,255,${interpolate(scrollY.value, [0, 60], [0, 0.08], Extrapolate.CLAMP)})`,
    borderBottomWidth: 1,
  }));

  const fetchData = useCallback(async () => {
    try {
      const queries = ['Inception', 'Parasite', 'The Dark Knight', 'Interstellar', 'Dune'];
      const trendingQueries = ['Oppenheimer', 'Killers of the Flower Moon', 'Poor Things', 'Past Lives', 'Anatomy of a Fall'];
      const newQ = ['The Holdovers', 'American Fiction', 'Society of the Snow', 'Nyad'];

      const fetchBatch = async (qs: string[]): Promise<Movie[]> => {
        const results: Movie[] = [];
        for (const q of qs) {
          try {
            const r = await omdbApi.searchMovies(q, 1);
            if (r.results[0] && !results.find(m => m.id === r.results[0].id)) {
              results.push(r.results[0]);
            }
          } catch { /* silent */ }
        }
        return results;
      };

      const [hero, trend, rec, newR] = await Promise.all([
        fetchBatch(queries),
        fetchBatch(trendingQueries),
        fetchBatch(['La La Land', 'Moonlight', 'Marriage Story', 'Manchester by the Sea', 'Nomadland']),
        fetchBatch(newQ),
      ]);

      setHeroMovies(hero);
      setTrending(trend);
      setRecommended(rec);
      setNewReleases(newR);
    } catch (e) {
      console.error('Home fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };
  const goToMovie = (id: number) => navigation.navigate('MovieDetails', { movieId: id });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <View style={[styles.loadingRoot, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg.void} />
        <ActivityIndicator size="large" color={Colors.accent.crimson} />
        <Text style={styles.loadingText} allowFontScaling={false}>Loading your cinema...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Sticky Header */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]}>
        <View>
          <Text style={styles.greeting} allowFontScaling={false}>{greeting()}</Text>
          <Text style={styles.headerWordmark} allowFontScaling={false}>
            CINE<Text style={styles.headerAI}>AI</Text>
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text.secondary} />
          </Pressable>
          <Pressable
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Main' as any)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText} allowFontScaling={false}>
                {(profile?.name?.[0] || 'G').toUpperCase()}
              </Text>
            </View>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.crimson} />
        }
      >
        {/* Hero */}
        <HeroBanner movies={heroMovies} onPress={goToMovie} />

        {/* Trending Now */}
        <View style={styles.section}>
          <SectionHeader title="Trending Now" subtitle="What the world is watching" />
          <FlatList
            data={trending}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={m => String(m.id)}
            contentContainerStyle={styles.carouselPad}
            renderItem={({ item, index }) => (
              <PosterCard movie={item} rank={index + 1} onPress={() => goToMovie(item.id)} />
            )}
          />
        </View>

        {/* AI Recommends */}
        <View style={styles.section}>
          <SectionHeader
            title="CineAI Recommends"
            subtitle="Curated for your taste"
            onSeeAll={() => {}}
          />
          <FlatList
            data={recommended}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={m => String(m.id)}
            contentContainerStyle={styles.carouselPad}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => goToMovie(item.id)}
                style={styles.editorialCard}
              >
                <Image
                  source={{ uri: item.poster_path && item.poster_path.startsWith('http') ? item.poster_path : `https://img.omdbapi.com/?apikey=3be0d3d0&i=${item.poster_path}&h=300` }}
                  style={styles.editorialPoster}
                  contentFit="cover"
                />
                <LinearGradient colors={['transparent', 'rgba(7,7,9,0.95)']} style={styles.editorialGrad} />
                <View style={styles.editorialMeta}>
                  <View style={styles.aiMatchChip}>
                    <Ionicons name="sparkles" size={10} color={Colors.accent.crimson} />
                    <Text style={styles.aiMatchText} allowFontScaling={false}>
                      {Math.floor(Math.random() * 12 + 87)}% Match
                    </Text>
                  </View>
                  <Text style={styles.editorialTitle} numberOfLines={2} allowFontScaling={false}>
                    {item.title}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* Mood Categories */}
        <View style={styles.section}>
          <SectionHeader title="Browse by Mood" />
          <View style={styles.moodGrid}>
            {MOOD_CATEGORIES.map(cat => (
              <Pressable key={cat.id} style={[styles.moodCard, { backgroundColor: cat.color }]}>
                <View style={[styles.moodAccentBar, { backgroundColor: cat.accent }]} />
                <Text style={styles.moodLabel} allowFontScaling={false}>{cat.label}</Text>
                <Ionicons name="chevron-forward" size={14} color={cat.accent} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* New Releases */}
        <View style={styles.section}>
          <SectionHeader title="New Releases" />
          <FlatList
            data={newReleases}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={m => String(m.id)}
            contentContainerStyle={styles.carouselPad}
            renderItem={({ item }) => (
              <PosterCard movie={item} onPress={() => goToMovie(item.id)} />
            )}
          />
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.void },
  loadingRoot: { flex: 1, backgroundColor: Colors.bg.void, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: 'rgba(7,7,9,0.7)',
  },
  greeting: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary },
  headerWordmark: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, letterSpacing: 1 },
  headerAI: { color: Colors.accent.crimson },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.glass.subtle, borderWidth: 1, borderColor: Colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBtn: {},
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accent.crimsonMuted, borderWidth: 1.5, borderColor: Colors.accent.crimson,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: Colors.accent.crimson },
  section: { marginTop: 36 },
  carouselPad: { paddingHorizontal: 20, paddingRight: 20 },
  editorialCard: {
    width: 200, height: 130, borderRadius: Radius.lg, overflow: 'hidden',
    backgroundColor: Colors.bg.surface, marginRight: 12, position: 'relative',
  },
  editorialPoster: { ...StyleSheet.absoluteFillObject },
  editorialGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 },
  editorialMeta: { position: 'absolute', bottom: 10, left: 10, right: 10 },
  aiMatchChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent.crimsonMuted, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6,
  },
  aiMatchText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.accent.crimson },
  editorialTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  moodGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10,
  },
  moodCard: {
    width: (W - 50) / 2, borderRadius: Radius.lg, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.glass.border, overflow: 'hidden',
  },
  moodAccentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  moodLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, flex: 1, marginLeft: 8 },
});

export default HomeScreen;
