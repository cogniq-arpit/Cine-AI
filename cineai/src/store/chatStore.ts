import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatSession, ChatMessage, Movie } from '../types';
import { useAuthStore } from './authStore';
import aiService from '../services/ai';
import { chatService } from '../services/api/chatService';
import omdbApi from '../services/omdbApi';

const SESSIONS_KEY = '@cineai_chat_sessions';

interface ChatStore {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  isSending: boolean;

  loadSessions: () => Promise<void>;
  createSession: (title?: string) => Promise<ChatSession>;
  loadSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearCurrentSession: () => void;
  deleteSession: (sessionId: string) => Promise<void>;
}

const generateId = () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const generateMsgId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Helper to extract movies from AI message text when FastAPI backend is used
const extractAndFetchMovies = async (text: string): Promise<Movie[]> => {
  const movies: Movie[] = [];
  try {
    // Basic regex to find movie-like titles quoted or mentioned
    const quotes = text.match(/"([^"]+)"|'([^']+)'/g);
    if (quotes) {
      const titles = quotes.map(q => q.replace(/['"]/g, '').trim()).slice(0, 4);
      for (const title of titles) {
        if (title.length > 1) {
          const res = await omdbApi.searchMovies(title, 1);
          if (res.results.length > 0) {
            const m = res.results[0];
            if (!movies.find(x => x.id === m.id)) {
              movies.push(m);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to extract/fetch movies from backend text:', err);
  }
  return movies;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  isSending: false,

  loadSessions: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(SESSIONS_KEY);
      if (stored) {
        const sessions: ChatSession[] = JSON.parse(stored);
        set({ sessions });
      }
    } catch (error) {
      console.error('Load sessions error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createSession: async (title = 'New Chat') => {
    const user = useAuthStore.getState().user;
    const now = new Date().toISOString();
    const newSession: ChatSession = {
      id: generateId(),
      user_id: user?.id || 'guest',
      title,
      messages: [],
      created_at: now,
      updated_at: now,
    };

    const { sessions } = get();
    const updated = [newSession, ...sessions];
    set({ sessions: updated, currentSession: newSession });

    try {
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Save session error:', error);
    }

    return newSession;
  },

  loadSession: async (sessionId: string) => {
    const { sessions } = get();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      set({ currentSession: session });
    }
  },

  sendMessage: async (content: string) => {
    const { currentSession } = get();
    const user = useAuthStore.getState().user;
    const profile = useAuthStore.getState().profile;

    // Create session if none exists
    let session = currentSession;
    if (!session) {
      session = await get().createSession(
        content.length > 50 ? content.slice(0, 50) + '...' : content
      );
    }

    // Optimistically add user message
    const userMessage: ChatMessage = {
      id: generateMsgId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...(session.messages || []), userMessage];
    const updatedSession = { ...session, messages: updatedMessages };
    set({ currentSession: updatedSession, isSending: true });

    let assistantMessage: ChatMessage | null = null;

    try {
      // If user is authenticated AND is not a guest, call the real FastAPI backend first!
      const isLoggedIn = !!useAuthStore.getState().user && !useAuthStore.getState().isGuest;

      if (isLoggedIn) {
        try {
          const backendRes = await chatService.postMessage(session.id, content);
          const fetchedMovies = await extractAndFetchMovies(backendRes.content);
          
          assistantMessage = {
            id: generateMsgId(),
            role: 'assistant',
            content: backendRes.content,
            movies: fetchedMovies.map((movie: Movie) => ({
              movie,
              reason: 'AI recommended based on your request',
              mood_tags: ['curated', 'recommended'],
            })),
            timestamp: new Date().toISOString(),
          };
        } catch (backendErr) {
          console.warn('FastAPI Chat backend offline or failed. Falling back to Gemini Client...', backendErr);
        }
      }

      // If backend failed OR user is a guest, use local Gemini direct integration!
      if (!assistantMessage) {
        const userContext = {
          favoriteGenres: profile?.favorite_genres?.map(String) || [],
          recentlyWatched: [],
        };

        const aiResponse = await aiService.sendMessage(
          content,
          session.messages || [],
          userContext
        );

        assistantMessage = {
          id: generateMsgId(),
          role: 'assistant',
          content: aiResponse.message,
          movies: aiResponse.movies.map((movie: Movie) => ({
            movie,
            reason: 'AI recommended based on your request',
            mood_tags: aiResponse.moodTags,
          })),
          timestamp: new Date().toISOString(),
        };
      }

      const finalMessages = [...updatedMessages, assistantMessage];
      const finalSession: ChatSession = {
        ...updatedSession,
        messages: finalMessages,
        updated_at: new Date().toISOString(),
      };

      // Update sessions list
      const { sessions } = get();
      const updatedSessions = sessions.map(s =>
        s.id === session!.id ? finalSession : s
      );

      set({ currentSession: finalSession, sessions: updatedSessions });

      // Persist to local storage
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
    } catch (error) {
      console.error('Send message failure:', error);
      // Fallback: still update the list with user prompt even if AI is fully disconnected
      const { sessions } = get();
      const updatedSessions = sessions.map(s =>
        s.id === session!.id ? updatedSession : s
      );
      set({ sessions: updatedSessions });
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
    } finally {
      set({ isSending: false });
    }
  },

  clearCurrentSession: () => set({ currentSession: null }),

  deleteSession: async (sessionId: string) => {
    const { sessions, currentSession } = get();
    const updated = sessions.filter(s => s.id !== sessionId);
    set({
      sessions: updated,
      currentSession: currentSession?.id === sessionId ? null : currentSession,
    });
    try {
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Delete session error:', error);
    }
  },
}));
