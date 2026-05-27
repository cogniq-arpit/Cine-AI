/**
 * CineAI V3 — HomeScreen (Premium Infinite Content Feed Edition)
 * A luxury-tier entertainment discovery experience combining design details
 * from Netflix, Disney+, Spotify, Apple TV+, and Letterboxd.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList,
  Dimensions, ActivityIndicator, StatusBar, RefreshControl, Platform
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, interpolate,
  useAnimatedScrollHandler, Extrapolate, withRepeat, withSequence
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Radius, Motion, Typography, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { Movie } from '../../types';
import { tmdbApi } from '../../services/tmdbApi';

const { width: W, height: H } = Dimensions.get('window');
const HERO_HEIGHT = H * 0.62;

// ─── Direct Curated Movie Dataset for Zero-Boot Latency ──────────────────────
const CURATED: Movie[] = [
  {
    id: 15398776,
    title: 'Oppenheimer',
    original_title: 'Oppenheimer',
    overview: 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    poster_path: 'https://image.tmdb.org/t/p/w500/8Gxv2Z7Hjsug4ZgCH5z25nuREQz.jpg',
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
    overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the Harks.',
    poster_path: 'https://image.tmdb.org/t/p/w500/1pdfpwXt6tLY244TLHjRj24Zt6t.jpg',
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
    overview: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.',
    poster_path: 'https://image.tmdb.org/t/p/w500/ljsQgJm4w4R02oL3t78z770a2FG.jpg',
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
    overview: 'Batman must accept his greatest psychological tests against the chaos-loving Joker.',
    poster_path: 'https://image.tmdb.org/t/p/w500/qJ2tWw7512l29i1KjGo8qG71wCc.jpg',
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
    overview: 'Greed and class discrimination threaten the relationship between the Park and Kim families.',
    poster_path: 'https://image.tmdb.org/t/p/w500/7omwqh3n7zVpt6N7nZ0BwQv8m2t.jpg',
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
    overview: 'The lives of mob hitmen, a boxer, and a gangster\'s wife intertwine in tales of violence.',
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
    overview: 'Over the course of several years, two convicts form a friendship, seeking consolation and redemption.',
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
    id: 9362722,
    title: 'Spider-Man: Across the Spider-Verse',
    original_title: 'Spider-Man: Across the Spider-Verse',
    overview: 'Miles Morales catapults across the Multiverse, encountering a team of Spider-People protecting its existence.',
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
    overview: 'Barbie and Ken are having the time of their lives in perfect Barbie Land before entering the real world.',
    poster_path: 'https://image.tmdb.org/t/p/w500/iuFNMSmv2jzgj07HiZyDYBfOIeC.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/iuFNMSmv2jzgj07HiZyDYBfOIeC.jpg',
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
    overview: 'A jazz pianist and an actress fall in love while navigating their aspirations in Los Angeles.',
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
    overview: 'LAPD Officer K uncovers a long-buried secret that has the potential to plunge society into chaos.',
    poster_path: 'https://image.tmdb.org/t/p/w500/r4FGhQIrB7pOvHTkl8PZB6FYSdK.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/gIZ1QniE6E77NI6lCU6MxlNBvIx.jpg',
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
    overview: 'US Marshals Teddy and Chuck investigate the mysterious disappearance of a patient on a remote island.',
    poster_path: 'https://image.tmdb.org/t/p/w500/4ryC88GMwAaGsj181z1Ty8K0j7q.jpg',
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
    overview: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club.',
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
  {
    id: 4154900,
    title: 'Avengers: Endgame',
    original_title: 'Avengers: Endgame',
    overview: 'The remaining Avengers assemble once more to reverse Thanos\' actions and restore balance.',
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
    id: 245429,
    title: 'Spirited Away',
    original_title: 'Spirited Away',
    overview: 'A young girl wanders into a world ruled by gods, witches, and spirits, where humans are changed into beasts.',
    poster_path: 'https://image.tmdb.org/t/p/w500/39q6a5rSFvyuiui7U72RTAu911Z.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/39q6a5rSFvyuiui7U72RTAu911Z.jpg',
    release_date: '2001-07-20',
    vote_average: 8.5,
    vote_count: 15400,
    popularity: 94.2,
    genre_ids: [16, 14, 10751],
    original_language: 'ja',
    adult: false,
    video: false,
  },
  {
    id: 11614188,
    title: 'RRR',
    original_title: 'RRR',
    overview: 'A fictional history of two legendary revolutionaries and their journey away from home before they began fighting.',
    poster_path: 'https://image.tmdb.org/t/p/w500/wJrOmW2jIKG1t683LJZ7V48Y4Ux.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/wJrOmW2jIKG1t683LJZ7V48Y4Ux.jpg',
    release_date: '2022-03-24',
    vote_average: 7.9,
    vote_count: 1450,
    popularity: 45.2,
    genre_ids: [28, 12, 18],
    original_language: 'te',
    adult: false,
    video: false,
  },
  {
    id: 1187043,
    title: '3 Idiots',
    original_title: '3 Idiots',
    overview: 'Two friends search for their long lost companion, revisiting college memories and learning lessons.',
    poster_path: 'https://image.tmdb.org/t/p/w500/668bMKsl921s766jY0aF27xOa4v.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/w1280/668bMKsl921s766jY0aF27xOa4v.jpg',
    release_date: '2009-12-25',
    vote_average: 8.0,
    vote_count: 3600,
    popularity: 38.6,
    genre_ids: [35, 18],
    original_language: 'hi',
    adult: false,
    video: false,
  },
];;

// Curated universes/brand tags with custom brand accents
const STUDIO_HUBS = [
  { id: 'marvel', label: 'MARVEL', icon: 'logo-github', glow: '#F0131E', desc: 'MCU Universe' },
  { id: 'ghibli', label: 'GHIBLI', icon: 'leaf-outline', glow: '#4EC9F0', desc: 'Japanese Classics' },
  { id: 'anime', label: 'CRUNCHY', icon: 'flame-outline', glow: '#FF9900', desc: 'Anime & Manga' },
  { id: 'nolan', label: 'NOLAN', icon: 'planet-outline', glow: '#9B94FF', desc: 'Mind-Benders' },
  { id: 'a24', label: 'A24', icon: 'sparkles-outline', glow: '#F7F7FA', desc: 'Indie Gems' }
];

const MOOD_CATEGORIES = [
  { id: 'dark', label: 'Dark & Tense', color: '#1A121E', accent: Colors.accent.crimson },
  { id: 'feel', label: 'Feel Good', color: '#10221A', accent: Colors.semantic.success },
  { id: 'mind', label: 'Mind-Bending', color: '#12162E', accent: Colors.accent.electric },
  { id: 'epic', label: 'Epic & Grand', color: '#251A10', accent: Colors.accent.gold },
];

// Mock watch history items for continue watching section
const MOCK_CONTINUE_WATCHING = [
  { movie: CURATED[0], progress: 0.72, timeLabel: '52m left' },
  { movie: CURATED[1], progress: 0.35, timeLabel: '1h 48m left' },
  { movie: CURATED[3], progress: 0.90, timeLabel: '14m left' },
];

// ─── Reusable High-Fidelity Components ─────────────────────────────────────

// Section Header with glass controls
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
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14, marginTop: 8 },
  left: { flex: 1 },
  title: { fontSize: 20, fontFamily: Typography.fontPoppinsBold, color: Colors.text.primary, letterSpacing: -0.4 },
  subtitle: { fontSize: 11, fontFamily: Typography.fontPrimary, color: Colors.text.secondary, marginTop: 1 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.glass.subtle, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.glass.border },
  seeAllText: { fontSize: 11, fontFamily: Typography.fontMedium, color: Colors.accent.crimson },
});

// Premium Animated Poster Card
const PosterCard: React.FC<{ movie: Movie; onPress: () => void; showRating?: boolean }> = ({ movie, onPress, showRating = true }) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[cardStyles.wrapper, style]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, Motion.springs.snappy); }}
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
          colors={['transparent', 'rgba(7,7,9,0.5)', 'rgba(7,7,9,0.92)']}
          style={cardStyles.posterGradient}
        />
        <View style={cardStyles.posterMeta}>
          <Text style={cardStyles.posterTitle} numberOfLines={2} allowFontScaling={false}>
            {movie.title}
          </Text>
          {showRating && movie.vote_average > 0 && (
            <View style={cardStyles.ratingRow}>
              <Ionicons name="star" size={9} color={Colors.accent.gold} />
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
  wrapper: { marginRight: Spacing.sm },
  pressable: { width: 124, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  poster: { width: 124, height: 180, borderRadius: Radius.md },
  posterGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  posterMeta: { position: 'absolute', bottom: 8, left: 8, right: 8 },
  posterTitle: { fontSize: 11, fontFamily: Typography.fontSemiBold, color: Colors.text.primary, marginBottom: 3, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 10, fontFamily: Typography.fontMedium, color: Colors.accent.gold },
});

// Netflix-style Rank Poster Card (Hollow Numeric Overlays)
const RankingPosterCard: React.FC<{ movie: Movie; rank: number; onPress: () => void }> = ({ movie, rank, onPress }) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[rankStyles.wrapper, style]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, Motion.springs.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, Motion.springs.bounce); }}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(); }}
        style={rankStyles.container}
      >
        {/* Giant Hollow Rank Digit placed behind/beside the card */}
        <View style={rankStyles.digitWrapper}>
          <Text style={rankStyles.digitText} allowFontScaling={false}>{rank}</Text>
        </View>
        
        {/* Poster Card */}
        <View style={rankStyles.card}>
          <Image
            source={{ uri: movie.poster_path || undefined }}
            style={rankStyles.poster}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={['transparent', 'rgba(7,7,9,0.85)']}
            style={rankStyles.gradient}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const rankStyles = StyleSheet.create({
  wrapper: { marginRight: 22 },
  container: { width: 145, height: 180, flexDirection: 'row', alignItems: 'flex-end', position: 'relative' },
  digitWrapper: { position: 'absolute', bottom: -22, left: -6, zIndex: 1 },
  digitText: {
    fontSize: 98,
    fontFamily: Typography.fontPoppinsBold,
    color: '#070709',
    textShadowColor: Colors.glass.borderActive,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
    letterSpacing: -6,
    lineHeight: 110,
    opacity: 0.92,
  },
  card: { width: 115, height: 172, borderRadius: Radius.md, overflow: 'hidden', marginLeft: 30, backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  poster: { width: 115, height: 172 },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
});

// Netflix-style Continue Watching Card
const ContinueWatchingCard: React.FC<{ movie: Movie; progress: number; timeLabel: string; onPress: () => void }> = ({ movie, progress, timeLabel, onPress }) => {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[cwStyles.wrapper, style]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, Motion.springs.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, Motion.springs.bounce); }}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(); }}
        style={cwStyles.container}
      >
        <Image
          source={{ uri: movie.backdrop_path || movie.poster_path || undefined }}
          style={cwStyles.backdrop}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <View style={StyleSheet.absoluteFillObject}>
          <LinearGradient
            colors={['rgba(7,7,9,0.1)', 'rgba(7,7,9,0.7)']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
        
        {/* Central glowing play icon indicator */}
        <View style={cwStyles.playCircle}>
          <Ionicons name="play" size={14} color="#FFF" />
        </View>

        <View style={cwStyles.meta}>
          <Text style={cwStyles.title} numberOfLines={1} allowFontScaling={false}>
            {movie.title}
          </Text>
          <Text style={cwStyles.time} allowFontScaling={false}>
            {timeLabel}
          </Text>
        </View>

        {/* Dynamic Netflix progress slider bar */}
        <View style={cwStyles.progressContainer}>
          <View style={cwStyles.progressBarBg} />
          <View style={[cwStyles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const cwStyles = StyleSheet.create({
  wrapper: { marginRight: Spacing.sm },
  container: { width: 190, height: 115, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  playCircle: { position: 'absolute', top: '35%', left: '44%', width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(230,57,70,0.85)', alignItems: 'center', justifyContent: 'center', shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8 },
  meta: { padding: Spacing.sm, zIndex: 2 },
  title: { fontSize: 12, fontFamily: Typography.fontSemiBold, color: Colors.text.primary },
  time: { fontSize: 10, fontFamily: Typography.fontPrimary, color: Colors.text.secondary, marginTop: 1 },
  progressContainer: { height: 3, position: 'relative' },
  progressBarBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressBarFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: Colors.accent.crimson, borderRadius: Radius.full },
});

// Ambient Glow Header Universe Selector (Studio Hubs)
const StudioHubRow: React.FC<{ activeHub: string | null; onSelectHub: (id: string | null) => void }> = ({ activeHub, onSelectHub }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={hubStyles.container}
    >
      {STUDIO_HUBS.map(hub => {
        const isActive = activeHub === hub.id;
        return (
          <Pressable
            key={hub.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onSelectHub(isActive ? null : hub.id);
            }}
            style={[
              hubStyles.card,
              isActive && { borderColor: hub.glow, backgroundColor: `${hub.glow}15` }
            ]}
          >
            <Ionicons name={hub.icon as any} size={14} color={isActive ? hub.glow : Colors.text.secondary} />
            <Text style={[hubStyles.label, isActive && { color: hub.glow }]} allowFontScaling={false}>
              {hub.label}
            </Text>
            {isActive && (
              <View style={[hubStyles.indicatorGlow, { backgroundColor: hub.glow }]} />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const hubStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 10, paddingVertical: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.md, backgroundColor: Colors.bg.surface,
    borderWidth: 1, borderColor: Colors.glass.border,
    position: 'relative', overflow: 'hidden'
  },
  label: { fontSize: 11, fontFamily: Typography.fontPoppins, color: Colors.text.secondary, letterSpacing: 0.8 },
  indicatorGlow: { position: 'absolute', bottom: 0, left: 12, right: 12, height: 2, borderTopLeftRadius: 1, borderTopRightRadius: 1 },
});

// Dynamic Autoplay-Indicator Hero Banner
const HeroBannerV3: React.FC<{ movies: Movie[]; onPress: (id: number) => void }> = ({ movies, onPress }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const sliderProgress = useSharedValue(0);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${sliderProgress.value * 100}%`,
  }));

  useEffect(() => {
    if (movies.length < 2) return;
    
    // Auto-fill indicator animation loop
    sliderProgress.value = 0;
    sliderProgress.value = withTiming(1, { duration: 6000 });

    const timer = setInterval(() => {
      opacity.value = withTiming(0, { duration: 400 });
      scale.value = withTiming(0.96, { duration: 400 });
      setTimeout(() => {
        setActiveIdx(i => (i + 1) % Math.min(movies.length, 5));
        opacity.value = withTiming(1, { duration: 500 });
        scale.value = withTiming(1, { duration: 500 });
        sliderProgress.value = 0;
        sliderProgress.value = withTiming(1, { duration: 6000 });
      }, 420);
    }, 6000);
    
    return () => clearInterval(timer);
  }, [movies.length, activeIdx]);

  if (!movies.length) return <View style={{ height: HERO_HEIGHT, backgroundColor: Colors.bg.surface }} />;
  const movie = movies[activeIdx];

  return (
    <Animated.View style={[heroStyles.container, heroStyle]}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(movie.id); }}
        style={StyleSheet.absoluteFillObject}
      >
        <Image
          source={{ uri: movie.poster_path || undefined }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={500}
          cachePolicy="memory-disk"
        />
        
        {/* Layered cinematic overlays */}
        <LinearGradient
          colors={['rgba(7,7,9,0.3)', 'rgba(7,7,9,0.5)', 'rgba(7,7,9,0.92)', Colors.bg.void]}
          locations={[0, 0.25, 0.7, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Ambient Crimson/Electric glow effect behind hero texts */}
        <View style={heroStyles.radialGlow} />

        <View style={heroStyles.content}>
          <View style={heroStyles.badgeRow}>
            <View style={heroStyles.aiChip}>
              <Ionicons name="sparkles" size={10} color={Colors.accent.crimson} />
              <Text style={heroStyles.aiChipText} allowFontScaling={false}>AI Choice Tonight</Text>
            </View>
            <View style={heroStyles.matchChip}>
              <Text style={heroStyles.matchChipText} allowFontScaling={false}>98% Match</Text>
            </View>
          </View>

          <Text style={heroStyles.movieTitle} numberOfLines={2} allowFontScaling={false}>
            {movie.title}
          </Text>

          {/* Genre Chips Overlays */}
          <View style={heroStyles.genreRow}>
            {movie.genre_ids?.slice(0, 3).map((gid, idx) => {
              const genres: Record<number, string> = { 28: 'Action', 12: 'Adventure', 16: 'Anime', 35: 'Comedy', 80: 'Crime', 18: 'Drama', 878: 'Sci-Fi', 53: 'Thriller', 36: 'History' };
              return (
                <View key={idx} style={heroStyles.genreCap}>
                  <Text style={heroStyles.genreCapText} allowFontScaling={false}>{genres[gid] || 'Cinema'}</Text>
                </View>
              );
            })}
          </View>

          {/* Metadata Row */}
          <View style={heroStyles.metaRow}>
            {movie.release_date && (
              <Text style={heroStyles.metaText} allowFontScaling={false}>
                {new Date(movie.release_date).getFullYear()}
              </Text>
            )}
            <View style={heroStyles.metaDot} />
            <Ionicons name="star" size={11} color={Colors.accent.gold} />
            <Text style={[heroStyles.metaText, { color: Colors.accent.gold }]} allowFontScaling={false}>
              {movie.vote_average.toFixed(1)}
            </Text>
            <View style={heroStyles.metaDot} />
            <Text style={heroStyles.metaText} allowFontScaling={false}>OLED 4K HDR</Text>
          </View>

          {/* Action CTAs */}
          <View style={heroStyles.actions}>
            <Pressable
              style={heroStyles.playBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); onPress(movie.id); }}
            >
              <Ionicons name="play" size={15} color={Colors.text.onAccent} />
              <Text style={heroStyles.playText} allowFontScaling={false}>Resume Movie</Text>
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

      {/* Dynamic Slide Dots Indicators */}
      <View style={heroStyles.dots}>
        {movies.slice(0, 5).map((_, i) => (
          <View key={i} style={[heroStyles.dot, i === activeIdx && heroStyles.dotActive]} />
        ))}
      </View>

      {/* Autoplay loading indicator progress line */}
      <View style={heroStyles.progressBarContainer}>
        <Animated.View style={[heroStyles.progressBarFill, progressStyle]} />
      </View>
    </Animated.View>
  );
};

const heroStyles = StyleSheet.create({
  container: { height: HERO_HEIGHT, position: 'relative' },
  radialGlow: {
    position: 'absolute', bottom: 0, left: -100, width: W * 1.5, height: 350,
    borderRadius: Radius.full, backgroundColor: 'rgba(230,57,70,0.06)',
    filter: Platform.OS === 'ios' ? 'blur(80px)' : undefined, opacity: 0.7,
  },
  content: { position: 'absolute', bottom: 45, left: 20, right: 20 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  aiChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${Colors.accent.crimson}18`, borderRadius: Radius.full,
    borderWidth: 1, borderColor: `${Colors.accent.crimson}30`,
    paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start',
  },
  aiChipText: { fontSize: 9, fontFamily: Typography.fontMedium, color: Colors.accent.crimson, letterSpacing: 0.5, textTransform: 'uppercase' },
  matchChip: { backgroundColor: 'rgba(45,189,140,0.12)', borderWidth: 1, borderColor: 'rgba(45,189,140,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  matchChipText: { fontSize: 9, fontFamily: Typography.fontMedium, color: Colors.semantic.success },
  movieTitle: {
    fontSize: 34, fontFamily: Typography.fontPoppinsBold, color: Colors.text.primary,
    lineHeight: 40, letterSpacing: -0.6, marginBottom: 8,
  },
  genreRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  genreCap: { backgroundColor: Colors.glass.medium, borderWidth: 1, borderColor: Colors.glass.border, borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  genreCapText: { fontSize: 10, fontFamily: Typography.fontPrimary, color: Colors.text.secondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 20 },
  metaText: { fontSize: 12, fontFamily: Typography.fontPrimary, color: Colors.text.secondary },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.text.tertiary },
  actions: { flexDirection: 'row', gap: 12 },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent.crimson, borderRadius: Radius.md,
    paddingHorizontal: 16, paddingVertical: 11,
    shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 4,
  },
  playText: { fontSize: 13, fontFamily: Typography.fontSemiBold, color: Colors.text.onAccent },
  infoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.glass.medium, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.glass.border,
    paddingHorizontal: 16, paddingVertical: 11,
  },
  infoText: { fontSize: 13, fontFamily: Typography.fontSemiBold, color: Colors.text.primary },
  dots: { position: 'absolute', bottom: 18, right: 20, flexDirection: 'row', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 14, backgroundColor: Colors.accent.crimson },
  progressBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.06)' },
  progressBarFill: { height: '100%', backgroundColor: Colors.accent.crimson },
});

// Dynamic Shimmer Loader for content rows
const RailSkeleton: React.FC = () => {
  return (
    <View style={skeletonStyles.container}>
      <View style={skeletonStyles.header} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={skeletonStyles.cards}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={skeletonStyles.card} />
        ))}
      </ScrollView>
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  container: { marginTop: 28, paddingHorizontal: 20 },
  header: { width: 140, height: 16, borderRadius: Radius.xs, backgroundColor: Colors.bg.surface, marginBottom: 12 },
  cards: { gap: 10 },
  card: { width: 124, height: 180, borderRadius: Radius.md, backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: Colors.glass.border },
});

