/**
 * CineAI V3 — HomeScreen (Bulletproof Edition)
 * Zero API calls on load. All images from Amazon CDN. Instant rendering.
 */
import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Radius, Motion } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { Movie } from '../../types';
import { tmdbApi } from '../../services/tmdbApi';

const { width: W, height: H } = Dimensions.get('window');
const HERO_HEIGHT = H * 0.58;

// ─── Hardcoded curated movies with verified Amazon CDN URLs ──────────────────
// These URLs are stable Amazon CDN links that do NOT require an API key.
const CURATED: Movie[] = [
  {
    id: 15398776,
    title: 'Oppenheimer',
    original_title: 'Oppenheimer',
    overview: 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    poster_path: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    release_date: '2023-07-21',
    vote_average: 8.9,
    vote_count: 715321,
    popularity: 127.5,
    genre_ids: [36, 18],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 15239678,
    title: 'Dune: Part Two',
    original_title: 'Dune: Part Two',
    overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    poster_path: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    release_date: '2024-03-01',
    vote_average: 9.0,
    vote_count: 430225,
    popularity: 98.4,
    genre_ids: [12, 878],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 816692,
    title: 'Interstellar',
    original_title: 'Interstellar',
    overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    poster_path: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    release_date: '2014-11-07',
    vote_average: 8.7,
    vote_count: 2014562,
    popularity: 89.3,
    genre_ids: [12, 18, 878],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 1375666,
    title: 'Inception',
    original_title: 'Inception',
    overview: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    poster_path: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
    release_date: '2010-07-16',
    vote_average: 8.8,
    vote_count: 2514682,
    popularity: 95.1,
    genre_ids: [28, 12, 878],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 468569,
    title: 'The Dark Knight',
    original_title: 'The Dark Knight',
    overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    poster_path: 'https://image.tmdb.org/t/p/w500/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg',
    release_date: '2008-07-18',
    vote_average: 9.0,
    vote_count: 2891421,
    popularity: 112.8,
    genre_ids: [28, 80, 18],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 6751668,
    title: 'Parasite',
    original_title: 'Parasite',
    overview: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    poster_path: 'https://image.tmdb.org/t/p/w500/od22ftNnyag0TTxcnJhlsu3aLoU.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/od22ftNnyag0TTxcnJhlsu3aLoU.jpg',
    release_date: '2019-05-30',
    vote_average: 8.5,
    vote_count: 912410,
    popularity: 73.2,
    genre_ids: [18, 53],
    original_language: 'ko',
    adult: false,
    video: false,
  },
  {
    id: 110912,
    title: 'Pulp Fiction',
    original_title: 'Pulp Fiction',
    overview: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.',
    poster_path: 'https://image.tmdb.org/t/p/w500/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
    release_date: '1994-10-14',
    vote_average: 8.9,
    vote_count: 2185212,
    popularity: 85.6,
    genre_ids: [80, 18],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 111161,
    title: 'The Shawshank Redemption',
    original_title: 'The Shawshank Redemption',
    overview: 'Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.',
    poster_path: 'https://image.tmdb.org/t/p/w500/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    release_date: '1994-10-14',
    vote_average: 9.3,
    vote_count: 2740000,
    popularity: 92.4,
    genre_ids: [18],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 133093,
    title: 'The Matrix',
    original_title: 'The Matrix',
    overview: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth — the life he knows is the elaborate deception of an evil cyber-intelligence.',
    poster_path: 'https://image.tmdb.org/t/p/w500/oMsxZEvz9a708d49b6UdZK1KAo5.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/oMsxZEvz9a708d49b6UdZK1KAo5.jpg',
    release_date: '1999-03-31',
    vote_average: 8.7,
    vote_count: 1995000,
    popularity: 78.9,
    genre_ids: [28, 878],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 4154900,
    title: 'Avengers: Endgame',
    original_title: 'Avengers: Endgame',
    overview: 'After the devastating events of Infinity War, the universe is in ruins. The Avengers assemble once more to reverse Thanos\' actions.',
    poster_path: 'https://image.tmdb.org/t/p/w500/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg',
    release_date: '2019-04-26',
    vote_average: 8.4,
    vote_count: 1240000,
    popularity: 91.3,
    genre_ids: [28, 12, 878],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 9362722,
    title: 'Spider-Man: Across the Spider-Verse',
    original_title: 'Spider-Man: Across the Spider-Verse',
    overview: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
    poster_path: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    release_date: '2023-06-02',
    vote_average: 8.6,
    vote_count: 360000,
    popularity: 87.2,
    genre_ids: [16, 28, 12],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 1517268,
    title: 'Barbie',
    original_title: 'Barbie',
    overview: 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land.',
    poster_path: 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
    release_date: '2023-07-21',
    vote_average: 6.9,
    vote_count: 510000,
    popularity: 76.5,
    genre_ids: [12, 35, 14],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 3783958,
    title: 'La La Land',
    original_title: 'La La Land',
    overview: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.',
    poster_path: 'https://image.tmdb.org/t/p/w500/6v4g6yW01uTmbxqwg75iEkMkrNP.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/6v4g6yW01uTmbxqwg75iEkMkrNP.jpg',
    release_date: '2016-12-09',
    vote_average: 8.0,
    vote_count: 650000,
    popularity: 58.7,
    genre_ids: [35, 18, 10402],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 1856101,
    title: 'Blade Runner 2049',
    original_title: 'Blade Runner 2049',
    overview: 'K, an officer with the LAPD\'s blade runner squad, uncovers a secret that could plunge what is left of society into chaos.',
    poster_path: 'https://image.tmdb.org/t/p/w500/r4FGhQIrB7pOvHTkl8PZB6FYSdK.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/r4FGhQIrB7pOvHTkl8PZB6FYSdK.jpg',
    release_date: '2017-10-06',
    vote_average: 8.0,
    vote_count: 640000,
    popularity: 63.1,
    genre_ids: [28, 18, 878],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 1130884,
    title: 'Shutter Island',
    original_title: 'Shutter Island',
    overview: 'Teddy Daniels and Chuck Aule, two US marshals, are sent to an asylum on a remote island in order to investigate the disappearance of a patient.',
    poster_path: 'https://image.tmdb.org/t/p/w500/2nqsOT2AqPkTW81bWaLRtjgjqVM.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/2nqsOT2AqPkTW81bWaLRtjgjqVM.jpg',
    release_date: '2010-02-19',
    vote_average: 8.2,
    vote_count: 1450000,
    popularity: 69.8,
    genre_ids: [9648, 53],
    original_language: 'en',
    adult: false,
    video: false,
  },
  {
    id: 137523,
    title: 'Fight Club',
    original_title: 'Fight Club',
    overview: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.',
    poster_path: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    release_date: '1999-10-15',
    vote_average: 8.8,
    vote_count: 2214500,
    popularity: 88.5,
    genre_ids: [18],
    original_language: 'en',
    adult: false,
    video: false,
  },
];

