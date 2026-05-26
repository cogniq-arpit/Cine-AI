/**
 * CineAI V3 — AIChatScreen Spacing & Refinement Polish
 * The absolute zenith of flagship mobile cinematic UX.
 * Perfectly balanced floating inputs, micro-halos, and elegant layout scale.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, StatusBar,
  Modal, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat,
  withSequence, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Radius, Motion, Spacing } from '../../constants/theme';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import type { ChatMessage, Movie, RootStackParamList } from '../../types';
import { VoiceWave } from '../../components/ui/VoiceWave';

const { width: W, height: H } = Dimensions.get('window');
type ChatNav = NativeStackNavigationProp<RootStackParamList>;

const MOCK_SPEECH_PHRASES = [
  'Recommend a highly immersive, futuristic sci-fi film with deep philosophical themes',
  'What is a dark and tense psychological thriller with a massive plot twist?',
  'Suggest a comforting, beautifully shot cinematic masterpiece for a quiet evening',
  'I want a visually spectacular modern action adventure with great pacing',
];

const QUICK_MOOD_PILLS = [
  { id: 'noir', label: 'Neo-Noir', icon: 'moon-outline' },
  { id: 'cyber', label: 'Cyberpunk', icon: 'hardware-chip-outline' },
  { id: 'oscar', label: 'Oscar Gold', icon: 'trophy-outline' },
  { id: 'indie', label: 'Indie Gems', icon: 'film-outline' },
  { id: 'mind', label: 'Mind-Bend', icon: 'bulb-outline' },
];

const SUGGESTION_CHIPS = [
  { id: '1', icon: 'shuffle', label: 'Surprise me', query: 'Recommend a film I wouldn\'t expect to love but probably will' },
  { id: '2', icon: 'heart-outline', label: 'Match my mood', query: 'What should I watch based on a relaxed evening mood?' },
  { id: '3', icon: 'trending-up', label: 'Top rated 2024', query: 'What are the best-reviewed films from 2024?' },
  { id: '4', icon: 'bulb-outline', label: 'Mind-bending', query: 'I want a film that will make me question everything' },
];

const PREVIEW_HIGHLIGHTS = [
  {
    id: 1,
    title: 'Interstellar',
    match: 98,
    poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    desc: 'Space Odyssey',
    movieId: 816692
  },
  {
    id: 2,
    title: 'Dune: Part Two',
    match: 96,
    poster: 'https://image.tmdb.org/t/p/w500/1pdfpwXt6tLY244TLHjRj24Zt6t.jpg',
    desc: 'Desert Epic',
    movieId: 15239678
  },
  {
    id: 3,
    title: 'The Dark Knight',
    match: 94,
    poster: 'https://image.tmdb.org/t/p/w500/qJ2tWw7512l29i1KjGo8qG71wCc.jpg',
    desc: 'Gotham\'s Guardian',
    movieId: 468569
  }
];


// ─── Breathing Aura Rings for CineAI Orb ─────────────────────────────────────
const PulseRing: React.FC<{ delay: number }> = ({ delay }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    const startAnimation = () => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.65, { duration: 2500, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) }),
          withTiming(0.45, { duration: 0 })
        ),
        -1,
        false
      );
    };

    const t = setTimeout(startAnimation, delay);
    return () => clearTimeout(t);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[welcomeStyles.auraRing, ringStyle]} />;
};

// ─── Typing Indicator ──────────────────────────────────────────────────────
const TypingIndicator: React.FC = () => {
  const d1 = useSharedValue(0);
  const d2 = useSharedValue(0);
  const d3 = useSharedValue(0);

  useEffect(() => {
    const animate = (sv: typeof d1, delay: number) => {
      sv.value = withDelay(delay, withRepeat(withSequence(
        withTiming(-6, { duration: 300 }),
        withTiming(0, { duration: 300 }),
      ), -1, false));
    };
    const withDelay = (delay: number, anim: any) => {
      return withSequence(withTiming(0, { duration: delay }), anim);
    };
    animate(d1, 0);
    animate(d2, 150);
    animate(d3, 300);
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: d1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: d2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: d3.value }] }));

  return (
    <View style={typingStyles.row}>
      <View style={typingStyles.orbDot} />
      <View style={typingStyles.bubble}>
        <Animated.View style={[typingStyles.dot, s1]} />
        <Animated.View style={[typingStyles.dot, s2]} />
        <Animated.View style={[typingStyles.dot, s3]} />
      </View>
    </View>
  );
};

const typingStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  orbDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent.crimsonMuted, borderWidth: 1, borderColor: Colors.accent.crimson, alignItems: 'center', justifyContent: 'center' },
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.bg.raised, borderRadius: Radius.xl, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: Colors.glass.border },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.text.tertiary },
});

// ─── Movie Recommendation Card (Optimized Height & Overlays) ─────────────────
const MovieChip: React.FC<{ movie: Movie; reason?: string; onPress: () => void }> = ({ movie, reason, onPress }) => {
  // poster_path from mapTmdbToMovie is always a full URL (Unsplash or TMDB CDN fallback)
  const poster = movie.poster_path || null;


  const matchPct = Math.floor(Math.random() * 8 + 91);

  return (
    <Pressable style={movieChipStyles.card} onPress={onPress}>
      <Image
        source={poster ? { uri: poster } : undefined}
        style={movieChipStyles.poster}
        contentFit="cover"
      />
      <LinearGradient colors={['transparent', 'rgba(7,7,9,0.3)', 'rgba(7,7,9,0.98)']} style={movieChipStyles.grad} />
      
      <View style={movieChipStyles.badge}>
        <Ionicons name="sparkles" size={8} color={Colors.accent.crimsonLight} />
        <Text style={movieChipStyles.badgeText} allowFontScaling={false}>{matchPct}% Match</Text>
      </View>

      <View style={movieChipStyles.meta}>
        <Text style={movieChipStyles.title} numberOfLines={1} allowFontScaling={false}>
          {movie.title}
        </Text>
        {reason ? (
          <Text style={movieChipStyles.reason} numberOfLines={2} allowFontScaling={false}>
            {reason}
          </Text>
        ) : (
          <Text style={movieChipStyles.reason} numberOfLines={2} allowFontScaling={false}>
            Curated perfectly based on your preferences.
          </Text>
        )}
        
        <View style={movieChipStyles.tagsRow}>
          <Text style={movieChipStyles.tagText} allowFontScaling={false}>#AI_Pick</Text>
          <Text style={movieChipStyles.tagText} allowFontScaling={false}>#MustWatch</Text>
        </View>

        {movie.vote_average > 0 && (
          <View style={movieChipStyles.ratingRow}>
            <Ionicons name="star" size={9} color={Colors.accent.gold} />
            <Text style={movieChipStyles.rating} allowFontScaling={false}>
              {movie.vote_average.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const movieChipStyles = StyleSheet.create({
  card: { width: 130, height: 195, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.bg.surface, marginRight: 10, position: 'relative', borderWidth: 1, borderColor: Colors.glass.border },
  poster: { ...StyleSheet.absoluteFillObject },
  grad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  badge: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(230, 57, 70, 0.22)', borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(230, 57, 70, 0.4)', paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.accent.crimsonLight, letterSpacing: 0.2 },
  meta: { position: 'absolute', bottom: 8, left: 8, right: 8 },
  title: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 2 },
  reason: { fontSize: 9, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 11, marginBottom: 3 },
  tagsRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  tagText: { fontSize: 8, fontFamily: 'Inter_600SemiBold', color: Colors.accent.crimsonLight },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { fontSize: 9, fontFamily: 'Inter_500Medium', color: Colors.accent.gold },
});

// ─── Message Bubble ────────────────────────────────────────────────────────
const MessageBubble: React.FC<{
  message: ChatMessage;
  onMoviePress: (id: number) => void;
}> = ({ message, onMoviePress }) => {
  const isUser = message.role === 'user';
  const movies = message.movies?.map(m => m.movie) || [];

  return (
    <View style={[bubbleStyles.row, isUser && bubbleStyles.rowUser]}>
      {!isUser && (
        <View style={bubbleStyles.aiAvatar}>
          <Ionicons name="sparkles" size={12} color={Colors.accent.crimson} />
        </View>
      )}

      <View style={[bubbleStyles.bubbleGroup, isUser && bubbleStyles.bubbleGroupUser]}>
        <View style={[bubbleStyles.bubble, isUser ? bubbleStyles.bubbleUser : bubbleStyles.bubbleAI]}>
          <Text style={[bubbleStyles.text, isUser && bubbleStyles.textUser]} allowFontScaling={false}>
            {message.content}
          </Text>
        </View>

        {movies.length > 0 && (
          <View style={bubbleStyles.moviesContainer}>
            <FlatList
              data={movies.slice(0, 6)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={m => String(m.id)}
              renderItem={({ item, index }) => (
                <MovieChip
                  movie={item}
                  reason={message.movies?.[index]?.reason}
                  onPress={() => onMoviePress(item.id)}
                />
              )}
            />
          </View>
        )}

        <Text style={bubbleStyles.timestamp} allowFontScaling={false}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8, alignItems: 'flex-end' },
  rowUser: { flexDirection: 'row-reverse' },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accent.crimsonMuted, borderWidth: 1, borderColor: Colors.accent.crimson,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bubbleGroup: { maxWidth: W * 0.75, gap: 8 },
  bubbleGroupUser: { alignItems: 'flex-end' },
  bubble: {
    borderRadius: Radius.xl, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: Colors.accent.crimsonMuted, borderColor: `${Colors.accent.crimson}40`,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: Colors.bg.raised, borderColor: Colors.glass.border,
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.primary, lineHeight: 21 },
  textUser: { color: Colors.text.primary },
  moviesContainer: { marginTop: 4 },
  timestamp: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary, marginTop: 2 },
});

// ─── Welcome State (Compact & Spatially Balanced) ──────────────────────────
const WelcomeState: React.FC<{
  onChipPress: (query: string) => void;
  onPreviewPress: (id: number) => void;
}> = ({ onChipPress, onPreviewPress }) => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={welcomeStyles.scrollContent}
    >
      {/* Dynamic Cinematic Hero Block */}
      <View style={welcomeStyles.heroBlock}>
        <View style={welcomeStyles.orbOuterContainer}>
          <PulseRing delay={0} />
          <PulseRing delay={1200} />
          <LinearGradient
            colors={[Colors.accent.orbStart, Colors.accent.orbMid, Colors.accent.orbEnd]}
            style={welcomeStyles.orbCore}
          >
            <Ionicons name="sparkles" size={14} color={Colors.text.onAccent} />
          </LinearGradient>
        </View>

        <Text style={welcomeStyles.greeting} allowFontScaling={false}>
          CineAI Curator • Active
        </Text>
        <Text style={welcomeStyles.title} allowFontScaling={false}>
          What cinematic masterpiece are we discovering tonight?
        </Text>

        {/* AI Personality Intro Bubble */}
        <View style={welcomeStyles.introBubble}>
          <Ionicons name="sparkles" size={12} color={Colors.accent.crimson} style={{ marginRight: 6, marginTop: 1 }} />
          <Text style={welcomeStyles.introText} allowFontScaling={false}>
            I'm CineAI, your cinematic critic. Tell me your favorite genres, directors, or ask about an era—let's find your next favorite film together.
          </Text>
        </View>
      </View>

      {/* Horizontally Scrolling Quick Actions */}
      <View style={welcomeStyles.section}>
        <Text style={welcomeStyles.sectionTitle} allowFontScaling={false}>Rapid Prompt Capsules</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={welcomeStyles.pillsContainer}
        >
          {SUGGESTION_CHIPS.map(chip => (
            <Pressable
              key={chip.id}
              style={({ pressed }) => [welcomeStyles.pillChip, pressed && { transform: [{ scale: 0.98 }] }]}
              onPress={() => onChipPress(chip.query)}
            >
              <Ionicons name={chip.icon as any} size={11} color={Colors.accent.crimson} />
              <Text style={welcomeStyles.pillText} allowFontScaling={false}>{chip.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* AI Curated Highlights Preview */}
      <View style={welcomeStyles.section}>
        <Text style={welcomeStyles.sectionTitle} allowFontScaling={false}>Tonight's AI Highlights</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={welcomeStyles.highlightsContainer}
        >
          {PREVIEW_HIGHLIGHTS.map(item => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [welcomeStyles.highlightCard, pressed && { transform: [{ scale: 0.98 }] }]}
              onPress={() => onPreviewPress(item.movieId)}
            >
              <Image source={{ uri: item.poster }} style={welcomeStyles.highlightPoster} contentFit="cover" />
              <LinearGradient colors={['transparent', 'rgba(7,7,9,0.3)', 'rgba(7,7,9,0.96)']} style={welcomeStyles.highlightGrad} />
              
              <View style={welcomeStyles.highlightBadge}>
                <Ionicons name="sparkles" size={8} color={Colors.accent.crimson} />
                <Text style={welcomeStyles.highlightBadgeText} allowFontScaling={false}>{item.match}% Match</Text>
              </View>

              <View style={welcomeStyles.highlightMeta}>
                <Text style={welcomeStyles.highlightName} numberOfLines={1} allowFontScaling={false}>{item.title}</Text>
                <Text style={welcomeStyles.highlightDesc} numberOfLines={1} allowFontScaling={false}>{item.desc}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const welcomeStyles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 170 },
  heroBlock: { alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  orbOuterContainer: { width: 56, height: 56, position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  auraRing: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 1.2, borderColor: Colors.accent.crimson, backgroundColor: 'transparent' },
  orbCore: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  greeting: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.accent.crimsonLight, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, textAlign: 'center', lineHeight: 24, letterSpacing: -0.3, paddingHorizontal: 16, marginBottom: 8 },
  introBubble: { flexDirection: 'row', backgroundColor: Colors.bg.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.glass.border, paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: 8 },
  introText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 16 },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  pillsContainer: { gap: 8, paddingHorizontal: 20, paddingRight: 36 },
  pillChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.bg.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.glass.border, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.primary },
  highlightsContainer: { gap: 12, paddingHorizontal: 20, paddingRight: 36 },
  highlightCard: { width: 120, height: 175, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.bg.surface, position: 'relative', borderWidth: 1, borderColor: Colors.glass.border, marginRight: 10 },
  highlightPoster: { ...StyleSheet.absoluteFillObject },
  highlightGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  highlightBadge: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(230, 57, 70, 0.22)', borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(230, 57, 70, 0.4)', paddingHorizontal: 5, paddingVertical: 2 },
  highlightBadgeText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.accent.crimson },
  highlightMeta: { position: 'absolute', bottom: 8, left: 8, right: 8 },
  highlightName: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 1 },
  highlightDesc: { fontSize: 9, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
});

