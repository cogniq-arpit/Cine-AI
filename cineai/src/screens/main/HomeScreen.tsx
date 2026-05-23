import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  Pressable, RefreshControl, FlatList, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedScrollHandler,
  interpolate, Extrapolate, withRepeat, withSequence, withTiming, withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { MovieCard } from '../../components/movie/MovieCard';
import { useAuthStore } from '../../store/authStore';
import { movieService } from '../../services/api/movieService';
import omdbApi, { getBackdropUrl } from '../../services/omdbApi';
import { Movie } from '../../types';
import { ShimmerFeedLoader } from '../../components/ui/ShimmerLoader';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.58;
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// ─── Pulse Glow Orb ────────────────────────────────────────────────────────
const AIOrb: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1, true
    );
  }, []);
  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Pressable onPress={onPress} style={styles.aiOrb}>
      <Animated.View style={[styles.aiOrbPulse, orbStyle]} />
      <LinearGradient colors={[Colors.primary, Colors.indigo]} style={styles.aiOrbGradient}>
        <Ionicons name="sparkles" size={18} color="#fff" />
      </LinearGradient>
    </Pressable>
  );
};

// ─── Section Header ────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; subtitle?: string; onSeeAll?: () => void }> = ({
  title, subtitle, onSeeAll,
}) => (
  <View style={styles.sectionHeader}>
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {onSeeAll && (
      <Pressable onPress={onSeeAll} style={styles.seeAllBtn}>
        <Text style={styles.seeAll}>See all</Text>
        <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
      </Pressable>
    )}
  </View>
);

