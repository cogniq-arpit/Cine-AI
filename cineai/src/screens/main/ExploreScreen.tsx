import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Typography } from '../../constants/theme';
import type { Movie } from '../../types';
import { apiClient } from '../../services/api/apiClient';
import { mapTmdbToMovie, tmdbApi } from '../../services/tmdbApi';
import { useAuthStore } from '../../store/authStore';
import { QuickProfileMenu } from '../../components/ui/QuickProfileMenu';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HUB_CARD_WIDTH = Math.min(244, SCREEN_WIDTH * 0.72);
const HUB_HERO_HEIGHT = Math.max(300, Math.floor(SCREEN_HEIGHT * 0.42));
const LANDSCAPE_CARD_WIDTH = Math.min(244, SCREEN_WIDTH * 0.64);
const LANDSCAPE_CARD_HEIGHT = Math.round(LANDSCAPE_CARD_WIDTH * 0.58);
const CACHE_TTL_MS = 8 * 60 * 1000;

interface RawMoviePayload {
  [key: string]: unknown;
}

interface DiscoverParams {
  with_genres?: string;
  sort_by?: string;
  with_original_language?: string;
  primary_release_year?: number;
  vote_average_gte?: number;
  vote_count_gte?: number;
}

interface HubCollectionDefinition {
  id: string;
  title: string;
  subtitle: string;
  mode: 'trending' | 'search' | 'discover';
  searchQuery?: string;
  discoverParams?: DiscoverParams;
}

interface PlatformHubDefinition {
  id: string;
  label: string;
  tagline: string;
  ambiance: string;
  palette: [string, string, string];
  collections: HubCollectionDefinition[];
}

interface HubCollectionState extends HubCollectionDefinition {
  movies: Movie[];
  loading: boolean;
  bannerMovie: Movie | null;
}

interface HubState {
  loading: boolean;
  collections: HubCollectionState[];
  spotlight: Movie | null;
  loadedAt: number;
}

const RAIL_CACHE = new Map<string, { expiresAt: number; movies: Movie[] }>();
const HUB_CACHE = new Map<string, { expiresAt: number; state: HubState }>();

const REPETITIVE_TITLE_TOKENS = [
  'dune',
  'interstellar',
  'dark knight',
  'avengers',
  'inception',
  'oppenheimer',
];

const FRANCHISE_STOPWORDS = new Set([
  'the',
  'and',
  'of',
  'a',
  'an',
  'part',
  'chapter',
  'volume',
  'vol',
  'episode',
  'movie',
  'film',
  'story',
  'rise',
  'return',
  'returns',
  'chronicles',
]);

