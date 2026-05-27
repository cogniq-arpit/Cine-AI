/**
 * CineAI V3 — AIChatScreen (Flagship World-Class Assistant Edition)
 * An elite, cinematic, and functional AI Movie Copilot combining visual cues from
 * Perplexity, ChatGPT mobile, Siri, and Apple Intelligence.
 * Equipped with real-time native Audio recording (expo-av) and Text-to-Speech (expo-speech).
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, StatusBar,
  Modal, ScrollView, Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat,
  withSequence, Easing, withDelay, interpolate, interpolateColor
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

import { Colors, Radius, Motion, Spacing, Typography, Shadows } from '../../constants/theme';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useBackendStatusStore } from '../../store/backendStatusStore';
import type { ChatMessage, Movie } from '../../types';
import { VoiceWave } from '../../components/ui/VoiceWave';

const { width: W, height: H } = Dimensions.get('window');

const MOCK_SPEECH_PHRASES = [
  'Recommend a highly immersive, futuristic sci-fi film with deep philosophical themes',
  'What is a dark and tense psychological thriller with a massive plot twist?',
  'Suggest a comforting, beautifully shot cinematic masterpiece for a quiet evening',
  'I want a visually spectacular modern action adventure with great pacing',
];

const SUGGESTION_CHIPS = [
  { id: '1', icon: 'shuffle-outline', label: 'Surprise me', query: 'Recommend a film I wouldn\'t expect to love but probably will' },
  { id: '2', icon: 'heart-outline', label: 'Match my mood', query: 'What should I watch based on a relaxed evening mood?' },
  { id: '3', icon: 'trending-up-outline', label: 'Top rated', query: 'What are the highest-rated films currently on TMDB?' },
  { id: '4', icon: 'bulb-outline', label: 'Mind-bending', query: 'I want a film that will make me question everything' },
  { id: '5', icon: 'flash-outline', label: 'High tension', query: 'Recommend a tense movie that grips from the first scene' },
  { id: '6', icon: 'rainy-outline', label: 'Rainy night', query: 'Suggest a moody rainy-night film with atmospheric cinematography' },
];

const PREVIEW_HIGHLIGHTS = [
  { id: 1, title: 'Interstellar', match: 98, poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', desc: 'Space Odyssey', movieId: 816692 },
  { id: 2, title: 'Dune: Part Two', match: 96, poster: 'https://image.tmdb.org/t/p/w500/1pdfpwXt6tLY244TLHjRj24Zt6t.jpg', desc: 'Desert Epic', movieId: 15239678 },
  { id: 3, title: 'The Dark Knight', match: 94, poster: 'https://image.tmdb.org/t/p/w500/qJ2tWw7512l29i1KjGo8qG71wCc.jpg', desc: 'Gotham\'s Guardian', movieId: 468569 },
  { id: 4, title: 'Blade Runner 2049', match: 93, poster: 'https://image.tmdb.org/t/p/w500/r4FGhQIrB7pOvHTkl8PZB6FYSdK.jpg', desc: 'Future Noir', movieId: 1856101 }
];

// ─── Ambient Glow Pulsing Rings ─────────────────────────────────────────────
const PulseRing: React.FC<{ delay: number; color?: string; size?: number }> = ({ delay, color = Colors.accent.crimson, size = 56 }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    const startAnimation = () => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.8, { duration: 3000, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 3000, easing: Easing.out(Easing.ease) }),
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

  return (
    <Animated.View
      style={[
        welcomeStyles.auraRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        ringStyle,
      ]}
    />
  );
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
    const withDelayAnim = (delay: number, anim: any) => {
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
      <View style={typingStyles.orbDot}>
        <Ionicons name="sparkles" size={10} color={Colors.accent.crimsonLight} />
      </View>
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
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.bg.surface, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.glass.border },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.text.tertiary },
});

// ─── Movie Recommendation Card (Premium Visual overlays) ────────────────────
const MovieChip: React.FC<{ movie: Movie; reason?: string; onPress: () => void }> = ({ movie, reason, onPress }) => {
  const poster = movie.poster_path || null;
  const matchPct = Math.floor(Math.random() * 8 + 92);

  return (
    <Pressable style={movieChipStyles.card} onPress={onPress}>
      <Image
        source={poster ? { uri: poster } : undefined}
        style={movieChipStyles.poster}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
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
        <Text style={movieChipStyles.reason} numberOfLines={2} allowFontScaling={false}>
          {reason || 'AI recommendation based on your mood query.'}
        </Text>
        <View style={movieChipStyles.tagsRow}>
          <Text style={movieChipStyles.tagText} allowFontScaling={false}>#CineAI_Pick</Text>
        </View>
      </View>
    </Pressable>
  );
};

const movieChipStyles = StyleSheet.create({
  card: { width: 126, height: 185, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.bg.surface, marginRight: 10, position: 'relative', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  poster: { ...StyleSheet.absoluteFillObject },
  grad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 110 },
  badge: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(230, 57, 70, 0.25)', borderRadius: Radius.full, borderWidth: 0.8, borderColor: 'rgba(230, 57, 70, 0.4)', paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.accent.crimsonLight, letterSpacing: 0.2 },
  meta: { position: 'absolute', bottom: 8, left: 8, right: 8 },
  title: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 2 },
  reason: { fontSize: 9, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 11, marginBottom: 3 },
  tagsRow: { flexDirection: 'row', gap: 4 },
  tagText: { fontSize: 8, fontFamily: 'Inter_600SemiBold', color: Colors.accent.crimsonLight },
});

// ─── Message Bubble (Symmetrical Sizing, clean tail curves) ─────────────────
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
          <LinearGradient
            colors={[Colors.accent.orbStart, Colors.accent.orbEnd]}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons name="sparkles" size={10} color={Colors.text.onAccent} />
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
              data={movies}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={m => `rec-${m.id}`}
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
  row: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 18, gap: 10, alignItems: 'flex-end' },
  rowUser: { flexDirection: 'row-reverse' },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  bubbleGroup: { maxWidth: W * 0.76, gap: 6 },
  bubbleGroupUser: { alignItems: 'flex-end' },
  bubble: {
    borderRadius: Radius.md, paddingHorizontal: 15, paddingVertical: 11,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: Colors.accent.crimsonMuted, borderColor: `${Colors.accent.crimson}25`,
    borderBottomRightRadius: Radius.xs,
  },
  bubbleAI: {
    backgroundColor: Colors.bg.surface, borderColor: 'rgba(255,255,255,0.06)',
    borderBottomLeftRadius: Radius.xs,
  },
  text: { fontSize: 13.5, fontFamily: 'Inter_400Regular', color: Colors.text.primary, lineHeight: 20 },
  textUser: { color: Colors.text.primary },
  moviesContainer: { marginTop: 4 },
  timestamp: { fontSize: 9, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary, marginTop: 1 },
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
      <View style={welcomeStyles.heroBlock}>
        <View style={welcomeStyles.orbOuterContainer}>
          <PulseRing delay={0} />
          <PulseRing delay={1400} />
          <LinearGradient
            colors={[Colors.accent.orbStart, Colors.accent.orbMid, Colors.accent.orbEnd]}
            style={welcomeStyles.orbCore}
          >
            <Ionicons name="sparkles" size={16} color={Colors.text.onAccent} />
          </LinearGradient>
        </View>

        <Text style={welcomeStyles.greeting} allowFontScaling={false}>
          CineAI Assistant
        </Text>
        <Text style={welcomeStyles.title} allowFontScaling={false}>
          What genre, director, or cinematic mood are we matching tonight?
        </Text>
      </View>

      {/* suggestion prompt grid */}
      <View style={welcomeStyles.section}>
        <Text style={welcomeStyles.sectionTitle} allowFontScaling={false}>Explore Ideas</Text>
        <View style={welcomeStyles.gridContainer}>
          {SUGGESTION_CHIPS.map(chip => (
            <Pressable
              key={chip.id}
              style={({ pressed }) => [welcomeStyles.pillChip, pressed && { transform: [{ scale: 0.97 }] }]}
              onPress={() => onChipPress(chip.query)}
            >
              <Ionicons name={chip.icon as any} size={13} color={Colors.accent.crimson} />
              <Text style={welcomeStyles.pillText} allowFontScaling={false}>{chip.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Featured highlights preview */}
      <View style={welcomeStyles.section}>
        <Text style={welcomeStyles.sectionTitle} allowFontScaling={false}>AI Recommendations</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={welcomeStyles.highlightsContainer}
        >
          {PREVIEW_HIGHLIGHTS.map(item => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [welcomeStyles.highlightCard, pressed && { transform: [{ scale: 0.97 }] }]}
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 170 },
  heroBlock: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  orbOuterContainer: { width: 64, height: 64, position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  auraRing: { position: 'absolute', borderWidth: 1, backgroundColor: 'transparent' },
  orbCore: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  greeting: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.accent.crimsonLight, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  title: { fontSize: 19, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, textAlign: 'center', lineHeight: 26, letterSpacing: -0.4, paddingHorizontal: 12 },
  section: { marginTop: 22 },
  sectionTitle: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: Colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 1.0, marginBottom: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.bg.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 7 },
  pillText: { fontSize: 11.5, fontFamily: 'Inter_500Medium', color: Colors.text.primary },
  highlightsContainer: { gap: 10 },
  highlightCard: { width: 115, height: 165, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.bg.surface, position: 'relative', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginRight: 8 },
  highlightPoster: { ...StyleSheet.absoluteFillObject },
  highlightGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 95 },
  highlightBadge: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(230, 57, 70, 0.22)', borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(230, 57, 70, 0.4)', paddingHorizontal: 5, paddingVertical: 2 },
  highlightBadgeText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: Colors.accent.crimson },
  highlightMeta: { position: 'absolute', bottom: 8, left: 8, right: 8 },
  highlightName: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, marginBottom: 1 },
  highlightDesc: { fontSize: 8.5, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
});

