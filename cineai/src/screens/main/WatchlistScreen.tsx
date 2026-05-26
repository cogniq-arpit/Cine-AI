/**
 * CineAI V3 — WatchlistScreen
 */
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, StatusBar, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Radius, Motion } from '../../constants/theme';
import { useWatchlistStore } from '../../store/watchlistStore';
import type { WatchlistItem, RootStackParamList } from '../../types';

const { width: W } = Dimensions.get('window');
type WNav = NativeStackNavigationProp<RootStackParamList>;

const WatchlistCard: React.FC<{
  item: WatchlistItem;
  onPress: () => void;
  onRemove: () => void;
}> = ({ item, onPress, onRemove }) => {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const movie = item.movie_data;
  // poster_path from mapTmdbToMovie is always a full URL (Unsplash or TMDB CDN fallback)
  const poster = movie.poster_path || null;


  return (
    <Animated.View style={[st.cardWrap, cardStyle]}>
      <Pressable
        style={st.card}
        onPressIn={() => { scale.value = withSpring(0.97, Motion.springs.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, Motion.springs.bounce); }}
        onPress={onPress}
      >
        {/* Poster */}
        <View style={st.posterWrap}>
          <Image
            source={poster ? { uri: poster } : undefined}
            style={st.poster}
            contentFit="cover"
          />
        </View>

        {/* Info */}
        <View style={st.info}>
          <Text style={st.title} numberOfLines={2} allowFontScaling={false}>
            {movie.title}
          </Text>
          <View style={st.metaRow}>
            {movie.release_date && (
              <Text style={st.meta} allowFontScaling={false}>
                {new Date(movie.release_date).getFullYear()}
              </Text>
            )}
            {movie.vote_average > 0 && (
              <View style={st.ratingRow}>
                <Ionicons name="star" size={10} color={Colors.accent.gold} />
                <Text style={st.rating} allowFontScaling={false}>
                  {movie.vote_average.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          {movie.overview ? (
            <Text style={st.overview} numberOfLines={3} allowFontScaling={false}>
              {movie.overview}
            </Text>
          ) : null}
          <Text style={st.addedDate} allowFontScaling={false}>
            Added {new Date(item.added_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Remove button */}
        <Pressable style={st.removeBtn} onPress={onRemove} hitSlop={8}>
          <Ionicons name="bookmark" size={20} color={Colors.accent.crimson} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

const EmptyWatchlist: React.FC = () => (
  <View style={st.empty}>
    <View style={st.emptyOrb}>
      <Ionicons name="bookmark-outline" size={36} color={Colors.accent.crimson} />
    </View>
    <Text style={st.emptyTitle} allowFontScaling={false}>Your watchlist is empty</Text>
    <Text style={st.emptySub} allowFontScaling={false}>
      Save films from the Home or Search screen to build your personal collection.
    </Text>
  </View>
);

export const WatchlistScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WNav>();
  const { items, loadWatchlist, removeFromWatchlist } = useWatchlistStore();

  useEffect(() => { loadWatchlist(); }, []);

  const handleRemove = (movieId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    removeFromWatchlist(movieId);
  };

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.void} />

      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.headerLabel} allowFontScaling={false}>Your Collection</Text>
          <Text style={st.headerTitle} allowFontScaling={false}>Watchlist</Text>
        </View>
        <View style={st.headerBadge}>
          <Text style={st.headerCount} allowFontScaling={false}>{items.length}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <EmptyWatchlist />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <WatchlistCard
              item={item}
              onPress={() => navigation.navigate('MovieDetails', { movieId: item.movie_id })}
              onRemove={() => handleRemove(item.movie_id)}
            />
          )}
          contentContainerStyle={st.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={st.separator} />}
        />
      )}
    </View>
  );
};

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.void },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
  },
  headerLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.tertiary, letterSpacing: 1.5, textTransform: 'uppercase' },
  headerTitle: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginTop: 4 },
  headerBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accent.crimsonMuted, borderWidth: 1, borderColor: `${Colors.accent.crimson}40`,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCount: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: Colors.accent.crimson },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  separator: { height: 1, backgroundColor: Colors.glass.border, marginVertical: 8 },
  cardWrap: {},
  card: {
    flexDirection: 'row', gap: 14, paddingVertical: 12,
    backgroundColor: Colors.bg.void,
  },
  posterWrap: { width: 78, height: 116, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.bg.surface },
  poster: { width: 78, height: 116 },
  info: { flex: 1, justifyContent: 'flex-start' },
  title: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.accent.gold },
  overview: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary, lineHeight: 17, marginBottom: 6 },
  addedDate: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary },
  removeBtn: { paddingTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 40 },
  emptyOrb: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.accent.crimsonMuted, borderWidth: 1, borderColor: `${Colors.accent.crimson}40`,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, textAlign: 'center' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, textAlign: 'center', lineHeight: 22 },
});

export default WatchlistScreen;