const HUB_DEFS: PlatformHubDefinition[] = [
  {
    id: 'netflix-hub',
    label: 'NETFLIX HUB',
    tagline: 'Dark momentum, binge rhythms, and global cultural heat',
    ambiance: 'Platform-first discovery for thriller-heavy exploration',
    palette: ['rgba(205,34,49,0.86)', 'rgba(121,20,29,0.7)', 'rgba(7,7,9,0.92)'],
    collections: [
      {
        id: 'netflix-originals',
        title: 'Netflix Originals',
        subtitle: 'Original storytelling with global conversation momentum',
        mode: 'search',
        searchQuery: 'netflix original movie',
      },
      {
        id: 'netflix-dark-thrillers',
        title: 'Dark Thrillers',
        subtitle: 'Noir tension and psychological instability',
        mode: 'discover',
        discoverParams: {
          with_genres: '53|80|9648',
          sort_by: 'popularity.desc',
          vote_average_gte: 6.2,
          vote_count_gte: 80,
        },
      },
      {
        id: 'netflix-binge-worthy',
        title: 'Binge-Worthy Stories',
        subtitle: 'Story hooks built for marathon sessions',
        mode: 'search',
        searchQuery: 'binge worthy thriller series movie',
      },
      {
        id: 'netflix-global-trending',
        title: 'Global Trending',
        subtitle: 'Worldwide audience heat right now',
        mode: 'trending',
      },
      {
        id: 'netflix-psychological-stories',
        title: 'Psychological Stories',
        subtitle: 'Cerebral tension and character fractures',
        mode: 'discover',
        discoverParams: {
          with_genres: '9648|53|18',
          sort_by: 'vote_average.desc',
          vote_average_gte: 6.5,
          vote_count_gte: 65,
        },
      },
    ],
  },
  {
    id: 'disney-hub',
    label: 'DISNEY+ HUB',
    tagline: 'Adventure worlds, fantasy scale, and family-safe spectacle',
    ambiance: 'High-immersion escapism with bright cinematic arcs',
    palette: ['rgba(53,91,171,0.84)', 'rgba(33,61,120,0.66)', 'rgba(7,7,9,0.92)'],
    collections: [
      {
        id: 'disney-adventure-worlds',
        title: 'Adventure Worlds',
        subtitle: 'Expeditions, quests, and giant-set-piece journeys',
        mode: 'discover',
        discoverParams: {
          with_genres: '12|14|28',
          sort_by: 'popularity.desc',
          vote_average_gte: 6.0,
          vote_count_gte: 70,
        },
      },
      {
        id: 'disney-fantasy-universes',
        title: 'Fantasy Universes',
        subtitle: 'Mythic systems and cinematic worldbuilding',
        mode: 'discover',
        discoverParams: {
          with_genres: '14|12|878',
          sort_by: 'vote_average.desc',
          vote_average_gte: 6.2,
          vote_count_gte: 55,
        },
      },
      {
        id: 'disney-family-animation',
        title: 'Family Animation',
        subtitle: 'Heart-forward animation with cross-age appeal',
        mode: 'discover',
        discoverParams: {
          with_genres: '16|10751|12',
          sort_by: 'popularity.desc',
          vote_average_gte: 6.0,
          vote_count_gte: 50,
        },
      },
      {
        id: 'disney-epic-journeys',
        title: 'Epic Journeys',
        subtitle: 'Large emotional arcs and destination cinema',
        mode: 'search',
        searchQuery: 'epic journey adventure film',
      },
      {
        id: 'disney-heroic-stories',
        title: 'Heroic Stories',
        subtitle: 'High-stakes courage and cinematic myth',
        mode: 'discover',
        discoverParams: {
          with_genres: '28|12|878',
          sort_by: 'popularity.desc',
          vote_average_gte: 5.9,
          vote_count_gte: 80,
        },
      },
    ],
  },
  {
    id: 'prime-hub',
    label: 'PRIME VIDEO HUB',
    tagline: 'Hard-edged action, crime gravity, and gritty atmospheres',
    ambiance: 'Direct, kinetic, and tension-led exploration',
    palette: ['rgba(22,110,162,0.84)', 'rgba(16,72,106,0.7)', 'rgba(7,7,9,0.92)'],
    collections: [
      {
        id: 'prime-action-collection',
        title: 'Action Collection',
        subtitle: 'Velocity-driven set pieces and impact cinema',
        mode: 'discover',
        discoverParams: {
          with_genres: '28|12',
          sort_by: 'popularity.desc',
          vote_average_gte: 5.8,
          vote_count_gte: 70,
        },
      },
      {
        id: 'prime-crime-stories',
        title: 'Crime Stories',
        subtitle: 'Heists, investigations, and underworld politics',
        mode: 'discover',
        discoverParams: {
          with_genres: '80|53|18',
          sort_by: 'popularity.desc',
          vote_average_gte: 6.2,
          vote_count_gte: 65,
        },
      },
      {
        id: 'prime-gritty-cinema',
        title: 'Gritty Cinema',
        subtitle: 'Raw performances and pressure-cooker stakes',
        mode: 'discover',
        discoverParams: {
          with_genres: '80|18|53',
          sort_by: 'vote_average.desc',
          vote_average_gte: 6.7,
          vote_count_gte: 55,
        },
      },
      {
        id: 'prime-suspense-nights',
        title: 'Suspense Nights',
        subtitle: 'Edge-of-seat pacing for late-night marathons',
        mode: 'discover',
        discoverParams: {
          with_genres: '53|9648',
          sort_by: 'popularity.desc',
          vote_average_gte: 6.1,
          vote_count_gte: 45,
        },
      },
    ],
  },
  {
    id: 'anime-universe',
    label: 'ANIME UNIVERSE',
    tagline: 'Shonen energy, emotional arcs, and imaginative futures',
    ambiance: 'Animation-first discovery with tonal range and precision',
    palette: ['rgba(117,63,193,0.84)', 'rgba(73,37,122,0.68)', 'rgba(7,7,9,0.92)'],
    collections: [
      {
        id: 'anime-shonen-essentials',
        title: 'Shonen Essentials',
        subtitle: 'Core action lineups and signature genre adrenaline',
        mode: 'search',
        searchQuery: 'shonen anime movie',
      },
      {
        id: 'anime-dark-anime',
        title: 'Dark Anime',
        subtitle: 'Psychological edges and morally grey conflict',
        mode: 'discover',
        discoverParams: {
          with_genres: '16|53|9648',
          with_original_language: 'ja',
          sort_by: 'vote_average.desc',
          vote_average_gte: 6.4,
          vote_count_gte: 35,
        },
      },
      {
        id: 'anime-scifi-anime',
        title: 'Sci-Fi Anime',
        subtitle: 'Neon futures, speculative tech, and existential scope',
        mode: 'discover',
        discoverParams: {
          with_genres: '16|878',
          with_original_language: 'ja',
          sort_by: 'popularity.desc',
          vote_average_gte: 6.1,
          vote_count_gte: 30,
        },
      },
      {
        id: 'anime-emotional-anime',
        title: 'Emotional Anime',
        subtitle: 'Character intimacy with deep emotional resonance',
        mode: 'discover',
        discoverParams: {
          with_genres: '16|18|10749',
          with_original_language: 'ja',
          sort_by: 'vote_average.desc',
          vote_average_gte: 6.4,
          vote_count_gte: 28,
        },
      },
      {
        id: 'anime-movies',
        title: 'Anime Movies',
        subtitle: 'Feature-length animation from classic to contemporary',
        mode: 'search',
        searchQuery: 'anime feature film',
      },
    ],
  },
  {
    id: 'korean-entertainment',
    label: 'KOREAN ENTERTAINMENT',
    tagline: 'Sharp craft, tonal control, and relentless narrative precision',
    ambiance: 'From prestige drama to high-pressure thriller systems',
    palette: ['rgba(41,128,84,0.82)', 'rgba(25,83,54,0.67)', 'rgba(7,7,9,0.92)'],
    collections: [
      {
        id: 'korean-kdrama-hits',
        title: 'K-Drama Hits',
        subtitle: 'Romance, momentum, and character-centered stakes',
        mode: 'search',
        searchQuery: 'kdrama korean drama movie',
      },
      {
        id: 'korean-thrillers',
        title: 'Korean Thrillers',
        subtitle: 'Highly tuned suspense with sharp genre execution',
        mode: 'discover',
        discoverParams: {
          with_original_language: 'ko',
          with_genres: '53|80|9648',
          sort_by: 'popularity.desc',
          vote_average_gte: 6.2,
          vote_count_gte: 35,
        },
      },
      {
        id: 'korean-emotional-cinema',
        title: 'Emotional Korean Cinema',
        subtitle: 'Human stories with emotional depth and restraint',
        mode: 'discover',
        discoverParams: {
          with_original_language: 'ko',
          with_genres: '18|10749',
          sort_by: 'vote_average.desc',
          vote_average_gte: 6.6,
          vote_count_gte: 25,
        },
      },
      {
        id: 'korean-dark-stories',
        title: 'Dark Korean Stories',
        subtitle: 'Bleak atmosphere and psychological intensity',
        mode: 'discover',
        discoverParams: {
          with_original_language: 'ko',
          with_genres: '53|9648|27',
          sort_by: 'vote_average.desc',
          vote_average_gte: 6.4,
          vote_count_gte: 30,
        },
      },
    ],
  },
  {
    id: 'bollywood-hub',
    label: 'BOLLYWOOD HUB',
    tagline: 'Emotion, spectacle, and drama-forward cinematic scale',
    ambiance: 'Hindi storytelling across crime, romance, and musical pulse',
    palette: ['rgba(190,102,26,0.84)', 'rgba(122,63,14,0.72)', 'rgba(7,7,9,0.92)'],
    collections: [
      {
        id: 'bollywood-crime',
        title: 'Bollywood Crime',
        subtitle: 'Hindi crime arcs with thriller velocity',
        mode: 'discover',
        discoverParams: {
          with_original_language: 'hi',
          with_genres: '80|53',
          sort_by: 'popularity.desc',
          vote_average_gte: 5.8,
          vote_count_gte: 35,
        },
      },
      {
        id: 'bollywood-emotional-drama',
        title: 'Emotional Drama',
        subtitle: 'Relationship depth and high-impact character turns',
        mode: 'discover',
        discoverParams: {
          with_original_language: 'hi',
          with_genres: '18|10749',
          sort_by: 'vote_average.desc',
          vote_average_gte: 6.1,
          vote_count_gte: 28,
        },
      },
      {
        id: 'bollywood-indian-blockbusters',
        title: 'Indian Blockbusters',
        subtitle: 'Mass-energy storytelling and crowd-scale momentum',
        mode: 'discover',
        discoverParams: {
          with_original_language: 'hi',
          with_genres: '28|12|18',
          sort_by: 'popularity.desc',
          vote_average_gte: 5.8,
          vote_count_gte: 45,
        },
      },
      {
        id: 'bollywood-musical-cinema',
        title: 'Musical Cinema',
        subtitle: 'Song-led drama and stylized emotional beats',
        mode: 'discover',
        discoverParams: {
          with_original_language: 'hi',
          with_genres: '10402|10749|35',
          sort_by: 'popularity.desc',
          vote_average_gte: 5.5,
          vote_count_gte: 20,
        },
      },
      {
        id: 'bollywood-cult',
        title: 'Cult Bollywood',
        subtitle: 'Beloved eras and titles with fan-following longevity',
        mode: 'search',
        searchQuery: 'cult bollywood cinema',
      },
    ],
  },
  {
    id: 'south-indian-cinema',
    label: 'SOUTH INDIAN CINEMA',
    tagline: 'Regional power, mass action, and grounded thriller systems',
    ambiance: 'Telugu, Tamil, Malayalam, and Kannada cinematic universes',
    palette: ['rgba(141,44,111,0.84)', 'rgba(88,29,69,0.7)', 'rgba(7,7,9,0.92)'],
    collections: [
      {
        id: 'south-telugu-blockbusters',
        title: 'Telugu Blockbusters',
        subtitle: 'High-scale Telugu event filmmaking',
        mode: 'discover',
        discoverParams: {
          with_original_language: 'te',
          with_genres: '28|12|18',
          sort_by: 'popularity.desc',
          vote_average_gte: 5.8,
          vote_count_gte: 35,
        },
      },
      {
        id: 'south-tamil-action',
        title: 'Tamil Action',
        subtitle: 'Velocity-driven Tamil action and gangster systems',
        mode: 'discover',
        discoverParams: {
          with_original_language: 'ta',
          with_genres: '28|80',
          sort_by: 'popularity.desc',
          vote_average_gte: 5.9,
          vote_count_gte: 32,
        },
      },
      {
        id: 'south-malayalam-thrillers',
        title: 'Malayalam Thrillers',
        subtitle: 'Craft-heavy suspense and layered character logic',
        mode: 'discover',
        discoverParams: {
          with_original_language: 'ml',
          with_genres: '53|80|9648',
          sort_by: 'vote_average.desc',
          vote_average_gte: 6.4,
          vote_count_gte: 18,
        },
      },
      {
        id: 'south-kannada-mass',
        title: 'Kannada Mass Cinema',
        subtitle: 'Punchy style, momentum, and crowd-energy stakes',
        mode: 'discover',
        discoverParams: {
          with_original_language: 'kn',
          with_genres: '28|12|18',
          sort_by: 'popularity.desc',
          vote_average_gte: 5.6,
          vote_count_gte: 18,
        },
      },
    ],
  },
  {
    id: 'global-cinema',
    label: 'GLOBAL CINEMA',
    tagline: 'Prestige drama, auteur voices, and cross-platform curation',
    ambiance: 'Apple TV+, HBO-style prestige, and world-class discovery',
    palette: ['rgba(66,109,130,0.84)', 'rgba(39,67,80,0.7)', 'rgba(7,7,9,0.92)'],
    collections: [
      {
        id: 'global-apple-style',
        title: 'Apple TV+ Style Picks',
        subtitle: 'Modern premium storytelling with clean cinematic tone',
        mode: 'search',
        searchQuery: 'apple tv original movie',
      },
      {
        id: 'global-hbo-prestige',
        title: 'HBO Prestige Drama',
        subtitle: 'Character-intense drama and high-critical craft',
        mode: 'search',
        searchQuery: 'hbo prestige drama film',
      },
      {
        id: 'global-award-winners',
        title: 'Award Winners',
        subtitle: 'Global acclaim and high-confidence quality signals',
        mode: 'discover',
        discoverParams: {
          sort_by: 'vote_average.desc',
          vote_average_gte: 7.1,
          vote_count_gte: 140,
        },
      },
      {
        id: 'global-cult-classics',
        title: 'Cult Classics',
        subtitle: 'Timeless titles with long-term audience devotion',
        mode: 'search',
        searchQuery: 'cult classic world cinema',
      },
      {
        id: 'global-hidden-gems',
        title: 'Hidden Gems',
        subtitle: 'High-rated titles outside repetitive blockbuster loops',
        mode: 'discover',
        discoverParams: {
          sort_by: 'vote_average.desc',
          vote_average_gte: 7.3,
          vote_count_gte: 32,
        },
      },
    ],
  },
];

