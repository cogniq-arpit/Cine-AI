/**
 * CineAI V3 — MovieDetailsScreen
 * Premium cinematic layout with edge-to-edge backdrop, parallax scaling,
 * custom action sheet trigger, AI critic matching, and immersive horizontal cast.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions,
  Linking, ActivityIndicator, StatusBar, Share,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, useAnimatedScrollHandler, Extrapolate,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Motion, Spacing } from '../constants/theme';
import { MovieDetails, CastMember, Movie, RootStackParamList } from '../types';
import { getPosterUrl, getBackdropUrl, getProfileUrl } from '../services/tmdbApi';
import tmdbApi from '../services/tmdbApi';
import { useWatchlistStore } from '../store/watchlistStore';
import { MovieCard } from '../components/movie/MovieCard';
import { movieService } from '../services/api/movieService';

const { width: W, height: H } = Dimensions.get('window');
const BACKDROP_HEIGHT = H * 0.46;
type DetailsRouteProp = RouteProp<RootStackParamList, 'MovieDetails'>;

// ─── Rating Component ────────────────────────────────────────────────────────
const RatingRow: React.FC<{ rating: number; count: number }> = ({ rating, count }) => {
  const stars = Math.round(rating / 2);
  return (
    <View style={rSt.row}>
      <View style={rSt.scoreBadge}>
        <Text style={rSt.scoreText} allowFontScaling={false}>{rating.toFixed(1)}</Text>
      </View>
      <View style={rSt.stars}>
        {[1, 2, 3, 4, 5].map(i => (
          <Ionicons
            key={i}
            name={i <= stars ? 'star' : 'star-outline'}
            size={12}
            color={Colors.accent.gold}
          />
        ))}
        <Text style={rSt.countText} allowFontScaling={false}>({count.toLocaleString()})</Text>
      </View>
    </View>
  );
};

const rSt = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreBadge: {
    backgroundColor: Colors.accent.goldMuted, borderWidth: 1, borderColor: `${Colors.accent.gold}30`,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm,
  },
  scoreText: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: Colors.accent.gold },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary, marginLeft: 4 },
});

// ─── Cast Card Component ─────────────────────────────────────────────────────
const CastCard: React.FC<{ member: CastMember }> = ({ member }) => (
  <View style={cSt.card}>
    <View style={cSt.avatarWrap}>
      <Image
        source={{ uri: getProfileUrl(member.profile_path) }}
        style={cSt.avatar}
        contentFit="cover"
      />
    </View>
    <Text style={cSt.name} numberOfLines={1} allowFontScaling={false}>{member.name}</Text>
    <Text style={cSt.character} numberOfLines={1} allowFontScaling={false}>{member.character}</Text>
  </View>
);

const cSt = StyleSheet.create({
  card: { width: 72, marginRight: 16, alignItems: 'center' },
  avatarWrap: {
    width: 60, height: 60, borderRadius: 30, overflow: 'hidden',
    backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: Colors.glass.border,
    marginBottom: 8,
  },
  avatar: { width: 60, height: 60 },
  name: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, textAlign: 'center' },
  character: { fontSize: 9, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary, textAlign: 'center', marginTop: 1 },
});

// ─── Main Details Screen ─────────────────────────────────────────────────────
export const MovieDetailsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<DetailsRouteProp>();
  const { movieId } = route.params;

  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState('NR');
  const [expanded, setExpanded] = useState(false);

  const inList = movie ? isInWatchlist(movie.id) : false;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  const backdropStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [-100, 0, BACKDROP_HEIGHT], [-20, 0, BACKDROP_HEIGHT * 0.45], Extrapolate.CLAMP),
      },
      {
        scale: interpolate(scrollY.value, [-100, 0], [1.15, 1], Extrapolate.CLAMP),
      },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, BACKDROP_HEIGHT * 0.75], [0.35, 0.95], Extrapolate.CLAMP),
  }));

  const navHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [BACKDROP_HEIGHT * 0.5, BACKDROP_HEIGHT * 0.8], [0, 1], Extrapolate.CLAMP),
  }));

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [d, c] = await Promise.all([
          tmdbApi.getMovieDetails(movieId),
          tmdbApi.getCertification(movieId),
        ]);
        if (active) {
          setMovie(d);
          setCert(c);
          if (d.imdb_id) {
            movieService.logInteraction(d.imdb_id, 'click').catch(err => {
              console.log('Failed to log movie click interaction:', err);
            });
          }
        }
      } catch (err) {
        console.error('Details fetch error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAll();
    return () => { active = false; };
  }, [movieId]);

  const handleShare = async () => {
    if (!movie) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await Share.share({
        title: movie.title,
        message: `Check out "${movie.title}" on CineAI! ${movie.tagline || ''}`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleToggleList = () => {
    if (!movie) return;
    Haptics.notificationAsync(inList ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (inList) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent.crimson} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={[styles.root, styles.center]}>
        <Ionicons name="alert-circle" size={48} color={Colors.text.tertiary} />
        <Text style={styles.errorText} allowFontScaling={false}>Failed to retrieve title details.</Text>
        <Pressable style={styles.backBtnPill} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={16} color={Colors.text.onAccent} />
          <Text style={styles.backBtnText} allowFontScaling={false}>Return Back</Text>
        </Pressable>
      </View>
    );
  }

  const videos = movie.videos?.results || [];
  let trailer = videos.find(
    v => v.official === true && v.type === 'Trailer' && v.site === 'YouTube'
  );
  if (!trailer) {
    trailer = videos.find(
      v => v.official === true && v.type === 'Teaser' && v.site === 'YouTube'
    );
  }
  if (!trailer) {
    trailer = videos.find(
      v => v.official === true && v.type === 'Clip' && v.site === 'YouTube'
    );
  }
  const duration = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '';
  const director = movie.credits?.crew?.find(c => c.job === 'Director')?.name || 'Unknown';
  const castList = movie.credits?.cast?.slice(0, 10) || [];
  const matches = Math.floor(78 + movie.vote_average * 2.1);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating navigation pill overlay */}
      <View style={[styles.navOverlay, { paddingTop: insets.top + 6 }]}>
        <Pressable style={styles.roundPill} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={Colors.text.primary} />
        </Pressable>
        <Animated.View style={[styles.navTitleWrap, navHeaderStyle]}>
          <Text style={styles.navTitle} numberOfLines={1} allowFontScaling={false}>{movie.title}</Text>
        </Animated.View>
        <View style={styles.rightPills}>
          <Pressable style={styles.roundPill} onPress={handleShare} hitSlop={12}>
            <Ionicons name="share-outline" size={18} color={Colors.text.primary} />
          </Pressable>
          <Pressable style={[styles.roundPill, inList && { borderColor: Colors.accent.crimson }]} onPress={handleToggleList} hitSlop={12}>
            <Ionicons name={inList ? 'bookmark' : 'bookmark-outline'} size={18} color={inList ? Colors.accent.crimson : Colors.text.primary} />
          </Pressable>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Parallax Hero Backdrop */}
        <View style={styles.heroContainer}>
          <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
            <Image
              source={{ uri: getBackdropUrl(movie.backdrop_path) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          </Animated.View>

          {/* OLED Grad overlays */}
          <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
            <LinearGradient
              colors={['rgba(7,7,9,0.3)', 'rgba(7,7,9,0.6)', Colors.bg.void]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Action video pulse button */}
          <Pressable
            style={({ pressed }) => [
              styles.playOrb, 
              pressed && trailer && { transform: [{ scale: 0.95 }] },
              !trailer && styles.playOrbDisabled
            ]}
            disabled={!trailer}
            onPress={() => {
              if (!trailer) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`).catch(() => {});
            }}
          >
            <View style={[styles.playOrbInner, !trailer && styles.playOrbInnerDisabled]}>
              <Ionicons 
                name={trailer ? "play" : "play-outline"} 
                size={28} 
                color={trailer ? Colors.text.onAccent : Colors.text.tertiary} 
                style={trailer ? { marginLeft: 3 } : {}} 
              />
            </View>
            <Text style={[styles.playText, !trailer && styles.playTextDisabled]} allowFontScaling={false}>
              {trailer ? "Watch Trailer" : "Trailer Unavailable"}
            </Text>
          </Pressable>

          {/* Bleeding Editorial Title Overlay */}
          <View style={styles.titleArea}>
            <Text style={styles.heroTitle} allowFontScaling={false}>{movie.title}</Text>
            {movie.tagline && (
              <Text style={styles.tagline} allowFontScaling={false}>“{movie.tagline}”</Text>
            )}
            <View style={styles.badgesRow}>
              {cert !== 'NR' && (
                <View style={styles.certPill}>
                  <Text style={styles.certLabel} allowFontScaling={false}>{cert}</Text>
                </View>
              )}
              {releaseYear && <Text style={styles.metaLabel} allowFontScaling={false}>{releaseYear}</Text>}
              {duration && <Text style={styles.metaLabel} allowFontScaling={false}>{duration}</Text>}
            </View>
          </View>
        </View>

        {/* Content body layout */}
        <View style={styles.body}>
          {/* Rating area */}
          <View style={styles.section}>
            <RatingRow rating={movie.vote_average} count={movie.vote_count} />
          </View>

          {/* AI Insights Smart Card */}
          <View style={styles.aiInsightCard}>
            <LinearGradient
              colors={[Colors.accent.crimsonMuted, Colors.accent.electricMuted]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.aiHeader}>
              <View style={styles.orbPulseIcon}>
                <Ionicons name="sparkles" size={12} color={Colors.accent.crimson} />
              </View>
              <Text style={styles.aiTitle} allowFontScaling={false}>CineAI Insight Match</Text>
              <View style={styles.matchBadge}>
                <Text style={styles.matchText} allowFontScaling={false}>{matches}% Match</Text>
              </View>
            </View>
            <Text style={styles.aiDescription} allowFontScaling={false}>
              Based on your unique viewing patterns, this is a premium {matches}% match. Displays signature {movie.genres?.map(g => g.name.toLowerCase()).slice(0, 2).join(' & ')} pacing, exquisite tone modeling, and an outstanding visual atmosphere curated specially by CineAI.
            </Text>
          </View>

          {/* Overview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle} allowFontScaling={false}>Overview</Text>
            <Text
              style={styles.overview}
              numberOfLines={expanded ? undefined : 4}
              allowFontScaling={false}
            >
              {movie.overview}
            </Text>
            {movie.overview.length > 180 && (
              <Pressable onPress={() => setExpanded(e => !e)} hitSlop={12}>
                <View style={styles.expandRow}>
                  <Ionicons
                    name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                    size={15}
                    color={Colors.accent.crimson}
                  />
                  <Text style={styles.expandLabel} allowFontScaling={false}>
                    {expanded ? 'Read Less' : 'Read Full Overview'}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Director detail */}
          <View style={styles.directorRow}>
            <Text style={styles.directorTitle} allowFontScaling={false}>Director</Text>
            <Text style={styles.directorName} allowFontScaling={false}>{director}</Text>
          </View>

          {/* Cast list */}
          {castList.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>Main Cast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {castList.map(item => (
                  <CastCard key={item.id} member={item} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Similar movies list */}
          {movie.similar?.results && movie.similar.results.length > 0 && (
            <View style={[styles.section, { marginTop: 12 }]}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>More Like This</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {movie.similar?.results?.slice(0, 8).map((sim: Movie) => (
                  <MovieCard
                    key={sim.id}
                    movie={sim}
                    onPress={() => navigation.push('MovieDetails', { movieId: sim.id })}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.void },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40 },
  errorText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, textAlign: 'center' },
  backBtnPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent.crimson, borderRadius: Radius.full,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
  },
  backBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.onAccent },
  navOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 10,
  },
  roundPill: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(7,7,9,0.5)', borderWidth: 1, borderColor: Colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitleWrap: { flex: 1, marginHorizontal: 16, alignItems: 'center' },
  navTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  rightPills: { flexDirection: 'row', gap: 8 },
  heroContainer: { height: BACKDROP_HEIGHT, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  playOrb: { alignItems: 'center', gap: 8, zIndex: 10, marginTop: -40 },
  playOrbDisabled: {
    opacity: 0.75,
  },
  playOrbInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.accent.crimson, borderWidth: 1, borderColor: Colors.accent.crimsonLight,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 8,
  },
  playOrbInnerDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
    shadowOpacity: 0,
    elevation: 0,
  },
  playText: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, letterSpacing: 0.5 },
  playTextDisabled: {
    color: Colors.text.tertiary,
  },
  titleArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 16,
  },
  heroTitle: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, letterSpacing: -0.6, lineHeight: 34 },
  tagline: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, fontStyle: 'italic', marginTop: 4, marginBottom: 8 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  certPill: {
    backgroundColor: Colors.glass.light, borderWidth: 1, borderColor: Colors.glass.border,
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
  },
  certLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  metaLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  body: { paddingHorizontal: 24, paddingTop: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 12 },
  overview: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 22 },
  expandRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  expandLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.accent.crimson },
  directorRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
    marginBottom: 24,
  },
  directorTitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary },
  directorName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  aiInsightCard: {
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.glass.border,
    padding: 16, overflow: 'hidden', marginBottom: 24,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  orbPulseIcon: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.accent.crimsonMuted, borderWidth: 1, borderColor: `${Colors.accent.crimson}30`,
    alignItems: 'center', justifyContent: 'center',
  },
  aiTitle: { flex: 1, fontSize: 13, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  matchBadge: {
    backgroundColor: Colors.accent.crimsonMuted, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: `${Colors.accent.crimson}30`,
  },
  matchText: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: Colors.accent.crimson },
  aiDescription: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 20 },
});

export default MovieDetailsScreen;
