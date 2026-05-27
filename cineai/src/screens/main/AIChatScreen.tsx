import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = () => {};

try {
  const SpeechRec = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = SpeechRec.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = SpeechRec.useSpeechRecognitionEvent;
} catch (e) {
  console.warn('[AIChatScreen] expo-speech-recognition native module not found. Voice recognition will be disabled.', e);
}
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Typography } from '../../constants/theme';
import { useBackendStatusStore } from '../../store/backendStatusStore';
import { useChatStore } from '../../store/chatStore';
import type { ChatMessage, ChatSession, Movie, MovieRecommendation } from '../../types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface StarterPrompt {
  id: string;
  icon: IoniconName;
  title: string;
  prompt: string;
}

const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: 'mood',
    icon: 'moon-outline',
    title: 'Match my mood',
    prompt: 'I want something atmospheric, emotional, and beautifully shot for tonight.',
  },
  {
    id: 'surprise',
    icon: 'shuffle-outline',
    title: 'Surprise me',
    prompt: 'Recommend movies I might not expect to love, but probably will.',
  },
  {
    id: 'prestige',
    icon: 'trophy-outline',
    title: 'Prestige picks',
    prompt: 'Give me award-worthy films with excellent writing and performances.',
  },
  {
    id: 'thrill',
    icon: 'flash-outline',
    title: 'High tension',
    prompt: 'Find a tense thriller that grabs attention from the first scene.',
  },
  {
    id: 'worlds',
    icon: 'planet-outline',
    title: 'Worldbuilding',
    prompt: 'Suggest immersive sci-fi or fantasy worlds with strong cinematic scale.',
  },
  {
    id: 'hidden',
    icon: 'diamond-outline',
    title: 'Hidden gems',
    prompt: 'Show me underrated films with a strong emotional payoff.',
  },
];

const statusCopy = (backendStatus: 'SLEEPING' | 'AWAKE', hasError: boolean) => {
  if (hasError) {
    return {
      label: 'Fallback',
      color: Colors.semantic.error,
      description: 'Local recovery active',
    };
  }

  if (backendStatus === 'AWAKE') {
    return {
      label: 'Online',
      color: Colors.semantic.success,
      description: 'Premium',
    };
  }

  return {
    label: 'Fallback',
    color: Colors.semantic.error,
    description: 'Quick AI',
  };
};

const yearFromDate = (date?: string): string => {
  if (!date || date.length < 4) return '';
  return date.slice(0, 4);
};

