import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Radius, Typography } from '../../constants/theme';
import tmdbApi from '../../services/tmdbApi';
import { apiClient } from '../../services/api/apiClient';
import { useLanguageStore } from '../../store/languageStore';
import type { Genre, Movie, PaginatedResponse, RootStackParamList } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RECENT_SEARCHES_KEY = '@cineai_recent_searches_v2';
const SEARCH_DEBOUNCE_MS = 380;
const SUGGESTION_DEBOUNCE_MS = 220;
const SUGGESTION_CACHE_TTL_MS = 3 * 60 * 1000;
const TREND_REFRESH_MS = 8 * 60 * 1000;

type SearchNav = NativeStackNavigationProp<RootStackParamList>;
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type SuggestionKind = 'movie' | 'tv' | 'actor' | 'franchise' | 'genre' | 'recent';

interface DiscoverQuery {
  with_genres?: string;
  sort_by?: string;
  'vote_average.gte'?: number;
  'vote_count.gte'?: number;
  with_original_language?: string;
  primary_release_year?: number;
  limit?: number;
}

interface SearchSuggestion {
  id: string;
  label: string;
  query: string;
  kind: SuggestionKind;
  icon: IoniconName;
  meta?: string;
}

interface TrendingItem {
  movie: Movie;
  score: number;
  tags: string[];
}

interface GenreBlueprint {
  key: string;
  label: string;
  lookupName?: string;
  fallbackGenreId: number;
  icon: IoniconName;
  palette: [string, string];
  discover: DiscoverQuery;
}

interface GenreCardData extends Genre {
  key: string;
  icon: IoniconName;
  palette: [string, string];
  discover: DiscoverQuery;
  movies: Movie[];
}

type CollectionMode = 'trending' | 'discover' | 'search';

interface CollectionDefinition {
  id: string;
  title: string;
  subtitle: string;
  icon: IoniconName;
  mode: CollectionMode;
  query?: string;
  discover?: DiscoverQuery;
}

interface CollectionCardData extends CollectionDefinition {
  movies: Movie[];
}

interface SuggestionCacheEntry {
  at: number;
  items: SearchSuggestion[];
}

interface RawSearchPayload {
  Title?: string;
  Year?: string;
  Actors?: string;
  Genre?: string;
  [key: string]: unknown;
}

const GENRE_BLUEPRINTS: GenreBlueprint[] = [
  {
    key: 'action',
    label: 'Action',
    lookupName: 'Action',
    fallbackGenreId: 28,
    icon: 'flame-outline',
    palette: ['rgba(249,115,22,0.9)', 'rgba(124,45,18,0.75)'],
    discover: { sort_by: 'popularity.desc', 'vote_count.gte': 90 },
  },
  {
    key: 'scifi',
    label: 'Sci-Fi',
    lookupName: 'Science Fiction',
    fallbackGenreId: 878,
    icon: 'planet-outline',
    palette: ['rgba(76,201,240,0.9)', 'rgba(15,48,87,0.75)'],
    discover: { sort_by: 'popularity.desc', 'vote_count.gte': 70 },
  },
  {
    key: 'horror',
    label: 'Horror',
    lookupName: 'Horror',
    fallbackGenreId: 27,
    icon: 'skull-outline',
    palette: ['rgba(16,185,129,0.9)', 'rgba(5,68,53,0.75)'],
    discover: { sort_by: 'popularity.desc', 'vote_count.gte': 55 },
  },
  {
    key: 'thriller',
    label: 'Thriller',
    lookupName: 'Thriller',
    fallbackGenreId: 53,
    icon: 'flash-outline',
    palette: ['rgba(244,114,182,0.9)', 'rgba(89,28,64,0.75)'],
    discover: { sort_by: 'popularity.desc', 'vote_count.gte': 65 },
  },
  {
    key: 'anime',
    label: 'Anime',
    lookupName: 'Animation',
    fallbackGenreId: 16,
    icon: 'sparkles-outline',
    palette: ['rgba(167,139,250,0.92)', 'rgba(49,46,129,0.75)'],
    discover: {
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
      'vote_count.gte': 20,
    },
  },
  {
    key: 'crime',
    label: 'Crime',
    lookupName: 'Crime',
    fallbackGenreId: 80,
    icon: 'shield-outline',
    palette: ['rgba(108,99,255,0.92)', 'rgba(49,46,129,0.72)'],
    discover: { sort_by: 'popularity.desc', 'vote_count.gte': 65 },
  },
  {
    key: 'romance',
    label: 'Romance',
    lookupName: 'Romance',
    fallbackGenreId: 10749,
    icon: 'heart-outline',
    palette: ['rgba(244,114,182,0.92)', 'rgba(131,24,67,0.75)'],
    discover: { sort_by: 'popularity.desc', 'vote_count.gte': 45 },
  },
  {
    key: 'fantasy',
    label: 'Fantasy',
    lookupName: 'Fantasy',
    fallbackGenreId: 14,
    icon: 'color-wand-outline',
    palette: ['rgba(147,51,234,0.9)', 'rgba(76,29,149,0.75)'],
    discover: { sort_by: 'popularity.desc', 'vote_count.gte': 45 },
  },
  {
    key: 'mystery',
    label: 'Mystery',
    lookupName: 'Mystery',
    fallbackGenreId: 9648,
    icon: 'help-circle-outline',
    palette: ['rgba(251,191,36,0.92)', 'rgba(120,53,15,0.75)'],
    discover: { sort_by: 'popularity.desc', 'vote_count.gte': 45 },
  },
  {
    key: 'comedy',
    label: 'Comedy',
    lookupName: 'Comedy',
    fallbackGenreId: 35,
    icon: 'happy-outline',
    palette: ['rgba(240,180,41,0.92)', 'rgba(133,77,14,0.75)'],
    discover: { sort_by: 'popularity.desc', 'vote_count.gte': 55 },
  },
];

const COLLECTION_DEFS: CollectionDefinition[] = [
  {
    id: 'award-winners',
    title: 'Award Winners',
    subtitle: 'Prestige titles with strong critical momentum',
    icon: 'trophy-outline',
    mode: 'discover',
    discover: {
      sort_by: 'vote_average.desc',
      'vote_average.gte': 7.3,
      'vote_count.gte': 220,
    },
  },
  {
    id: 'trending-worldwide',
    title: 'Trending Worldwide',
    subtitle: 'Global conversation heat right now',
    icon: 'trending-up-outline',
    mode: 'trending',
  },
  {
    id: 'hidden-gems',
    title: 'Hidden Gems',
    subtitle: 'High-rated titles outside blockbuster loops',
    icon: 'diamond-outline',
    mode: 'discover',
    discover: {
      sort_by: 'vote_average.desc',
      'vote_average.gte': 7.0,
      'vote_count.gte': 55,
    },
  },
  {
    id: 'netflix-originals',
    title: 'Netflix Originals',
    subtitle: 'Platform-native stories with global reach',
    icon: 'tv-outline',
    mode: 'search',
    query: 'netflix original movie',
  },
  {
    id: 'anime-universe',
    title: 'Anime Universe',
    subtitle: 'Japanese animation worlds and iconic arcs',
    icon: 'sparkles-outline',
    mode: 'discover',
    discover: {
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
      'vote_count.gte': 20,
    },
  },
  {
    id: 'bollywood-spotlight',
    title: 'Bollywood Spotlight',
    subtitle: 'Hindi cinema highlights with mass appeal',
    icon: 'star-outline',
    mode: 'discover',
    discover: {
      with_original_language: 'hi',
      sort_by: 'popularity.desc',
      'vote_count.gte': 25,
    },
  },
  {
    id: 'korean-thrillers',
    title: 'Korean Thrillers',
    subtitle: 'High-intensity Korean suspense picks',
    icon: 'moon-outline',
    mode: 'discover',
    discover: {
      with_original_language: 'ko',
      with_genres: '53|80|9648',
      sort_by: 'popularity.desc',
      'vote_count.gte': 20,
    },
  },
  {
    id: 'scifi-worlds',
    title: 'Sci-Fi Worlds',
    subtitle: 'Speculative futures and cosmic storytelling',
    icon: 'planet-outline',
    mode: 'discover',
    discover: {
      with_genres: '878|12|14',
      sort_by: 'popularity.desc',
      'vote_count.gte': 40,
    },
  },
];