const genreLabelMap: Record<number, string> = {
  12: 'Adventure',
  14: 'Fantasy',
  16: 'Animation',
  18: 'Drama',
  27: 'Horror',
  28: 'Action',
  35: 'Comedy',
  53: 'Thriller',
  80: 'Crime',
  878: 'Sci-Fi',
  9648: 'Mystery',
  10402: 'Music',
  10749: 'Romance',
  10751: 'Family',
};

const releaseYear = (date: string | undefined): string => {
  if (!date || date.length < 4) return 'N/A';
  return date.slice(0, 4);
};

const genreLine = (ids: number[] | undefined): string => {
  if (!ids?.length) return 'Cinema';
  return ids
    .map(id => genreLabelMap[id])
    .filter(Boolean)
    .slice(0, 2)
    .join(' | ') || 'Cinema';
};

const normalizeTitle = (title: string): string => {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getFranchiseKey = (title: string): string => {
  const normalized = normalizeTitle(title)
    .replace(/\b(part|chapter|volume|vol|episode)\b.*$/, '')
    .trim();
  if (!normalized) return '';
  const tokens = normalized
    .split(' ')
    .filter(token => token.length > 2 && !FRANCHISE_STOPWORDS.has(token));
  if (tokens.length === 0) return normalized;
  return tokens.slice(0, 2).join(' ');
};

const imageIsFromTmdb = (url: string | null | undefined): boolean => {
  return typeof url === 'string' && url.includes('image.tmdb.org/t/p/');
};

const isQualityMovie = (movie: Movie): boolean => {
  const hasPoster = typeof movie.poster_path === 'string' && movie.poster_path.length > 0;
  const hasBackdrop = typeof movie.backdrop_path === 'string' && movie.backdrop_path.length > 0;
  return hasPoster && hasBackdrop && movie.vote_average >= 5.2 && movie.vote_count >= 18;
};

const sanitizeMovieList = (movies: Movie[]): Movie[] => {
  const seen = new Set<number>();
  return movies.filter(movie => {
    if (!isQualityMovie(movie)) return false;
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
};

const rankMovie = (movie: Movie): number => {
  const titlePenalty = REPETITIVE_TITLE_TOKENS.some(token => normalizeTitle(movie.title).includes(token))
    ? 2.9
    : 0;
  const voteSignal = Math.log10(Math.max(1, movie.vote_count));
  return (
    movie.vote_average * 18 +
    voteSignal * 8.4 +
    Math.min(movie.popularity, 1300) * 0.015 -
    titlePenalty
  );
};

const rankMovies = (movies: Movie[]): Movie[] => {
  return [...movies].sort((a, b) => rankMovie(b) - rankMovie(a));
};

const setCachedRail = (cacheKey: string, movies: Movie[]): void => {
  RAIL_CACHE.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    movies,
  });
};

const getCachedRail = (cacheKey: string): Movie[] | null => {
  const cached = RAIL_CACHE.get(cacheKey);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    RAIL_CACHE.delete(cacheKey);
    return null;
  }
  return cached.movies;
};