const cleanSpeechText = (content: string): string => {
  return content
    .replace(/[*#`_~>\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 900);
};

const movieMeta = (movie: Movie): string => {
  const year = yearFromDate(movie.release_date);
  const rating = movie.vote_average > 0 ? `${movie.vote_average.toFixed(1)} TMDB` : 'TMDB';
  return [year, rating].filter(Boolean).join(' | ');
};

const AIIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <View style={[styles.aiIcon, { width: size, height: size, borderRadius: size / 2 }]}>
    <Ionicons name="sparkles" size={Math.max(12, size * 0.42)} color={Colors.accent.crimsonLight} />
  </View>
);

const TypingIndicator: React.FC = () => (
  <View style={styles.typingRow}>
    <AIIcon size={26} />
    <View style={styles.typingBubble}>
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
    </View>
  </View>
);

const RecommendationCard: React.FC<{
  recommendation: MovieRecommendation;
  onPress: (movie: Movie) => void;
}> = ({ recommendation, onPress }) => {
  const movie = recommendation.movie;

  return (
    <Pressable style={styles.recCard} onPress={() => onPress(movie)}>
      <Image
        source={{ uri: movie.poster_path || movie.backdrop_path || undefined }}
        style={styles.recPoster}
        contentFit="cover"
        transition={180}
        cachePolicy="memory-disk"
      />
      <View style={styles.recTextWrap}>
        <Text style={styles.recTitle} numberOfLines={2} allowFontScaling={false}>
          {movie.title}
        </Text>
        <Text style={styles.recMeta} numberOfLines={1} allowFontScaling={false}>
          {movieMeta(movie)}
        </Text>
        <Text style={styles.recReason} numberOfLines={3} allowFontScaling={false}>
          {recommendation.reason || 'Matched to your cinematic request.'}
        </Text>
      </View>
    </Pressable>
  );
};

const MessageRow: React.FC<{
  message: ChatMessage;
  onMoviePress: (movie: Movie) => void;
}> = ({ message, onMoviePress }) => {
  const isUser = message.role === 'user';
  const recommendations = message.movies || [];

  return (
    <View style={[styles.messageRow, isUser && styles.userMessageRow]}>
      {!isUser ? <AIIcon size={28} /> : null}
      <View style={[styles.messageStack, isUser && styles.userMessageStack]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]} allowFontScaling={false}>
            {message.content}
          </Text>
        </View>

        {recommendations.length > 0 ? (
          <FlatList
            data={recommendations}
            keyExtractor={(item, index) => `rec-${item.movie.id}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <RecommendationCard recommendation={item} onPress={onMoviePress} />
            )}
            contentContainerStyle={styles.recRail}
          />
        ) : null}
      </View>
    </View>
  );
};

const EmptyChat: React.FC<{
  onPrompt: (prompt: string) => void;
}> = ({ onPrompt }) => (
  <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.emptyContent}
    keyboardShouldPersistTaps="handled"
  >
    <View style={styles.emptyHero}>
      <AIIcon size={44} />
      <Text style={styles.emptyTitle} allowFontScaling={false}>What should we watch?</Text>
      <Text style={styles.emptySubtitle} allowFontScaling={false}>
        Ask for a mood, a director, a genre, a hidden gem, or a streaming-style shortlist.
      </Text>
    </View>

    <View style={styles.promptGrid}>
      {STARTER_PROMPTS.map(prompt => (
        <Pressable
          key={prompt.id}
          style={({ pressed }) => [styles.promptCard, pressed && styles.pressedCard]}
          onPress={() => onPrompt(prompt.prompt)}
        >
          <View style={styles.promptIcon}>
            <Ionicons name={prompt.icon} size={16} color={Colors.accent.crimsonLight} />
          </View>
          <Text style={styles.promptTitle} allowFontScaling={false}>{prompt.title}</Text>
          <Text style={styles.promptText} numberOfLines={3} allowFontScaling={false}>
            {prompt.prompt}
          </Text>
        </Pressable>
      ))}
    </View>
  </ScrollView>
);

const HistoryModal: React.FC<{
  visible: boolean;
  sessions: ChatSession[];
  activeId?: string;
  bottomInset: number;
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ visible, sessions, activeId, bottomInset, onClose, onSelect, onDelete }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalRoot}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.historySheet, { paddingBottom: bottomInset + 14 }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle} allowFontScaling={false}>Chat History</Text>
        <Text style={styles.sheetSubtitle} allowFontScaling={false}>Resume a conversation or clear old threads.</Text>

        <ScrollView contentContainerStyle={styles.historyList} showsVerticalScrollIndicator={false}>
          {sessions.length === 0 ? (
            <View style={styles.historyEmpty}>
              <Ionicons name="chatbubble-ellipses-outline" size={28} color={Colors.text.tertiary} />
              <Text style={styles.historyEmptyText} allowFontScaling={false}>No conversations yet.</Text>
            </View>
          ) : (
            sessions.map(session => {
              const firstMessage = session.messages?.[0]?.content;
              const lastMessage = session.messages?.[session.messages.length - 1]?.content;
              const title = session.title === 'New Chat' && firstMessage ? firstMessage : session.title;
              const active = session.id === activeId;

              return (
                <Pressable
                  key={session.id}
                  style={[styles.historyItem, active && styles.historyItemActive]}
                  onPress={() => onSelect(session.id)}
                >
                  <View style={styles.historyCopy}>
                    <Text style={[styles.historyTitle, active && styles.historyTitleActive]} numberOfLines={1} allowFontScaling={false}>
                      {title || 'New Chat'}
                    </Text>
                    <Text style={styles.historyPreview} numberOfLines={1} allowFontScaling={false}>
                      {lastMessage || 'Empty conversation'}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.historyDelete}
                    onPress={() => onDelete(session.id)}
                    hitSlop={10}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.text.tertiary} />
                  </Pressable>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export const AIChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { status: backendStatus } = useBackendStatusStore();
  const {
    sessions,
    currentSession,
    isSending,
    error,
    sendMessage,
    createSession,
    loadSession,
    deleteSession,
    loadSessions,
  } = useChatStore();

  const [text, setText] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInput>(null);
  const transcriptRef = useRef('');
  const submitVoiceOnEndRef = useRef(false);
  const voiceResponsePendingRef = useRef(false);
  const lastSpokenAssistantIdRef = useRef<string | null>(null);

  const messages = currentSession?.messages || [];
  const isEmpty = messages.length === 0;
  const status = statusCopy(backendStatus, Boolean(error || voiceError));
  const composerBottomPadding = isKeyboardVisible ? 10 : insets.bottom + 72;
  const canSendText = text.trim().length > 0 && !isSending;
  const rightIconName: IoniconName = canSendText ? 'arrow-up' : isRecognizing ? 'stop' : 'mic-outline';

  useSpeechRecognitionEvent('start', () => {
    setIsRecognizing(true);
    setVoiceError(null);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim() || '';
    if (!transcript) return;

    transcriptRef.current = transcript;
    setVoiceTranscript(transcript);
    setText(transcript);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsRecognizing(false);
    submitVoiceOnEndRef.current = false;
    const message = event.error === 'no-speech' || event.error === 'speech-timeout'
      ? 'I did not catch that. Tap the mic and try again.'
      : event.message || 'Voice recognition is unavailable right now.';
    setVoiceError(message);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecognizing(false);
    const transcript = transcriptRef.current.trim();
    const shouldSubmit = submitVoiceOnEndRef.current;
    submitVoiceOnEndRef.current = false;

    if (shouldSubmit && transcript) {
      void sendPrompt(transcript, 'voice');
    }
  });

  const openMovieDetails = useCallback((movie: Movie) => {
    navigation.navigate('MovieDetails', {
      movieId: movie.id,
      imdbId: movie.imdb_id || movie.imdbID,
      movieTitle: movie.title,
      releaseYear: yearFromDate(movie.release_date),
      movie,
    });
  }, [navigation]);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
  }, []);

  const speakAssistantResponse = useCallback((content: string) => {
    if (isMuted) return;

    const clean = cleanSpeechText(content);
    if (!clean) return;

    Speech.stop();
    Speech.speak(clean, {
      language: 'en-US',
      pitch: 1,
      rate: 0.98,
    });
  }, [isMuted]);

  const sendPrompt = useCallback(async (prompt: string, source: 'text' | 'voice' = 'text') => {
    const trimmed = prompt.trim();
    if (!trimmed || isSending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setText('');
    setVoiceTranscript('');
    setVoiceError(null);
    stopSpeaking();

    if (source === 'voice') {
      voiceResponsePendingRef.current = true;
    }

    await sendMessage(trimmed);
  }, [isSending, sendMessage, stopSpeaking]);

  const handleRightAction = useCallback(async () => {
    if (canSendText) {
      await sendPrompt(text, 'text');
      return;
    }

    if (isSending) return;

    if (isRecognizing) {
      submitVoiceOnEndRef.current = true;
      ExpoSpeechRecognitionModule?.stop();
      return;
    }

    try {
      if (!ExpoSpeechRecognitionModule) {
        setVoiceError('Speech recognition is not available in Expo Go. Please use a development build.');
        return;
      }

      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!available) {
        setVoiceError('Speech recognition is not available on this device.');
        return;
      }

      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setVoiceError('Microphone and speech recognition permission are required.');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      transcriptRef.current = '';
      submitVoiceOnEndRef.current = true;
      setVoiceTranscript('');
      setText('');
      setVoiceError(null);
      stopSpeaking();

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
        contextualStrings: [
          'movie',
          'film',
          'director',
          'actor',
          'thriller',
          'sci-fi',
          'anime',
          'Bollywood',
          'Korean thriller',
          'CineAI',
        ],
      });
    } catch (err) {
      console.log('Speech recognition start failed:', err);
      submitVoiceOnEndRef.current = false;
      setIsRecognizing(false);
      setVoiceError('Could not start voice recognition.');
    }
  }, [canSendText, isRecognizing, isSending, sendPrompt, stopSpeaking, text]);

  const handleNewChat = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    stopSpeaking();
    setText('');
    setVoiceTranscript('');
    setVoiceError(null);
    await createSession();
  }, [createSession, stopSpeaking]);

  const handlePrompt = useCallback((prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setText(prompt);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const selectHistorySession = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    stopSpeaking();
    loadSession(id);
    setHistoryVisible(false);
  }, [loadSession, stopSpeaking]);

  const removeHistorySession = useCallback((id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    deleteSession(id);
  }, [deleteSession]);

  const toggleMute = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsMuted(prev => {
      const next = !prev;
      if (next) stopSpeaking();
      return next;
    });
  }, [stopSpeaking]);

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

    void initializeChat();
  }, [createSession, loadSession, loadSessions]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 90);
  }, [messages.length]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;
    if (!voiceResponsePendingRef.current) return;
    if (lastSpokenAssistantIdRef.current === lastMessage.id) return;

    lastSpokenAssistantIdRef.current = lastMessage.id;
    voiceResponsePendingRef.current = false;
    speakAssistantResponse(lastMessage.content);
  }, [messages, speakAssistantResponse]);

  useEffect(() => {
    return () => {
      try {
        ExpoSpeechRecognitionModule?.abort();
      } catch {
        // no-op
      }
      Speech.stop();
    };
  }, []);

  const contentWidth = useMemo(() => Math.min(width, 560), [width]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.void} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.headerButton}
            onPress={() => {
              stopSpeaking();
              navigation.navigate('Home');
            }}
            accessibilityRole="button"
            accessibilityLabel="Go to Home"
          >
            <Ionicons name="home-outline" size={18} color={Colors.text.secondary} />
          </Pressable>

          <AIIcon size={34} />

          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle} allowFontScaling={false}>CineAI</Text>
              <View style={styles.premiumPill}>
                <Text style={styles.premiumText} allowFontScaling={false}>Premium</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]} allowFontScaling={false}>
                {status.label}
              </Text>
              <Text style={styles.statusMutedText} allowFontScaling={false}>
                {status.description}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerButton}
            onPress={toggleMute}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Unmute voice responses' : 'Mute voice responses'}
          >
            <Ionicons
              name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
              size={18}
              color={isMuted ? Colors.text.tertiary : Colors.text.secondary}
            />
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={() => setHistoryVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Open chat history"
          >
            <Ionicons name="time-outline" size={18} color={Colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.conversationShell}>
        <View style={[styles.contentWidth, { maxWidth: contentWidth }]}>
          {isEmpty ? (
            <EmptyChat onPrompt={handlePrompt} />
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <MessageRow message={item} onMoviePress={openMovieDetails} />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messageList}
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={isSending ? <TypingIndicator /> : null}
              initialNumToRender={10}
              maxToRenderPerBatch={8}
              windowSize={8}
            />
          )}
        </View>
      </View>

      {(error || voiceError || isRecognizing || voiceTranscript) ? (
        <View style={[styles.liveStatus, { bottom: composerBottomPadding + 74 }]}>
          <Ionicons
            name={error || voiceError ? 'alert-circle-outline' : isRecognizing ? 'mic-outline' : 'checkmark-circle-outline'}
            size={14}
            color={error || voiceError ? Colors.semantic.error : Colors.text.secondary}
          />
          <Text
            style={[
              styles.liveStatusText,
              (error || voiceError) && { color: Colors.semantic.error },
            ]}
            numberOfLines={2}
            allowFontScaling={false}
          >
            {error || voiceError || (isRecognizing ? 'Listening...' : voiceTranscript)}
          </Text>
        </View>
      ) : null}

      <View style={[styles.composerWrap, { paddingBottom: composerBottomPadding }]}>
        <View style={styles.composer}>
          <Pressable
            style={styles.newChatButton}
            onPress={handleNewChat}
            accessibilityRole="button"
            accessibilityLabel="Start a new chat"
          >
            <Ionicons name="add" size={20} color={Colors.text.secondary} />
          </Pressable>

          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={(value) => {
                setText(value);
                if (voiceError) setVoiceError(null);
              }}
              placeholder="Ask CineAI what to watch..."
              placeholderTextColor={Colors.text.tertiary}
              style={styles.input}
              multiline
              maxLength={900}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => {
                if (!text.includes('\n')) {
                  void sendPrompt(text, 'text');
                }
              }}
              selectionColor={Colors.accent.crimson}
              allowFontScaling={false}
            />
          </View>

          <Pressable
            style={[
              styles.rightActionButton,
              canSendText && styles.sendActionButton,
              isRecognizing && styles.listeningActionButton,
            ]}
            onPress={handleRightAction}
            disabled={isSending && !canSendText}
            accessibilityRole="button"
            accessibilityLabel={canSendText ? 'Send message' : isRecognizing ? 'Stop listening' : 'Start voice input'}
          >
            {isSending && canSendText ? (
              <ActivityIndicator size="small" color={Colors.text.onAccent} />
            ) : (
              <Ionicons
                name={rightIconName}
                size={18}
                color={canSendText || isRecognizing ? Colors.text.onAccent : Colors.text.secondary}
              />
            )}
          </Pressable>
        </View>
      </View>

      <HistoryModal
        visible={historyVisible}
        sessions={sessions}
        activeId={currentSession?.id}
        bottomInset={insets.bottom}
        onClose={() => setHistoryVisible(false)}
        onSelect={selectHistorySession}
        onDelete={removeHistorySession}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.void,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(7,7,9,0.98)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIcon: {
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.38)',
    backgroundColor: 'rgba(230,57,70,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontFamily: Typography.fontDisplay,
  },
  premiumPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  premiumText: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontFamily: Typography.fontMedium,
  },
  statusRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Typography.fontMedium,
  },
  statusMutedText: {
    color: Colors.text.tertiary,
    fontSize: 11,
    fontFamily: Typography.fontPrimary,
  },
  conversationShell: {
    flex: 1,
    alignItems: 'center',
  },
  contentWidth: {
    width: '100%',
    flex: 1,
  },
  emptyContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 190,
  },
  emptyHero: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  emptyTitle: {
    color: Colors.text.primary,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: Typography.fontDisplay,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Typography.fontPrimary,
    textAlign: 'center',
    maxWidth: 320,
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  promptCard: {
    width: '48%',
    minHeight: 132,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    padding: 12,
    gap: 8,
  },
  pressedCard: {
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255,255,255,0.065)',
  },
  promptIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(230,57,70,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontFamily: Typography.fontSemiBold,
  },
  promptText: {
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Typography.fontPrimary,
  },
  messageList: {
    paddingTop: 18,
    paddingBottom: 188,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  messageStack: {
    flex: 1,
    maxWidth: '88%',
  },
  userMessageStack: {
    flex: 0,
    maxWidth: '82%',
    alignItems: 'flex-end',
  },
  messageBubble: {
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.075)',
  },
  userBubble: {
    backgroundColor: Colors.accent.crimson,
  },
  messageText: {
    color: Colors.text.primary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Typography.fontPrimary,
  },
  userMessageText: {
    color: Colors.text.onAccent,
  },
  recRail: {
    paddingTop: 10,
    paddingRight: 16,
    gap: 10,
  },
  recCard: {
    width: 228,
    minHeight: 132,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: Colors.bg.surface,
    overflow: 'hidden',
    flexDirection: 'row',
    marginRight: 2,
  },
  recPoster: {
    width: 82,
    minHeight: 132,
    backgroundColor: Colors.bg.raised,
  },
  recTextWrap: {
    flex: 1,
    padding: 10,
    gap: 5,
  },
  recTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    lineHeight: 17,
    fontFamily: Typography.fontSemiBold,
  },
  recMeta: {
    color: Colors.text.tertiary,
    fontSize: 10,
    fontFamily: Typography.fontMedium,
  },
  recReason: {
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Typography.fontPrimary,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.lg,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  typingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.text.secondary,
  },
  liveStatus: {
    position: 'absolute',
    left: 20,
    right: 20,
    minHeight: 34,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(12,12,18,0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  liveStatusText: {
    flex: 1,
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Typography.fontPrimary,
  },
  composerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(7,7,9,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
  },
  composer: {
    minHeight: 52,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  newChatButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    minHeight: 38,
    maxHeight: 118,
    justifyContent: 'center',
  },
  input: {
    color: Colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Typography.fontPrimary,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    paddingHorizontal: 2,
  },
  rightActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendActionButton: {
    borderColor: Colors.accent.crimsonLight,
    backgroundColor: Colors.accent.crimson,
  },
  listeningActionButton: {
    borderColor: Colors.semantic.error,
    backgroundColor: Colors.semantic.error,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  historySheet: {
    maxHeight: '72%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    backgroundColor: Colors.bg.deep,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontFamily: Typography.fontDisplay,
    textAlign: 'center',
  },
  sheetSubtitle: {
    color: Colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Typography.fontPrimary,
    textAlign: 'center',
    marginTop: 2,
  },
  historyList: {
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
  },
  historyEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  historyEmptyText: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontFamily: Typography.fontPrimary,
  },
  historyItem: {
    minHeight: 64,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  historyItemActive: {
    borderColor: 'rgba(230,57,70,0.45)',
    backgroundColor: 'rgba(230,57,70,0.1)',
  },
  historyCopy: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    color: Colors.text.primary,
    fontSize: 13,
    fontFamily: Typography.fontSemiBold,
  },
  historyTitleActive: {
    color: Colors.accent.crimsonLight,
  },
  historyPreview: {
    marginTop: 3,
    color: Colors.text.secondary,
    fontSize: 11,
    fontFamily: Typography.fontPrimary,
  },
  historyDelete: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AIChatScreen;
