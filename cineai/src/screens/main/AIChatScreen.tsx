import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Linking,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  interpolate,
  Extrapolate,
  SharedValue,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';
import { useChatStore } from '../../store/chatStore';
import { useWatchlistStore } from '../../store/watchlistStore';
import { getPosterUrl } from '../../services/omdbApi';
import { VoiceWave } from '../../components/ui/VoiceWave';
import { Movie, ChatMessage } from '../../types';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.82;

const QUICK_PROMPTS = [
  { icon: 'film-outline', text: 'Dark psychological thrillers' },
  { icon: 'happy-outline', text: 'Feel-good comedies tonight' },
  { icon: 'planet-outline', text: 'Mind-bending sci-fi films' },
  { icon: 'heart-outline', text: 'Romantic like The Notebook' },
  { icon: 'globe-outline', text: 'Award-winning foreign films' },
  { icon: 'trophy-outline', text: 'Best films of the decade' },
];

const MOCK_SPEECH_QUERIES = [
  "Recommend some dark psychological thrillers with crazy plot twists",
  "Suggest a feel-good comedy movie for tonight",
  "Tell me about some mind-bending sci-fi movies like Interstellar",
  "I want to watch a breathtaking cinematic masterpiece with beautiful visuals",
  "Are there any award-winning foreign films you recommend?",
  "Suggest a high-concept mystery movie that keeps me guessing till the end"
];

// ─── Typing Indicator ──────────────────────────────────────────────────────
const TypingIndicator: React.FC = React.memo(() => {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    const animate = (val: SharedValue<number>, delay: number) => {
      setTimeout(() => {
        val.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 }),
          ),
          -1,
          false
        );
      }, delay);
    };
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  const d1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const d2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const d3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={typingStyles.container}>
      <View style={typingStyles.aiAvatar}>
        <Ionicons name="sparkles" size={12} color={Colors.primary} />
      </View>
      <View style={typingStyles.bubble}>
        <Animated.View style={[typingStyles.dot, d1]} />
        <Animated.View style={[typingStyles.dot, d2]} />
        <Animated.View style={[typingStyles.dot, d3]} />
      </View>
    </View>
  );
});

const typingStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  bubble: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    borderBottomLeftRadius: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});

// ─── Premium Tactile Suggestion Chip ───────────────────────────────────────
interface SuggestionChipProps {
  prompt: { icon: string; text: string };
  onPress: () => void;
}