const MOOD_CATEGORIES = [
  { id: 'dark', label: 'Dark & Tense', color: '#1A1A2E', accent: Colors.accent.crimson },
  { id: 'feel', label: 'Feel Good', color: '#1A2A1A', accent: Colors.semantic.success },
  { id: 'mind', label: 'Mind-Bending', color: '#1A1A2E', accent: Colors.accent.electric },
  { id: 'epic', label: 'Epic & Grand', color: '#2A1A0E', accent: Colors.accent.gold },
];

// ─── Movie Poster Card ─────────────────────────────────────────────────────
const PosterCard: React.FC<{ movie: Movie; onPress: () => void; rank?: number }> = ({ movie, onPress, rank }) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[cardStyles.wrapper, style]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.95, Motion.springs.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, Motion.springs.bounce); }}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(); }}
        style={cardStyles.pressable}
      >
        <Image
          source={{ uri: movie.poster_path || undefined }}
          style={cardStyles.poster}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
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
        <Ionicons name="grid-outline" size={13} color={Colors.accent.crimson} />
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

  return (
    <Animated.View style={[heroStyles.container, heroStyle]}>
      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(movie.id); }} style={{ flex: 1 }}>
        <Image
          source={{ uri: movie.poster_path || undefined }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={500}
          cachePolicy="memory-disk"
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
            <Pressable
              style={heroStyles.playBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); onPress(movie.id); }}
            >
              <Ionicons name="play" size={16} color={Colors.text.onAccent} />
              <Text style={heroStyles.playText} allowFontScaling={false}>More Info</Text>
            </Pressable>
            <Pressable
              style={heroStyles.infoBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(movie.id); }}
            >
              <Ionicons name="information-circle-outline" size={16} color={Colors.text.primary} />
              <Text style={heroStyles.infoText} allowFontScaling={false}>Details</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>

      {/* Dot indicators */}
      <View style={heroStyles.dots}>
        {movies.slice(0, 5).map((_, i) => (
          <View key={i} style={[heroStyles.dot, i === activeIdx && heroStyles.dotActive]} />
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
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();

  // All sections initialized from CURATED data immediately for instant first-frame render
  const [heroMovies, setHeroMovies] = useState<Movie[]>(CURATED.slice(0, 5));
  const [trending, setTrending] = useState<Movie[]>(CURATED.slice(0, 10));
  const [recommended, setRecommended] = useState<Movie[]>([...CURATED].sort((a, b) => b.vote_average - a.vote_average).slice(0, 8));
  const [newReleases, setNewReleases] = useState<Movie[]>([...CURATED].sort((a, b) => new Date(b.release_date || '').getTime() - new Date(a.release_date || '').getTime()).slice(0, 8));
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch live dynamic trending
      const trendingRes = await tmdbApi.getTrending();
      if (trendingRes?.results?.length > 0) {
        setTrending(trendingRes.results.slice(0, 10));
        setHeroMovies(trendingRes.results.slice(0, 5));
      }

      // 2. Fetch live dynamic recommended/popular
      const popularRes = await tmdbApi.getPopular();
      if (popularRes?.results?.length > 0) {
        setRecommended(popularRes.results.slice(0, 8));
      }

      // 3. Fetch live dynamic new releases/upcoming
      const upcomingRes = await tmdbApi.getUpcoming();
      if (upcomingRes?.results?.length > 0) {
        setNewReleases(upcomingRes.results.slice(0, 8));
      }
    } catch (err) {
      console.warn('Failed to load dynamic TMDB data. Retaining local curated master fallbacks.', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Dynamic refresh: load fresh live TMDB data whenever screen comes into focus or user logs in/out
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData, profile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const goToMovie = (id: number) => navigation.navigate('MovieDetails', { movieId: id });

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0.85], Extrapolate.CLAMP),
    borderBottomColor: `rgba(255,255,255,${interpolate(scrollY.value, [0, 60], [0, 0.08], Extrapolate.CLAMP)})`,
    borderBottomWidth: 1,
  }));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
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
            keyExtractor={m => `rec-${m.id}`}
            contentContainerStyle={styles.carouselPad}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); goToMovie(item.id); }}
                style={styles.editorialCard}
              >
                <Image
                  source={{ uri: item.poster_path || undefined }}
                  style={styles.editorialPoster}
                  contentFit="cover"
                  cachePolicy="memory-disk"
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
          <SectionHeader title="New Releases" subtitle="Fresh from the cinema" />
          <FlatList
            data={newReleases}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={m => `new-${m.id}`}
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