const buildInitialHubState = (): Record<string, HubState> => {
  return HUB_DEFS.reduce((acc, hub) => {
    acc[hub.id] = {
      loading: false,
      collections: [],
      spotlight: null,
      loadedAt: 0,
    };
    return acc;
  }, {} as Record<string, HubState>);
};

const selectDiverseList = (
  raw: Movie[],
  globalUsed: Set<number>,
  nearbyBlocked: Set<number>,
  desiredCount: number,
): Movie[] => {
  const ranked = rankMovies(sanitizeMovieList(raw));
  const picks: Movie[] = [];
  const pickedIds = new Set<number>();
  const usedFranchises = new Set<string>();
  const genreUsage = new Map<number, number>();

  const canPick = (
    movie: Movie,
    options: {
      ignoreGlobal?: boolean;
      ignoreFranchise?: boolean;
      ignoreGenreCap?: boolean;
      ignoreNearby?: boolean;
    },
  ): boolean => {
    if (pickedIds.has(movie.id)) return false;
    if (!options.ignoreGlobal && globalUsed.has(movie.id)) return false;
    if (!options.ignoreNearby && nearbyBlocked.has(movie.id)) return false;

    const franchiseKey = getFranchiseKey(movie.title);
    if (!options.ignoreFranchise && franchiseKey && usedFranchises.has(franchiseKey)) return false;

    const primaryGenre = movie.genre_ids?.[0] ?? -1;
    const genreCount = genreUsage.get(primaryGenre) || 0;
    if (!options.ignoreGenreCap && genreCount >= 2) return false;

    return true;
  };

  const commit = (movie: Movie): void => {
    picks.push(movie);
    pickedIds.add(movie.id);

    const franchiseKey = getFranchiseKey(movie.title);
    if (franchiseKey) {
      usedFranchises.add(franchiseKey);
    }

    const primaryGenre = movie.genre_ids?.[0] ?? -1;
    genreUsage.set(primaryGenre, (genreUsage.get(primaryGenre) || 0) + 1);
  };

  const passes = [
    { ignoreGlobal: false, ignoreFranchise: false, ignoreGenreCap: false, ignoreNearby: false },
    { ignoreGlobal: false, ignoreFranchise: false, ignoreGenreCap: true, ignoreNearby: false },
    { ignoreGlobal: true, ignoreFranchise: false, ignoreGenreCap: true, ignoreNearby: false },
    { ignoreGlobal: true, ignoreFranchise: true, ignoreGenreCap: true, ignoreNearby: false },
    { ignoreGlobal: true, ignoreFranchise: true, ignoreGenreCap: true, ignoreNearby: true },
  ];

  for (const pass of passes) {
    if (picks.length >= desiredCount) break;
    for (const movie of ranked) {
      if (picks.length >= desiredCount) break;
      if (!canPick(movie, pass)) continue;
      commit(movie);
    }
  }

  picks.forEach(movie => globalUsed.add(movie.id));
  return picks.slice(0, desiredCount);
};

const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <View style={styles.collectionHeader}>
    <Text style={styles.collectionTitle} allowFontScaling={false}>{title}</Text>
    <Text style={styles.collectionSubtitle} allowFontScaling={false}>{subtitle}</Text>
  </View>
);

