import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import type { Movie } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useWatchlistStore } from '../../store/watchlistStore';
import { useBackendStatusStore } from '../../store/backendStatusStore';
import { apiClient } from '../../services/api/apiClient';
import { chatService } from '../../services/api/chatService';
import { mapTmdbToMovie, numberToImdbId, tmdbApi } from '../../services/tmdbApi';
import { QuickProfileMenu } from '../../components/ui/QuickProfileMenu';
import { useLanguageStore } from '../../store/languageStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.max(420, Math.floor(SCREEN_HEIGHT * 0.58));
const RAIL_CARD_WIDTH = 132;
const RAIL_CARD_HEIGHT = 198;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CONTINUE_WATCHING_KEY = '@cineai_continue_history_v1';

interface RawMoviePayload {
  imdbID?: string;
  Title?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  genre_ids?: number[];
  original_language?: string;
  [key: string]: unknown;
}

interface TrailerInfo {
  key: string;
  type: 'Trailer' | 'Teaser' | 'Clip';
}

interface ContinueWatchingEntry {
  movie: Movie;
  progress: number;
  lastViewedAt: string;
}

interface MoodDefinition {
  id: string;
  label: string;
  subtitle: string;
  discoverParams: {
    with_genres: string;
    sort_by?: string;
    with_original_language?: string;
  };
}

interface PremiumRailDefinition {
  id: string;
  title: string;
  subtitle: string;
  mode: 'trending' | 'search' | 'discover';
  searchQuery?: string;
  discoverParams?: {
    with_genres?: string;
    sort_by?: string;
    with_original_language?: string;
    primary_release_year?: number;
    vote_average_gte?: number;
    vote_count_gte?: number;
  };
}

interface PremiumRailState extends PremiumRailDefinition {
  movies: Movie[];
  loading: boolean;
}

interface HomeCachePayload {
  timestamp: number;
  heroMovies: Movie[];
  aiRecommendations: Movie[];
  moodRailById: Record<string, Movie[]>;
  premiumRails: Array<{ id: string; movies: Movie[] }>;
}

interface RailCacheEntry {
  expiresAt: number;
  movies: Movie[];
}

interface TrailerCacheEntry {
  expiresAt: number;
  trailer: TrailerInfo | null;
}

const HOME_CACHE: { payload: HomeCachePayload | null } = { payload: null };
const RAIL_CACHE = new Map<string, RailCacheEntry>();
const TRAILER_CACHE = new Map<number, TrailerCacheEntry>();

const MOOD_RAILS: MoodDefinition[] = [
  {
    id: 'dark-tense',
    label: 'Dark & Tense',
    subtitle: 'Atmospheric crime, suspense, and dread',
    discoverParams: { with_genres: '53,80,27', sort_by: 'vote_average.desc' },
  },
  {
    id: 'feel-good',
    label: 'Feel Good',
    subtitle: 'Uplifting, warm, and comfort-driven stories',
    discoverParams: { with_genres: '35,10749,10751', sort_by: 'popularity.desc' },
  },
  {
    id: 'mind-bending',
    label: 'Mind-Bending',
    subtitle: 'Twists, paradoxes, and cerebral sci-fi',
    discoverParams: { with_genres: '878,9648,53', sort_by: 'vote_average.desc' },
  },
  {
    id: 'epic-grand',
    label: 'Epic & Grand',
    subtitle: 'Scale, spectacle, and mythic journeys',
    discoverParams: { with_genres: '12,14,28', sort_by: 'popularity.desc' },
  },
  {
    id: 'emotional-drama',
    label: 'Emotional Drama',
    subtitle: 'Character-first stories with emotional weight',
    discoverParams: { with_genres: '18,10749', sort_by: 'vote_average.desc' },
  },
  {
    id: 'late-night-thrillers',
    label: 'Late Night Thrillers',
    subtitle: 'Fast-paced tension for after-hours viewing',
    discoverParams: { with_genres: '53,9648', sort_by: 'popularity.desc' },
  },
];

const PREMIUM_RAIL_DEFS: PremiumRailDefinition[] = [
  {
    id: 'trending-worldwide',
    title: 'Trending Worldwide',
    subtitle: 'The most discussed films right now',
    mode: 'trending',
  },
  {
    id: 'trending-india',
    title: 'Trending in India',
    subtitle: 'Regional momentum and crowd favorites',
    mode: 'discover',
    discoverParams: {
      with_original_language: 'hi|te|ta|ml|kn',
      sort_by: 'popularity.desc',
      vote_average_gte: 5.4,
      vote_count_gte: 30,
    },
  },
  {
    id: 'hollywood-scifi',
    title: 'Hollywood Sci-Fi',
    subtitle: 'Large-scale futures and speculative worlds',
    mode: 'discover',
    discoverParams: { with_genres: '878,12', with_original_language: 'en', sort_by: 'popularity.desc' },
  },
  {
    id: 'award-winners',
    title: 'Award Winners',
    subtitle: 'Celebrated films from global awards circuits',
    mode: 'discover',
    discoverParams: {
      sort_by: 'vote_average.desc',
      vote_average_gte: 7.1,
      vote_count_gte: 180,
    },
  },
  {
    id: 'hidden-gems',
    title: 'Hidden Gems',
    subtitle: 'Highly rated films outside mainstream cycles',
    mode: 'discover',
    discoverParams: { sort_by: 'vote_average.desc' },
  },
  {
    id: 'korean-cinema',
    title: 'Korean Cinema',
    subtitle: 'Sharp storytelling and genre precision',
    mode: 'discover',
    discoverParams: { with_original_language: 'ko', sort_by: 'popularity.desc' },
  },
  {
    id: 'anime-essentials',
    title: 'Anime Essentials',
    subtitle: 'Foundational titles and modern standouts',
    mode: 'discover',
    discoverParams: { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc' },
  },
  {
    id: 'bollywood-crime',
    title: 'Bollywood Crime',
    subtitle: 'High-stakes Hindi crime dramas and thrillers',
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
    id: 'south-indian-blockbusters',
    title: 'South Indian Blockbusters',
    subtitle: 'Event-level action and mass storytelling',
    mode: 'discover',
    discoverParams: {
      with_original_language: 'te|ta|ml|kn',
      with_genres: '28|12',
      sort_by: 'popularity.desc',
      vote_average_gte: 5.6,
      vote_count_gte: 40,
    },
  },
  {
    id: 'psychological-thrillers',
    title: 'Psychological Thrillers',
    subtitle: 'Obsessive tension and psychological unease',
    mode: 'discover',
    discoverParams: { with_genres: '53,9648', sort_by: 'vote_average.desc' },
  },
];

const genreLabelMap: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  18: 'Drama',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  27: 'Horror',
  14: 'Fantasy',
  53: 'Thriller',
};