const SuggestionChip: React.FC<SuggestionChipProps> = React.memo(({ prompt, onPress }) => {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96);
  }, []);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, { flex: 1 }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.quickPrompt}
      >
        <Ionicons name={prompt.icon as any} size={14} color={Colors.primary} />
        <Text style={styles.quickPromptText} numberOfLines={1}>
          {prompt.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

// ─── Netflix + Letterboxd Recommendation Card ──────────────────────────────
const RecommendationCard: React.FC<{ movie: Movie; onPress: (m: Movie) => void }> = React.memo(({ movie, onPress }) => {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
  const isSaved = isInWatchlist(movie.id);

  const handleWatchlistPress = useCallback((e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (isSaved) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  }, [isSaved, movie]);

  const handlePlayTrailer = useCallback((e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const searchName = movie.original_title || movie.title;
    Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchName + ' official trailer')}`).catch(() => {});
  }, [movie]);

  const handleCardPress = useCallback(() => {
    onPress(movie);
  }, [movie, onPress]);

  return (
    <Pressable onPress={handleCardPress} style={chatStyles.recCard}>
      <Image
        source={{ uri: getPosterUrl(movie.poster_path) }}
        style={chatStyles.recPoster}
        contentFit="cover"
        transition={200}
      />
      <LinearGradient
        colors={['transparent', 'rgba(10,10,15,0.7)', 'rgba(10,10,15,0.98)']}
        style={StyleSheet.absoluteFill}
      />
      
      <Pressable onPress={handleWatchlistPress} style={chatStyles.bookmarkBtn}>
        <Ionicons 
          name={isSaved ? "bookmark" : "bookmark-outline"} 
          size={13} 
          color={isSaved ? Colors.primary : Colors.white} 
        />
      </Pressable>

      <View style={chatStyles.recInfo}>
        <Text style={chatStyles.recTitle} numberOfLines={1}>{movie.title}</Text>
        
        <View style={chatStyles.recMetaRow}>
          <Text style={chatStyles.recYear}>{movie.release_date?.split('-')[0] || 'N/A'}</Text>
          <View style={chatStyles.recRating}>
            <Ionicons name="star" size={10} color={Colors.gold} />
            <Text style={chatStyles.recRatingText}>{movie.vote_average?.toFixed(1) || '0.0'}</Text>
          </View>
        </View>

        <Text style={chatStyles.recDetails} numberOfLines={1}>
          Match: {Math.floor(85 + (movie.vote_average || 0) * 1.5)}% • Cinematic
        </Text>

        <View style={chatStyles.recActionsRow}>
          <Pressable onPress={handlePlayTrailer} style={chatStyles.trailerBtn}>
            <Ionicons name="logo-youtube" size={11} color={Colors.white} />
            <Text style={chatStyles.actionBtnText}>Trailer</Text>
          </Pressable>
          <Pressable onPress={handleCardPress} style={chatStyles.infoBtn}>
            <Ionicons name="information-circle-outline" size={11} color={Colors.white} />
            <Text style={chatStyles.actionBtnText}>Details</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

const chatStyles = StyleSheet.create({
  recCard: {
    width: 154,
    height: 236,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.md,
  },
  recPoster: { ...StyleSheet.absoluteFillObject },
  bookmarkBtn: {
    position: 'absolute',
    top: Spacing.xs + 2,
    right: Spacing.xs + 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(10,10,15,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.whiteAlpha10,
    zIndex: 10,
  },
  recInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  recTitle: {
    color: Colors.white,
    fontSize: Typography.xs + 1,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  recMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  recYear: { color: Colors.textSecondary, fontSize: 10, fontFamily: 'Inter_400Regular' },
  recRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  recRatingText: { color: Colors.gold, fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  recDetails: {
    color: Colors.textTertiary,
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    marginBottom: Spacing.xs + 2,
  },
  recActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  trailerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  infoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: Colors.surface,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
  },
});

// ─── Message Bubble ────────────────────────────────────────────────────────
interface MessageBubbleProps {
  message: ChatMessage;
  onMoviePress: (m: Movie) => void;
  isSpeaking: boolean;
  onSpeakToggle: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  onMoviePress,
  isSpeaking,
  onSpeakToggle,
}) => {
  const isUser = message.role === 'user';
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1, { duration: 250 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI, style]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={13} color={Colors.primary} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI, { maxWidth: width * 0.78 }]}>
        {isUser ? (
          <Text style={[styles.bubbleText, styles.bubbleTextUser]}>{message.content}</Text>
        ) : (
          <View style={styles.bubbleHeaderRow}>
            <Text style={[styles.bubbleText, { flex: 1 }]}>{message.content}</Text>
            <Pressable onPress={onSpeakToggle} style={styles.speakIconBtn} hitSlop={8}>
              <Ionicons
                name={isSpeaking ? 'volume-mute-outline' : 'volume-medium-outline'}
                size={16}
                color={isSpeaking ? Colors.primary : Colors.textSecondary}
              />
            </Pressable>
          </View>
        )}

        {/* Movie Recommendations List */}
        {!isUser && message.movies && message.movies.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.recsScroll}
            contentContainerStyle={styles.recsContent}
          >
            {message.movies.map(rec => (
              <RecommendationCard
                key={rec.movie.id}
                movie={rec.movie}
                onPress={onMoviePress}
              />
            ))}
          </ScrollView>
        )}

        {/* Mood Tags */}
        {!isUser && message.movies && message.movies.length > 0 && message.movies[0]?.mood_tags && message.movies[0].mood_tags.length > 0 && (
          <View style={styles.moodTagsRow}>
            {message.movies[0].mood_tags.slice(0, 4).map(tag => (
              <View key={tag} style={styles.moodTag}>
                <Text style={styles.moodTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
});

export const AIChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { 
    currentSession, 
    sendMessage, 
    isSending, 
    clearCurrentSession, 
    sessions, 
    loadSessions, 
    loadSession, 
    deleteSession 
  } = useChatStore();
  
  const [inputText, setInputText] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [wasVoiceRequest, setWasVoiceRequest] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const recognitionRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Animated Drawer Translation
  const drawerTranslateX = useSharedValue(-DRAWER_WIDTH);
  const micScale = useSharedValue(1);

  const messages = currentSession?.messages || [];

  useEffect(() => {
    loadSessions();
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      Speech.stop().catch(() => {});
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const bottomPadding = isKeyboardVisible 
    ? (Platform.OS === 'ios' ? Spacing.sm : Spacing.xs)
    : (Platform.OS === 'ios' ? 88 + Spacing.xs : 68 + Spacing.xs);

  // Pulsating mic scale when listening
  useEffect(() => {
    if (isListening) {
      micScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400 }),
          withTiming(1.0, { duration: 400 }),
        ),
        -1,
        true
      );
    } else {
      micScale.value = 1;
    }
  }, [isListening]);

  // Auto-play text-to-speech if the query was asked via voice
  useEffect(() => {
    if (messages.length > 0 && wasVoiceRequest && !isSending) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== 'user') {
        const timer = setTimeout(() => {
          handleSpeakToggle(lastMessage.id, lastMessage.content);
        }, 500);
        setWasVoiceRequest(false);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, wasVoiceRequest, isSending]);

  const toggleDrawer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const toValue = drawerOpen ? -DRAWER_WIDTH : 0;
    drawerTranslateX.value = withSpring(toValue, { damping: 18, stiffness: 120 });
    setDrawerOpen(!drawerOpen);
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => {
    if (drawerOpen) {
      drawerTranslateX.value = withSpring(-DRAWER_WIDTH, { damping: 18, stiffness: 120 });
      setDrawerOpen(false);
    }
  }, [drawerOpen]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setInputText('');
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await sendMessage(text);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  }, [inputText, isSending, sendMessage]);

  const sendVoiceMessage = useCallback(async (text: string) => {
    setWasVoiceRequest(true);
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await sendMessage(text);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  }, [sendMessage]);

  const handleQuickPrompt = useCallback(async (prompt: string) => {
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await sendMessage(prompt);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  }, [sendMessage]);

  const handleSpeakToggle = useCallback(async (messageId: string, content: string) => {
    if (speakingId === messageId) {
      Speech.stop();
      setSpeakingId(null);
    } else {
      setSpeakingId(messageId);
      Speech.speak(content, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.95,
        onDone: () => setSpeakingId(null),
        onStopped: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
    }
  }, [speakingId]);

  const handleMicPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    
    const SpeechRecognition = typeof window !== 'undefined' && 
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    
    if (SpeechRecognition) {
      if (isListening) {
        setIsListening(false);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (_) {}
        }
      } else {
        setIsListening(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            sendVoiceMessage(transcript);
          }
        };
        
        recognition.onerror = () => {
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
        recognition.start();
      }
    } else {
      // Mobile fallback/dictation dialog
      Alert.alert(
        'Voice Assistant',
        'Direct system voice dictation is currently processing. Would you like to try a curated movie request query, or activate your mobile keyboard dictation?',
        [
          {
            text: 'Try Curated Sample',
            onPress: () => {
              setIsListening(true);
              setTimeout(() => {
                setIsListening(false);
                const randomQuery = MOCK_SPEECH_QUERIES[Math.floor(Math.random() * MOCK_SPEECH_QUERIES.length)];
                let currentText = '';
                let index = 0;
                
                const typeCharacter = () => {
                  if (index < randomQuery.length) {
                    currentText += randomQuery[index];
                    setInputText(currentText);
                    index++;
                    typingTimeoutRef.current = setTimeout(typeCharacter, 22);
                  } else {
                    setTimeout(() => {
                      sendVoiceMessage(randomQuery);
                    }, 500);
                  }
                };
                
                typeCharacter();
              }, 1200);
            }
          },
          {
            text: 'Keyboard Dictation',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setTimeout(() => {
                inputRef.current?.focus();
              }, 150);
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  }, [isListening, sendVoiceMessage]);

  const navigateToMovie = useCallback((movie: Movie) => {
    navigation.navigate('MovieDetails', { movieId: movie.id });
  }, [navigation]);

  // Reanimated styling
  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerTranslateX.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      drawerTranslateX.value,
      [-DRAWER_WIDTH, 0],
      [0, 0.65],
      Extrapolate.CLAMP
    ),
  }));

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => (
    <MessageBubble
      message={item}
      onMoviePress={navigateToMovie}
      isSpeaking={speakingId === item.id}
      onSpeakToggle={() => handleSpeakToggle(item.id, item.content)}
    />
  ), [speakingId, navigateToMovie, handleSpeakToggle]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.background }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={toggleDrawer} style={styles.menuBtn} hitSlop={12}>
              <Ionicons name="menu-outline" size={24} color={Colors.textPrimary} />
            </Pressable>
            <View style={styles.aiOrbSmall}>
              <Ionicons name="sparkles" size={14} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Cine AI</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerSubtitle}>Personal Movie Critic</Text>
              </View>
            </View>
          </View>
          <Pressable 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              clearCurrentSession();
            }} 
            style={styles.newChatBtnHeader} 
            hitSlop={8}
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={styles.newChatTextHeader}>New</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'space-between' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List with senior FlatList optimizations */}
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <View style={styles.emptyChatOrbWrapper}>
                <View style={styles.emptyChatOrbRing} />
                <View style={styles.emptyChatOrb}>
                  <Ionicons name="sparkles" size={32} color={Colors.primary} />
                </View>
              </View>
              <Text style={styles.emptyChatTitle}>Cine AI Assistant</Text>
              <Text style={styles.emptyChatSubtitle}>
                Tell me your mood, favorite genres, or ask me for curated cinematic suggestions!
              </Text>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.quickPromptsScrollContent}
                style={styles.quickPromptsScroll}
              >
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <SuggestionChip 
                    key={idx}
                    prompt={prompt} 
                    onPress={() => handleQuickPrompt(prompt.text)} 
                  />
                ))}
              </ScrollView>
            </View>
          }
          renderItem={renderItem}
          ListFooterComponent={isSending ? <TypingIndicator /> : null}
        />

        {/* Dynamic Voice Overlay UI */}
        {isListening && (
          <View style={styles.voiceOverlay}>
            <LinearGradient
              colors={['rgba(10,10,15,0.92)', 'rgba(17,17,24,0.98)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.voiceOverlayContent}>
              <View style={styles.breathOrbOuter}>
                <Animated.View style={[styles.breathOrbInner, micAnimatedStyle]}>
                  <Ionicons name="mic" size={32} color={Colors.white} />
                </Animated.View>
              </View>
              <Text style={styles.voiceOverlayTitle}>Cine Voice Assistant</Text>
              <Text style={styles.voiceOverlayStatus}>Say something like "I want space movies"...</Text>
              
              <VoiceWave isListening={isListening} isProcessing={isSending} />
              
              <Pressable onPress={handleMicPress} style={styles.stopVoiceBtn}>
                <Ionicons name="close" size={20} color={Colors.white} />
                <Text style={styles.stopVoiceBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: bottomPadding }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message Cine AI..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={400}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSend}
            />
            
            <Animated.View style={micAnimatedStyle}>
              <Pressable
                onPress={handleMicPress}
                style={styles.micBtn}
                hitSlop={12}
              >
                <Ionicons name="mic-outline" size={20} color={Colors.textSecondary} />
              </Pressable>
            </Animated.View>

            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
              style={[styles.sendBtn, (!inputText.trim() || isSending) && styles.sendBtnDisabled]}
              hitSlop={12}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="arrow-up" size={18} color={Colors.white} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* History Drawer Backdrop */}
      {drawerOpen && (
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable onPress={closeDrawer} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}

      {/* Sliding History Drawer */}
      <Animated.View style={[styles.drawerContainer, drawerAnimatedStyle]}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerHeaderTitle}>Conversations</Text>
            <Pressable onPress={closeDrawer} hitSlop={15}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* New Chat CTA */}
          <Pressable 
            onPress={() => {
              clearCurrentSession();
              closeDrawer();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            }}
            style={styles.drawerNewChatBtn}
          >
            <Ionicons name="add" size={18} color={Colors.white} />
            <Text style={styles.drawerNewChatBtnText}>New Conversation</Text>
          </Pressable>

          <ScrollView 
            style={styles.drawerScrollView} 
            contentContainerStyle={styles.drawerScrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {sessions.length === 0 ? (
              <View style={styles.drawerEmptyState}>
                <Ionicons name="chatbubbles-outline" size={28} color={Colors.textMuted} />
                <Text style={styles.drawerEmptyText}>No previous chats</Text>
              </View>
            ) : (
              sessions.map(sess => {
                const isActive = currentSession?.id === sess.id;
                return (
                  <View 
                    key={sess.id} 
                    style={[styles.drawerSessionRow, isActive && styles.drawerSessionRowActive]}
                  >
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        loadSession(sess.id);
                        closeDrawer();
                      }}
                      style={{ flex: 1 }}
                    >
                      <Text 
                        style={[styles.drawerSessionTitle, isActive && styles.drawerSessionTitleActive]} 
                        numberOfLines={1}
                      >
                        {sess.title || 'Untitled Chat'}
                      </Text>
                      <Text style={styles.drawerSessionTime}>
                        {new Date(sess.updated_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </Pressable>
                    
                    <Pressable 
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                        deleteSession(sess.id);
                      }}
                      style={styles.drawerDeleteBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={15} color={Colors.textMuted} />
                    </Pressable>
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  menuBtn: {
    paddingRight: Spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiOrbSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.base + 2, fontFamily: 'Poppins_600SemiBold' },
  headerSubtitle: { color: Colors.textSecondary, fontSize: Typography.xs, fontFamily: 'Inter_500Medium' },
  newChatBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  newChatTextHeader: { color: Colors.primary, fontSize: Typography.xs + 1, fontFamily: 'Inter_600SemiBold' },

  // Messages List
  messagesList: { paddingVertical: Spacing.md, paddingBottom: 24 },
  messageRow: { flexDirection: 'row', marginVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAI: { justifyContent: 'flex-start', alignItems: 'flex-end', gap: Spacing.sm },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  bubble: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bubbleAI: {
    backgroundColor: Colors.surfaceElevated,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleText: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
    lineHeight: Typography.base * 1.55,
  },
  bubbleTextUser: { color: Colors.white },
  bubbleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  speakIconBtn: {
    padding: Spacing.xs,
    marginRight: -Spacing.xs,
    marginTop: 1,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  recsScroll: { marginTop: Spacing.md, marginHorizontal: -Spacing.xs },
  recsContent: { paddingHorizontal: Spacing.xs, gap: Spacing.sm },
  moodTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  moodTag: {
    backgroundColor: Colors.indigoMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.indigo,
  },
  moodTagText: { color: Colors.indigoLight, fontSize: Typography.xs, fontFamily: 'Inter_500Medium' },

  // Empty Chat State
  emptyChat: { alignItems: 'center', paddingTop: 24, paddingHorizontal: Spacing.xl },
  emptyChatOrbWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyChatOrbRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: Colors.primary,
    opacity: 0.35,
  },
  emptyChatOrb: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  emptyChatTitle: {
    color: Colors.textPrimary,
    fontSize: Typography['2xl'] + 2,
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs + 2,
  },
  emptyChatSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.base - 1,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: Typography.base * 1.5,
    marginBottom: Spacing.xl + 4,
  },
  quickPromptsScroll: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    width: '100%',
  },
  quickPromptsScrollContent: {
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  quickPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 38,
  },
  quickPromptText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs + 1,
    fontFamily: 'Inter_500Medium',
  },

  // Input Bar
  inputBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg + 2 : Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    minHeight: 50,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: 'Inter_400Regular',
    maxHeight: 120,
    paddingTop: 0,
    paddingBottom: 0,
  },
  micBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },

  // Sliding History Drawer
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 90,
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: 'rgba(17, 17, 24, 0.98)',
    borderRightWidth: 1,
    borderColor: Colors.border,
    zIndex: 100,
    paddingHorizontal: Spacing.lg,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  drawerHeaderTitle: {
    color: Colors.white,
    fontSize: Typography.lg,
    fontFamily: 'Poppins_600SemiBold',
  },
  drawerNewChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  drawerNewChatBtnText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontFamily: 'Inter_600SemiBold',
  },
  drawerScrollView: { flex: 1 },
  drawerScrollViewContent: { paddingBottom: Spacing['4xl'] },
  drawerEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.sm,
  },
  drawerEmptyText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontFamily: 'Inter_500Medium',
  },
  drawerSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  drawerSessionRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  drawerSessionTitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: 'Inter_500Medium',
  },
  drawerSessionTitleActive: {
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
  },
  drawerSessionTime: {
    color: Colors.textTertiary,
    fontSize: 10,
    marginTop: 4,
  },
  drawerDeleteBtn: { padding: Spacing.xs },

  // Voice Overlay System
  voiceOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceOverlayContent: {
    width: '85%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  breathOrbOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(230, 57, 70, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.15)',
  },
  breathOrbInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  voiceOverlayTitle: {
    color: Colors.white,
    fontSize: Typography.xl + 2,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.2,
  },
  voiceOverlayStatus: {
    color: Colors.textSecondary,
    fontSize: Typography.base - 1,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: Typography.base * 1.5,
    marginBottom: Spacing.sm,
  },
  stopVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xl,
  },
  stopVoiceBtnText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontFamily: 'Inter_600SemiBold',
  },
});

export default AIChatScreen;