// ─── HomeScreen Redesign ───────────────────────────────────────────────────
export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();

  const [activeHub, setActiveHub] = useState<string | null>(null);

  // Live state streams
  const [heroMovies, setHeroMovies] = useState<Movie[]>(CURATED.slice(0, 5));
  const [trending, setTrending] = useState<Movie[]>(CURATED.slice(0, 10));
  const [recommended, setRecommended] = useState<Movie[]>([...CURATED].sort((a, b) => b.vote_average - a.vote_average).slice(0, 8));
  const [newReleases, setNewReleases] = useState<Movie[]>([...CURATED].sort((a, b) => new Date(b.release_date || '').getTime() - new Date(a.release_date || '').getTime()).slice(0, 8));

  // Dynamic dynamic lazy loaded rails lists (Infinite Discovery Core)
  const [sciFiMovies, setSciFiMovies] = useState<Movie[]>([]);
  const [thrillerMovies, setThrillerMovies] = useState<Movie[]>([]);
  const [criticallyAcclaimed, setCriticallyAcclaimed] = useState<Movie[]>([]);
  const [bollywoodMovies, setBollywoodMovies] = useState<Movie[]>([]);
  const [animeUniverse, setAnimeUniverse] = useState<Movie[]>([]);
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Infinite Scroll Pagination State
  const [visibleRailCount, setVisibleRailCount] = useState(5);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  // Dynamic lists loader
  const loadData = useCallback(async () => {
    try {
      // 1. Fetch live dynamic trending
      const trendingRes = await tmdbApi.getTrending();
      if (trendingRes?.results?.length > 0) {
        setTrending(trendingRes.results.slice(0, 10));
        setHeroMovies(trendingRes.results.slice(0, 5));
      } else {
        setTrending(CURATED.slice(0, 10));
        setHeroMovies(CURATED.slice(0, 5));
      }

      // 2. Fetch live dynamic recommended
      const popularRes = await tmdbApi.getPopular();
      if (popularRes?.results?.length > 0) {
        setRecommended(popularRes.results.slice(0, 8));
      } else {
        setRecommended(CURATED.slice(10, 18));
      }

      // 3. Fetch live dynamic new releases
      const upcomingRes = await tmdbApi.getUpcoming();
      if (upcomingRes?.results?.length > 0) {
        setNewReleases(upcomingRes.results.slice(0, 8));
      } else {
        setNewReleases([...CURATED].reverse().slice(0, 8));
      }

      // 4. Fetch dynamic sci-fi via customized search to ensure distinct visual rows
      const scifiRes = await tmdbApi.searchMovies("Sci-Fi space");
      if (scifiRes?.results?.length > 0) {
        setSciFiMovies(scifiRes.results.slice(0, 10));
      } else {
        // Fallback: distinct slice filtering sci-fi genre
        setSciFiMovies(CURATED.filter(m => m.genre_ids.includes(878)));
      }

      // 5. Fetch dynamic thrillers via customized search to ensure distinct visual rows
      const thrillerRes = await tmdbApi.searchMovies("Psychological Suspense Thriller");
      if (thrillerRes?.results?.length > 0) {
        setThrillerMovies(thrillerRes.results.slice(0, 10));
      } else {
        // Fallback: distinct slice filtering thriller/mystery genres
        setThrillerMovies(CURATED.filter(m => m.genre_ids.includes(53) || m.genre_ids.includes(9648)));
      }

      // 6. Fetch critically acclaimed movies (Top Rated)
      const topRatedRes = await tmdbApi.getTopRated();
      if (topRatedRes?.results?.length > 0) {
        setCriticallyAcclaimed(topRatedRes.results.slice(0, 10));
      } else {
        setCriticallyAcclaimed([...CURATED].sort((a, b) => b.vote_average - a.vote_average).slice(0, 8));
      }

      // 7. Fetch Bollywood Spotlight via search to pull actual live regional movies
      const bollywoodRes = await tmdbApi.searchMovies("Bollywood Hindi");
      if (bollywoodRes?.results?.length > 0) {
        setBollywoodMovies(bollywoodRes.results.slice(0, 10));
      } else {
        // Fallback: distinct slice containing actual curated regional films (RRR, 3 Idiots)
        setBollywoodMovies(CURATED.filter(m => [11614188, 1187043, 3783958].includes(m.id)));
      }

      // 8. Fetch Crunchyroll Anime Universe via search
      const animeRes = await tmdbApi.searchMovies("Studio Ghibli Anime");
      if (animeRes?.results?.length > 0) {
        setAnimeUniverse(animeRes.results.slice(0, 10));
      } else {
        // Fallback: distinct slice containing curated anime/animation films (Spirited Away, Spider-Verse)
        setAnimeUniverse(CURATED.filter(m => [245429, 9362722].includes(m.id)));
      }

    } catch (err) {
      console.warn('Failed to load live TMDB discover rails. Retaining local fallbacks.', err);
      // Ensure robust initial offline states are populated completely with zero duplicates
      setTrending(CURATED.slice(0, 10));
      setHeroMovies(CURATED.slice(0, 5));
      setRecommended(CURATED.slice(10, 18));
      setNewReleases([...CURATED].reverse().slice(0, 8));
      setSciFiMovies(CURATED.filter(m => m.genre_ids.includes(878)));
      setThrillerMovies(CURATED.filter(m => m.genre_ids.includes(53)));
      setCriticallyAcclaimed([...CURATED].sort((a, b) => b.vote_average - a.vote_average).slice(0, 8));
      setBollywoodMovies(CURATED.filter(m => [11614188, 1187043, 3783958].includes(m.id)));
      setAnimeUniverse(CURATED.filter(m => [245429, 9362722].includes(m.id)));
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Load more rails dynamically when scroll threshold reached (Dopamine Infinite Scroll)
  const handleScrollEnd = () => {
    if (visibleRailCount >= 16 || isPaginationLoading) return;
    setIsPaginationLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    
    setTimeout(() => {
      setVisibleRailCount(prev => prev + 3);
      setIsPaginationLoading(false);
    }, 1000);
  };

  const goToMovie = (id: number) => navigation.navigate('MovieDetails', { movieId: id });

  // Smooth Header alpha transition based on scroll position
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const headerStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(7,7,9,${interpolate(scrollY.value, [0, 80], [0.65, 0.96], Extrapolate.CLAMP)})`,
    borderBottomColor: `rgba(255,255,255,${interpolate(scrollY.value, [0, 80], [0, 0.08], Extrapolate.CLAMP)})`,
    borderBottomWidth: 1,
  }));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Filter content catalog depending on selected brand/universe hub
  const getFilteredList = (list: Movie[]) => {
    if (!activeHub) return list;
    if (activeHub === 'nolan') return list.filter(m => [15398776, 816692, 1375666, 468569].includes(m.id));
    if (activeHub === 'marvel') return list.filter(m => [133093, 4154900, 9362722].includes(m.id));
    return list.slice(0, 4);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Premium Glassmorphic Header */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.greeting} allowFontScaling={false}>{greeting()}</Text>
          <Text style={styles.headerWordmark} allowFontScaling={false}>
            CINE<Text style={styles.headerAI}>AI</Text>
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              navigation.navigate('AIChat');
            }}
            accessibilityRole="button"
            accessibilityLabel="Open AI companion chatbot"
          >
            <LinearGradient
              colors={[Colors.accent.orbStart, Colors.accent.orbEnd]}
              style={styles.orbGlow}
            >
              <Ionicons name="sparkles" size={13} color="#FFF" />
            </LinearGradient>
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
        onMomentumScrollEnd={e => {
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 400;
          if (isCloseToBottom) {
            handleScrollEnd();
          }
        }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.crimson} />
        }
      >
        {/* Full-bleed Dynamic Hero V3 */}
        <HeroBannerV3 movies={getFilteredList(heroMovies)} onPress={goToMovie} />

        {/* Ambient Ambient Glow Underlays */}
        <View style={styles.contentBody}>

          {/* Premium Universe selector row */}
          <View style={styles.studioSec}>
            <StudioHubRow activeHub={activeHub} onSelectHub={setActiveHub} />
          </View>

          {/* CORE SECTION 1: Continue Watching (Netflix Resumption layout) */}
          {visibleRailCount >= 1 && (
            <View style={styles.section}>
              <SectionHeader title="Continue Watching" subtitle="Resume where you left off" />
              <FlatList
                data={MOCK_CONTINUE_WATCHING}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `cw-${index}`}
                contentContainerStyle={styles.carouselPad}
                renderItem={({ item }) => (
                  <ContinueWatchingCard
                    movie={item.movie}
                    progress={item.progress}
                    timeLabel={item.timeLabel}
                    onPress={() => goToMovie(item.movie.id)}
                  />
                )}
              />
            </View>
          )}

          {/* CORE SECTION 2: Trending Worldwide (Netflix Numeric Ranks layout) */}
          {visibleRailCount >= 2 && (
            <View style={styles.section}>
              <SectionHeader title="Trending Worldwide" subtitle="The absolute biggest movies right now" />
              <FlatList
                data={getFilteredList(trending)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={m => `trend-${m.id}`}
                contentContainerStyle={styles.carouselPadTrend}
                renderItem={({ item, index }) => (
                  <RankingPosterCard
                    movie={item}
                    rank={index + 1}
                    onPress={() => goToMovie(item.id)}
                  />
                )}
              />
            </View>
          )}

          {/* CORE SECTION 3: CineAI Taste Recommendations */}
          {visibleRailCount >= 3 && (
            <View style={styles.section}>
              <SectionHeader title="CineAI Recommends" subtitle="Personalized according to your critic preference" />
              <FlatList
                data={getFilteredList(recommended)}
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
                        <Ionicons name="sparkles" size={9} color={Colors.accent.crimson} />
                        <Text style={styles.aiMatchText} allowFontScaling={false}>
                          {Math.floor(Math.random() * 10 + 89)}% Match
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
          )}

          {/* CORE SECTION 4: Interactive Mood Filter Capsule Rows */}
          {visibleRailCount >= 4 && (
            <View style={styles.section}>
              <SectionHeader title="Select Your Cinematic Mood" subtitle="Let your emotions guide your selection" />
              <View style={styles.moodGrid}>
                {MOOD_CATEGORIES.map(cat => (
                  <Pressable key={cat.id} style={[styles.moodCard, { backgroundColor: cat.color }]}>
                    <View style={[styles.moodAccentBar, { backgroundColor: cat.accent }]} />
                    <Text style={styles.moodLabel} allowFontScaling={false}>{cat.label}</Text>
                    <Ionicons name="chevron-forward" size={12} color={cat.accent} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* CORE SECTION 5: New Releases */}
          {visibleRailCount >= 5 && (
            <View style={styles.section}>
              <SectionHeader title="New Releases" subtitle="Straight out of the cinemas tonight" />
              <FlatList
                data={getFilteredList(newReleases)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={m => `new-${m.id}`}
                contentContainerStyle={styles.carouselPad}
                renderItem={({ item }) => (
                  <PosterCard movie={item} onPress={() => goToMovie(item.id)} />
                )}
              />
            </View>
          )}

          {/* LAZY LOADED ENDLESS ROW FEED (Dopamine Discovery Elements) */}

          {/* PAGINATED ROW 6: Mind-Bending Sci-Fi */}
          {visibleRailCount >= 6 && sciFiMovies.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Mind-Bending Sci-Fi" subtitle="Challenge your perception of space and time" />
              <FlatList
                data={getFilteredList(sciFiMovies)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={m => `scifi-${m.id}`}
                contentContainerStyle={styles.carouselPad}
                renderItem={({ item }) => (
                  <PosterCard movie={item} onPress={() => goToMovie(item.id)} />
                )}
              />
            </View>
          )}

          {/* PAGINATED ROW 7: Critically Acclaimed (Top IMDb) */}
          {visibleRailCount >= 7 && criticallyAcclaimed.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Critically Acclaimed Masterpieces" subtitle="Flawless cinema certified by absolute critics" />
              <FlatList
                data={getFilteredList(criticallyAcclaimed)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={m => `crit-${m.id}`}
                contentContainerStyle={styles.carouselPad}
                renderItem={({ item }) => (
                  <PosterCard movie={item} onPress={() => goToMovie(item.id)} />
                )}
              />
            </View>
          )}

          {/* PAGINATED ROW 8: Dark Psychological Thrillers */}
          {visibleRailCount >= 8 && thrillerMovies.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Dark Psychological Thrillers" subtitle="High tension twists that grip you until the end" />
              <FlatList
                data={getFilteredList(thrillerMovies)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={m => `thrill-${m.id}`}
                contentContainerStyle={styles.carouselPad}
                renderItem={({ item }) => (
                  <PosterCard movie={item} onPress={() => goToMovie(item.id)} />
                )}
              />
            </View>
          )}

          {/* PAGINATED ROW 9: Crunchyroll Anime Spotlight */}
          {visibleRailCount >= 9 && animeUniverse.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Crunchyroll Anime Universe" subtitle="Epic hand-drawn visual masterpieces" />
              <FlatList
                data={getFilteredList(animeUniverse)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={m => `anime-${m.id}`}
                contentContainerStyle={styles.carouselPad}
                renderItem={({ item }) => (
                  <PosterCard movie={item} onPress={() => goToMovie(item.id)} showRating={false} />
                )}
              />
            </View>
          )}

          {/* PAGINATED ROW 10: Bollywood & Regional Blockbusters */}
          {visibleRailCount >= 10 && bollywoodMovies.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Bollywood Spotlight" subtitle="Triumphant cinematic musical epics" />
              <FlatList
                data={getFilteredList(bollywoodMovies)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={m => `bolly-${m.id}`}
                contentContainerStyle={styles.carouselPad}
                renderItem={({ item }) => (
                  <PosterCard movie={item} onPress={() => goToMovie(item.id)} />
                )}
              />
            </View>
          )}

          {/* PAGINATED ROW 11: Late Night Recs */}
          {visibleRailCount >= 11 && (
            <View style={styles.section}>
              <SectionHeader title="Late Night Recommendations" subtitle="Understated slow burners perfect for midnight" />
              <FlatList
                data={getFilteredList(recommended.reverse())}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={m => `late-${m.id}`}
                contentContainerStyle={styles.carouselPad}
                renderItem={({ item }) => (
                  <PosterCard movie={item} onPress={() => goToMovie(item.id)} />
                )}
              />
            </View>
          )}

          {/* Infinite Pagination Shimmer Placeholder Skeletons */}
          {isPaginationLoading && (
            <View style={{ paddingVertical: 12 }}>
              <RailSkeleton />
              <ActivityIndicator size="small" color={Colors.accent.crimson} style={{ marginTop: 24 }} />
            </View>
          )}

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
    paddingHorizontal: 20, paddingBottom: 14,
  },
  headerTitleRow: {},
  greeting: { fontSize: 10, fontFamily: Typography.fontPrimary, color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.6 },
  headerWordmark: { fontSize: 18, fontFamily: Typography.fontPoppinsBold, color: Colors.text.primary, letterSpacing: 1.2, marginTop: 1 },
  headerAI: { color: Colors.accent.crimson },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  orbGlow: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10,
  },
  avatarBtn: {},
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.accent.crimsonMuted, borderWidth: 1.5, borderColor: Colors.accent.crimson,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontFamily: Typography.fontPoppinsBold, color: Colors.accent.crimson },
  contentBody: { position: 'relative', marginTop: -Spacing.lg },
  studioSec: { marginTop: Spacing.sm, marginBottom: Spacing.xs },
  section: { marginTop: Spacing.lg },
  carouselPad: { paddingHorizontal: 20, gap: 4 },
  carouselPadTrend: { paddingHorizontal: 20, gap: 0, paddingLeft: 12 },
  editorialCard: {
    width: 195, height: 125, borderRadius: Radius.md, overflow: 'hidden',
    backgroundColor: Colors.bg.surface, marginRight: Spacing.sm, position: 'relative',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  editorialPoster: { ...StyleSheet.absoluteFillObject },
  editorialGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85 },
  editorialMeta: { position: 'absolute', bottom: 10, left: 10, right: 10 },
  aiMatchChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.accent.crimsonMuted, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 6,
  },
  aiMatchText: { fontSize: 9, fontFamily: Typography.fontSemiBold, color: Colors.accent.crimson },
  editorialTitle: { fontSize: 12, fontFamily: Typography.fontSemiBold, color: Colors.text.primary },
  moodGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8,
  },
  moodCard: {
    width: (W - 48) / 2, borderRadius: Radius.md, padding: Spacing.base,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.glass.border, overflow: 'hidden',
  },
  moodAccentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  moodLabel: { fontSize: 13, fontFamily: Typography.fontSemiBold, color: Colors.text.primary, flex: 1, marginLeft: 8 },
});

export default HomeScreen;
