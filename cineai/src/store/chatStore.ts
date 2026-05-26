import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatSession, ChatMessage, Movie } from '../types';
import { useAuthStore } from './authStore';
import aiService from '../services/ai';
import { chatService } from '../services/api/chatService';
import tmdbApi from '../services/tmdbApi';

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
          const res = await tmdbApi.searchMovies(title, 1);
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

    // Helper to parse backend JSON and fetch rich movies from TMDB
    const parseBackendJSONAndFetch = async (rawContent: string): Promise<{ text: string, movies: Movie[], tags: string[] }> => {
      try {
        const clean = rawContent.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const parsed = JSON.parse(clean);
        if (parsed && typeof parsed === 'object' && parsed.message) {
          const queries = parsed.movieSearchQueries || [];
          const movies: Movie[] = [];
          for (const title of queries.slice(0, 5)) {
            if (title?.trim()) {
              try {
                const res = await tmdbApi.searchMovies(title.trim(), 1);
                if (res.results.length > 0) {
                  const m = res.results[0];
                  if (!movies.find(x => x.id === m.id)) {
                    movies.push(m);
                  }
                }
              } catch {}
            }
          }
          return {
            text: parsed.message,
            movies,
            tags: parsed.moodTags || ['curated']
          };
        }
      } catch (err) {
        console.warn('Failed to parse backend content as structured JSON, falling back to regex...', err);
      }
      
      // Fallback: use raw text and regex
      const fetched = await extractAndFetchMovies(rawContent);
      return {
        text: rawContent,
        movies: fetched,
        tags: ['curated', 'recommended']
      };
    };

    try {
      // If user is authenticated AND is not a guest, call the real FastAPI backend first!
      const isLoggedIn = !!useAuthStore.getState().user && !useAuthStore.getState().isGuest;

      if (isLoggedIn) {
        try {
          const backendRes = await chatService.postMessage(session.id, content);
          const parsedRes = await parseBackendJSONAndFetch(backendRes.content);
          
          assistantMessage = {
            id: generateMsgId(),
            role: 'assistant',
            content: parsedRes.text,
            movies: parsedRes.movies.map((movie: Movie) => ({
              movie,
              reason: 'AI recommended based on your request',
              mood_tags: parsedRes.tags,
            })),
            timestamp: new Date().toISOString(),
          };
        } catch (backendErr) {
          console.warn('FastAPI Chat backend failed. Falling back to Guest secure handler...', backendErr);
        }
      }

      // If backend failed OR user is a guest, use our secure FastAPI guest chatbot proxy!
      if (!assistantMessage) {
        const historyContext = (session.messages || []).map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        const backendRes = await chatService.postGuestMessage(content, historyContext);
        const parsedRes = await parseBackendJSONAndFetch(backendRes.content);

        assistantMessage = {
          id: generateMsgId(),
          role: 'assistant',
          content: parsedRes.text,
          movies: parsedRes.movies.map((movie: Movie) => ({
            movie,
            reason: 'AI recommended based on your request',
            mood_tags: parsedRes.tags,
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