const imageIsFromTmdb = (url: string | null | undefined): boolean => {
  return typeof url === 'string' && url.includes('image.tmdb.org/t/p/');
};

const isQualityMovie = (movie: Movie): boolean => {
  const hasPoster = typeof movie.poster_path === 'string' && movie.poster_path.length > 0;
  const hasBackdrop = typeof movie.backdrop_path === 'string' && movie.backdrop_path.length > 0;
  return (
    hasPoster &&
    hasBackdrop &&
    movie.vote_count >= 5 &&
    movie.vote_average >= 4.0
  );
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
  const voteSignal = Math.log10(Math.max(1, movie.vote_count));
  return movie.vote_average * 18 + voteSignal * 8 + Math.min(movie.popularity, 1000) * 0.015;
};

const rankMovies = (movies: Movie[]): Movie[] => {
  return [...movies].sort((a, b) => rankMovie(b) - rankMovie(a));
};

const genreLine = (ids: number[] | undefined): string => {
  if (!ids?.length) return 'Cinema';
  return ids.map(id => genreLabelMap[id]).filter(Boolean).slice(0, 2).join(' • ') || 'Cinema';
};

const releaseYear = (date: string | undefined): string => {
  if (!date || date.length < 4) return 'N/A';
  return date.slice(0, 4);
};

const toMovies = (payload: RawMoviePayload[]): Movie[] => {
  return payload
    .map(item => {
      try {
        return mapTmdbToMovie(item);
      } catch {
        return null;
      }
    })
    .filter((movie): movie is Movie => Boolean(movie));
};

const isYoutubeKey = (key: string): boolean => /^[a-zA-Z0-9_-]{10,15}$/.test(key);

const selectTrailerFromVideos = (videos: any[]): TrailerInfo | null => {
  if (!Array.isArray(videos) || videos.length === 0) return null;

  const allowed = videos.filter(video => {
    if (!video) return false;
    if (video.official !== true) return false;
    if (video.site !== 'YouTube') return false;
    if (!['Trailer', 'Teaser', 'Clip'].includes(video.type)) return false;
    if (!isYoutubeKey(String(video.key || ''))) return false;
    return true;
  });

  const score = (type: string): number => {
    if (type === 'Trailer') return 3;
    if (type === 'Teaser') return 2;
    if (type === 'Clip') return 1;
    return 0;
  };

  const best = allowed.sort((a, b) => score(b.type) - score(a.type))[0];
  if (!best) return null;

  return {
    key: String(best.key),
    type: best.type,
  };
};

const mergeByDiversity = (
  raw: Movie[],
  globalUsed: Set<number>,
  nearbyBlocked: Set<number>,
  desiredCount: number,
): Movie[] => {
  const ranked = rankMovies(sanitizeMovieList(raw));

  const strict = ranked.filter(movie => !globalUsed.has(movie.id) && !nearbyBlocked.has(movie.id));
  const strictSlice = strict.slice(0, desiredCount);
  if (strictSlice.length >= desiredCount) {
    strictSlice.forEach(movie => globalUsed.add(movie.id));
    return strictSlice;
  }

  const relaxed = ranked.filter(movie => !nearbyBlocked.has(movie.id));
  const merged: Movie[] = [...strictSlice];
  const present = new Set(merged.map(movie => movie.id));

  for (const movie of relaxed) {
    if (merged.length >= desiredCount) break;
    if (present.has(movie.id)) continue;
    merged.push(movie);
    present.add(movie.id);
  }

  // Safety net: if strict anti-duplicate filters starve a rail, allow top-ranked spillover.
  if (merged.length < Math.min(desiredCount, 8)) {
    for (const movie of ranked) {
      if (merged.length >= desiredCount) break;
      if (present.has(movie.id)) continue;
      merged.push(movie);
      present.add(movie.id);
    }
  }

  merged.forEach(movie => globalUsed.add(movie.id));
  return merged;
};

const setCacheRail = (key: string, movies: Movie[]): void => {
  RAIL_CACHE.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    movies,
  });
};

const getCacheRail = (key: string): Movie[] | null => {
  const entry = RAIL_CACHE.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    RAIL_CACHE.delete(key);
    return null;
  }
  return entry.movies;
};

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} allowFontScaling={false}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle} allowFontScaling={false}>{subtitle}</Text> : null}
    </View>
  );
};

const RailSkeleton: React.FC = () => {
  return (
    <View style={styles.railSkeletonWrap}>
      <View style={styles.railSkeletonHeader} />
      <View style={styles.railSkeletonRow}>
        {[0, 1, 2, 3].map(index => (
          <View key={`skeleton-${index}`} style={styles.railSkeletonCard} />
        ))}
      </View>
    </View>
  );
};

const PosterRailCard: React.FC<{
  movie: Movie;
  onPress: (movie: Movie) => void;
}> = React.memo(({ movie, onPress }) => {
  return (
    <Pressable style={styles.posterCard} onPress={() => onPress(movie)}>
      <Image
        source={{ uri: movie.poster_path || undefined }}
        style={styles.posterImage}
        contentFit="cover"
        transition={220}
        cachePolicy="memory-disk"
      />
      <LinearGradient colors={['transparent', 'rgba(7,7,9,0.9)']} style={styles.posterGradient} />
      <View style={styles.posterMeta}>
        <Text style={styles.posterTitle} numberOfLines={1} allowFontScaling={false}>{movie.title}</Text>
        <Text style={styles.posterSub} numberOfLines={1} allowFontScaling={false}>
          {releaseYear(movie.release_date)} • {genreLine(movie.genre_ids)}
        </Text>
      </View>
      <View style={styles.posterRatingPill}>
        <Ionicons name="star" size={10} color={Colors.accent.gold} />
        <Text style={styles.posterRatingText} allowFontScaling={false}>{movie.vote_average.toFixed(1)}</Text>
      </View>
    </Pressable>
  );
});