// ─── Mood Chip ─────────────────────────────────────────────────────────────
const MOODS = [
  { icon: 'sunny-outline' as const, label: 'Happy', query: 'comedy', color: Colors.gold },
  { icon: 'rainy-outline' as const, label: 'Melancholic', query: 'drama', color: Colors.indigo },
  { icon: 'flash-outline' as const, label: 'Thrilled', query: 'thriller', color: Colors.primary },
  { icon: 'heart-outline' as const, label: 'Romantic', query: 'romance', color: '#FF6B9D' },
  { icon: 'planet-outline' as const, label: 'Curious', query: 'sci-fi', color: Colors.info },
  { icon: 'bonfire-outline' as const, label: 'Scared', query: 'horror', color: '#FF6B35' },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();

  const [trending, setTrending] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [aiPicks, setAiPicks] = useState<Movie[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
    headerOpacity.value = interpolate(e.contentOffset.y, [0, 120], [0, 1], Extrapolate.CLAMP);
  });
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    backgroundColor: `rgba(10,10,15,${headerOpacity.value * 0.98})`,
  }));
  const heroParallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, HERO_HEIGHT], [0, HERO_HEIGHT * 0.45], Extrapolate.CLAMP) }],
  }));

  const fetchData = useCallback(async () => {
    try {
      const [trendingRes, nowPlayingRes, topRatedRes, upcomingRes] = await Promise.all([
        omdbApi.getTrending(),
        omdbApi.getNowPlaying(),
        omdbApi.getTopRated(),
        omdbApi.getUpcoming(),
      ]);
      setTrending(trendingRes.results);
      setNowPlaying(nowPlayingRes.results);
      setTopRated(topRatedRes.results);
      setUpcoming(upcomingRes.results);
      // AI picks: blend top rated + trending, shuffled
      const blend = [...topRatedRes.results.slice(0, 5), ...trendingRes.results.slice(0, 5)];
      setAiPicks(blend.sort(() => Math.random() - 0.5).slice(0, 8));

      try {
        const backendTrending = await movieService.getTrending();
        if (backendTrending?.length > 0) {
          const mapped: Movie[] = backendTrending.map((m: any, i: number) => ({
            id: i + 999000, title: m.Title, original_title: m.Title,
            overview: m.Plot || '', poster_path: m.Poster && m.Poster !== 'N/A' ? m.Poster : null,
            backdrop_path: m.Poster && m.Poster !== 'N/A' ? m.Poster : null,
            release_date: m.Year || '2024', vote_average: parseFloat(m.imdbRating || '8.0'),
            vote_count: 1000, popularity: 90, genre_ids: [], adult: false, original_language: 'en', video: false,
          }));
          setTrending(mapped);
        }
      } catch { /* backend optional */ }
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => setHeroIndex(p => (p + 1) % Math.min(trending.length, 5)), 5000);
    return () => clearInterval(interval);
  }, [trending]);

  const heroMovie = trending[heroIndex];
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const firstName = profile?.name?.split(' ')[0] || 'Cinephile';

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={{ backgroundColor: Colors.background }}>
          <View style={styles.welcomeRow}>
            <Text style={styles.headerLogo}><Text style={styles.logoC}>C</Text>INE AI</Text>
          </View>
        </SafeAreaView>
        <ShimmerFeedLoader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating Header */}
      <Animated.View style={[styles.stickyHeader, headerStyle]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.stickyHeaderContent}>
            <Text style={styles.headerLogo}><Text style={styles.logoC}>C</Text>INE AI</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Pressable onPress={() => navigation.navigate('Search')} style={styles.searchIconBtn}>
                <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('AIChat')} style={styles.aiChip}>
                <Ionicons name="sparkles" size={13} color={Colors.primary} />
                <Text style={styles.aiChipText}>Ask AI</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchData(); }} tintColor={Colors.primary} />
        }
      >
        {/* Greeting Row */}
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.welcomeSafe}>
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName}>{firstName} 👋</Text>
            </View>
            <AIOrb onPress={() => navigation.navigate('AIChat')} />
          </View>
        </SafeAreaView>

        {/* Hero Banner */}
        <View style={styles.heroContainer}>
          <Animated.View style={[StyleSheet.absoluteFill, heroParallaxStyle]}>
            {heroMovie ? (
              <Image
                source={{ uri: heroMovie.backdrop_path?.startsWith('http') ? heroMovie.backdrop_path : getBackdropUrl(heroMovie.backdrop_path) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={700}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.backgroundSecondary }]} />
            )}
          </Animated.View>

          {/* Gradient layers */}
          <LinearGradient colors={['transparent', 'rgba(10,10,15,0.5)', Colors.background]} style={StyleSheet.absoluteFill} locations={[0.35, 0.7, 1]} />
          <LinearGradient colors={['rgba(10,10,15,0.4)', 'transparent']} style={[StyleSheet.absoluteFill, { height: 120 }]} />

          {heroMovie && (
            <View style={styles.heroContent}>
              {/* Dots */}
              <View style={styles.heroDotsRow}>
                {trending.slice(0, 5).map((_, i) => (
                  <Pressable key={i} onPress={() => setHeroIndex(i)}>
                    <View style={[styles.heroDot, i === heroIndex && styles.heroDotActive]} />
                  </Pressable>
                ))}
              </View>

              {/* Badges */}
              <View style={styles.heroBadgesRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="star" size={11} color={Colors.gold} />
                  <Text style={styles.heroBadgeText}>{heroMovie.vote_average?.toFixed(1)}</Text>
                </View>
                <View style={styles.trendingBadge}>
                  <Ionicons name="trending-up" size={11} color={Colors.primary} />
                  <Text style={styles.trendingBadgeText}>Trending #{heroIndex + 1}</Text>
                </View>
              </View>

              <Text style={styles.heroTitle} numberOfLines={2}>{heroMovie.title}</Text>
              <Text style={styles.heroOverview} numberOfLines={2}>{heroMovie.overview}</Text>

              <View style={styles.heroActions}>
                <Pressable onPress={() => navigation.navigate('MovieDetails', { movieId: heroMovie.id })} style={styles.watchBtn}>
                  <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.watchBtnGradient}>
                    <Ionicons name="play" size={16} color="#fff" />
                    <Text style={styles.watchBtnText}>Watch Now</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={() => navigation.navigate('MovieDetails', { movieId: heroMovie.id })} style={styles.infoBtn}>
                  <BlurView intensity={25} style={styles.infoBtnBlur} tint="dark">
                    <Ionicons name="information-circle-outline" size={16} color={Colors.white} />
                    <Text style={styles.infoBtnText}>Info</Text>
                  </BlurView>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* AI Recommendation Banner */}
        <Pressable onPress={() => navigation.navigate('AIChat')} style={styles.aiBanner}>
          <LinearGradient
            colors={['rgba(108,99,255,0.2)', 'rgba(230,57,70,0.15)', 'rgba(10,10,15,0.3)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.aiBannerGradient}
          >
            <View style={styles.aiBannerLeft}>
              <View style={styles.aiBannerIconWrap}>
                <LinearGradient colors={[Colors.primary, Colors.indigo]} style={styles.aiBannerIcon}>
                  <Ionicons name="sparkles" size={14} color="#fff" />
                </LinearGradient>
              </View>
              <View>
                <Text style={styles.aiBannerTitle}>Cine AI is ready for you</Text>
                <Text style={styles.aiBannerSubtitle}>"Recommend me something emotional tonight..."</Text>
              </View>
            </View>
            <View style={styles.aiBannerArrowWrap}>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Mood Picker */}
        <View style={styles.section}>
          <SectionHeader title="What's your mood?" subtitle="Find the perfect film for right now" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
            {MOODS.map(mood => (
              <Pressable
                key={mood.query}
                onPress={() => navigation.navigate('Search', { mood: mood.query })}
                style={[styles.moodChip, { borderColor: `${mood.color}40` }]}
              >
                <View style={[styles.moodIconWrap, { backgroundColor: `${mood.color}20` }]}>
                  <Ionicons name={mood.icon} size={16} color={mood.color} />
                </View>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Trending Section */}
        <View style={styles.section}>
          <SectionHeader
            title="🔥 Trending Now"
            subtitle="Most watched this week"
            onSeeAll={() => navigation.navigate('Search', { category: 'trending' })}
          />
          <FlatList
            data={trending.slice(0, 10)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `trending-${item.id}-${i}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <MovieCard movie={item} onPress={m => navigation.navigate('MovieDetails', { movieId: m.id })} />}
          />
        </View>

        {/* AI Picks */}
        {aiPicks.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="✨ AI Picks for You"
              subtitle="Personalized by Cine AI"
              onSeeAll={() => navigation.navigate('AIChat')}
            />
            <FlatList
              data={aiPicks}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, i) => `aipick-${item.id}-${i}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => <MovieCard movie={item} onPress={m => navigation.navigate('MovieDetails', { movieId: m.id })} variant="featured" />}
            />
          </View>
        )}

        {/* Now Playing */}
        <View style={styles.section}>
          <SectionHeader title="🎬 In Theatres" onSeeAll={() => {}} />
          <FlatList
            data={nowPlaying.slice(0, 8)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `np-${item.id}-${i}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <MovieCard movie={item} onPress={m => navigation.navigate('MovieDetails', { movieId: m.id })} variant="landscape" />}
          />
        </View>

        {/* Top Rated */}
        <View style={styles.section}>
          <SectionHeader title="⭐ Top Rated" subtitle="Critically acclaimed masterpieces" onSeeAll={() => {}} />
          <FlatList
            data={topRated.slice(0, 10)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `tr-${item.id}-${i}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <MovieCard movie={item} onPress={m => navigation.navigate('MovieDetails', { movieId: m.id })} />}
          />
        </View>

        {/* Coming Soon */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <SectionHeader title="🚀 Coming Soon" onSeeAll={() => {}} />
          <FlatList
            data={upcoming.slice(0, 8)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `up-${item.id}-${i}`}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <MovieCard movie={item} onPress={m => navigation.navigate('MovieDetails', { movieId: m.id })} />}
          />
        </View>
      </AnimatedScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  stickyHeaderContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  headerLogo: { fontSize: Typography.xl, fontFamily: 'Poppins_700Bold', color: Colors.textPrimary },
  logoC: { color: Colors.primary },
  searchIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  aiChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryMuted, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary,
  },
  aiChipText: { color: Colors.primary, fontSize: Typography.sm, fontFamily: 'Inter_600SemiBold' },
  welcomeSafe: { backgroundColor: Colors.background },
  welcomeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  greeting: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: 'Inter_400Regular' },
  userName: { color: Colors.textPrimary, fontSize: Typography.xl, fontFamily: 'Poppins_700Bold' },
  aiOrb: { alignItems: 'center', justifyContent: 'center', width: 48, height: 48 },
  aiOrbPulse: {
    position: 'absolute', width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(230,57,70,0.2)',
  },
  aiOrbGradient: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', ...Shadows.glow,
  },
  heroContainer: { height: HERO_HEIGHT, overflow: 'hidden' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  heroDotsRow: { flexDirection: 'row', gap: 5, marginBottom: Spacing.sm },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  heroDotActive: { width: 22, backgroundColor: Colors.primary },
  heroBadgesRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full,
  },
  heroBadgeText: { color: Colors.gold, fontSize: Typography.sm, fontFamily: 'Inter_600SemiBold' },
  trendingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryMuted, paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary,
  },
  trendingBadgeText: { color: Colors.primary, fontSize: Typography.sm, fontFamily: 'Inter_600SemiBold' },
  heroTitle: {
    fontSize: Typography['4xl'], fontFamily: 'Poppins_700Bold', color: Colors.white,
    letterSpacing: -0.5, lineHeight: Typography['4xl'] * 1.15, marginBottom: Spacing.xs,
  },
  heroOverview: {
    fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular',
    lineHeight: Typography.sm * 1.5, marginBottom: Spacing.lg,
  },
  heroActions: { flexDirection: 'row', gap: Spacing.sm },
  watchBtn: { flex: 1, borderRadius: Radius.md, overflow: 'hidden', ...Shadows.glow },
  watchBtnGradient: { paddingVertical: Spacing.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs },
  watchBtnText: { color: Colors.white, fontSize: Typography.base, fontFamily: 'Inter_600SemiBold' },
  infoBtn: { width: 90, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  infoBtnBlur: { paddingVertical: Spacing.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs },
  infoBtnText: { color: Colors.white, fontSize: Typography.base, fontFamily: 'Inter_500Medium' },
  aiBanner: { marginHorizontal: Spacing.xl, marginVertical: Spacing.lg, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(108,99,255,0.25)' },
  aiBannerGradient: { padding: Spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  aiBannerIconWrap: { flexShrink: 0 },
  aiBannerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  aiBannerTitle: { color: Colors.textPrimary, fontSize: Typography.base, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  aiBannerSubtitle: { color: Colors.textMuted, fontSize: Typography.xs, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  aiBannerArrowWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
  },
  section: { marginTop: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.md,
  },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontFamily: 'Poppins_600SemiBold' },
  sectionSubtitle: { color: Colors.textMuted, fontSize: Typography.xs, fontFamily: 'Inter_400Regular', marginTop: 2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  seeAll: { color: Colors.primary, fontSize: Typography.sm, fontFamily: 'Inter_600SemiBold' },
  moodRow: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  moodChip: {
    alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1,
    minWidth: 80,
  },
  moodIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  moodLabel: { color: Colors.textSecondary, fontSize: Typography.xs, fontFamily: 'Inter_500Medium' },
  horizontalList: { paddingHorizontal: Spacing.xl },
});

export default HomeScreen;