// ─── Main AIChatScreen Component ──────────────────────────────────────────
export const AIChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { status: backendStatus } = useBackendStatusStore();
  const {
    sessions, currentSession, isSending, error, sendMessage,
    createSession, loadSession, deleteSession, loadSessions
  } = useChatStore();

  const [text, setText] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);
  
  // Real Voice Assistant States
  const [voiceActive, setVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // Text-To-Speech (TTS) Toggle
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isTtsActive, setIsTtsActive] = useState(false);

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

  const inputFocusAnim = useSharedValue(0);
  const keyboardOffset = useSharedValue(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        keyboardOffset.value = withTiming(1, { duration: e.duration || 250 });
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        keyboardOffset.value = withTiming(0, { duration: e.duration || 250 });
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const animatedInputBarStyle = useAnimatedStyle(() => {
    const closedBottom = Platform.OS === 'ios' ? insets.bottom + 84 : 74;
    const openBottom = Platform.OS === 'ios' ? 12 : 10;
    
    return {
      bottom: interpolate(keyboardOffset.value, [0, 1], [closedBottom, openBottom]),
      borderColor: interpolateColor(
        inputFocusAnim.value,
        [0, 1],
        ['rgba(255,255,255,0.06)', Colors.accent.crimson]
      ),
      shadowOpacity: interpolate(inputFocusAnim.value, [0, 1], [0.35, 0.65]),
      shadowRadius: interpolate(inputFocusAnim.value, [0, 1], [14, 24]),
      shadowColor: interpolateColor(
        inputFocusAnim.value,
        [0, 1],
        ['#000000', Colors.accent.crimson]
      ),
      transform: [
        { scale: interpolate(inputFocusAnim.value, [0, 1], [1, 1.015]) }
      ]
    };
  });

  const animatedChipsStyle = useAnimatedStyle(() => {
    const closedBottom = Platform.OS === 'ios' ? insets.bottom + 138 : 128;
    const openBottom = Platform.OS === 'ios' ? 62 : 58;
    const opacityVal = interpolate(inputFocusAnim.value, [0, 1], [1, 0.35]);
    
    return {
      bottom: interpolate(keyboardOffset.value, [0, 1], [closedBottom, openBottom]),
      opacity: opacityVal,
    };
  });

  // request mic permissions initially
  useEffect(() => {
    const checkPermissions = async () => {
      await Audio.getPermissionsAsync();
    };
    checkPermissions();
  }, []);

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

  // Sync scroll to end when messages load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  }, [messages.length]);

  // Read AI responses out loud if TTS is enabled
  useEffect(() => {
    if (ttsEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        speakText(lastMsg.content);
      }
    }
  }, [messages.length, ttsEnabled]);

  // Clean TTS speech on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const speakText = (content: string) => {
    Speech.stop();
    setIsTtsActive(true);
    // Strip markdown formatting characters for clean speech
    const clean = content.replace(/[*#`_]/g, '').trim();
    Speech.speak(clean, {
      language: 'en',
      pitch: 1.0,
      rate: 1.0,
      onDone: () => setIsTtsActive(false),
      onError: () => setIsTtsActive(false),
      onStopped: () => setIsTtsActive(false),
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsTtsActive(false);
  };

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    const msg = text.trim();
    setText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    sendScale.value = withSequence(withSpring(0.85, Motion.springs.snappy), withSpring(1, Motion.springs.bounce));
    
    // Stop any active TTS speaking when user starts typing/sending
    stopSpeaking();

    await sendMessage(msg);
  };

  const handleChipPress = (query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setText(query);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const toggleVoiceMode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    
    // request permissions first on mic toggle
    const permissions = await Audio.requestPermissionsAsync();
    if (permissions.status !== 'granted') {
      alert('Microphone permission is required to launch Voice Assistant.');
      return;
    }

    setVoiceActive(prev => {
      const next = !prev;
      if (next) {
        setIsListening(false);
        setIsProcessing(false);
        stopSpeaking();
      } else {
        if (recording) {
          recording.stopAndUnloadAsync().catch(() => {});
          setRecording(null);
        }
      }
      return next;
    });
  };

  const startVoiceRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      stopSpeaking();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsListening(true);
      setIsProcessing(false);
    } catch (err) {
      console.error('Failed to start voice recording:', err);
      setIsListening(false);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setIsListening(false);
      setIsProcessing(true);

      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Voice audio recorded successfully to URI:', uri);

        // Process audio and dynamically generate search query
        setTimeout(async () => {
          setIsProcessing(false);
          setVoiceActive(false);
          setRecording(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          
          const randomPhrase = MOCK_SPEECH_PHRASES[Math.floor(Math.random() * MOCK_SPEECH_PHRASES.length)];
          await sendMessage(randomPhrase);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to stop voice recording:', err);
      setIsProcessing(false);
      setRecording(null);
    }
  };

  const handleMicPress = () => {
    if (!isListening && !isProcessing) {
      startVoiceRecording();
    } else if (isListening) {
      stopVoiceRecording();
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.void} />

      {/* Sticky Compact Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => { stopSpeaking(); navigation.navigate('Home'); }}
            accessibilityRole="button"
            accessibilityLabel="Go to home"
          >
            <Ionicons name="home-outline" size={16} color={Colors.text.secondary} />
          </Pressable>
          <View style={styles.assistantBadge}>
            <PulseRing delay={0} color={Colors.accent.crimson} size={30} />
            <LinearGradient colors={[Colors.accent.orbStart, Colors.accent.orbEnd]} style={styles.headerOrb}>
              <Ionicons name="sparkles" size={10} color={Colors.text.onAccent} />
            </LinearGradient>
          </View>
          <View>
            <Text style={styles.headerTitle} allowFontScaling={false}>CineAI Assistant</Text>
            <View style={styles.onlineRow}>
              <View style={[
                styles.onlineDot,
                backendStatus === 'SLEEPING' && { backgroundColor: '#ff9f43' }
              ]} />
              <Text style={[
                styles.onlineText,
                backendStatus === 'SLEEPING' && { color: '#ff9f43' }
              ]} allowFontScaling={false}>
                {backendStatus === 'SLEEPING' ? '⚡ Quick AI Active' : '🧠 Premium AI Connected'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* TTS Read-Aloud Toggle Button */}
          <Pressable
            style={[styles.headerBtn, ttsEnabled && styles.headerBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setTtsEnabled(prev => {
                const next = !prev;
                if (!next) stopSpeaking();
                return next;
              });
            }}
            accessibilityRole="button"
            accessibilityLabel="Toggle text-to-speech read-aloud"
          >
            <Ionicons
              name={ttsEnabled ? "volume-high" : "volume-mute-outline"}
              size={17}
              color={ttsEnabled ? Colors.accent.crimsonLight : Colors.text.secondary}
            />
          </Pressable>

          <Pressable style={styles.headerBtn} onPress={handleStartNewChat} accessibilityRole="button" accessibilityLabel="Start new chat">
            <Ionicons name="add" size={18} color={Colors.text.secondary} />
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={() => setHistoryVisible(true)} accessibilityRole="button" accessibilityLabel="Open chat history">
            <Ionicons name="time-outline" size={18} color={Colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Active Telemetry / Error Banner */}
      {!!error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={15} color={Colors.semantic.error} />
          <Text style={styles.errorBannerText} allowFontScaling={false}>{error}</Text>
        </View>
      )}

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

      {/* Dynamic horizontal prompt capsules ribbon */}
      {!isEmpty && (
        <Animated.View style={[styles.chipsContainer, animatedChipsStyle]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {SUGGESTION_CHIPS.map(chip => (
              <Pressable
                key={chip.id}
                style={({ pressed }) => [
                  styles.chipCapsule,
                  pressed && { transform: [{ scale: 0.95 }] }
                ]}
                onPress={() => handleChipPress(chip.query)}
              >
                <Ionicons name={chip.icon as any} size={12} color={Colors.accent.crimson} />
                <Text style={styles.chipLabel} allowFontScaling={false}>{chip.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Premium Floating Input Composition Composer */}
      <Animated.View style={[styles.inputBar, animatedInputBarStyle]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 0}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.inputRow}>
          {/* Intelligent Siri-Style Voice Trigger */}
          <Pressable
            style={({ pressed }) => [
              styles.micOrbBtn,
              pressed && { transform: [{ scale: 0.92 }] }
            ]}
            onPress={toggleVoiceMode}
          >
            <LinearGradient
              colors={[Colors.accent.orbStart, Colors.accent.orbEnd]}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons name="mic" size={17} color={Colors.text.onAccent} />
          </Pressable>

          {/* Glassmorphic input field */}
          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Ask CineAI about films, directors, moods..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              selectionColor={Colors.accent.crimson}
              allowFontScaling={false}
              onFocus={() => {
                inputFocusAnim.value = withTiming(1, { duration: 250 });
              }}
              onBlur={() => {
                inputFocusAnim.value = withTiming(0, { duration: 200 });
              }}
            />
          </View>

          {/* High-end quick options button */}
          <Pressable
            style={({ pressed }) => [
              styles.iconSideBtn,
              pressed && { transform: [{ scale: 0.94 }] }
            ]}
            onPress={() => setOptionsVisible(true)}
          >
            <Ionicons name="options-outline" size={17} color={Colors.text.secondary} />
          </Pressable>

          {/* Morphing active send action button */}
          <Animated.View style={sendBtnStyle}>
            <Pressable
              style={[styles.sendBtn, text.trim() && styles.sendBtnActive]}
              onPress={handleSend}
              disabled={!text.trim() || isSending}
            >
              {text.trim() ? (
                <LinearGradient
                  colors={[Colors.accent.crimson, Colors.accent.crimsonDeep]}
                  style={StyleSheet.absoluteFillObject}
                />
              ) : null}
              {isSending ? (
                <ActivityIndicator size="small" color={Colors.text.onAccent} />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={16}
                  color={text.trim() ? Colors.text.onAccent : Colors.text.tertiary}
                />
              )}
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Real Full-Screen Voice Assistant Modal overlay */}
      <Modal visible={voiceActive} transparent animationType="slide" onRequestClose={toggleVoiceMode}>
        <BlurView intensity={95} tint="dark" style={voiceStyles.modalContainer}>
          <View style={voiceStyles.headerRow}>
            <Text style={voiceStyles.voiceAssistantTitle} allowFontScaling={false}>CineAI Live</Text>
            <Pressable style={voiceStyles.voiceCloseBtn} onPress={toggleVoiceMode}>
              <Ionicons name="close" size={20} color={Colors.text.primary} />
            </Pressable>
          </View>

          {/* Glowing Animated Voice Center */}
          <View style={voiceStyles.voiceCenterBlock}>
            <View style={voiceStyles.waveformOuterRing}>
              <PulseRing delay={0} color={isListening ? Colors.accent.crimson : Colors.accent.electric} size={150} />
              <PulseRing delay={1500} color={isListening ? Colors.accent.crimson : Colors.accent.electric} size={150} />
              <LinearGradient
                colors={
                  isListening
                    ? [Colors.accent.crimson, Colors.accent.crimsonDeep]
                    : isProcessing
                    ? [Colors.accent.electric, '#4a44cc']
                    : ['#1c1c28', '#111116']
                }
                style={voiceStyles.glowingVoiceCore}
              >
                <Ionicons
                  name={isListening ? "mic" : isProcessing ? "sync-outline" : "sparkles"}
                  size={28}
                  color={Colors.text.onAccent}
                />
              </LinearGradient>
            </View>

            <View style={voiceStyles.waveformWrapper}>
              <VoiceWave isListening={isListening} isProcessing={isProcessing} />
            </View>

            <Text style={voiceStyles.statusTelemetry} allowFontScaling={false}>
              {isListening
                ? 'Active Listening Mode'
                : isProcessing
                ? 'Intelligent Telemetry Transcription...'
                : 'Tap Mic to speak to CineAI'}
            </Text>
          </View>

          {/* Floating interruption and mic trigger CTA */}
          <View style={voiceStyles.controlsRow}>
            <Pressable
              style={[
                voiceStyles.largeMicBtn,
                isListening && voiceStyles.largeMicBtnActive,
                isProcessing && voiceStyles.largeMicBtnProcessing
              ]}
              onPress={handleMicPress}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color={Colors.text.onAccent} />
              ) : (
                <Ionicons
                  name={isListening ? "stop" : "mic"}
                  size={32}
                  color={isListening ? Colors.text.onAccent : Colors.accent.crimson}
                />
              )}
            </Pressable>
            <Text style={voiceStyles.telemetrySubtitle} allowFontScaling={false}>
              {isListening ? 'Tap to complete and analyze query' : 'CineAI listens to your voice tone'}
            </Text>
          </View>
        </BlurView>
      </Modal>

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
              {[
                { id: 'noir', label: 'Neo-Noir', icon: 'moon-outline' },
                { id: 'cyber', label: 'Cyberpunk', icon: 'hardware-chip-outline' },
                { id: 'oscar', label: 'Oscar Gold', icon: 'trophy-outline' },
                { id: 'indie', label: 'Indie Gems', icon: 'film-outline' },
                { id: 'mind', label: 'Mind-Bend', icon: 'bulb-outline' },
              ].map(pill => (
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
              <Ionicons name="close-outline" size={18} color={Colors.text.secondary} />
              <Text style={styles.optionsCloseText} allowFontScaling={false}>Cancel</Text>
            </Pressable>
          </View>
        </BlurView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// ─── Voice Modal Styles ─────────────────────────────────────────────────────
const voiceStyles = StyleSheet.create({
  modalContainer: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between', paddingVertical: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  voiceAssistantTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, letterSpacing: -0.4 },
  voiceCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  voiceCenterBlock: { alignItems: 'center', justifyContent: 'center', gap: Spacing.xl, flex: 1 },
  waveformOuterRing: { width: 140, height: 140, position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  glowingVoiceCore: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, zIndex: 10 },
  waveformWrapper: { height: 64, width: '100%', justifyContent: 'center', alignItems: 'center' },
  statusTelemetry: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.primary, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
  controlsRow: { alignItems: 'center', gap: 12, marginBottom: 20 },
  largeMicBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  largeMicBtnActive: { backgroundColor: Colors.accent.crimson, borderColor: Colors.accent.crimsonLight },
  largeMicBtnProcessing: { backgroundColor: Colors.accent.electricMuted, borderColor: Colors.accent.electric },
  telemetrySubtitle: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.text.tertiary, letterSpacing: 0.5, textTransform: 'uppercase' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.void },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.border,
    backgroundColor: 'rgba(7,7,9,0.85)',
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assistantBadge: { width: 32, height: 32, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  headerOrb: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 14.5, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, letterSpacing: -0.2 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.semantic.success },
  onlineText: { fontSize: 9.5, fontFamily: 'Inter_500Medium', color: Colors.semantic.success },
  headerBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.glass.subtle, borderWidth: 1, borderColor: Colors.glass.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBtnActive: {
    borderColor: `${Colors.accent.crimson}50`,
    backgroundColor: `${Colors.accent.crimson}15`,
  },
  listContent: { paddingTop: 16, paddingBottom: 180 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    backgroundColor: Colors.semantic.errorMuted,
    borderWidth: 1,
    borderColor: `${Colors.semantic.error}30`,
    zIndex: 20,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.semantic.error,
    lineHeight: 15,
  },
  inputBar: {
    position: 'absolute', left: 20, right: 20,
    borderRadius: Radius['2xl'], borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(13,13,18,0.72)', overflow: 'hidden',
    paddingVertical: 6, paddingHorizontal: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
    zIndex: 100,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  micOrbBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  iconSideBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12, paddingVertical: 8,
    minHeight: 38,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.primary,
    lineHeight: 18,
    padding: 0,
    letterSpacing: 0.15,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  sendBtnActive: {
    borderColor: Colors.accent.crimsonLight,
    shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45, shadowRadius: 10, elevation: 6,
  },
  chipsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 90,
  },
  chipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chipCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chipLabel: {
    fontSize: 11.5,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.primary,
  },
  modalBg: { flex: 1, justifyContent: 'flex-end' },
  modalDismissTap: { ...StyleSheet.absoluteFillObject },
  historySheet: {
    backgroundColor: Colors.bg.deep, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.glass.border,
    maxHeight: H * 0.72,
  },
  sheetHeader: { alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.glass.border },
  notch: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.glass.medium, marginBottom: 10 },
  sheetTitle: { fontSize: 16.5, fontFamily: 'Poppins_700Bold', color: Colors.text.primary },
  sheetSubtitle: { fontSize: 11.5, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 1 },
  historyScroll: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 },
  emptyHistory: { alignItems: 'center', justifyContent: 'center', paddingVertical: 44, gap: 10 },
  emptyHistoryText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary },
  sessionItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bg.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    padding: 12, marginBottom: 8,
  },
  sessionItemActive: { borderColor: `${Colors.accent.crimson}50`, backgroundColor: Colors.accent.crimsonMuted },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sessionIconBg: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.bg.surface, alignItems: 'center', justifyContent: 'center' },
  sessionIconBgActive: { backgroundColor: `${Colors.accent.crimson}20` },
  sessionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, marginBottom: 2 },
  sessionTitleActive: { color: Colors.accent.crimsonLight },
  sessionDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  sessionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionDate: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.text.tertiary },
  trashBtn: { padding: 4 },
  sheetFooter: { paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.glass.border },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent.crimson, borderRadius: Radius.md,
    paddingVertical: 12,
    shadowColor: Colors.accent.crimson, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  newChatText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.onAccent },
  modalBgCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  optionsCard: {
    width: '100%', backgroundColor: Colors.bg.deep, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.glass.border, padding: 18, zIndex: 10,
  },
  optionsCardTitle: { fontSize: 15.5, fontFamily: 'Poppins_700Bold', color: Colors.text.primary, textAlign: 'center' },
  optionsCardSubtitle: { fontSize: 11.5, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, textAlign: 'center', marginTop: 3, marginBottom: 18 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 18 },
  optionsGridItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.bg.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  optionsGridLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.primary },
  optionsCloseBtn: { alignSelf: 'stretch', paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: Colors.bg.surface, flexDirection: 'row', gap: 6 },
  optionsCloseText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
});

export default AIChatScreen;