const releaseYear = (releaseDate: string | undefined): string => {
  if (!releaseDate || releaseDate.length < 4) return 'N/A';
  return releaseDate.slice(0, 4);
};

const normalizedTitle = (title: string): string => {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const franchiseToken = (title: string): string => {
  const cleaned = normalizedTitle(title)
    .replace(/\b(part|chapter|volume|vol|episode)\b.*$/, '')
    .replace(/\b(ii|iii|iv|v|vi|vii|viii|ix|x)\b/g, '')
    .trim();
  if (!cleaned) return '';
  const pieces = cleaned.split(' ').filter(token => token.length > 2);
  if (pieces.length === 0) return '';
  return pieces.slice(0, 2).join(' ');
};

const humanizeFranchise = (token: string): string => {
  return token
    .split(' ')
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const sanitizeMovieList = (movies: Movie[]): Movie[] => {
  const seen = new Set<number>();
  const output: Movie[] = [];

  for (const movie of movies) {
    if (!movie || !movie.id || !movie.title) continue;
    if (seen.has(movie.id)) continue;
    seen.add(movie.id);
    output.push(movie);
  }

  return output;
};

const resultMetaLine = (movie: Movie): string => {
  const year = releaseYear(movie.release_date);
  const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : 'N/A';
  return `${year}  |  ${rating}  |  TMDB`;
};

const toRawRows = (payload: unknown): RawSearchPayload[] => {
  if (!Array.isArray(payload)) return [];
  return payload.filter((item): item is RawSearchPayload => typeof item === 'object' && item !== null);
};

const responseFromMovies = (movies: Movie[]): PaginatedResponse<Movie> => ({
  page: 1,
  results: movies,
  total_pages: 1,
  total_results: movies.length,
});

const SearchResultRow: React.FC<{
  movie: Movie;
  onPress: (movie: Movie) => void;
}> = ({ movie, onPress }) => {
  return (
    <Pressable style={styles.resultCard} onPress={() => onPress(movie)}>
      <Image
        source={{ uri: movie.poster_path || movie.backdrop_path || undefined }}
        style={styles.resultPoster}
        contentFit="cover"
        transition={180}
        cachePolicy="memory-disk"
      />
      <View style={styles.resultBody}>
        <Text style={styles.resultTitle} numberOfLines={2} allowFontScaling={false}>
          {movie.title}
        </Text>
        <Text style={styles.resultMeta} allowFontScaling={false}>
          {resultMetaLine(movie)}
        </Text>
        <Text style={styles.resultOverview} numberOfLines={3} allowFontScaling={false}>
          {movie.overview || 'No overview available.'}
        </Text>
      </View>
    </Pressable>
  );
};

const SearchScreen: React.FC = () => {
  const localizedSearch = useCallback((key: string, defaultValue: string) => {
    const searchTranslations: Record<string, Record<string, string>> = {
      en: {
        'search.placeholder': 'Search movies, TV, actors, genres, franchises...',
        'search.trending': 'Dynamic Trending Searches',
        'search.genreGrid': 'Genre Discovery Grid',
        'search.genreGridSub': 'Tap any genre for real TMDB-powered discovery',
        'search.collections': 'Streaming Collections',
        'search.collectionsSub': 'Platform-inspired hubs powered by live TMDB data',
        'search.recent': 'Recently Searched',
        'search.recentSub': 'Jump back into your last discovery paths',
        'search.clear': 'Clear',
        'search.discover': 'Discover',
        'search.building': 'Building your cinematic results...',
        'search.featured': 'Featured Match',
        'search.noMatch': 'No cinematic matches found',
        'search.noMatchSub': 'Try another title, actor, franchise, or genre keyword.',
        'collection.award-winners.title': 'Award Winners',
        'collection.award-winners.subtitle': 'Prestige titles with strong critical momentum',
        'collection.trending-worldwide.title': 'Trending Worldwide',
        'collection.trending-worldwide.subtitle': 'Global conversation heat right now',
        'collection.hidden-gems.title': 'Hidden Gems',
        'collection.hidden-gems.subtitle': 'High-rated titles outside blockbuster loops',
        'collection.netflix-originals.title': 'Netflix Originals',
        'collection.netflix-originals.subtitle': 'Platform-native stories with global reach',
        'collection.anime-universe.title': 'Anime Universe',
        'collection.anime-universe.subtitle': 'Japanese animation worlds and iconic arcs',
        'collection.bollywood-spotlight.title': 'Bollywood Spotlight',
        'collection.bollywood-spotlight.subtitle': 'Hindi cinema highlights with mass appeal',
        'collection.korean-thrillers.title': 'Korean Thrillers',
        'collection.korean-thrillers.subtitle': 'High-intensity Korean suspense picks',
        'collection.scifi-worlds.title': 'Sci-Fi Worlds',
        'collection.scifi-worlds.subtitle': 'Speculative futures and cosmic storytelling',
      },
      es: {
        'search.placeholder': 'Buscar películas, programas de TV, actores...',
        'search.trending': 'Tendencias de Búsqueda Dinámicas',
        'search.genreGrid': 'Cuadrícula de Géneros',
        'search.genreGridSub': 'Toca cualquier género para descubrir películas',
        'search.collections': 'Colecciones de Streaming',
        'search.collectionsSub': 'Hubs de plataformas con datos en vivo de TMDB',
        'search.recent': 'Búsquedas Recientes',
        'search.recentSub': 'Vuelve a tus últimos caminos de descubrimiento',
        'search.clear': 'Borrar',
        'search.discover': 'Descubrir',
        'search.building': 'Construyendo tus resultados cinematográficos...',
        'search.featured': 'Coincidencia Destacada',
        'search.noMatch': 'No se encontraron coincidencias cinematográficas',
        'search.noMatchSub': 'Prueba con otro título, actor o palabra clave.',
        'collection.award-winners.title': 'Ganadoras de Premios',
        'collection.award-winners.subtitle': 'Títulos prestigiosos con fuerte impulso crítico',
        'collection.trending-worldwide.title': 'Tendencias Mundiales',
        'collection.trending-worldwide.subtitle': 'Conversación global en este momento',
        'collection.hidden-gems.title': 'Joyas Ocultas',
        'collection.hidden-gems.subtitle': 'Títulos de alta calificación fuera de los circuitos de taquilla',
        'collection.netflix-originals.title': 'Originales de Netflix',
        'collection.netflix-originals.subtitle': 'Historias nativas de la plataforma con alcance global',
        'collection.anime-universe.title': 'Universo Anime',
        'collection.anime-universe.subtitle': 'Mundos de animación japonesa y arcos icónicos',
        'collection.bollywood-spotlight.title': 'Enfoque en Bollywood',
        'collection.bollywood-spotlight.subtitle': 'Destacados del cine hindi con atractivo masivo',
        'collection.korean-thrillers.title': 'Thrillers Coreanos',
        'collection.korean-thrillers.subtitle': 'Selecciones de suspenso coreano de alta intensidad',
        'collection.scifi-worlds.title': 'Mundos de Ciencia Ficción',
        'collection.scifi-worlds.subtitle': 'Futuros especulativos y narración cósmica',
      },
      fr: {
        'search.placeholder': 'Rechercher des films, séries, acteurs...',
        'search.trending': 'Tendances de recherche',
        'search.genreGrid': 'Grille des genres',
        'search.genreGridSub': 'Tapez sur un genre pour découvrir sur TMDB',
        'search.collections': 'Collections en streaming',
        'search.collectionsSub': 'Hubs inspirés des plateformes (données TMDB)',
        'search.recent': 'Recherches récentes',
        'search.recentSub': 'Reprenez vos dernières découvertes',
        'search.clear': 'Effacer',
        'search.discover': 'Découvrir',
        'search.building': 'Préparation de vos résultats...',
        'search.featured': 'Meilleure correspondance',
        'search.noMatch': 'Aucun film trouvé',
        'search.noMatchSub': 'Essayez un autre mot-clé, titre ou acteur.',
        'collection.award-winners.title': 'Films primés',
        'collection.award-winners.subtitle': 'Titres de prestige avec un fort élan critique',
        'collection.trending-worldwide.title': 'Tendances mondiales',
        'collection.trending-worldwide.subtitle': 'Sujets de conversation mondiaux actuels',
        'collection.hidden-gems.title': 'Pépites cachées',
        'collection.hidden-gems.subtitle': 'Titres très bien notés en dehors des grands circuits',
        'collection.netflix-originals.title': 'Créations Netflix',
        'collection.netflix-originals.subtitle': 'Histoires originales de la plateforme à portée mondiale',
        'collection.anime-universe.title': 'Univers Anime',
        'collection.anime-universe.subtitle': 'Mondes d\'animation japonaise et arcs emblématiques',
        'collection.bollywood-spotlight.title': 'Pleins feux sur Bollywood',
        'collection.bollywood-spotlight.subtitle': 'Cinéma hindi populaire à grand succès',
        'collection.korean-thrillers.title': 'Thrillers coréens',
        'collection.korean-thrillers.subtitle': 'Sélections de suspense coréen de haute intensité',
        'collection.scifi-worlds.title': 'Mondes de SF',
        'collection.scifi-worlds.subtitle': 'Futurs spéculatifs et narration cosmique',
      },
      de: {
        'search.placeholder': 'Filme, Serien, Regisseure suchen...',
        'search.trending': 'Aktuelle Suchtrends',
        'search.genreGrid': 'Genre-Übersicht',
        'search.genreGridSub': 'Tippe auf ein Genre für direkte TMDB-Suche',
        'search.collections': 'Streaming-Sammlungen',
        'search.collectionsSub': 'Beliebte Kanäle gefüttert mit TMDB-Daten',
        'search.recent': 'Letzte Suchen',
        'search.recentSub': 'Knüpfe an deine letzten Suchen an',
        'search.clear': 'Löschen',
        'search.discover': 'Entdecken',
        'search.building': 'Ergebnisse werden geladen...',
        'search.featured': 'Bester Treffer',
        'search.noMatch': 'Keine Treffer gefunden',
        'search.noMatchSub': 'Probiere ein anderes Stichwort, Genre oder Schauspieler.',
        'collection.award-winners.title': 'Preisgekrönte Filme',
        'collection.award-winners.subtitle': 'Anspruchsvolle Werke mit starkem kritischen Zuspruch',
        'collection.trending-worldwide.title': 'Weltweite Trends',
        'collection.trending-worldwide.subtitle': 'Globale Gesprächsthemen im Moment',
        'collection.hidden-gems.title': 'Geheimtipps',
        'collection.hidden-gems.subtitle': 'Herausragende Filme abseits des Mainstreams',
        'collection.netflix-originals.title': 'Netflix Originals',
        'collection.netflix-originals.subtitle': 'Plattform-eigene Geschichten mit globaler Reichweite',
        'collection.anime-universe.title': 'Anime-Universum',
        'collection.anime-universe.subtitle': 'Japanische Zeichentrickwelten und legendäre Sagen',
        'collection.bollywood-spotlight.title': 'Bollywood-Fokus',
        'collection.bollywood-spotlight.subtitle': 'Populäres Hindi-Kino mit breiter Anziehungskraft',
        'collection.korean-thrillers.title': 'Koreanische Thriller',
        'collection.korean-thrillers.subtitle': 'Hochspannende Thriller aus Südkorea',
        'collection.scifi-worlds.title': 'Sci-Fi-Welten',
        'collection.scifi-worlds.subtitle': 'Spekulative Zukünfte und kosmische Geschichten',
      },
      hi: {
        'search.placeholder': 'फिल्में, टीवी शो, शैलियों को खोजें...',
        'search.trending': 'सक्रिय ट्रेंडिंग खोजें',
        'search.genreGrid': 'शैलियाँ ग्रिड',
        'search.genreGridSub': 'TMDB-संचालित खोज के लिए शैली पर टैप करें',
        'search.collections': 'स्ट्रीमिंग संग्रह',
        'search.collectionsSub': 'TMDB डेटा द्वारा संचालित प्लेटफॉर्म हब',
        'search.recent': 'हाल ही की खोजें',
        'search.recentSub': 'अपने पिछले खोज पथों पर वापस जाएं',
        'search.clear': 'साफ करें',
        'search.discover': 'खोजें',
        'search.building': 'परिणाम तैयार किए जा रहे हैं...',
        'search.featured': 'विशेष मैच',
        'search.noMatch': 'कोई मेल नहीं मिला',
        'search.noMatchSub': 'कोई अन्य शीर्षक या शैली शब्द आज़माएं।',
        'collection.award-winners.title': 'पुरस्कार विजेता',
        'collection.award-winners.subtitle': 'मजबूत आलोचनात्मक गति वाली बेहतरीन फ़िल्में',
        'collection.trending-worldwide.title': 'वैश्विक रुझान',
        'collection.trending-worldwide.subtitle': 'इस समय दुनिया भर में चर्चित विषय',
        'collection.hidden-gems.title': 'छिपे हुए रत्न',
        'collection.hidden-gems.subtitle': 'मुख्यधारा से अलग उच्च श्रेणी की बेहतरीन फ़िल्में',
        'collection.netflix-originals.title': 'नेटफ्लिक्स ओरिजिनल',
        'collection.netflix-originals.subtitle': 'वैश्विक पहुंच वाली मूल कहानियां',
        'collection.anime-universe.title': 'एनीमे ब्रह्मांड',
        'collection.anime-universe.subtitle': 'जापानी एनीमेशन और लोकप्रिय सीरीज़',
        'collection.bollywood-spotlight.title': 'बॉलीवुड स्पॉटलाइट',
        'collection.bollywood-spotlight.subtitle': 'जन-अपील वाली हिंदी सिनेमा की मुख्य फ़िल्में',
        'collection.korean-thrillers.title': 'कोरियाई थ्रिलर',
        'collection.korean-thrillers.subtitle': 'उच्च तीव्रता वाले कोरियाई सस्पेंस थ्रिलर',
        'collection.scifi-worlds.title': 'साइंस-फिक्शन दुनिया',
        'collection.scifi-worlds.subtitle': 'काल्पनिक भविष्य और ब्रह्मांडीय कहानियां',
      },
      ja: {
        'search.placeholder': '映画、TV番組、キャスト、ジャンルを検索...',
        'search.trending': '急上昇ワード',
        'search.genreGrid': 'ジャンルで探す',
        'search.genreGridSub': 'タップしてTMDBリアルタイム作品検索',
        'search.collections': '配信コレクション',
        'search.collectionsSub': '各配信サービスをイメージした特設ハブ',
        'search.recent': '最近の検索',
        'search.recentSub': '前回の検索履歴から再開',
        'search.clear': '履歴をクリア',
        'search.discover': '見つける',
        'search.building': '検索結果を集計中...',
        'search.featured': '一番の候補',
        'search.noMatch': '一致する作品が見つかりません',
        'search.noMatchSub': '別のキーワード、作品名、キャストをお試しください。',
        'collection.award-winners.title': '受賞作セレクト',
        'collection.award-winners.subtitle': '世界の映画祭を賑わせた傑作選',
        'collection.trending-worldwide.title': '世界トレンド',
        'collection.trending-worldwide.subtitle': '世界中で今最も熱い作品のトーク',
        'collection.hidden-gems.title': '隠れた名作',
        'collection.hidden-gems.subtitle': '大ヒット枠外の超高評価作品',
        'collection.netflix-originals.title': 'Netflix オリジナル',
        'collection.netflix-originals.subtitle': '世界規模で展開するプラットフォーム作品',
        'collection.anime-universe.title': 'アニメワールド',
        'collection.anime-universe.subtitle': '日本のアニメ世界と名作エピソード',
        'collection.bollywood-spotlight.title': 'ボリウッド特集',
        'collection.bollywood-spotlight.subtitle': '大衆的人気を誇るインド・ヒンディー映画',
        'collection.korean-thrillers.title': '韓国サスペンス',
        'collection.korean-thrillers.subtitle': '世界を震撼させる超一級の韓国スリラー',
        'collection.scifi-worlds.title': 'SF映画の世界',
        'collection.scifi-worlds.subtitle': '遥かなる未来と宇宙のストーリー',
      },
      ko: {
        'search.placeholder': '영화, TV, 배우, 장르, 프랜차이즈 검색...',
        'search.trending': '실시간 급상승 검색',
        'search.genreGrid': '장르 디렉토리',
        'search.genreGridSub': '장르를 선택해 실시간 TMDB 발견을 해보세요',
        'search.collections': '스트리밍 컬렉션',
        'search.collectionsSub': '각 플랫폼별 인기작 허브',
        'search.recent': '최근 검색어',
        'search.recentSub': '이전 검색 기록 이어가기',
        'search.clear': '지우기',
        'search.discover': '둘러보기',
        'search.building': '영화 검색 결과를 빌드하고 있습니다...',
        'search.featured': '가장 유력한 매칭',
        'search.noMatch': '일치하는 영화를 찾지 못했습니다',
        'search.noMatchSub': '다른 제목, 장르, 혹은 인물명으로 검색해 보세요.',
        'collection.award-winners.title': '수상작 컬렉션',
        'collection.award-winners.subtitle': '전문가들의 호평을 한 몸에 받은 웰메이드 영화',
        'collection.trending-worldwide.title': '글로벌 인기작',
        'collection.trending-worldwide.subtitle': '지금 세계인들이 가장 많이 대화하는 영화',
        'collection.hidden-gems.title': '숨겨진 보석',
        'collection.hidden-gems.subtitle': '대중적이지 않지만 평점이 높은 명작',
        'collection.netflix-originals.title': '넷플릭스 오리지널',
        'collection.netflix-originals.subtitle': '글로벌한 반향을 불러일으키는 플랫폼 제작 영화',
        'collection.anime-universe.title': '애니 유니버스',
        'collection.anime-universe.subtitle': '일본 애니메이션 명작과 감동의 서사시',
        'collection.bollywood-spotlight.title': '볼리우드 스포트라이트',
        'collection.bollywood-spotlight.subtitle': '대중성을 갖춘 인도 힌디어 영화 화제작',
        'collection.korean-thrillers.title': '한국 스릴러 명작',
        'collection.korean-thrillers.subtitle': '극강의 몰입감을 선사하는 한국 서스펜스 인기작',
        'collection.scifi-worlds.title': 'SF 세계관',
        'collection.scifi-worlds.subtitle': '가상 미래와 광활한 우주 대서사시',
      },
    };
    const activeLanguage = useLanguageStore.getState().language;
    return searchTranslations[activeLanguage]?.[key] || defaultValue;
  }, []);

  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SearchNav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Search'>>();
  const inputRef = useRef<TextInput>(null);
  const isMountedRef = useRef(true);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const suggestionDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const suggestionRequestIdRef = useRef(0);
  const suggestionCacheRef = useRef<Map<string, SuggestionCacheEntry>>(new Map());
  const t = useLanguageStore(state => state.t);
  const language = useLanguageStore(state => state.language);

  const [query, setQuery] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  const [genreCards, setGenreCards] = useState<GenreCardData[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);

  const [collections, setCollections] = useState<CollectionCardData[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  const [globalResults, setGlobalResults] = useState<Movie[]>([]);
  const [discoveryResults, setDiscoveryResults] = useState<Movie[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [activeDiscoveryTitle, setActiveDiscoveryTitle] = useState('');
  const [activeDiscoverySubtitle, setActiveDiscoverySubtitle] = useState('');

  const loadRecentSearches = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (!raw) {
        setRecentSearches([]);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        setRecentSearches([]);
        return;
      }
      const cleaned = parsed
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, 12);
      setRecentSearches(cleaned);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const saveRecentSearch = useCallback(async (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;

    setRecentSearches(prev => {
      const merged = [cleaned, ...prev.filter(item => item.toLowerCase() !== cleaned.toLowerCase())].slice(0, 12);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(merged)).catch(() => {});
      return merged;
    });
  }, []);

  const clearRecentSearches = useCallback(async () => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // no-op
    }
  }, []);

  const fetchTrendingSignals = useCallback(async () => {
    setTrendingLoading(true);
    try {
      const [dayRes, weekRes, globalRes] = await Promise.allSettled([
        tmdbApi.getTrending('day', 16),
        tmdbApi.getTrending('week', 16),
        tmdbApi.getPopular(1, 14),
      ]);

      const scored = new Map<number, { movie: Movie; score: number; tags: Set<string> }>();

      const ingest = (movies: Movie[], tag: string, weight: number): void => {
        sanitizeMovieList(movies).forEach(movie => {
          const ratingScore = movie.vote_average * 3;
          const voteScore = Math.log10(Math.max(movie.vote_count, 1)) * 2;
          const popularityScore = Math.min(movie.popularity, 1400) * 0.02;
          const yearBoost = releaseYear(movie.release_date) >= String(new Date().getFullYear() - 1) ? 0.9 : 0;
          const total = (ratingScore + voteScore + popularityScore + yearBoost) * weight;

          const existing = scored.get(movie.id);
          if (!existing || total > existing.score) {
            scored.set(movie.id, {
              movie,
              score: total,
              tags: new Set(existing ? Array.from(existing.tags) : []),
            });
          }
          const current = scored.get(movie.id);
          if (current) {
            current.tags.add(tag);
          }
        });
      };

      if (dayRes.status === 'fulfilled') ingest(dayRes.value.results, 'Today', 1.18);
      if (weekRes.status === 'fulfilled') ingest(weekRes.value.results, 'Week', 1.1);
      if (globalRes.status === 'fulfilled') ingest(globalRes.value.results, 'Worldwide', 1.06);

      const ranked = Array.from(scored.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 14)
        .map(item => ({
          movie: item.movie,
          score: item.score,
          tags: Array.from(item.tags),
        }));

      if (isMountedRef.current) {
        setTrending(ranked);
      }
    } catch {
      if (isMountedRef.current) {
        setTrending([]);
      }
    } finally {
      if (isMountedRef.current) {
        setTrendingLoading(false);
      }
    }
  }, []);

  const fetchGenreCards = useCallback(async () => {
    setGenresLoading(true);
    try {
      const response = await tmdbApi.getGenres();
      const genreByName = new Map<string, number>();

      response.genres.forEach(item => {
        genreByName.set(item.name.toLowerCase(), item.id);
      });

      const cards = await Promise.all(
        GENRE_BLUEPRINTS.map(async blueprint => {
          const resolvedId = genreByName.get((blueprint.lookupName || blueprint.label).toLowerCase()) || blueprint.fallbackGenreId;
          const discover: DiscoverQuery = {
            ...blueprint.discover,
            with_genres: String(resolvedId),
            limit: 8,
          };

          if (blueprint.key === 'anime') {
            discover.with_genres = '16';
            discover.with_original_language = 'ja';
          }

          const preview = await tmdbApi.discover(discover);
          return {
            id: resolvedId,
            key: blueprint.key,
            name: blueprint.label,
            icon: blueprint.icon,
            palette: blueprint.palette,
            discover,
            movies: sanitizeMovieList(preview.results).slice(0, 4),
          } as GenreCardData;
        }),
      );

      if (isMountedRef.current) {
        setGenreCards(cards);
      }
    } catch {
      if (isMountedRef.current) {
        setGenreCards([]);
      }
    } finally {
      if (isMountedRef.current) {
        setGenresLoading(false);
      }
    }
  }, []);

  const resolveCollectionResponse = useCallback(async (def: CollectionDefinition): Promise<PaginatedResponse<Movie>> => {
    if (def.mode === 'trending') {
      return tmdbApi.getTrending('week', 22);
    }
    if (def.mode === 'discover') {
      return tmdbApi.discover({
        ...(def.discover || {}),
        limit: 22,
      });
    }
    return tmdbApi.searchMovies(def.query || def.title, 1, 22);
  }, []);

  const fetchCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const settled = await Promise.allSettled(
        COLLECTION_DEFS.map(async def => {
          const response = await resolveCollectionResponse(def);
          return {
            ...def,
            movies: sanitizeMovieList(response.results).slice(0, 14),
          } as CollectionCardData;
        }),
      );

      const nextCollections = settled
        .filter((item): item is PromiseFulfilledResult<CollectionCardData> => item.status === 'fulfilled')
        .map(item => item.value)
        .filter(item => item.movies.length > 0);

      if (isMountedRef.current) {
        setCollections(nextCollections);
      }
    } catch {
      if (isMountedRef.current) {
        setCollections([]);
      }
    } finally {
      if (isMountedRef.current) {
        setCollectionsLoading(false);
      }
    }
  }, [resolveCollectionResponse]);

  const runGlobalSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setGlobalResults([]);
      setResultsLoading(false);
      return;
    }

    setResultsLoading(true);
    try {
      const response = await tmdbApi.searchMovies(trimmed);
      if (!isMountedRef.current) return;
      setGlobalResults(sanitizeMovieList(response.results));
      await saveRecentSearch(trimmed);
    } catch {
      if (!isMountedRef.current) return;
      setGlobalResults([]);
    } finally {
      if (isMountedRef.current) {
        setResultsLoading(false);
      }
    }
  }, [saveRecentSearch]);

  const runDiscovery = useCallback(async (
    title: string,
    subtitle: string,
    resolver: () => Promise<PaginatedResponse<Movie>>,
  ) => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.blur();
    setInputFocused(false);
    setActiveDiscoveryTitle(title);
    setActiveDiscoverySubtitle(subtitle);
    setResultsLoading(true);

    try {
      const response = await resolver();
      if (!isMountedRef.current) return;
      const list = sanitizeMovieList(response.results);
      setDiscoveryResults(list);
      await saveRecentSearch(title);
    } catch {
      if (!isMountedRef.current) return;
      setDiscoveryResults([]);
    } finally {
      if (isMountedRef.current) {
        setResultsLoading(false);
      }
    }
  }, [saveRecentSearch]);

  const buildSuggestions = useCallback(async (term: string) => {
    const trimmed = term.trim();
    const normalized = trimmed.toLowerCase();
    if (normalized.length < 2) {
      setSuggestions([]);
      return;
    }

    const cached = suggestionCacheRef.current.get(normalized);
    if (cached && Date.now() - cached.at < SUGGESTION_CACHE_TTL_MS) {
      setSuggestions(cached.items);
      return;
    }

    const requestId = ++suggestionRequestIdRef.current;
    try {
      const [baseRes, tvRes] = await Promise.allSettled([
        apiClient.get<RawSearchPayload[]>('/movies/search', {
          params: { query: trimmed, limit: 8 },
        }),
        apiClient.get<RawSearchPayload[]>('/movies/search', {
          params: { query: `${trimmed} series`, limit: 5 },
        }),
      ]);

      if (requestId !== suggestionRequestIdRef.current || !isMountedRef.current) {
        return;
      }

      const baseRows = baseRes.status === 'fulfilled' ? toRawRows(baseRes.value.data) : [];
      const tvRows = tvRes.status === 'fulfilled' ? toRawRows(tvRes.value.data) : [];
      const nextSuggestions: SearchSuggestion[] = [];
      const seen = new Set<string>();

      const pushSuggestion = (item: SearchSuggestion): void => {
        const key = `${item.kind}:${item.query.toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        nextSuggestions.push(item);
      };

      const movieTitles: string[] = [];
      baseRows.forEach((row, index) => {
        const title = typeof row.Title === 'string' ? row.Title.trim() : '';
        if (!title) return;
        movieTitles.push(title);
        if (nextSuggestions.length >= 3) return;
        pushSuggestion({
          id: `movie-${title}-${index}`,
          label: title,
          query: title,
          kind: 'movie',
          icon: 'film-outline',
          meta: typeof row.Year === 'string' ? row.Year : 'Movie',
        });
      });

      tvRows.slice(0, 2).forEach((row, index) => {
        const title = typeof row.Title === 'string' ? row.Title.trim() : '';
        if (!title) return;
        pushSuggestion({
          id: `tv-${title}-${index}`,
          label: title,
          query: `${title} series`,
          kind: 'tv',
          icon: 'tv-outline',
          meta: 'TV-oriented',
        });
      });

      const actorCounts = new Map<string, number>();
      baseRows.forEach(row => {
        const actors = typeof row.Actors === 'string' ? row.Actors : '';
        if (!actors) return;
        actors
          .split(',')
          .map(name => name.trim())
          .filter(Boolean)
          .forEach(name => {
            const key = name.toLowerCase();
            actorCounts.set(name, (actorCounts.get(name) || 0) + 1);
            if (key.includes(normalized)) actorCounts.set(name, (actorCounts.get(name) || 0) + 2);
          });
      });

      Array.from(actorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .forEach(([name], index) => {
          pushSuggestion({
            id: `actor-${name}-${index}`,
            label: name,
            query: name,
            kind: 'actor',
            icon: 'person-outline',
            meta: 'Actor',
          });
        });

      const franchiseCounts = new Map<string, number>();
      movieTitles.forEach(title => {
        const token = franchiseToken(title);
        if (!token) return;
        franchiseCounts.set(token, (franchiseCounts.get(token) || 0) + 1);
      });

      Array.from(franchiseCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .forEach(([token], index) => {
          const label = humanizeFranchise(token);
          pushSuggestion({
            id: `franchise-${token}-${index}`,
            label,
            query: label,
            kind: 'franchise',
            icon: 'layers-outline',
            meta: 'Franchise',
          });
        });

      genreCards
        .filter(card => card.name.toLowerCase().includes(normalized))
        .slice(0, 2)
        .forEach((card, index) => {
          pushSuggestion({
            id: `genre-${card.key}-${index}`,
            label: card.name,
            query: card.name,
            kind: 'genre',
            icon: card.icon,
            meta: 'Genre',
          });
        });

      recentSearches
        .filter(item => item.toLowerCase().includes(normalized))
        .slice(0, 2)
        .forEach((item, index) => {
          pushSuggestion({
            id: `recent-${item}-${index}`,
            label: item,
            query: item,
            kind: 'recent',
            icon: 'time-outline',
            meta: 'Recent',
          });
        });

      const finalList = nextSuggestions.slice(0, 10);
      suggestionCacheRef.current.set(normalized, { at: Date.now(), items: finalList });
      setSuggestions(finalList);
    } catch {
      if (!isMountedRef.current) return;
      setSuggestions([]);
    }
  }, [genreCards, recentSearches]);

  const applySearchTerm = useCallback((term: string) => {
    const trimmed = term.trim();
    setQuery(trimmed);
    setInputFocused(false);
    setSuggestions([]);
    setActiveDiscoveryTitle('');
    setActiveDiscoverySubtitle('');
    setDiscoveryResults([]);
    clearTimeout(searchDebounceRef.current);
    clearTimeout(suggestionDebounceRef.current);
    void runGlobalSearch(trimmed);
  }, [runGlobalSearch]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    setActiveDiscoveryTitle('');
    setActiveDiscoverySubtitle('');
    setDiscoveryResults([]);

    const trimmed = text.trim();
    clearTimeout(searchDebounceRef.current);
    clearTimeout(suggestionDebounceRef.current);

    if (!trimmed) {
      setGlobalResults([]);
      setResultsLoading(false);
      setSuggestions([]);
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      void runGlobalSearch(trimmed);
    }, SEARCH_DEBOUNCE_MS);

    suggestionDebounceRef.current = setTimeout(() => {
      void buildSuggestions(trimmed);
    }, SUGGESTION_DEBOUNCE_MS);
  }, [buildSuggestions, runGlobalSearch]);

  const handleSuggestionPress = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.kind === 'genre') {
      const card = genreCards.find(item => item.name.toLowerCase() === suggestion.label.toLowerCase());
      if (card) {
        void runDiscovery(
          `${card.name} Discovery`,
          'Genre-powered TMDB discovery',
          () => tmdbApi.discover({ ...card.discover, sort_by: 'popularity.desc', limit: 30 }),
        );
        return;
      }
    }
    applySearchTerm(suggestion.query);
  }, [applySearchTerm, genreCards, runDiscovery]);

  const handleOpenMovie = useCallback((movie: Movie) => {
    navigation.navigate('MovieDetails', {
      movieId: movie.id,
      imdbId: movie.imdb_id || movie.imdbID,
      movieTitle: movie.title,
      releaseYear: releaseYear(movie.release_date),
      movie,
    });
  }, [navigation]);

  const handleClearContext = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setGlobalResults([]);
    setDiscoveryResults([]);
    setActiveDiscoveryTitle('');
    setActiveDiscoverySubtitle('');
    setInputFocused(false);
    inputRef.current?.blur();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTrendingSignals(),
      fetchGenreCards(),
      fetchCollections(),
    ]);

    const trimmed = query.trim();
    if (trimmed) {
      await runGlobalSearch(trimmed);
    }
    setRefreshing(false);
  }, [fetchCollections, fetchGenreCards, fetchTrendingSignals, query, runGlobalSearch]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadRecentSearches();
    void Promise.all([fetchTrendingSignals(), fetchGenreCards(), fetchCollections()]);

    const timer = setInterval(() => {
      void fetchTrendingSignals();
    }, TREND_REFRESH_MS);

    return () => {
      isMountedRef.current = false;
      clearTimeout(searchDebounceRef.current);
      clearTimeout(suggestionDebounceRef.current);
      clearInterval(timer);
    };
  }, [fetchCollections, fetchGenreCards, fetchTrendingSignals, loadRecentSearches]);

  useEffect(() => {
    if (!route.params?.query) return;
    applySearchTerm(route.params.query);
    navigation.setParams({ query: undefined } as any);
  }, [applySearchTerm, navigation, route.params?.query]);

  const hasQuery = query.trim().length > 0;
  const hasDiscoverySelection = activeDiscoveryTitle.length > 0;
  const showResults = hasQuery || hasDiscoverySelection;
  const activeResults = hasQuery ? globalResults : discoveryResults;
  const featuredMovie = activeResults[0];
  const resultRows = activeResults.slice(1);

  const resultHeaderTitle = hasQuery ? 'Global Search Results' : activeDiscoveryTitle;
  const resultHeaderSubtitle = hasQuery
    ? `${activeResults.length} matches for "${query.trim()}"`
    : activeDiscoverySubtitle;

  const trendingSubtitle = useMemo(() => {
    const currentHour = new Date().getHours();
    const segment = currentHour < 12 ? 'Morning pulse' : currentHour < 18 ? 'Afternoon pulse' : 'Night pulse';
    return `${segment}  |  Live day/week/worldwide signals`;
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)', 'rgba(7,7,9,0)']}
        style={[styles.headerGlow, { height: insets.top + 180 }]}
      />

      <FlatList
        data={showResults ? resultRows : []}
        keyExtractor={item => `result-${item.id}`}
        renderItem={({ item }) => (
          <SearchResultRow movie={item} onPress={handleOpenMovie} />
        )}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={(
          <View style={{ paddingTop: insets.top + 8 }}>
            <View style={styles.headerWrap}>
              <Text style={styles.headerEyebrow} allowFontScaling={false}>
                Cinematic Discovery Engine
              </Text>
              <Text style={styles.headerTitle} allowFontScaling={false}>
                Search
              </Text>
              <Text style={styles.headerSub} allowFontScaling={false}>
                Search movies, TV shows, actors, genres, and franchises with live TMDB-powered discovery.
              </Text>
            </View>

            <View style={styles.searchWrap}>
              <Pressable style={styles.searchBar} onPress={() => inputRef.current?.focus()}>
                <Ionicons
                  name="search"
                  size={18}
                  color={hasQuery ? Colors.accent.crimson : Colors.text.secondary}
                />
                <TextInput
                  ref={inputRef}
                  value={query}
                  onChangeText={handleQueryChange}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={localizedSearch('search.placeholder', 'Search movies, TV, actors, genres, franchises...')}
                  placeholderTextColor={Colors.text.tertiary}
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  selectionColor={Colors.accent.crimson}
                  onSubmitEditing={() => applySearchTerm(query)}
                  allowFontScaling={false}
                />
                {query.length > 0 ? (
                  <Pressable onPress={handleClearContext} style={styles.searchActionBtn}>
                    <Ionicons name="close-circle" size={18} color={Colors.text.secondary} />
                  </Pressable>
                ) : null}
              </Pressable>
            </View>

            {inputFocused && suggestions.length > 0 ? (
              <View style={styles.suggestionWrap}>
                {suggestions.map(item => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSuggestionPress(item)}
                    style={styles.suggestionItem}
                  >
                    <Ionicons name={item.icon} size={14} color={Colors.text.secondary} />
                    <View style={styles.suggestionCopy}>
                      <Text style={styles.suggestionTitle} numberOfLines={1} allowFontScaling={false}>
                        {item.label}
                      </Text>
                      {item.meta ? (
                        <Text style={styles.suggestionMeta} numberOfLines={1} allowFontScaling={false}>
                          {item.meta}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {!showResults ? (
              <View style={styles.discoveryWrap}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle} allowFontScaling={false}>{localizedSearch('search.trending', 'Dynamic Trending Searches')}</Text>
                  <Text style={styles.sectionSubtitle} allowFontScaling={false}>{trendingSubtitle}</Text>
                </View>

                {trendingLoading ? (
                  <View style={styles.trendingSkeletonRow}>
                    {[0, 1, 2].map(index => (
                      <View key={`trending-skeleton-${index}`} style={styles.trendingSkeletonCard} />
                    ))}
                  </View>
                ) : (
                  <FlatList
                    horizontal
                    data={trending}
                    keyExtractor={item => `trending-${item.movie.id}`}
                    renderItem={({ item }) => (
                      <Pressable
                        style={styles.trendingCard}
                        onPress={() => applySearchTerm(item.movie.title)}
                      >
                        <Image
                          source={{ uri: item.movie.backdrop_path || item.movie.poster_path || undefined }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                          transition={200}
                          cachePolicy="memory-disk"
                        />
                        <LinearGradient
                          colors={['rgba(7,7,9,0.12)', 'rgba(7,7,9,0.82)']}
                          style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.trendingTopRow}>
                          <View style={styles.trendingTag}>
                            <Ionicons name="trending-up" size={10} color={Colors.accent.gold} />
                            <Text style={styles.trendingTagText} allowFontScaling={false}>
                              {item.tags[0] || 'Live'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.trendingTitle} numberOfLines={2} allowFontScaling={false}>
                          {item.movie.title}
                        </Text>
                      </Pressable>
                    )}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.trendingRail}
                  />
                )}

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle} allowFontScaling={false}>{localizedSearch('search.genreGrid', 'Genre Discovery Grid')}</Text>
                  <Text style={styles.sectionSubtitle} allowFontScaling={false}>
                    {localizedSearch('search.genreGridSub', 'Tap any genre for real TMDB-powered discovery')}
                  </Text>
                </View>

                {genresLoading ? (
                  <View style={styles.genreGrid}>
                    {[0, 1, 2, 3].map(index => (
                      <View key={`genre-skeleton-${index}`} style={styles.genreSkeletonCard} />
                    ))}
                  </View>
                ) : (
                  <View style={styles.genreGrid}>
                    {genreCards.map(card => (
                      <Pressable
                        key={`genre-${card.key}`}
                        style={styles.genreCard}
                        onPress={() => {
                          void runDiscovery(
                            `${card.name} Discovery`,
                            'Genre-powered TMDB discovery',
                            () => tmdbApi.discover({ ...card.discover, sort_by: 'popularity.desc', limit: 30 }),
                          );
                        }}
                      >
                        <LinearGradient
                          colors={[card.palette[0], card.palette[1]]}
                          style={styles.genreTint}
                        />
                        <View style={styles.genreCollageRow}>
                          {card.movies.slice(0, 3).map((movie, idx) => (
                            <Image
                              key={`${card.key}-${movie.id}-${idx}`}
                              source={{ uri: movie.poster_path || movie.backdrop_path || undefined }}
                              style={styles.genreCollageImage}
                              contentFit="cover"
                            />
                          ))}
                        </View>
                        <LinearGradient
                          colors={['rgba(7,7,9,0.04)', 'rgba(7,7,9,0.75)']}
                          style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.genreCopy}>
                          <Ionicons name={card.icon} size={20} color={Colors.text.primary} />
                          <Text style={styles.genreTitle} numberOfLines={1} allowFontScaling={false}>
                            {card.name}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle} allowFontScaling={false}>{localizedSearch('search.collections', 'Streaming Collections')}</Text>
                  <Text style={styles.sectionSubtitle} allowFontScaling={false}>
                    {localizedSearch('search.collectionsSub', 'Platform-inspired hubs powered by live TMDB data')}
                  </Text>
                </View>

                {collectionsLoading ? (
                  <View style={styles.collectionGrid}>
                    {[0, 1, 2, 3].map(index => (
                      <View key={`collection-skeleton-${index}`} style={styles.collectionSkeletonCard} />
                    ))}
                  </View>
                ) : (
                  <View style={styles.collectionGrid}>
                    {collections.map(collection => {
                      const lead = collection.movies[0];
                      const localTitle = localizedSearch(`collection.${collection.id}.title`, collection.title);
                      const localSubtitle = localizedSearch(`collection.${collection.id}.subtitle`, collection.subtitle);
                      return (
                        <Pressable
                          key={collection.id}
                          style={styles.collectionCard}
                          onPress={() => {
                            void runDiscovery(
                              localTitle,
                              localSubtitle,
                              () => resolveCollectionResponse(collection),
                            );
                          }}
                        >
                          {lead ? (
                            <Image
                              source={{ uri: lead.backdrop_path || lead.poster_path || undefined }}
                              style={StyleSheet.absoluteFill}
                              contentFit="cover"
                            />
                          ) : null}
                          <LinearGradient
                            colors={['rgba(7,7,9,0.1)', 'rgba(7,7,9,0.82)']}
                            style={StyleSheet.absoluteFill}
                          />
                          <View style={styles.collectionCopy}>
                            <View style={styles.collectionIconBadge}>
                              <Ionicons name={collection.icon} size={14} color={Colors.accent.gold} />
                            </View>
                            <Text style={styles.collectionTitle} numberOfLines={2} allowFontScaling={false}>
                              {localTitle}
                            </Text>
                            <Text style={styles.collectionSubtitle} numberOfLines={2} allowFontScaling={false}>
                              {localSubtitle}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {recentSearches.length > 0 ? (
                  <View>
                    <View style={styles.sectionHeaderRow}>
                      <View>
                        <Text style={styles.sectionTitle} allowFontScaling={false}>{localizedSearch('search.recent', 'Recently Searched')}</Text>
                        <Text style={styles.sectionSubtitle} allowFontScaling={false}>
                          {localizedSearch('search.recentSub', 'Jump back into your last discovery paths')}
                        </Text>
                      </View>
                      <Pressable onPress={clearRecentSearches}>
                        <Text style={styles.clearText} allowFontScaling={false}>{localizedSearch('search.clear', 'Clear')}</Text>
                      </Pressable>
                    </View>
                    <View style={styles.recentWrap}>
                      {recentSearches.map(item => (
                        <Pressable
                          key={`recent-chip-${item}`}
                          style={styles.recentChip}
                          onPress={() => applySearchTerm(item)}
                        >
                          <Ionicons name="time-outline" size={12} color={Colors.text.secondary} />
                          <Text style={styles.recentText} numberOfLines={1} allowFontScaling={false}>
                            {item}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.resultsHeaderWrap}>
                <View style={styles.resultsHeaderTop}>
                  <View>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>{resultHeaderTitle}</Text>
                    <Text style={styles.sectionSubtitle} allowFontScaling={false}>{resultHeaderSubtitle}</Text>
                  </View>
                  <Pressable onPress={handleClearContext} style={styles.backToDiscoveryBtn}>
                    <Ionicons name="compass-outline" size={14} color={Colors.text.secondary} />
                    <Text style={styles.backToDiscoveryText} allowFontScaling={false}>
                      {localizedSearch('search.discover', 'Discover')}
                    </Text>
                  </Pressable>
                </View>

                {resultsLoading ? (
                  <View style={styles.resultsLoadingWrap}>
                    <ActivityIndicator size="small" color={Colors.accent.crimson} />
                    <Text style={styles.resultsLoadingText} allowFontScaling={false}>
                      {localizedSearch('search.building', 'Building your cinematic results...')}
                    </Text>
                  </View>
                ) : null}

                {!resultsLoading && featuredMovie ? (
                  <Pressable style={styles.featuredResultCard} onPress={() => handleOpenMovie(featuredMovie)}>
                    <Image
                      source={{ uri: featuredMovie.backdrop_path || featuredMovie.poster_path || undefined }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={220}
                      cachePolicy="memory-disk"
                    />
                    <LinearGradient
                      colors={['rgba(7,7,9,0.15)', 'rgba(7,7,9,0.88)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.featuredCopy}>
                      <Text style={styles.featuredEyebrow} allowFontScaling={false}>{localizedSearch('search.featured', 'Featured Match')}</Text>
                      <Text style={styles.featuredTitle} numberOfLines={2} allowFontScaling={false}>
                        {featuredMovie.title}
                      </Text>
                      <Text style={styles.featuredMeta} allowFontScaling={false}>
                        {resultMetaLine(featuredMovie)}
                      </Text>
                      <Text style={styles.featuredOverview} numberOfLines={2} allowFontScaling={false}>
                        {featuredMovie.overview || 'No overview available.'}
                      </Text>
                    </View>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          showResults && !resultsLoading ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={40} color={Colors.text.tertiary} />
              <Text style={styles.emptyTitle} allowFontScaling={false}>{localizedSearch('search.noMatch', 'No cinematic matches found')}</Text>
              <Text style={styles.emptySubtitle} allowFontScaling={false}>
                {localizedSearch('search.noMatchSub', 'Try another title, actor, franchise, or genre keyword.')}
              </Text>
            </View>
          ) : null
        }
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.accent.crimson}
          />
        )}
        initialNumToRender={7}
        maxToRenderPerBatch={7}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.void,
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 124,
  },
  headerWrap: {
    paddingHorizontal: 20,
    gap: 4,
  },
  headerEyebrow: {
    color: Colors.text.tertiary,
    fontSize: 10,
    letterSpacing: 1.15,
    textTransform: 'uppercase',
    fontFamily: Typography.fontMedium,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 34,
    letterSpacing: -0.6,
    fontFamily: Typography.fontDisplay,
  },
  headerSub: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Typography.fontPrimary,
  },
  searchWrap: {
    marginTop: 14,
    paddingHorizontal: 20,
  },
  searchBar: {
    height: 52,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(20,20,29,0.78)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 14,
    fontFamily: Typography.fontPrimary,
  },
  searchActionBtn: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionWrap: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    overflow: 'hidden',
    backgroundColor: 'rgba(14,14,22,0.98)',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  suggestionCopy: {
    flex: 1,
  },
  suggestionTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontFamily: Typography.fontPrimary,
  },
  suggestionMeta: {
    marginTop: 1,
    color: Colors.text.tertiary,
    fontSize: 10,
    fontFamily: Typography.fontMedium,
  },
  discoveryWrap: {
    marginTop: 24,
    gap: 22,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    gap: 2,
  },
  sectionHeaderRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 20,
    letterSpacing: -0.25,
    fontFamily: Typography.fontDisplay,
  },
  sectionSubtitle: {
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Typography.fontPrimary,
  },
  trendingRail: {
    paddingHorizontal: 20,
    gap: 10,
  },
  trendingCard: {
    width: 164,
    height: 186,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
  },
  trendingTopRow: {
    position: 'absolute',
    top: 9,
    left: 9,
    right: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendingTag: {
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(240,180,41,0.45)',
    backgroundColor: 'rgba(7,7,9,0.78)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  trendingTagText: {
    color: Colors.accent.gold,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.55,
    fontFamily: Typography.fontSemiBold,
  },
  trendingTitle: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    color: Colors.text.primary,
    fontSize: 13,
    lineHeight: 17,
    fontFamily: Typography.fontSemiBold,
  },
  trendingSkeletonRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
  },
  trendingSkeletonCard: {
    width: 164,
    height: 186,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  genreGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: 160,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    overflow: 'hidden',
    backgroundColor: Colors.bg.surface,
  },
  genreTint: {
    ...StyleSheet.absoluteFillObject,
  },
  genreCollageRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
    height: 62,
    opacity: 0.65,
  },
  genreCollageImage: {
    flex: 1,
    borderRadius: Radius.sm,
  },
  genreCopy: {
    position: 'absolute',
    left: 11,
    right: 11,
    bottom: 11,
    gap: 5,
  },
  genreTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontFamily: Typography.fontSemiBold,
  },
  genreSkeletonCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: 160,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  collectionGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  collectionCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: 156,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    overflow: 'hidden',
    backgroundColor: Colors.bg.surface,
  },
  collectionCopy: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    gap: 4,
  },
  collectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(240,180,41,0.4)',
    backgroundColor: 'rgba(7,7,9,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    lineHeight: 16,
    fontFamily: Typography.fontSemiBold,
  },
  collectionSubtitle: {
    color: Colors.text.secondary,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: Typography.fontPrimary,
  },
  collectionSkeletonCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: 156,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  recentWrap: {
    marginTop: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    maxWidth: SCREEN_WIDTH * 0.44,
    minHeight: 34,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
  },
  recentText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontFamily: Typography.fontPrimary,
    flexShrink: 1,
  },
  clearText: {
    color: Colors.accent.crimson,
    fontSize: 12,
    fontFamily: Typography.fontSemiBold,
  },
  resultsHeaderWrap: {
    marginTop: 22,
    paddingHorizontal: 20,
    gap: 12,
  },
  resultsHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  backToDiscoveryBtn: {
    height: 30,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backToDiscoveryText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontFamily: Typography.fontMedium,
  },
  featuredResultCard: {
    height: 238,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: Colors.bg.surface,
  },
  featuredCopy: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    gap: 4,
  },
  featuredEyebrow: {
    color: Colors.text.tertiary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontFamily: Typography.fontMedium,
  },
  featuredTitle: {
    color: Colors.text.primary,
    fontSize: 23,
    lineHeight: 27,
    letterSpacing: -0.35,
    fontFamily: Typography.fontDisplay,
  },
  featuredMeta: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontFamily: Typography.fontMedium,
  },
  featuredOverview: {
    color: '#D6D8E8',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Typography.fontPrimary,
  },
  resultsLoadingWrap: {
    minHeight: 58,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  resultsLoadingText: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontFamily: Typography.fontPrimary,
  },
  resultCard: {
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: Colors.bg.surface,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 138,
  },
  resultPoster: {
    width: 95,
    minHeight: 138,
    backgroundColor: Colors.bg.raised,
  },
  resultBody: {
    flex: 1,
    paddingHorizontal: 11,
    paddingVertical: 10,
    gap: 6,
  },
  resultTitle: {
    color: Colors.text.primary,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: Typography.fontSemiBold,
  },
  resultMeta: {
    color: Colors.text.tertiary,
    fontSize: 10,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    fontFamily: Typography.fontMedium,
  },
  resultOverview: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Typography.fontPrimary,
  },
  emptyWrap: {
    marginTop: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: Colors.text.primary,
    fontSize: 17,
    fontFamily: Typography.fontSemiBold,
  },
  emptySubtitle: {
    color: Colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: Typography.fontPrimary,
  },
});

export { SearchScreen };
export default SearchScreen;
