import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { MovieCard } from '../../components/movie/MovieCard';
import omdbApi from '../../services/omdbApi';
import { movieService } from '../../services/api/movieService';
import { Movie } from '../../types';

const { width } = Dimensions.get('window');

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10749, name: 'Romance' },
  { id: 16, name: 'Animation' },
  { id: 12, name: 'Adventure' },
  { id: 80, name: 'Crime' },
  { id: 14, name: 'Fantasy' },
  { id: 9648, name: 'Mystery' },
];

const TRENDING_SEARCHES = [
  'Oppenheimer', 'Dune: Part Two', 'The Godfather',
  'Inception', 'Interstellar', 'Parasite',
];

// Pulsating Skeleton Card for premium search UX loading states
const SkeletonCard: React.FC<{ width?: number; height?: number }> = ({ width: w = 140, height: h = 210 }) => {
  const opacity = useSharedValue(0.4);
  
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width: w, height: h, borderRadius: Radius.lg, backgroundColor: Colors.surfaceElevated, marginBottom: Spacing.md }, style]}
    />
  );
};

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const searchInputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const [isLoadingGenre, setIsLoadingGenre] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [genreError, setGenreError] = useState<string | null>(null);

  const searchWidth = useSharedValue(width - Spacing.xl * 2);
  const cancelOpacity = useSharedValue(0);

  const searchBarStyle = useAnimatedStyle(() => ({
    width: searchWidth.value,
  }));

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: cancelOpacity.value,
  }));

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        let mappedResults: Movie[] = [];
        try {
          const data = await movieService.search(text.trim());
          mappedResults = data.map((m: any, index: number) => ({
            id: m.imdbID ? parseInt(m.imdbID.replace(/[^0-9]/g, ''), 10) || index + 1 : index + 1,
            title: m.Title, original_title: m.Title,
            overview: m.Plot || 'AI curated recommendation.',
            poster_path: m.Poster && m.Poster !== 'N/A' ? m.Poster : null,
            backdrop_path: m.Poster && m.Poster !== 'N/A' ? m.Poster : null,
            release_date: m.Year || '2024',
            vote_average: parseFloat(m.imdbRating || '8.0'),
            vote_count: 180, popularity: 88, genre_ids: [],
            adult: false, original_language: 'en', video: false,
          }));
        } catch {
          const omdbResults = await omdbApi.searchMovies(text.trim());
          mappedResults = omdbResults.results;
        }
        setResults(mappedResults);
      } catch (err) {
        console.error('Search error:', err);
        setSearchError('Unable to search. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    searchWidth.value = withSpring(width - Spacing.xl * 2 - 70, { damping: 15 });
    cancelOpacity.value = withTiming(1, { duration: 200 });
  };

  const handleCancel = () => {
    setIsFocused(false);
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setSearchError(null);
    searchInputRef.current?.blur();
    searchWidth.value = withSpring(width - Spacing.xl * 2, { damping: 15 });
    cancelOpacity.value = withTiming(0, { duration: 200 });
  };

  const handleGenreSelect = async (genreId: number) => {
    if (selectedGenre === genreId) {
      setSelectedGenre(null);
      setGenreMovies([]);
      setGenreError(null);
      return;
    }
    setSelectedGenre(genreId);
    setGenreError(null);
    setIsLoadingGenre(true);
    try {
      const data = await omdbApi.getByGenre(genreId);
      setGenreMovies(data.results);
    } catch (err) {
      setGenreMovies([]);
      setGenreError('Failed to fetch movies for this genre. Please try again.');
    } finally {
      setIsLoadingGenre(false);
    }
  };

  const retrySearch = () => {
    handleSearch(query);
  };

  const retryGenreFetch = () => {
    if (selectedGenre !== null) {
      handleGenreSelect(selectedGenre);
    }
  };

  const navigateToMovie = (movie: Movie) => {
    navigation.navigate('MovieDetails', { movieId: movie.id });
  };

  const showGenreSection = !query && selectedGenre && genreMovies.length > 0;
  const showResults = hasSearched && results.length > 0;
  const showEmpty = hasSearched && !isSearching && !searchError && results.length === 0;
  const showDefault = !hasSearched && !selectedGenre;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <Animated.View style={[styles.searchBarWrapper, searchBarStyle]}>
            <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
              <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search movies, actors, directors..."
                placeholderTextColor={Colors.textMuted}
                value={query}
                onChangeText={handleSearch}
                onFocus={handleFocus}
                returnKeyType="search"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <Pressable onPress={() => handleSearch('')} style={styles.clearBtn} hitSlop={8}>
                  <Ionicons name="close" size={14} color={Colors.white} />
                </Pressable>
              )}
            </View>
          </Animated.View>
          <Animated.View style={[styles.cancelWrapper, cancelStyle]}>
            <Pressable onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Genre Filter Chips */}
        {!isFocused && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreRow}
          >
            {GENRES.map(genre => (
              <Pressable
                key={genre.id}
                onPress={() => handleGenreSelect(genre.id)}
                style={[styles.genreChip, selectedGenre === genre.id && styles.genreChipSelected]}
              >
                <Text style={[styles.genreLabel, selectedGenre === genre.id && styles.genreLabelSelected]}>
                  {genre.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Content */}
      {isSearching && (
        <View style={styles.resultsGrid}>
          <Text style={styles.resultsHeader}>Searching cinematic database...</Text>
          <View style={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonCard 
                key={idx} 
                width={(width - Spacing.xl * 2 - Spacing.md) / 2} 
                height={((width - Spacing.xl * 2 - Spacing.md) / 2) * 1.5} 
              />
            ))}
          </View>
        </View>
      )}

      {searchError && !isSearching && (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.primary} />
          <Text style={styles.errorTitle}>Search Failed</Text>
          <Text style={styles.errorSubtitle}>{searchError}</Text>
          <Pressable style={styles.retryBtn} onPress={retrySearch}>
            <Text style={styles.retryBtnText}>Retry Search</Text>
          </Pressable>
        </View>
      )}

      {showResults && !isSearching && !searchError && (
        <FlatList
          data={results}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.resultsGrid}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultsHeader}>{results.length} results for "{query}"</Text>
          }
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPress={navigateToMovie}
              width={(width - Spacing.xl * 2 - Spacing.md) / 2}
            />
          )}
        />
      )}

      {showEmpty && (
        <View style={styles.emptyContainer}>
          <Ionicons name="film-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>Try searching for another movie, actor, or genre</Text>
        </View>
      )}

      {isLoadingGenre && (
        <View style={styles.resultsGrid}>
          <Text style={styles.resultsHeader}>Loading genre selection...</Text>
          <View style={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonCard 
                key={idx} 
                width={(width - Spacing.xl * 2 - Spacing.md) / 2} 
                height={((width - Spacing.xl * 2 - Spacing.md) / 2) * 1.5} 
              />
            ))}
          </View>
        </View>
      )}

      {genreError && !isLoadingGenre && (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.primary} />
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorSubtitle}>{genreError}</Text>
          <Pressable style={styles.retryBtn} onPress={retryGenreFetch}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {showGenreSection && !isLoadingGenre && !genreError && (
        <FlatList
          data={genreMovies}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.resultsGrid}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultsHeader}>
              {GENRES.find(g => g.id === selectedGenre)?.name} Movies
            </Text>
          }
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPress={navigateToMovie}
              width={(width - Spacing.xl * 2 - Spacing.md) / 2}
            />
          )}
        />
      )}

      {showDefault && (
        <ScrollView
          contentContainerStyle={styles.defaultContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Trending Searches</Text>
          <View style={styles.trendingGrid}>
            {TRENDING_SEARCHES.map(term => (
              <Pressable
                key={term}
                onPress={() => { handleSearch(term); searchInputRef.current?.focus(); setQuery(term); }}
                style={styles.trendingChip}
              >
                <Text style={styles.trendingText}>{term}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Browse by Genre</Text>
          <View style={styles.genreGrid}>
            {GENRES.map(genre => (
              <Pressable
                key={genre.id}
                onPress={() => handleGenreSelect(genre.id)}
                style={styles.genreGridCard}
              >
                <LinearGradient
                  colors={['rgba(230,57,70,0.2)', 'rgba(10,10,15,0.9)']}
                  style={styles.genreGridGradient}
                >
                  <Text style={styles.genreGridName}>{genre.name}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchBarWrapper: {},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 46,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchBarFocused: { borderColor: Colors.primary },
  searchIcon: { fontSize: 15 }, // compat
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: { color: Colors.white, fontSize: 10, fontFamily: 'Inter_700Bold' },
  cancelWrapper: { position: 'absolute', right: Spacing.xl },
  cancelText: { color: Colors.primary, fontSize: Typography.base, fontFamily: 'Inter_600SemiBold' },
  genreRow: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, paddingBottom: Spacing.sm },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  genreChipSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  genreEmoji: { fontSize: 13 }, // compat
  genreLabel: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: 'Inter_500Medium' },
  genreLabelSelected: { color: Colors.primary },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { color: Colors.textSecondary, fontSize: Typography.base, fontFamily: 'Inter_400Regular' },
  resultsGrid: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  columnWrapper: { gap: Spacing.md, marginBottom: Spacing.md },
  resultsHeader: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_400Regular',
    marginBottom: Spacing.base,
    marginTop: Spacing.sm,
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing['3xl'], marginTop: Spacing['3xl'] },
  emptyEmoji: { fontSize: 48 }, // compat
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.xl, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  emptySubtitle: { color: Colors.textSecondary, fontSize: Typography.base, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: Typography.base * 1.5 },
  defaultContent: { paddingHorizontal: Spacing.xl, paddingBottom: 100, paddingTop: Spacing.sm },
  sectionLabel: { color: Colors.textPrimary, fontSize: Typography.base, fontFamily: 'Poppins_600SemiBold', marginBottom: Spacing.md },
  trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  trendingChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trendingText: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: 'Inter_500Medium' },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  genreGridCard: {
    width: (width - Spacing.xl * 2 - Spacing.sm * 2) / 3,
    height: 80,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  genreGridGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  genreGridEmoji: { fontSize: 24 },
  genreGridName: { color: Colors.textPrimary, fontSize: Typography.xs, fontFamily: 'Inter_600SemiBold' },
  
  // Premium Error UI styling
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.md,
    marginTop: Spacing['3xl'],
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  errorSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: Typography.sm * 1.5,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
    ...Shadows.md,
  },
  retryBtnText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontFamily: 'Inter_600SemiBold',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default SearchScreen;