const ContinueWatchingCard: React.FC<{
  entry: ContinueWatchingEntry;
  onPress: (movie: Movie) => void;
}> = ({ entry, onPress }) => {
  const progressPercent = Math.max(5, Math.min(95, Math.round(entry.progress * 100)));

  return (
    <Pressable style={styles.continueCard} onPress={() => onPress(entry.movie)}>
      <Image
        source={{ uri: entry.movie.backdrop_path || undefined }}
        style={styles.continueBackdrop}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
      <LinearGradient colors={['transparent', 'rgba(7,7,9,0.92)']} style={styles.continueGradient} />
      <View style={styles.continueMeta}>
        <Text style={styles.continueTitle} numberOfLines={1} allowFontScaling={false}>{entry.movie.title}</Text>
        <Text style={styles.continueSub} allowFontScaling={false}>{progressPercent}% watched</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>
    </Pressable>
  );
};

const HeroBanner: React.FC<{
  movie: Movie | null;
  trailer: TrailerInfo | null | undefined;
  trailerLoading: boolean;
  onOpenTrailer: () => void;
  onOpenMovie: () => void;
  inWatchlist: boolean;
  onToggleWatchlist: () => void;
}> = ({
  movie,
  trailer,
  trailerLoading,
  onOpenTrailer,
  onOpenMovie,
  inWatchlist,
  onToggleWatchlist,
}) => {
  if (!movie) {
    return (
      <View style={styles.heroSkeleton}>
        <ActivityIndicator size="small" color={Colors.accent.crimson} />
      </View>
    );
  }

  const trailerText = trailerLoading
    ? 'Checking Trailer'
    : trailer
      ? trailer.type === 'Trailer'
        ? 'Watch Trailer'
        : trailer.type === 'Teaser'
          ? 'Watch Teaser'
          : 'Watch Clip'
      : 'Trailer Unavailable';

  return (
    <View style={styles.heroWrap}>
      <Image
        source={{ uri: movie.backdrop_path || undefined }}
        style={styles.heroBackdrop}
        contentFit="cover"
        transition={180}
        cachePolicy="memory-disk"
      />

      <LinearGradient
        colors={['rgba(7,7,9,0.15)', 'rgba(7,7,9,0.55)', 'rgba(7,7,9,0.98)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.heroContent}>
        <View>
          <Text style={styles.heroLabel} allowFontScaling={false}>Featured Tonight</Text>
          <Text style={styles.heroTitle} numberOfLines={2} allowFontScaling={false}>{movie.title}</Text>
          <Text style={styles.heroMeta} allowFontScaling={false}>
            {releaseYear(movie.release_date)} • {movie.vote_average.toFixed(1)} ★ • {genreLine(movie.genre_ids)}
          </Text>
          <Text style={styles.heroOverview} numberOfLines={3} allowFontScaling={false}>{movie.overview}</Text>
        </View>

        <View style={styles.heroActions}>
          <Pressable
            style={[styles.heroPrimaryBtn, !trailer && styles.heroDisabledBtn]}
            disabled={!trailer || trailerLoading}
            onPress={onOpenTrailer}
          >
            <Ionicons name={trailer ? 'play' : 'alert-circle-outline'} size={14} color={trailer ? '#071018' : Colors.text.secondary} />
            <Text
              style={[styles.heroPrimaryBtnText, !trailer && styles.heroDisabledBtnText]}
              allowFontScaling={false}
            >
              {trailerText}
            </Text>
          </Pressable>

          <Pressable style={styles.heroSecondaryBtn} onPress={onOpenMovie}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.text.primary} />
            <Text style={styles.heroSecondaryBtnText} allowFontScaling={false}>Details</Text>
          </Pressable>

          <Pressable style={styles.heroSecondaryBtn} onPress={onToggleWatchlist}>
            <Ionicons name={inWatchlist ? 'bookmark' : 'bookmark-outline'} size={14} color={Colors.text.primary} />
            <Text style={styles.heroSecondaryBtnText} allowFontScaling={false}>{inWatchlist ? 'Saved' : 'Watchlist'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const t = useLanguageStore(state => state.t);
  const language = useLanguageStore(state => state.language);
  const { profile } = useAuthStore();
  const {
    items: watchlistItems,
    loadWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  } = useWatchlistStore();
  const backendStatus = useBackendStatusStore(state => state.status);

  const isMountedRef = useRef(true);

  const [refreshing, setRefreshing] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroTrailerMap, setHeroTrailerMap] = useState<Record<number, TrailerInfo | null>>({});
  const [heroTrailerLoadingMap, setHeroTrailerLoadingMap] = useState<Record<number, boolean>>({});

  const [continueWatching, setContinueWatching] = useState<ContinueWatchingEntry[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<Movie[]>([]);

  const [selectedMoodId, setSelectedMoodId] = useState<string>(MOOD_RAILS[0].id);
  const [moodRailById, setMoodRailById] = useState<Record<string, Movie[]>>({});
  const [moodLoading, setMoodLoading] = useState(false);

  const [premiumRails, setPremiumRails] = useState<PremiumRailState[]>(
    PREMIUM_RAIL_DEFS.map(def => ({ ...def, movies: [], loading: true })),
  );
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const heroAdvanceLockRef = useRef(false);

  const headerGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  }, [language]);

  const localizedMood = useCallback((id: string, defaultLabel: string) => {
    const moodTranslations: Record<string, Record<string, string>> = {
      en: {
        'dark-tense': 'Dark & Tense',
        'feel-good': 'Feel Good',
        'mind-bending': 'Mind-Bending',
        'epic-grand': 'Epic & Grand',
        'emotional-drama': 'Emotional Drama',
        'late-night-thrillers': 'Late Night Thrillers',
      },
      es: {
        'dark-tense': 'Oscuro y Tenso',
        'feel-good': 'Buen Rollo',
        'mind-bending': 'Mente Compleja',
        'epic-grand': 'Épico y Grandioso',
        'emotional-drama': 'Drama Emocional',
        'late-night-thrillers': 'Thrillers Nocturnos',
      },
      fr: {
        'dark-tense': 'Sombre et Tendu',
        'feel-good': 'Sensationnel',
        'mind-bending': 'Esprit tordu',
        'epic-grand': 'Épique et grandiose',
        'emotional-drama': 'Drame émotionnel',
        'late-night-thrillers': 'Thrillers tardifs',
      },
      de: {
        'dark-tense': 'Düster & Packend',
        'feel-good': 'Gute Laune',
        'mind-bending': 'Mind-Bending',
        'epic-grand': 'Epos & Pracht',
        'emotional-drama': 'Gefühlvolles Drama',
        'late-night-thrillers': 'Späte Thriller',
      },
      hi: {
        'dark-tense': 'डार्क और सस्पेंस',
        'feel-good': 'अच्छा मूड',
        'mind-bending': 'दिमाग हिलाने वाली',
        'epic-grand': 'महाकाव्य और भव्य',
        'emotional-drama': 'भावनात्मक ड्रामा',
        'late-night-thrillers': 'देर रात के थ्रिलर',
      },
      ja: {
        'dark-tense': 'ダーク＆サスペンス',
        'feel-good': 'ほっこり・コメディ',
        'mind-bending': 'マインドベンディング',
        'epic-grand': 'スペクタクル・超大作',
        'emotional-drama': '感動の人間ドラマ',
        'late-night-thrillers': '真夜中のスリラー',
      },
      ko: {
        'dark-tense': '어둡고 팽팽한',
        'feel-good': '기분 좋은',
        'mind-bending': '마인드벤딩',
        'epic-grand': '웅장한 대서사시',
        'emotional-drama': '감성 드라마',
        'late-night-thrillers': '심야 스릴러',
      },
    };
    return moodTranslations[language]?.[id] || defaultLabel;
  }, [language]);

  const localizedEmptyMood = useMemo(() => {
    const emptyMessages: Record<string, string> = {
      en: 'No titles available for this mood right now.',
      es: 'No hay títulos disponibles para este estado de ánimo en este momento.',
      fr: 'Aucun titre disponible pour cette ambiance pour le moment.',
      de: 'Aktuell keine Filme für diese Stimmung verfügbar.',
      hi: 'इस मूड के लिए अभी कोई फ़िल्म उपलब्ध नहीं है।',
      ja: 'この気分の映画は現在ご利用いただけません।',
      ko: '현재 이 감정 카테고리에 제공되는 영화가 없습니다.',
    };
    return emptyMessages[language] || emptyMessages.en;
  }, [language]);

  const activeHeroMovie = heroMovies[heroIndex] || null;

  const activeHeroTrailer = activeHeroMovie ? heroTrailerMap[activeHeroMovie.id] : null;
  const activeHeroTrailerLoading = activeHeroMovie ? Boolean(heroTrailerLoadingMap[activeHeroMovie.id]) : false;

  const readContinueWatching = useCallback(async (): Promise<ContinueWatchingEntry[]> => {
    try {
      const raw = await AsyncStorage.getItem(CONTINUE_WATCHING_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ContinueWatchingEntry[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(entry => entry?.movie?.id && isQualityMovie(entry.movie))
        .sort((a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime())
        .slice(0, 12);
    } catch {
      return [];
    }
  }, []);

  const writeContinueWatching = useCallback(async (entries: ContinueWatchingEntry[]) => {
    try {
      await AsyncStorage.setItem(CONTINUE_WATCHING_KEY, JSON.stringify(entries));
    } catch {
      // no-op
    }
  }, []);

  const updateContinueWatching = useCallback(async (movie: Movie) => {
    const current = await readContinueWatching();
    const existing = current.find(entry => entry.movie.id === movie.id);
    const nextProgress = existing ? Math.min(0.95, existing.progress + 0.12) : 0.18;

    const updated: ContinueWatchingEntry[] = [
      {
        movie,
        progress: nextProgress,
        lastViewedAt: new Date().toISOString(),
      },
      ...current.filter(entry => entry.movie.id !== movie.id),
    ].slice(0, 20);

    if (!isMountedRef.current) return;
    setContinueWatching(updated.slice(0, 10));
    await writeContinueWatching(updated);
  }, [readContinueWatching, writeContinueWatching]);

  const fetchRawMovies = useCallback(async (
    mode: 'trending' | 'search' | 'discover',
    args: {
      query?: string;
      discoverParams?: Record<string, string | number | undefined>;
      limit?: number;
    } = {},
  ): Promise<Movie[]> => {
    const limit = args.limit ?? 35;

    // Load active content region dynamically
    const region = await AsyncStorage.getItem('contentRegion') || 'global';
    const regionParams: Record<string, any> = {};
    if (region !== 'global') {
      const REGION_COUNTRY_CODES: Record<string, string> = {
        in: 'IN',
        us: 'US',
        jp: 'JP',
        kr: 'KR',
      };
      const REGION_LANGUAGES: Record<string, string> = {
        in: 'hi|te|ta|ml|kn|en',
        jp: 'ja',
        kr: 'ko',
      };
      if (REGION_COUNTRY_CODES[region]) {
        regionParams.region = REGION_COUNTRY_CODES[region];
      }
      if (REGION_LANGUAGES[region]) {
        regionParams.with_original_language = REGION_LANGUAGES[region];
      }
    }

    try {
      if (mode === 'trending') {
        const { data } = await apiClient.get<RawMoviePayload[]>('/movies/trending', { params: { limit } });
        return toMovies(data || []);
      }

      if (mode === 'search') {
        const { data } = await apiClient.get<RawMoviePayload[]>('/movies/search', {
          params: {
            query: args.query,
            limit,
          },
        });
        return toMovies(data || []);
      }

      const discoverParams = args.discoverParams || {};
      const discoverVoteAverageGte =
        discoverParams.vote_average_gte !== undefined ? Number(discoverParams.vote_average_gte) : 6.2;
      const discoverVoteCountGte =
        discoverParams.vote_count_gte !== undefined ? Number(discoverParams.vote_count_gte) : 120;
      const { data } = await apiClient.get<RawMoviePayload[]>('/movies/discover', {
        params: {
          ...discoverParams,
          ...regionParams,
          vote_average_gte: discoverVoteAverageGte,
          vote_count_gte: discoverVoteCountGte,
          limit,
        },
      });
      return toMovies(data || []);
    } catch (error) {
      console.log(`[DEBUG] fetchRawMovies failed for mode ${mode}, using tmdbApi offline fallback:`, error);
      
      try {
        if (mode === 'trending') {
          const res = await tmdbApi.getTrending('week', limit);
          return res.results;
        }
        if (mode === 'search') {
          const res = await tmdbApi.searchMovies(args.query || '', 1, limit);
          return res.results;
        }
        
        // discover mode
        const discoverParams = args.discoverParams || {};
        const discoverVoteAverageGte =
          discoverParams.vote_average_gte !== undefined ? Number(discoverParams.vote_average_gte) : 6.2;
        const discoverVoteCountGte =
          discoverParams.vote_count_gte !== undefined ? Number(discoverParams.vote_count_gte) : 120;
        const res = await tmdbApi.discover({
          with_genres: discoverParams.with_genres ? String(discoverParams.with_genres) : undefined,
          sort_by: discoverParams.sort_by ? String(discoverParams.sort_by) : undefined,
          'vote_average.gte': discoverVoteAverageGte,
          'vote_count.gte': discoverVoteCountGte,
          with_original_language: regionParams.with_original_language || (discoverParams.with_original_language ? String(discoverParams.with_original_language) : undefined),
          region: regionParams.region,
          primary_release_year: discoverParams.primary_release_year ? Number(discoverParams.primary_release_year) : undefined,
          limit,
        } as any);
        return res.results;
      } catch (fallbackError) {
        console.log('[DEBUG] tmdbApi fallback failed:', fallbackError);
        return [];
      }
    }
  }, []);

  const getOrFetchRail = useCallback(async (
    cacheKey: string,
    loader: () => Promise<Movie[]>,
  ): Promise<Movie[]> => {
    const fromCache = getCacheRail(cacheKey);
    if (fromCache && fromCache.length > 0) return fromCache;
    const movies = await loader();
    const cleaned = sanitizeMovieList(movies);
    setCacheRail(cacheKey, cleaned);
    return cleaned;
  }, []);

  const fetchHeroMovies = useCallback(async (): Promise<Movie[]> => {
    const movies = await getOrFetchRail('hero-trending', () => fetchRawMovies('trending', { limit: 45 }));
    return rankMovies(movies).slice(0, 7);
  }, [fetchRawMovies, getOrFetchRail]);

  const fetchAiRecommendations = useCallback(async (excludeIds: Set<number>): Promise<Movie[]> => {
    const favoriteGenres = profile?.favorite_genres?.length
      ? profile.favorite_genres.map(id => genreLabelMap[id]).filter(Boolean).join(', ')
      : 'Drama, Thriller, Sci-Fi, Crime';

    const prompt = [
      'Curate exactly 20 high-confidence movie recommendations.',
      'Keep selections diverse across languages, decades, and styles.',
      'Avoid repeated Christopher Nolan and Marvel dominance.',
      `Anchor partially around these genres: ${favoriteGenres}.`,
      'Return only real movie titles.',
    ].join(' ');

    try {
      const aiTitles = await chatService.getRecommendations(prompt);
      const titleList = aiTitles
        .map((item: any) => String(item?.Title || '').trim())
        .filter(Boolean)
        .slice(0, 24);

      const mappedBatches = await Promise.all(
        titleList.map(async title => {
          try {
            const list = await fetchRawMovies('search', { query: title, limit: 10 });
            return list;
          } catch {
            return [];
          }
        }),
      );

      const combined = mappedBatches.flat();
      const uniqueRanked = rankMovies(sanitizeMovieList(combined));
      const filtered = uniqueRanked.filter(movie => !excludeIds.has(movie.id));

      if (filtered.length >= 15) {
        filtered.slice(0, 18).forEach(movie => excludeIds.add(movie.id));
        return filtered.slice(0, 18);
      }
    } catch {
      // fall through to deterministic discover fallback
    }

    const fallbackDiscover = await Promise.all([
      fetchRawMovies('discover', { discoverParams: { with_genres: '18,53', sort_by: 'vote_average.desc' }, limit: 30 }),
      fetchRawMovies('discover', { discoverParams: { with_genres: '878,9648', sort_by: 'popularity.desc' }, limit: 30 }),
      fetchRawMovies('search', { query: 'international acclaimed cinema', limit: 30 }),
    ]);

    const fallback = rankMovies(sanitizeMovieList(fallbackDiscover.flat())).filter(movie => !excludeIds.has(movie.id)).slice(0, 18);
    fallback.forEach(movie => excludeIds.add(movie.id));
    return fallback;
  }, [fetchRawMovies, profile?.favorite_genres]);

  const fetchMoodRail = useCallback(async (mood: MoodDefinition): Promise<Movie[]> => {
    const cacheKey = `mood-${mood.id}`;
    return getOrFetchRail(cacheKey, () => fetchRawMovies('discover', {
      discoverParams: {
        with_genres: mood.discoverParams.with_genres,
        sort_by: mood.discoverParams.sort_by || 'popularity.desc',
        with_original_language: mood.discoverParams.with_original_language,
      },
      limit: 36,
    }));
  }, [fetchRawMovies, getOrFetchRail]);

  const fetchPremiumRailRaw = useCallback(async (def: PremiumRailDefinition): Promise<Movie[]> => {
    if (def.mode === 'trending') {
      return getOrFetchRail(`rail-${def.id}`, () => fetchRawMovies('trending', { limit: 40 }));
    }

    if (def.mode === 'search') {
      return getOrFetchRail(`rail-${def.id}`, () => fetchRawMovies('search', { query: def.searchQuery, limit: 40 }));
    }

    return getOrFetchRail(`rail-${def.id}`, async () => {
      const discoverParams = {
        with_genres: def.discoverParams?.with_genres,
        with_original_language: def.discoverParams?.with_original_language,
        sort_by: def.discoverParams?.sort_by || 'popularity.desc',
        primary_release_year: def.discoverParams?.primary_release_year,
        vote_average_gte: def.discoverParams?.vote_average_gte,
        vote_count_gte: def.discoverParams?.vote_count_gte,
      };

      const langFilter = String(discoverParams.with_original_language || '');
      const hasLangUnion = langFilter.includes('|');

      if (hasLangUnion) {
        const languages = langFilter.split('|').map(l => l.trim()).filter(Boolean);
        const perLanguageLimit = Math.max(14, Math.ceil(64 / Math.max(languages.length, 1)));
        const batches = await Promise.all(
          languages.map(with_original_language =>
            fetchRawMovies('discover', {
              discoverParams: { ...discoverParams, with_original_language },
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
        limit: 40,
      });
    });
  }, [fetchRawMovies, getOrFetchRail]);

  const prefetchHeroAssets = useCallback(async (movie: Movie | null | undefined) => {
    if (!movie) return;
    const queue: Promise<boolean>[] = [];
    const posterUrl = movie.poster_path;
    const backdropUrl = movie.backdrop_path;
    if (typeof posterUrl === 'string' && imageIsFromTmdb(posterUrl)) queue.push(Image.prefetch(posterUrl));
    if (typeof backdropUrl === 'string' && imageIsFromTmdb(backdropUrl)) queue.push(Image.prefetch(backdropUrl));
    if (queue.length === 0) return;
    await Promise.allSettled(queue);
  }, []);

  const resolveTrailer = useCallback(async (movie: Movie): Promise<TrailerInfo | null> => {
    const cached = TRAILER_CACHE.get(movie.id);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.trailer;
    }

    try {
      const imdbId = numberToImdbId(movie.id);
      if (!imdbId) {
        TRAILER_CACHE.set(movie.id, { trailer: null, expiresAt: Date.now() + CACHE_TTL_MS });
        return null;
      }

      const { data } = await apiClient.get<RawMoviePayload>('/movies/details/' + imdbId);
      const trailer = selectTrailerFromVideos((data as any)?.videos?.results || []);
      TRAILER_CACHE.set(movie.id, {
        trailer,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return trailer;
    } catch {
      TRAILER_CACHE.set(movie.id, {
        trailer: null,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return null;
    }
  }, []);

  const warmHeroTrailer = useCallback(async (movie: Movie | null | undefined) => {
    if (!movie || heroTrailerMap[movie.id] !== undefined || heroTrailerLoadingMap[movie.id]) return;

    setHeroTrailerLoadingMap(prev => ({ ...prev, [movie.id]: true }));
    const trailer = await resolveTrailer(movie);
    if (!isMountedRef.current) return;
    setHeroTrailerMap(prev => ({ ...prev, [movie.id]: trailer }));
    setHeroTrailerLoadingMap(prev => ({ ...prev, [movie.id]: false }));
  }, [heroTrailerLoadingMap, heroTrailerMap, resolveTrailer]);

  const openMovie = useCallback((movie: Movie) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    updateContinueWatching(movie).catch(() => {});
    navigation.navigate('MovieDetails', {
      movieId: movie.id,
      imdbId: movie.imdb_id || movie.imdbID,
      movieTitle: movie.title,
      releaseYear: releaseYear(movie.release_date),
      movie,
    });
  }, [navigation, updateContinueWatching]);

  const toggleHeroWatchlist = useCallback(() => {
    if (!activeHeroMovie) return;
    Haptics.selectionAsync().catch(() => {});
    if (isInWatchlist(activeHeroMovie.id)) {
      removeFromWatchlist(activeHeroMovie.id);
      return;
    }
    addToWatchlist(activeHeroMovie);
  }, [activeHeroMovie, addToWatchlist, isInWatchlist, removeFromWatchlist]);

  const loadHomepage = useCallback(async (force = false) => {
    const now = Date.now();

    if (!force && HOME_CACHE.payload && now - HOME_CACHE.payload.timestamp < CACHE_TTL_MS) {
      const cache = HOME_CACHE.payload;
      if (!isMountedRef.current) return;

      setHeroMovies(cache.heroMovies);
      setAiRecommendations(cache.aiRecommendations);
      setMoodRailById(cache.moodRailById);
      setPremiumRails(PREMIUM_RAIL_DEFS.map(def => {
        const hit = cache.premiumRails.find(rail => rail.id === def.id);
        return {
          ...def,
          movies: hit?.movies || [],
          loading: false,
        };
      }));
      setBootLoading(false);
      return;
    }

    setBootLoading(true);
    setPremiumRails(PREMIUM_RAIL_DEFS.map(def => ({ ...def, movies: [], loading: true })));

    const history = await readContinueWatching();
    if (isMountedRef.current) {
      setContinueWatching(history.slice(0, 10));
    }

    let hero: Movie[] = [];
    try {
      hero = await fetchHeroMovies();
      if (isMountedRef.current) {
        setHeroMovies(hero);
        setHeroIndex(0);
        hero.slice(0, 3).forEach(movie => {
          prefetchHeroAssets(movie).catch(() => {});
        });
      }
    } catch (e) {
      console.log('Error fetching hero movies in loadHomepage:', e);
    }

    const usedIds = new Set<number>([
      ...hero.map(movie => movie.id),
      ...history.map(entry => entry.movie.id),
    ]);

    let aiRail: Movie[] = [];
    try {
      aiRail = await fetchAiRecommendations(usedIds);
      if (isMountedRef.current) {
        setAiRecommendations(aiRail);
        aiRail.slice(0, 6).forEach(movie => {
          if (movie.poster_path) Image.prefetch(movie.poster_path);
        });
      }
    } catch (e) {
      console.log('Error fetching AI recommendations in loadHomepage:', e);
    }

    const initialMood = MOOD_RAILS.find(mood => mood.id === selectedMoodId) || MOOD_RAILS[0];
    let moodRaw: Movie[] = [];
    try {
      moodRaw = await fetchMoodRail(initialMood);
    } catch (e) {
      console.log('Error fetching mood rail in loadHomepage:', e);
    }
    const moodChosen = mergeByDiversity(moodRaw, usedIds, new Set(), 16);
    const initialMoodMap: Record<string, Movie[]> = {
      [initialMood.id]: moodChosen,
    };

    if (isMountedRef.current) {
      setMoodRailById(initialMoodMap);
    }

    const nearbyIds = new Set<number>(moodChosen.map(movie => movie.id));
    const builtRails: Array<{ id: string; movies: Movie[] }> = [];

    for (const def of PREMIUM_RAIL_DEFS) {
      let raw: Movie[] = [];
      try {
        raw = await fetchPremiumRailRaw(def);
      } catch {
        raw = [];
      }

      const picked = mergeByDiversity(raw, usedIds, nearbyIds, 16);
      builtRails.push({ id: def.id, movies: picked });

      const nextNearby = new Set<number>(picked.map(movie => movie.id));
      nextNearby.forEach(id => nearbyIds.add(id));
      if (nearbyIds.size > 120) {
        const keep = Array.from(nearbyIds).slice(-60);
        nearbyIds.clear();
        keep.forEach(id => nearbyIds.add(id));
      }

      if (isMountedRef.current) {
        setPremiumRails(prev => prev.map(rail => {
          if (rail.id !== def.id) return rail;
          return {
            ...rail,
            movies: picked,
            loading: false,
          };
        }));
      }
    }

    HOME_CACHE.payload = {
      timestamp: Date.now(),
      heroMovies: hero,
      aiRecommendations: aiRail,
      moodRailById: initialMoodMap,
      premiumRails: builtRails,
    };

    if (isMountedRef.current) {
      setBootLoading(false);
    }
  }, [fetchAiRecommendations, fetchHeroMovies, fetchMoodRail, fetchPremiumRailRaw, prefetchHeroAssets, readContinueWatching, selectedMoodId]);

  const advanceHero = useCallback(async () => {
    if (heroMovies.length <= 1 || heroAdvanceLockRef.current) return;
    heroAdvanceLockRef.current = true;
    try {
      const nextIndex = (heroIndex + 1) % heroMovies.length;
      const nextMovie = heroMovies[nextIndex];
      await prefetchHeroAssets(nextMovie);
      if (isMountedRef.current) {
        setHeroIndex(nextIndex);
      }
    } finally {
      heroAdvanceLockRef.current = false;
    }
  }, [heroIndex, heroMovies, prefetchHeroAssets]);

  const refreshMoodRail = useCallback(async (mood: MoodDefinition) => {
    if (moodRailById[mood.id]?.length) {
      setSelectedMoodId(mood.id);
      return;
    }

    setSelectedMoodId(mood.id);
    setMoodLoading(true);

    try {
      const raw = await fetchMoodRail(mood);
      const cleaned = rankMovies(sanitizeMovieList(raw)).slice(0, 16);
      if (!isMountedRef.current) return;
      setMoodRailById(prev => ({ ...prev, [mood.id]: cleaned }));
    } finally {
      if (isMountedRef.current) {
        setMoodLoading(false);
      }
    }
  }, [fetchMoodRail, moodRailById]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    HOME_CACHE.payload = null;
    await loadHomepage(true);
    setRefreshing(false);
  }, [loadHomepage]);

  useEffect(() => {
    isMountedRef.current = true;
    loadWatchlist().catch(() => {});
    loadHomepage(false).catch(() => {
      if (isMountedRef.current) setBootLoading(false);
    });

    return () => {
      isMountedRef.current = false;
    };
  }, [loadHomepage, loadWatchlist]);

  useEffect(() => {
    if (backendStatus === 'AWAKE') {
      console.log('[HomeScreen] Render backend woke up! Refreshing homepage seamlessly with live data...');
      loadHomepage(true).catch(() => {});
    }
  }, [backendStatus, loadHomepage]);

  useFocusEffect(
    useCallback(() => {
      readContinueWatching().then(entries => {
        if (!isMountedRef.current) return;
        setContinueWatching(entries.slice(0, 10));
      }).catch(() => {});
    }, [readContinueWatching]),
  );

  useEffect(() => {
    if (heroMovies.length <= 1) return;

    const interval = setInterval(() => {
      advanceHero().catch(() => {});
    }, 7000);

    return () => clearInterval(interval);
  }, [advanceHero, heroMovies.length]);

  useEffect(() => {
    if (!activeHeroMovie) return;

    warmHeroTrailer(activeHeroMovie).catch(() => {});
    const nextMovie = heroMovies[(heroIndex + 1) % Math.max(heroMovies.length, 1)];
    warmHeroTrailer(nextMovie).catch(() => {});
    prefetchHeroAssets(nextMovie).catch(() => {});
    const afterNextMovie = heroMovies[(heroIndex + 2) % Math.max(heroMovies.length, 1)];
    prefetchHeroAssets(afterNextMovie).catch(() => {});
  }, [activeHeroMovie, heroIndex, heroMovies, prefetchHeroAssets, warmHeroTrailer]);

  const openHeroTrailer = useCallback(() => {
    if (!activeHeroTrailer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Linking.openURL(`https://www.youtube.com/watch?v=${activeHeroTrailer.key}`).catch(() => {});
  }, [activeHeroTrailer]);

  const heroInWatchlist = activeHeroMovie ? isInWatchlist(activeHeroMovie.id) : false;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[
        styles.topHeader, 
        { paddingTop: insets.top + 8 },
        isHeaderScrolled && styles.topHeaderSolid
      ]}>
        <View>
          <Text style={styles.topGreeting} allowFontScaling={false}>{headerGreeting}</Text>
          <Text style={styles.topBrand} allowFontScaling={false}>CINE<Text style={styles.topBrandAi}>AI</Text></Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.crimson} />}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          setIsHeaderScrolled(offsetY > 30);
        }}
        scrollEventThrottle={16}
      >
        <HeroBanner
          movie={activeHeroMovie}
          trailer={activeHeroTrailer}
          trailerLoading={activeHeroTrailerLoading}
          onOpenTrailer={openHeroTrailer}
          onOpenMovie={() => activeHeroMovie && openMovie(activeHeroMovie)}
          inWatchlist={heroInWatchlist}
          onToggleWatchlist={toggleHeroWatchlist}
        />

        {heroMovies.length > 1 ? (
          <View style={styles.heroIndicators}>
            {heroMovies.map((movie, index) => (
              <View
                key={`hero-dot-${movie.id}`}
                style={[styles.heroDot, index === heroIndex && styles.heroDotActive]}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.body}>
          {continueWatching.length > 0 ? (
            <View style={styles.sectionWrap}>
              <SectionHeader title={t('home.section.continue')} subtitle={t('home.section.continueSub')} />
              <FlatList
                data={continueWatching}
                horizontal
                keyExtractor={item => `continue-${item.movie.id}`}
                renderItem={({ item }) => <ContinueWatchingCard entry={item} onPress={openMovie} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.railContent}
                initialNumToRender={4}
                maxToRenderPerBatch={6}
                windowSize={4}
                removeClippedSubviews
              />
            </View>
          ) : null}

          <View style={styles.sectionWrap}>
            <SectionHeader
              title={t('home.section.ai')}
              subtitle={t('home.section.aiSub')}
            />
            {bootLoading && aiRecommendations.length === 0 ? (
              <RailSkeleton />
            ) : (
              <FlatList
                data={aiRecommendations}
                horizontal
                keyExtractor={item => `ai-${item.id}`}
                renderItem={({ item }) => <PosterRailCard movie={item} onPress={openMovie} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.railContent}
                initialNumToRender={5}
                maxToRenderPerBatch={6}
                windowSize={4}
                removeClippedSubviews
              />
            )}
          </View>

          <View style={styles.sectionWrap}>
            <SectionHeader
              title={t('home.section.mood')}
              subtitle={t('home.section.moodSub')}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodChipRow}>
              {MOOD_RAILS.map(mood => {
                const selected = mood.id === selectedMoodId;
                return (
                  <Pressable
                    key={mood.id}
                    style={[styles.moodChip, selected && styles.moodChipSelected]}
                    onPress={() => refreshMoodRail(mood)}
                  >
                    <Text style={[styles.moodChipLabel, selected && styles.moodChipLabelSelected]} allowFontScaling={false}>
                      {localizedMood(mood.id, mood.label)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {moodLoading ? (
              <RailSkeleton />
            ) : (
              <FlatList
                data={moodRailById[selectedMoodId] || []}
                horizontal
                keyExtractor={item => `mood-${selectedMoodId}-${item.id}`}
                renderItem={({ item }) => <PosterRailCard movie={item} onPress={openMovie} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.railContent}
                initialNumToRender={5}
                maxToRenderPerBatch={6}
                windowSize={4}
                removeClippedSubviews
                ListEmptyComponent={
                  <View style={styles.emptyMoodRail}>
                    <Text style={styles.emptyMoodText} allowFontScaling={false}>{localizedEmptyMood}</Text>
                  </View>
                }
              />
            )}
          </View>

          {premiumRails.map(rail => (
            <View key={rail.id} style={styles.sectionWrap}>
              <SectionHeader
                title={t(`rail.${rail.id}.title`) !== `rail.${rail.id}.title` ? t(`rail.${rail.id}.title`) : rail.title}
                subtitle={t(`rail.${rail.id}.subtitle`) !== `rail.${rail.id}.subtitle` ? t(`rail.${rail.id}.subtitle`) : rail.subtitle}
              />
              {rail.loading ? (
                <RailSkeleton />
              ) : (
                <FlatList
                  data={rail.movies}
                  horizontal
                  keyExtractor={item => `${rail.id}-${item.id}`}
                  renderItem={({ item }) => <PosterRailCard movie={item} onPress={openMovie} />}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.railContent}
                  initialNumToRender={5}
                  maxToRenderPerBatch={6}
                  windowSize={4}
                  removeClippedSubviews
                />
              )}
            </View>
          ))}

          {bootLoading ? (
            <View style={styles.bootLoaderRow}>
              <ActivityIndicator size="small" color={Colors.accent.crimson} />
            </View>
          ) : null}

          {watchlistItems.length > 0 ? (
            <View style={styles.footerSpace} />
          ) : null}
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
    zIndex: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(7,7,9,0.22)',
  },
  topHeaderSolid: {
    backgroundColor: '#070709', // Solid dark color matching Colors.bg.void
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  topGreeting: {
    color: Colors.text.tertiary,
    fontSize: 10,
    fontFamily: Typography.fontMedium,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  topBrand: {
    marginTop: 3,
    color: Colors.text.primary,
    fontSize: 19,
    fontFamily: Typography.fontDisplay,
    letterSpacing: 1.1,
  },
  topBrandAi: {
    color: Colors.accent.crimson,
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
  heroWrap: {
    height: HERO_HEIGHT,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  heroSkeleton: {
    height: HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.deep,
  },
  heroContent: {
    paddingHorizontal: 22,
    paddingBottom: 28,
    gap: 16,
  },
  heroLabel: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontFamily: Typography.fontMedium,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    color: Colors.text.primary,
    fontSize: 33,
    fontFamily: Typography.fontDisplay,
    letterSpacing: -0.7,
    lineHeight: 37,
  },
  heroMeta: {
    marginTop: 8,
    color: Colors.text.secondary,
    fontSize: 12,
    fontFamily: Typography.fontMedium,
  },
  heroOverview: {
    marginTop: 8,
    color: '#D2D2E0',
    fontSize: 13,
    fontFamily: Typography.fontPrimary,
    lineHeight: 20,
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
    gap: 10,
  },
  heroPrimaryBtn: {
    minHeight: 40,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D9ECFA',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 150,
  },
  heroPrimaryBtnText: {
    color: '#071018',
    fontSize: 12,
    fontFamily: Typography.fontSemiBold,
  },
  heroDisabledBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroDisabledBtnText: {
    color: Colors.text.secondary,
  },
  heroSecondaryBtn: {
    minHeight: 40,
    borderRadius: Radius.full,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(7,7,9,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 108,
  },
  heroSecondaryBtnText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontFamily: Typography.fontSemiBold,
  },
  heroIndicators: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroDotActive: {
    width: 16,
    backgroundColor: Colors.accent.crimson,
  },
  body: {
    marginTop: 18,
    gap: 24,
  },
  sectionWrap: {
    gap: 12,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    gap: 3,
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 20,
    fontFamily: Typography.fontDisplay,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontFamily: Typography.fontPrimary,
  },
  railContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  posterCard: {
    width: RAIL_CARD_WIDTH,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginRight: 4,
  },
  posterImage: {
    width: RAIL_CARD_WIDTH,
    height: RAIL_CARD_HEIGHT,
    backgroundColor: Colors.bg.surface,
  },
  posterGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
  },
  posterMeta: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 9,
  },
  posterTitle: {
    color: Colors.text.primary,
    fontSize: 12,
    fontFamily: Typography.fontSemiBold,
  },
  posterSub: {
    marginTop: 2,
    color: Colors.text.secondary,
    fontSize: 9.5,
    fontFamily: Typography.fontPrimary,
  },
  posterRatingPill: {
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
  posterRatingText: {
    color: Colors.accent.gold,
    fontSize: 10,
    fontFamily: Typography.fontSemiBold,
  },
  continueCard: {
    width: 256,
    height: 144,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: Colors.bg.surface,
    marginRight: 8,
  },
  continueBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  continueGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  continueMeta: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 20,
  },
  continueTitle: {
    color: Colors.text.primary,
    fontSize: 14,
    fontFamily: Typography.fontSemiBold,
  },
  continueSub: {
    marginTop: 3,
    color: Colors.text.secondary,
    fontSize: 11,
    fontFamily: Typography.fontPrimary,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.accent.crimson,
  },
  moodChipRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  moodChip: {
    minHeight: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodChipSelected: {
    borderColor: 'rgba(230,57,70,0.6)',
    backgroundColor: 'rgba(230,57,70,0.2)',
  },
  moodChipLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontFamily: Typography.fontMedium,
  },
  moodChipLabelSelected: {
    color: Colors.text.primary,
  },
  emptyMoodRail: {
    width: SCREEN_WIDTH - 40,
    paddingVertical: 30,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMoodText: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontFamily: Typography.fontPrimary,
  },
  railSkeletonWrap: {
    paddingHorizontal: 20,
    gap: 10,
  },
  railSkeletonHeader: {
    width: 170,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  railSkeletonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  railSkeletonCard: {
    width: RAIL_CARD_WIDTH,
    height: RAIL_CARD_HEIGHT + 44,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bootLoaderRow: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSpace: {
    height: Spacing.base,
  },
});

export default HomeScreen;