const CollectionRailSkeleton: React.FC = () => (
  <View style={styles.collectionSkeletonWrap}>
    <View style={styles.collectionSkeletonTitle} />
    <View style={styles.collectionSkeletonRow}>
      {[0, 1, 2].map(index => (
        <View key={`collection-skeleton-${index}`} style={styles.collectionSkeletonCard} />
      ))}
    </View>
  </View>
);

const LandscapeMovieCard: React.FC<{
  movie: Movie;
  onPress: (movie: Movie) => void;
}> = ({ movie, onPress }) => {
  return (
    <Pressable style={styles.landscapeCard} onPress={() => onPress(movie)}>
      <Image
        source={{ uri: movie.backdrop_path || undefined }}
        style={styles.landscapeImage}
        contentFit="cover"
        transition={220}
        cachePolicy="memory-disk"
      />
      <LinearGradient colors={['transparent', 'rgba(7,7,9,0.92)']} style={styles.landscapeGradient} />
      <View style={styles.landscapeMeta}>
        <Text style={styles.landscapeTitle} numberOfLines={1} allowFontScaling={false}>
          {movie.title}
        </Text>
        <Text style={styles.landscapeSub} numberOfLines={1} allowFontScaling={false}>
          {releaseYear(movie.release_date)} | {genreLine(movie.genre_ids)}
        </Text>
      </View>
      <View style={styles.landscapeRatingPill}>
        <Ionicons name="star" size={9} color={Colors.accent.gold} />
        <Text style={styles.landscapeRatingText} allowFontScaling={false}>
          {movie.vote_average.toFixed(1)}
        </Text>
      </View>
    </Pressable>
  );
};