// ─── Main AIChatScreen Redesign Refined ──────────────────────────────────────
export const AIChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ChatNav>();
  const {
    sessions, currentSession, isSending, sendMessage,
    createSession, loadSession, deleteSession, loadSessions
  } = useChatStore();

  const [text, setText] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);

  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const sendScale = useSharedValue(1);

  const messages = currentSession?.messages || [];
  const isEmpty = messages.length === 0;

  const sendBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
    opacity: text.trim() ? 1 : 0.4,
  }));

  useEffect(() => {
    const initializeChat = async () => {
      await loadSessions();
      const loadedSessions = useChatStore.getState().sessions;
      if (loadedSessions.length === 0) {
        await createSession();
      } else {
        await loadSession(loadedSessions[0].id);
      }
    };
    initializeChat();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    const msg = text.trim();
    setText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    sendScale.value = withSequence(withSpring(0.85, Motion.springs.snappy), withSpring(1, Motion.springs.bounce));
    await sendMessage(msg);
  };

  const handleChipPress = (query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setText(query);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const toggleVoiceMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setVoiceActive(prev => {
      const next = !prev;
      if (next) {
        setIsListening(false);
        setIsProcessing(false);
      }
      return next;
    });
  };

  const handleMicPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (!isListening && !isProcessing) {
      setIsListening(true);
      setIsProcessing(false);
    } else if (isListening) {
      setIsListening(false);
      setIsProcessing(true);

      setTimeout(() => {
        const randomPhrase = MOCK_SPEECH_PHRASES[Math.floor(Math.random() * MOCK_SPEECH_PHRASES.length)];
        setIsProcessing(false);
        setVoiceActive(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        sendMessage(randomPhrase);
      }, 1800);
    }
  };

  const handleMoodPillPress = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setText(prev => (prev ? `${prev} with a ${label} vibe` : `Recommend a ${label} movie`));
    setOptionsVisible(false);
  };

  const selectHistorySession = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    loadSession(id);
    setHistoryVisible(false);
  };

  const removeHistorySession = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    deleteSession(id);
  };

  const handleStartNewChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    createSession();
    setHistoryVisible(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.void} />

      {/* Sticky Compact Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={[Colors.accent.orbStart, Colors.accent.orbEnd]} style={styles.headerOrb}>
            <Ionicons name="sparkles" size={12} color={Colors.text.onAccent} />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle} allowFontScaling={false}>CineAI</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText} allowFontScaling={false}>AI Ready</Text>
            </View>
          </View>
        </View>
        <Pressable style={styles.headerBtn} onPress={() => setHistoryVisible(true)}>
          <Ionicons name="time-outline" size={20} color={Colors.text.secondary} />
        </Pressable>
      </View>

      {/* Dynamic Content View */}
      {isEmpty ? (
        <WelcomeState
          onChipPress={handleChipPress}
          onPreviewPress={id => navigation.navigate('MovieDetails', { movieId: id })}
        />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onMoviePress={id => navigation.navigate('MovieDetails', { movieId: id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isSending ? <TypingIndicator /> : null}
        />
      )}

      {/* Premium Floating Chat Input bar */}
      <View style={[styles.inputBar, { bottom: Platform.OS === 'ios' ? 90 : 80 }]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 60 : 0}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        {voiceActive ? (
          <View style={styles.voicePanelRow}>
            <Pressable style={styles.iconSideBtn} onPress={() => setVoiceActive(false)}>
              <Ionicons name={"keyboard-outline" as any} size={18} color={Colors.text.secondary} />
            </Pressable>
            <View style={styles.voiceCenter}>
              <VoiceWave isListening={isListening} isProcessing={isProcessing} compact />
              <Text style={styles.voiceStatusLabel} allowFontScaling={false}>
                {isListening ? 'Listening...' : isProcessing ? 'Transcribing...' : 'Tap Mic to speak'}
              </Text>
            </View>
            <Pressable
              style={[styles.micBtn, isListening && styles.micBtnActive, isProcessing && styles.micBtnProcessing]}
              onPress={handleMicPress}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={Colors.text.onAccent} />
              ) : (
                <Ionicons name={isListening ? 'stop' : 'mic'} size={18} color={isListening ? Colors.text.onAccent : Colors.accent.crimson} />
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <Pressable style={styles.iconSideBtn} onPress={toggleVoiceMode}>
              <Ionicons name="mic-outline" size={18} color={Colors.text.secondary} />
            </Pressable>
            <View style={styles.inputWrap}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="Ask CineAI about movies, moods, directors..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                selectionColor={Colors.accent.crimson}
                allowFontScaling={false}
              />
            </View>
            <Pressable style={styles.iconSideBtn} onPress={() => setOptionsVisible(true)}>
              <Ionicons name="options-outline" size={18} color={Colors.text.secondary} />
            </Pressable>
            <Animated.View style={sendBtnStyle}>
              <Pressable
                style={[styles.sendBtn, text.trim() && styles.sendBtnActive]}
                onPress={handleSend}
                disabled={!text.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={Colors.text.onAccent} />
                ) : (
                  <Ionicons name="arrow-up" size={16} color={text.trim() ? Colors.text.onAccent : Colors.text.tertiary} />
                )}
              </Pressable>
            </Animated.View>
          </View>
        )}
      </View>

      {/* Chat History slide-up sheets */}
      <Modal visible={historyVisible} transparent animationType="slide" onRequestClose={() => setHistoryVisible(false)}>
        <BlurView intensity={90} tint="dark" style={styles.modalBg}>
          <Pressable style={styles.modalDismissTap} onPress={() => setHistoryVisible(false)} />
          <View style={styles.historySheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.notch} />
              <Text style={styles.sheetTitle} allowFontScaling={false}>Chat History</Text>
              <Text style={styles.sheetSubtitle} allowFontScaling={false}>Resume or manage your past discussions</Text>
            </View>
            <ScrollView contentContainerStyle={styles.historyScroll}>
              {sessions.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="chatbubbles-outline" size={32} color={Colors.text.tertiary} />
                  <Text style={styles.emptyHistoryText} allowFontScaling={false}>No discussions recorded yet.</Text>
                </View>
              ) : (
                sessions.map(s => {
                  const hasMsgs = s.messages?.length > 0;
                  const desc = hasMsgs ? s.messages[s.messages.length - 1].content : 'Empty discussion';
                  const dateStr = new Date(s.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  const active = currentSession?.id === s.id;
                  return (
                    <Pressable key={s.id} style={[styles.sessionItem, active && styles.sessionItemActive]} onPress={() => selectHistorySession(s.id)}>
                      <View style={styles.sessionLeft}>
                        <View style={[styles.sessionIconBg, active && styles.sessionIconBgActive]}>
                          <Ionicons name="chatbox-ellipses-outline" size={16} color={active ? Colors.accent.crimson : Colors.text.secondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.sessionTitle, active && styles.sessionTitleActive]} numberOfLines={1} allowFontScaling={false}>
                            {s.title === 'New Chat' && hasMsgs ? s.messages[0].content : s.title}
                          </Text>
                          <Text style={styles.sessionDesc} numberOfLines={1} allowFontScaling={false}>{desc}</Text>
                        </View>
                      </View>
                      <View style={styles.sessionRight}>
                        <Text style={styles.sessionDate} allowFontScaling={false}>{dateStr}</Text>
                        <Pressable style={styles.trashBtn} onPress={() => removeHistorySession(s.id)} hitSlop={10}>
                          <Ionicons name="trash-outline" size={16} color={Colors.text.tertiary} />
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
            <View style={[styles.sheetFooter, { paddingBottom: insets.bottom + 16 }]}>
              <Pressable style={styles.newChatBtn} onPress={handleStartNewChat}>
                <Ionicons name="add" size={20} color={Colors.text.onAccent} />
                <Text style={styles.newChatText} allowFontScaling={false}>Start a New Chat</Text>
              </Pressable>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Mood Options modal */}
      <Modal visible={optionsVisible} transparent animationType="fade" onRequestClose={() => setOptionsVisible(false)}>
        <BlurView intensity={90} tint="dark" style={styles.modalBgCenter}>
          <Pressable style={styles.modalDismissTap} onPress={() => setOptionsVisible(false)} />
          <View style={styles.optionsCard}>
            <Text style={styles.optionsCardTitle} allowFontScaling={false}>Select Quick Genre Filter</Text>
            <Text style={styles.optionsCardSubtitle} allowFontScaling={false}>Refine your AI search immediately</Text>
            <View style={styles.optionsGrid}>
              {QUICK_MOOD_PILLS.map(pill => (
                <Pressable
                  key={pill.id}
                  style={styles.optionsGridItem}
                  onPress={() => handleMoodPillPress(pill.label)}
                >
                  <Ionicons name={pill.icon as any} size={18} color={Colors.accent.crimson} />
                  <Text style={styles.optionsGridLabel} allowFontScaling={false}>{pill.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.optionsCloseBtn} onPress={() => setOptionsVisible(false)}>
              <Text style={styles.optionsCloseText} allowFontScaling={false}>Cancel</Text>
            </Pressable>
          </View>
        </BlurView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.void },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
    backgroundColor: 'rgba(7,7,9,0.82)',
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerOrb: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, letterSpacing: 0.2 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.semantic.success },
  onlineText: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.semantic.success },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.glass.subtle, borderWidth: 1, borderColor: Colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  listContent: { paddingTop: 16, paddingBottom: 170 },
  inputBar: {
    position: 'absolute', left: 20, right: 20,
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(13,13,18,0.72)', overflow: 'hidden',
    paddingTop: 6, paddingBottom: 6, paddingHorizontal: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    zIndex: 100,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconSideBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bg.raised, borderWidth: 1, borderColor: Colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  inputWrap: {
    flex: 1, backgroundColor: Colors.bg.raised, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.glass.border,
    paddingHorizontal: 12, paddingVertical: 6, minHeight: 36,
    maxHeight: 120,
  },
  input: {
    fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.primary,
    lineHeight: 18, padding: 0,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bg.raised, borderWidth: 1, borderColor: Colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: Colors.accent.crimson, borderColor: Colors.accent.crimson,
    shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  voicePanelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  voiceCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 },
  voiceStatusLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.text.tertiary, marginTop: -2 },
  micBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bg.raised, borderWidth: 1, borderColor: Colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: Colors.accent.crimson, borderColor: Colors.accent.crimsonLight },
  micBtnProcessing: { backgroundColor: Colors.accent.electricMuted, borderColor: Colors.accent.electric },
  modalBg: { flex: 1, justifyContent: 'flex-end' },
  modalDismissTap: { ...StyleSheet.absoluteFillObject },
  historySheet: {
    backgroundColor: Colors.bg.deep, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.glass.border,
    maxHeight: H * 0.72,
  },
  sheetHeader: { alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.glass.border },
  notch: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.glass.medium, marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  sheetSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 2 },
  historyScroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  emptyHistory: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  emptyHistoryText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary },
  sessionItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bg.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.glass.border,
    padding: 14, marginBottom: 10,
  },
  sessionItemActive: { borderColor: `${Colors.accent.crimson}60`, backgroundColor: Colors.accent.crimsonMuted },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sessionIconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg.raised, alignItems: 'center', justifyContent: 'center' },
  sessionIconBgActive: { backgroundColor: `${Colors.accent.crimson}20` },
  sessionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, marginBottom: 3 },
  sessionTitleActive: { color: Colors.accent.crimsonLight },
  sessionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  sessionRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary },
  trashBtn: { padding: 4 },
  sheetFooter: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.glass.border },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent.crimson, borderRadius: Radius.lg,
    paddingVertical: 14,
    shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  newChatText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.onAccent },
  modalBgCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  optionsCard: {
    width: '100%', backgroundColor: Colors.bg.deep, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.glass.border, padding: 20, zIndex: 10,
  },
  optionsCardTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, textAlign: 'center' },
  optionsCardSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 20 },
  optionsGridItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.bg.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.glass.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  optionsGridLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.text.primary },
  optionsCloseBtn: { alignSelf: 'stretch', paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg, backgroundColor: Colors.bg.raised },
  optionsCloseText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
});

export default AIChatScreen;
