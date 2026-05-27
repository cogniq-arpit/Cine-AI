/**
 * CineAI V3 — SearchScreen
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, Dimensions, ActivityIndicator, StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Radius, Motion, Spacing } from '../../constants/theme';
import tmdbApi from '../../services/tmdbApi';
import type { Movie, RootStackParamList } from '../../types';

const { width: W } = Dimensions.get('window');
type SearchNav = NativeStackNavigationProp<RootStackParamList>;

const TRENDING = ['Oppenheimer', 'Dune Part Two', 'Poor Things', 'Past Lives', 'The Holdovers', 'May December'];
const GENRES = [
  { id: 'drama', label: 'Drama', icon: 'heart-outline', color: Colors.accent.crimson },
  { id: 'thriller', label: 'Thriller', icon: 'flash-outline', color: Colors.accent.electric },
  { id: 'comedy', label: 'Comedy', icon: 'happy-outline', color: Colors.accent.gold },
  { id: 'scifi', label: 'Sci-Fi', icon: 'planet-outline', color: '#4CC9F0' },
  { id: 'horror', label: 'Horror', icon: 'skull-outline', color: '#8B5CF6' },
  { id: 'action', label: 'Action', icon: 'bonfire-outline', color: '#F97316' },
];

const SearchResultCard: React.FC<{ movie: Movie; onPress: () => void }> = ({ movie, onPress }) => {
  // poster_path from mapTmdbToMovie is always a full URL (Unsplash or TMDB CDN fallback)
  const poster = movie.poster_path || null;


  return (
    <Pressable style={cardSt.card} onPress={onPress}>
      <Image source={poster ? { uri: poster } : undefined} style={cardSt.poster} contentFit="cover" />
      <View style={cardSt.info}>
        <Text style={cardSt.title} numberOfLines={2} allowFontScaling={false}>{movie.title}</Text>
        <View style={cardSt.metaRow}>
          {movie.release_date && (
            <Text style={cardSt.meta} allowFontScaling={false}>{new Date(movie.release_date).getFullYear()}</Text>
          )}
          {movie.vote_average > 0 && (
            <View style={cardSt.ratingRow}>
              <Ionicons name="star" size={10} color={Colors.accent.gold} />
              <Text style={cardSt.rating} allowFontScaling={false}>{movie.vote_average.toFixed(1)}</Text>
            </View>
          )}
        </View>
        {movie.overview ? (
          <Text style={cardSt.overview} numberOfLines={3} allowFontScaling={false}>{movie.overview}</Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const cardSt = StyleSheet.create({
  card: { flexDirection: 'row', gap: 14, paddingHorizontal: 20, marginBottom: 16 },
  poster: { width: 80, height: 120, borderRadius: Radius.md, backgroundColor: Colors.bg.surface },
  info: { flex: 1, justifyContent: 'flex-start', paddingTop: 4 },
  title: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.accent.gold },
  overview: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary, lineHeight: 18 },
});

export const SearchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SearchNav>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const barWidth = useSharedValue(W - 40);
  const cancelOpacity = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({ width: barWidth.value }));
  const cancelStyle = useAnimatedStyle(() => ({ opacity: cancelOpacity.value }));

  const handleFocus = () => {
    setFocused(true);
    barWidth.value = withSpring(W - 100, Motion.springs.gentle);
    cancelOpacity.value = withTiming(1, { duration: 200 });
  };

  const handleCancel = () => {
    setFocused(false);
    setQuery('');
    setResults([]);
    inputRef.current?.blur();
    barWidth.value = withSpring(W - 40, Motion.springs.gentle);
    cancelOpacity.value = withTiming(0, { duration: 200 });
  };

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await tmdbApi.searchMovies(q.trim());
        setResults(r.results);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 400);
  }, []);

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.void} />

      {/* Search bar row */}
      <View style={st.barRow}>
        <Animated.View style={[st.barWrap, barStyle]}>
          <Ionicons name="search" size={18} color={query ? Colors.accent.crimson : Colors.text.tertiary} style={st.searchIcon} />
          <TextInput
            ref={inputRef}
            style={st.input}
            value={query}
            onChangeText={handleSearch}
            onFocus={handleFocus}
            placeholder="Search films, directors, actors..."
            placeholderTextColor={Colors.text.tertiary}
            returnKeyType="search"
            selectionColor={Colors.accent.crimson}
            allowFontScaling={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => handleSearch('')} style={st.clearBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.text.tertiary} />
            </Pressable>
          )}
        </Animated.View>

        <Animated.View style={cancelStyle}>
          <Pressable onPress={handleCancel} style={st.cancelBtn}>
            <Ionicons name="close-outline" size={16} color={Colors.accent.crimson} />
            <Text style={st.cancelText} allowFontScaling={false}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>

      {!query ? (
        /* Pre-search state */
        <FlatList
          ListHeaderComponent={
            <>
              {/* Trending */}
              <View style={st.section}>
                <Text style={st.sectionTitle} allowFontScaling={false}>Trending Searches</Text>
                <View style={st.trendingList}>
                  {TRENDING.map(t => (
                    <Pressable key={t} style={st.trendingChip} onPress={() => handleSearch(t)}>
                      <Ionicons name="trending-up" size={13} color={Colors.accent.crimson} />
                      <Text style={st.trendingText} allowFontScaling={false}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Genres */}
              <View style={st.section}>
                <Text style={st.sectionTitle} allowFontScaling={false}>Browse Genres</Text>
                <View style={st.genreGrid}>
                  {GENRES.map(g => (
                    <Pressable
                      key={g.id}
                      style={[st.genreCard, { borderColor: `${g.color}40` }]}
                      onPress={() => handleSearch(g.label)}
                    >
                      <Ionicons name={g.icon as any} size={22} color={g.color} />
                      <Text style={st.genreLabel} allowFontScaling={false}>{g.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          }
          data={[]}
          renderItem={() => null}
          showsVerticalScrollIndicator={false}
        />
      ) : loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={Colors.accent.crimson} />
          <Text style={st.searchingText} allowFontScaling={false}>Searching...</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={st.center}>
          <Ionicons name="search-outline" size={48} color={Colors.text.tertiary} />
          <Text style={st.emptyTitle} allowFontScaling={false}>No results found</Text>
          <Text style={st.emptySubtitle} allowFontScaling={false}>
            Try a different title, director, or actor
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={m => String(m.id)}
          renderItem={({ item }) => (
            <SearchResultCard
              movie={item}
              onPress={() => navigation.navigate('MovieDetails', { movieId: item.id })}
            />
          )}
          contentContainerStyle={st.resultsList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={st.resultCount} allowFontScaling={false}>
              {results.length} results for "{query}"
            </Text>
          }
        />
      )}
    </View>
  );
};

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.void },
  barRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 12, marginBottom: 20, gap: 8 },
  barWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg.raised, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.glass.border,
    paddingHorizontal: 14, height: 48,
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text.primary },
  clearBtn: { padding: 4 },
  cancelBtn: { paddingHorizontal: 4, height: 48, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 4 },
  cancelText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.accent.crimson },
  section: { marginBottom: 28, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 14 },
  trendingList: { gap: 8 },
  trendingChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  trendingText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genreCard: {
    width: (W - 50) / 2, paddingVertical: 18, paddingHorizontal: 16,
    backgroundColor: Colors.bg.raised, borderRadius: Radius.lg,
    borderWidth: 1, alignItems: 'flex-start', gap: 10,
  },
  genreLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  searchingText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, textAlign: 'center' },
  resultsList: { paddingBottom: 100 },
  resultCount: { paddingHorizontal: 20, paddingBottom: 16, fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
});

export default SearchScreen;