export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const isMountedRef = useRef(true);

  const [bootLoading, setBootLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [activeHubId, setActiveHubId] = useState(HUB_DEFS[0].id);
  const [hubStateById, setHubStateById] = useState<Record<string, HubState>>(() => buildInitialHubState());
  const hubStateRef = useRef<Record<string, HubState>>(buildInitialHubState());

  useEffect(() => {
    hubStateRef.current = hubStateById;
  }, [hubStateById]);

  const activeHub = useMemo(
    () => HUB_DEFS.find(hub => hub.id === activeHubId) || HUB_DEFS[0],
    [activeHubId],
  );

  const activeHubState = hubStateById[activeHub.id];

  const prefetchMovieAssets = useCallback(async (movie: Movie | null | undefined) => {
    if (!movie) return;
    const queue: Promise<boolean>[] = [];
    if (imageIsFromTmdb(movie.poster_path)) queue.push(Image.prefetch(movie.poster_path as string));
    if (imageIsFromTmdb(movie.backdrop_path)) queue.push(Image.prefetch(movie.backdrop_path as string));
    if (queue.length === 0) return;
    await Promise.allSettled(queue);
  }, []);

  const toMovies = useCallback((payload: RawMoviePayload[]): Movie[] => {
    return payload
      .map(item => {
        try {
          return mapTmdbToMovie(item);
        } catch {
          return null;
        }
      })
      .filter((movie): movie is Movie => Boolean(movie));
  }, []);

  const fetchRawMovies = useCallback(async (
    mode: 'trending' | 'search' | 'discover',
    args: {
      query?: string;
      discoverParams?: Record<string, string | number | undefined>;
      limit?: number;
    } = {},
  ): Promise<Movie[]> => {
    const limit = args.limit ?? 36;

    try {
      if (mode === 'trending') {
        const { data } = await apiClient.get<RawMoviePayload[]>('/movies/trending', { params: { limit } });
        return toMovies(data || []);
      }

      if (mode === 'search') {
        const { data } = await apiClient.get<RawMoviePayload[]>('/movies/search', {
          params: { query: args.query, limit },
        });
        return toMovies(data || []);
      }

      const discoverParams = args.discoverParams || {};
      const voteAverageGte =
        discoverParams.vote_average_gte !== undefined ? Number(discoverParams.vote_average_gte) : 6.0;
      const voteCountGte =
        discoverParams.vote_count_gte !== undefined ? Number(discoverParams.vote_count_gte) : 40;

      const { data } = await apiClient.get<RawMoviePayload[]>('/movies/discover', {
        params: {
          ...discoverParams,
          vote_average_gte: voteAverageGte,
          vote_count_gte: voteCountGte,
          limit,
        },
      });
      return toMovies(data || []);
    } catch {
      try {
        if (mode === 'trending') {
          const res = await tmdbApi.getTrending('week', limit);
          return res.results;
        }
        if (mode === 'search') {
          const res = await tmdbApi.searchMovies(args.query || '', 1, limit);
          return res.results;
        }

        const discoverParams = args.discoverParams || {};
        const voteAverageGte =
          discoverParams.vote_average_gte !== undefined ? Number(discoverParams.vote_average_gte) : 6.0;
        const voteCountGte =
          discoverParams.vote_count_gte !== undefined ? Number(discoverParams.vote_count_gte) : 40;

        const res = await tmdbApi.discover({
          with_genres: discoverParams.with_genres ? String(discoverParams.with_genres) : undefined,
          sort_by: discoverParams.sort_by ? String(discoverParams.sort_by) : undefined,
          'vote_average.gte': voteAverageGte,
          'vote_count.gte': voteCountGte,
          with_original_language: discoverParams.with_original_language
            ? String(discoverParams.with_original_language)
            : undefined,
          primary_release_year: discoverParams.primary_release_year
            ? Number(discoverParams.primary_release_year)
            : undefined,
          limit,
        });
        return res.results;
      } catch {
        return [];
      }
    }
  }, [toMovies]);

  const getOrFetchRail = useCallback(async (
    cacheKey: string,
    loader: () => Promise<Movie[]>,
  ): Promise<Movie[]> => {
    const cached = getCachedRail(cacheKey);
    if (cached && cached.length > 0) return cached;
    const movies = await loader();
    const cleaned = sanitizeMovieList(movies);
    setCachedRail(cacheKey, cleaned);
    return cleaned;
  }, []);

  const fetchCollectionRaw = useCallback(async (
    hubId: string,
    collection: HubCollectionDefinition,
  ): Promise<Movie[]> => {
    const cacheKey = `hub-${hubId}-${collection.id}`;
    if (collection.mode === 'trending') {
      return getOrFetchRail(cacheKey, () => fetchRawMovies('trending', { limit: 44 }));
    }

    if (collection.mode === 'search') {
      return getOrFetchRail(cacheKey, () => fetchRawMovies('search', {
        query: collection.searchQuery,
        limit: 44,
      }));
    }

    return getOrFetchRail(cacheKey, async () => {
      const discoverParams = {
        with_genres: collection.discoverParams?.with_genres,
        with_original_language: collection.discoverParams?.with_original_language,
        sort_by: collection.discoverParams?.sort_by || 'popularity.desc',
        primary_release_year: collection.discoverParams?.primary_release_year,
        vote_average_gte: collection.discoverParams?.vote_average_gte,
        vote_count_gte: collection.discoverParams?.vote_count_gte,
      };

      const langFilter = String(discoverParams.with_original_language || '');
      const hasLanguageUnion = langFilter.includes('|');

      if (hasLanguageUnion) {
        const languages = langFilter.split('|').map(value => value.trim()).filter(Boolean);
        const perLanguageLimit = Math.max(14, Math.ceil(72 / Math.max(languages.length, 1)));

        const batches = await Promise.all(
          languages.map(language =>
            fetchRawMovies('discover', {
              discoverParams: { ...discoverParams, with_original_language: language },
              limit: perLanguageLimit,
            }),
          ),
        );

        const merged = rankMovies(sanitizeMovieList(batches.flat()));
        if (merged.length >= 10) {
          return merged;
        }
      }

      return fetchRawMovies('discover', {
        discoverParams,
        limit: 44,
      });
    });
  }, [fetchRawMovies, getOrFetchRail]);

  const loadHub = useCallback(async (hubId: string, force = false) => {
    const hub = HUB_DEFS.find(item => item.id === hubId);
    if (!hub) return;

    const now = Date.now();
    const currentState = hubStateRef.current[hubId];
    const cached = HUB_CACHE.get(hubId);

    if (!force && cached && cached.expiresAt > now) {
      if (!isMountedRef.current) return;
      setHubStateById(prev => ({ ...prev, [hubId]: cached.state }));
      return;
    }

    if (
      !force &&
      currentState &&
      currentState.collections.length > 0 &&
      now - currentState.loadedAt < CACHE_TTL_MS
    ) {
      return;
    }

    if (isMountedRef.current) {
      setHubStateById(prev => ({
        ...prev,
        [hubId]: {
          ...prev[hubId],
          loading: true,
        },
      }));
    }

    const usedIds = new Set<number>();
    const nearbyIds = new Set<number>();
    const builtCollections: HubCollectionState[] = [];

    for (const collection of hub.collections) {
      let raw: Movie[] = [];
      try {
        raw = await fetchCollectionRaw(hubId, collection);
      } catch {
        raw = [];
      }

      if (raw.length < 8) {
        const fallbackBatches = await Promise.all([
          fetchRawMovies('trending', { limit: 24 }),
          collection.searchQuery
            ? fetchRawMovies('search', { query: collection.searchQuery, limit: 20 })
            : Promise.resolve([] as Movie[]),
        ]);
        raw = [...raw, ...fallbackBatches[0], ...fallbackBatches[1]];
      }

      const selected = selectDiverseList(raw, usedIds, nearbyIds, 10);
      builtCollections.push({
        ...collection,
        movies: selected,
        loading: false,
        bannerMovie: selected[0] || null,
      });

      selected.forEach(movie => nearbyIds.add(movie.id));
      if (nearbyIds.size > 120) {
        const keep = Array.from(nearbyIds).slice(-70);
        nearbyIds.clear();
        keep.forEach(id => nearbyIds.add(id));
      }
    }

    const spotlightPool = builtCollections.flatMap(collection => collection.movies);
    const spotlight = rankMovies(spotlightPool)[0] || null;
    if (spotlight) {
      prefetchMovieAssets(spotlight).catch(() => {});
    }
    builtCollections.slice(0, 2).forEach(collection => {
      prefetchMovieAssets(collection.bannerMovie).catch(() => {});
    });

    const nextState: HubState = {
      loading: false,
      collections: builtCollections,
      spotlight,
      loadedAt: Date.now(),
    };

    HUB_CACHE.set(hubId, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      state: nextState,
    });

    if (!isMountedRef.current) return;
    setHubStateById(prev => ({
      ...prev,
      [hubId]: nextState,
    }));
  }, [fetchCollectionRaw, fetchRawMovies, prefetchMovieAssets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    HUB_CACHE.delete(activeHub.id);
    Array.from(RAIL_CACHE.keys())
      .filter(key => key.startsWith(`hub-${activeHub.id}-`))
      .forEach(key => RAIL_CACHE.delete(key));

    await loadHub(activeHub.id, true);
    setRefreshing(false);
  }, [activeHub.id, loadHub]);

  const openMovie = useCallback((movie: Movie) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('MovieDetails', {
      movieId: movie.id,
      imdbId: movie.imdb_id || movie.imdbID,
      movieTitle: movie.title,
      releaseYear: releaseYear(movie.release_date),
      movie,
    });
  }, [navigation]);

  useEffect(() => {
    isMountedRef.current = true;

    loadHub(activeHub.id, false)
      .finally(() => {
        if (isMountedRef.current) setBootLoading(false);
      });

    if (HUB_DEFS[1]) {
      loadHub(HUB_DEFS[1].id, false).catch(() => {});
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [activeHub.id, loadHub]);

  useEffect(() => {
    if (!activeHubState?.collections?.length && !activeHubState?.loading) {
      loadHub(activeHub.id, false).catch(() => {});
    }
  }, [activeHub.id, activeHubState?.collections?.length, activeHubState?.loading, loadHub]);

  const spotlightMeta = useMemo(() => {
    const movie = activeHubState?.spotlight;
    if (!movie) return 'Streaming ecosystem discovery powered by TMDB';
    return `${releaseYear(movie.release_date)} | ${movie.vote_average.toFixed(1)} | ${genreLine(movie.genre_ids)}`;
  }, [activeHubState?.spotlight]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View
        style={[
          styles.topHeader,
          { paddingTop: insets.top + 8 },
          headerSolid && styles.topHeaderSolid,
        ]}
      >
        <View>
          <Text style={styles.topLabel} allowFontScaling={false}>Streaming Universes</Text>
          <Text style={styles.topTitle} allowFontScaling={false}>Explore</Text>
        </View>

        <View style={styles.topActions}>
          <Pressable
            style={styles.topIconBtn}
            onPress={() => navigation.navigate('Search')}
            accessibilityRole="button"
            accessibilityLabel="Open search"
          >
            <Ionicons name="search" size={14} color={Colors.text.primary} />
          </Pressable>

          <Pressable
            style={styles.topAvatar}
            onPress={() => setProfileMenuVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Open quick profile menu"
          >
            <Text style={styles.topAvatarText} allowFontScaling={false}>
              {(profile?.name?.[0] || 'G').toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent.crimson}
          />
        )}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          setHeaderSolid(offsetY > 20);
        }}
        scrollEventThrottle={16}
      >
        <View style={[styles.body, { paddingTop: insets.top + 92 }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
            style={styles.introCard}
          >
            <Text style={styles.introEyebrow} allowFontScaling={false}>
              Explore is category-first
            </Text>
            <Text style={styles.introTitle} allowFontScaling={false}>
              Enter cinematic ecosystems, not another recommendation feed.
            </Text>
            <Text style={styles.introBody} allowFontScaling={false}>
              Switch hubs to browse platform-inspired universes powered entirely by live TMDB discovery.
            </Text>
          </LinearGradient>

          <View style={styles.hubSelectorHeader}>
            <Text style={styles.hubSelectorTitle} allowFontScaling={false}>Choose A Hub</Text>
            <Text style={styles.hubSelectorSubtitle} allowFontScaling={false}>Tap a universe to reframe discovery</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hubCardRow}
          >
            {HUB_DEFS.map(hub => {
              const selected = hub.id === activeHub.id;
              return (
                <Pressable
                  key={hub.id}
                  style={[styles.hubCard, selected && styles.hubCardSelected]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setActiveHubId(hub.id);
                    loadHub(hub.id, false).catch(() => {});
                  }}
                >
                  <LinearGradient
                    colors={hub.palette}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.hubCardOverlay} />
                  <Text style={styles.hubCardLabel} allowFontScaling={false}>{hub.label}</Text>
                  <Text style={styles.hubCardTagline} numberOfLines={2} allowFontScaling={false}>
                    {hub.tagline}
                  </Text>
                  {selected ? (
                    <View style={styles.hubSelectedPill}>
                      <Ionicons name="checkmark" size={12} color={Colors.text.primary} />
                      <Text style={styles.hubSelectedText} allowFontScaling={false}>Active</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {activeHubState?.loading && !activeHubState.spotlight ? (
            <View style={styles.hubHeroSkeleton}>
              <ActivityIndicator size="small" color={Colors.accent.crimson} />
            </View>
          ) : activeHubState?.spotlight ? (
            <Pressable
              style={styles.hubHero}
              onPress={() => openMovie(activeHubState.spotlight as Movie)}
            >
              <Image
                source={{ uri: activeHubState.spotlight.backdrop_path || undefined }}
                style={styles.hubHeroBackdrop}
                contentFit="cover"
                transition={240}
                cachePolicy="memory-disk"
              />
              <LinearGradient colors={activeHub.palette} style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={['rgba(7,7,9,0.1)', 'rgba(7,7,9,0.65)', 'rgba(7,7,9,0.96)']}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.hubHeroContent}>
                <Text style={styles.hubHeroEyebrow} allowFontScaling={false}>{activeHub.label}</Text>
                <Text style={styles.hubHeroTitle} numberOfLines={2} allowFontScaling={false}>
                  {activeHubState.spotlight.title}
                </Text>
                <Text style={styles.hubHeroMeta} allowFontScaling={false}>{spotlightMeta}</Text>
                <Text style={styles.hubHeroOverview} numberOfLines={2} allowFontScaling={false}>
                  {activeHub.ambiance}
                </Text>

                <View style={styles.hubHeroActionRow}>
                  <View style={styles.hubHeroActionPill}>
                    <Ionicons name="layers-outline" size={13} color={Colors.text.secondary} />
                    <Text style={styles.hubHeroActionText} allowFontScaling={false}>
                      {activeHub.collections.length} collections
                    </Text>
                  </View>
                  <View style={styles.hubHeroActionPill}>
                    <Ionicons name="compass-outline" size={13} color={Colors.text.secondary} />
                    <Text style={styles.hubHeroActionText} allowFontScaling={false}>Discovery mode</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ) : null}

          <View style={styles.collectionsWrap}>
            {activeHubState?.collections.map(collection => (
              <View key={`${activeHub.id}-${collection.id}`} style={styles.collectionBlock}>
                <SectionHeader title={collection.title} subtitle={collection.subtitle} />

                {collection.loading ? (
                  <CollectionRailSkeleton />
                ) : (
                  <FlatList
                    data={collection.movies}
                    horizontal
                    keyExtractor={item => `${activeHub.id}-${collection.id}-${item.id}`}
                    renderItem={({ item }) => <LandscapeMovieCard movie={item} onPress={openMovie} />}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.collectionRail}
                    initialNumToRender={4}
                    maxToRenderPerBatch={5}
                    windowSize={4}
                    removeClippedSubviews
                    ListEmptyComponent={(
                      <View style={styles.emptyCollection}>
                        <Text style={styles.emptyCollectionText} allowFontScaling={false}>
                          Fresh results for this collection are warming up. Pull to refresh.
                        </Text>
                      </View>
                    )}
                  />
                )}
              </View>
            ))}

            {(bootLoading || activeHubState?.loading) ? (
              <View style={styles.bootLoaderRow}>
                <ActivityIndicator size="small" color={Colors.accent.crimson} />
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <QuickProfileMenu
        visible={profileMenuVisible}
        onClose={() => setProfileMenuVisible(false)}
        topOffset={insets.top + 56}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.void,
  },
  topHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(7,7,9,0.22)',
  },
  topHeaderSolid: {
    backgroundColor: '#070709',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  topLabel: {
    color: Colors.text.tertiary,
    fontSize: 10,
    fontFamily: Typography.fontMedium,
    letterSpacing: 1.15,
    textTransform: 'uppercase',
  },
  topTitle: {
    marginTop: 3,
    color: Colors.text.primary,
    fontSize: 24,
    letterSpacing: -0.3,
    fontFamily: Typography.fontDisplay,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(7,7,9,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.6)',
    backgroundColor: 'rgba(230,57,70,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAvatarText: {
    color: Colors.accent.crimson,
    fontSize: 13,
    fontFamily: Typography.fontDisplay,
  },
  scrollContent: {
    paddingBottom: 118,
  },
  body: {
    paddingHorizontal: 0,
    gap: 18,
  },
  introCard: {
    marginHorizontal: 20,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    gap: 7,
  },
  introEyebrow: {
    color: Colors.text.tertiary,
    fontSize: 10,
    fontFamily: Typography.fontMedium,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  introTitle: {
    color: Colors.text.primary,
    fontSize: 19,
    lineHeight: 25,
    fontFamily: Typography.fontDisplay,
    letterSpacing: -0.3,
  },
  introBody: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Typography.fontPrimary,
  },
  hubSelectorHeader: {
    paddingHorizontal: 20,
    gap: 2,
  },
  hubSelectorTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontFamily: Typography.fontSemiBold,
  },
  hubSelectorSubtitle: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontFamily: Typography.fontPrimary,
  },
  hubCardRow: {
    paddingHorizontal: 20,
    gap: 12,
  },
  hubCard: {
    width: HUB_CARD_WIDTH,
    minHeight: 118,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    padding: 14,
    justifyContent: 'space-between',
  },
  hubCardSelected: {
    borderColor: 'rgba(230,57,70,0.68)',
    transform: [{ scale: 1.02 }],
  },
  hubCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,7,9,0.12)',
  },
  hubCardLabel: {
    color: Colors.text.primary,
    fontSize: 10,
    letterSpacing: 1.25,
    textTransform: 'uppercase',
    fontFamily: Typography.fontSemiBold,
  },
  hubCardTagline: {
    color: '#D8DAEA',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Typography.fontPrimary,
  },
  hubSelectedPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.62)',
    backgroundColor: 'rgba(230,57,70,0.18)',
  },
  hubSelectedText: {
    color: Colors.text.primary,
    fontSize: 10,
    fontFamily: Typography.fontMedium,
  },
  hubHeroSkeleton: {
    marginHorizontal: 20,
    height: HUB_HERO_HEIGHT,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: Colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubHero: {
    marginHorizontal: 20,
    height: HUB_HERO_HEIGHT,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  hubHeroBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  hubHeroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  hubHeroEyebrow: {
    color: '#DDE4FC',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: Typography.fontSemiBold,
  },
  hubHeroTitle: {
    color: Colors.text.primary,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.5,
    fontFamily: Typography.fontDisplay,
  },
  hubHeroMeta: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontFamily: Typography.fontMedium,
  },
  hubHeroOverview: {
    color: '#D1D3E3',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Typography.fontPrimary,
  },
  hubHeroActionRow: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hubHeroActionPill: {
    minHeight: 30,
    borderRadius: Radius.full,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(7,7,9,0.42)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hubHeroActionText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontFamily: Typography.fontMedium,
  },
  collectionsWrap: {
    marginTop: 2,
    gap: 20,
  },
  collectionBlock: {
    gap: 10,
  },
  collectionHeader: {
    paddingHorizontal: 20,
    gap: 2,
  },
  collectionTitle: {
    color: Colors.text.primary,
    fontSize: 20,
    letterSpacing: -0.2,
    fontFamily: Typography.fontDisplay,
  },
  collectionSubtitle: {
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Typography.fontPrimary,
  },
  collectionRail: {
    paddingHorizontal: 20,
    gap: 10,
  },
  landscapeCard: {
    width: LANDSCAPE_CARD_WIDTH,
    height: LANDSCAPE_CARD_HEIGHT,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    backgroundColor: Colors.bg.surface,
    marginRight: 4,
  },
  landscapeImage: {
    width: LANDSCAPE_CARD_WIDTH,
    height: LANDSCAPE_CARD_HEIGHT,
    backgroundColor: Colors.bg.surface,
  },
  landscapeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
  },
  landscapeMeta: {
    position: 'absolute',
    left: 9,
    right: 9,
    bottom: 8,
  },
  landscapeTitle: {
    color: Colors.text.primary,
    fontSize: 12,
    fontFamily: Typography.fontSemiBold,
  },
  landscapeSub: {
    marginTop: 2,
    color: Colors.text.secondary,
    fontSize: 9.5,
    fontFamily: Typography.fontPrimary,
  },
  landscapeRatingPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(240,180,41,0.35)',
    backgroundColor: 'rgba(7,7,9,0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  landscapeRatingText: {
    color: Colors.accent.gold,
    fontSize: 9.5,
    fontFamily: Typography.fontSemiBold,
  },
  collectionSkeletonWrap: {
    paddingHorizontal: 20,
    gap: 10,
  },
  collectionSkeletonTitle: {
    width: 176,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  collectionSkeletonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  collectionSkeletonCard: {
    width: LANDSCAPE_CARD_WIDTH,
    height: LANDSCAPE_CARD_HEIGHT,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  emptyCollection: {
    width: SCREEN_WIDTH - 40,
    minHeight: 108,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyCollectionText: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: Typography.fontPrimary,
  },
  bootLoaderRow: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ExploreScreen;
