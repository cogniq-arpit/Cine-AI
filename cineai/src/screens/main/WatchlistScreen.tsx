import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useWatchlistStore } from '../../store/watchlistStore';
import { Movie } from '../../types';
import { getPosterUrl } from '../../services/omdbApi';

const { width } = Dimensions.get('window');
const CARD_W = (width - Spacing.xl * 2 - Spacing.md) / 2;

export const WatchlistScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { items, isLoading, loadWatchlist, removeFromWatchlist } = useWatchlistStore();

  useEffect(() => {
    loadWatchlist();
  }, []);

  const navigateToMovie = (movie: Movie) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('MovieDetails', { movieId: movie.id });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Watchlist</Text>
          <Text style={styles.count}>{items.length} films</Text>
        </View>
      </SafeAreaView>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={56} color={Colors.border} />
          <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add movies you want to watch and they'll appear here. Ask Cine AI for recommendations!
          </Text>
          <Pressable
            onPress={() => navigation.navigate('AIChat')}
            style={styles.aiBtn}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiBtnGradient}
            >
              <Ionicons name="sparkles" size={16} color={Colors.white} />
              <Text style={styles.aiBtnText}>Ask Cine AI</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigateToMovie(item.movie_data)}
              style={styles.card}
            >
              <Image
                source={{ uri: getPosterUrl(item.movie_data.poster_path) }}
                style={styles.poster}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(10,10,15,0.9)']}
                style={styles.cardGradient}
              />
              {/* Rating badge */}
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={10} color={Colors.gold} />
                <Text style={styles.ratingText}>{item.movie_data.vote_average?.toFixed(1)}</Text>
              </View>
              {/* Remove button */}
              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  removeFromWatchlist(item.movie_id);
                }}
                style={styles.removeBtn}
                hitSlop={12}
              >
                <Ionicons name="close" size={14} color={Colors.white} />
              </Pressable>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.movie_data.title}</Text>
                <Text style={styles.cardYear}>{item.movie_data.release_date?.split('-')[0]}</Text>
                <Text style={styles.addedAt}>Added {new Date(item.added_at).toLocaleDateString()}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: Typography['3xl'],
    fontFamily: 'Poppins_700Bold',
    color: Colors.textPrimary,
  },
  count: {
    fontSize: Typography.sm,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.sm }, // compat
  emptyTitle: {
    fontSize: Typography.xl,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.base * 1.6,
  },
  aiBtn: { marginTop: Spacing.md, width: '100%', borderRadius: Radius.lg, overflow: 'hidden' },
  aiBtnGradient: { paddingVertical: Spacing.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  aiBtnText: { color: Colors.white, fontSize: Typography.base, fontFamily: 'Inter_600SemiBold' },
  grid: { padding: Spacing.xl, paddingBottom: 100 },
  row: { gap: Spacing.md, marginBottom: Spacing.md },
  card: {
    width: CARD_W,
    height: CARD_W * 1.6,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    ...Shadows.md,
  },
  poster: { ...StyleSheet.absoluteFillObject },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  ratingText: { color: Colors.gold, fontSize: Typography.xs, fontFamily: 'Inter_600SemiBold' },
  removeBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: Colors.white, fontSize: Typography.xs, fontFamily: 'Inter_700Bold' }, // compat
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  cardTitle: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 1,
  },
  cardYear: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontFamily: 'Inter_400Regular',
  },
  addedAt: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});

export default WatchlistScreen;
