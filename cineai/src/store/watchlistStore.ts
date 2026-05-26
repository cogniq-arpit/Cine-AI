import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie, WatchlistItem } from '../types';
import { movieService } from '../services/api/movieService';
import { useAuthStore } from './authStore';
import { imdbIdToNumber, numberToImdbId } from '../services/tmdbApi';

const WATCHLIST_KEY = '@cineai_watchlist';

interface WatchlistState {
  items: WatchlistItem[];
  isLoading: boolean;

  loadWatchlist: () => Promise<void>;
  addToWatchlist: (movie: Movie) => Promise<void>;
  removeFromWatchlist: (movieId: number) => Promise<void>;
  isInWatchlist: (movieId: number) => boolean;
  clearWatchlist: () => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: [],
  isLoading: false,

  loadWatchlist: async () => {
    set({ isLoading: true });
    try {
      const { user, isGuest } = useAuthStore.getState();
      const isLoggedIn = !!user && !isGuest;

      if (isLoggedIn) {
        try {
          const backendItems = await movieService.getWatchlist();
          const items: WatchlistItem[] = backendItems.map(b => {
            const movie_id = imdbIdToNumber(b.imdb_id);
            return {
              id: `wl_${b.created_at}_${b.imdb_id}`,
              user_id: user?.id || 'server',
              movie_id: movie_id,
              movie_data: {
                id: movie_id,
                title: b.title,
                original_title: b.title,
                overview: 'View details to see full plot overview.',
                poster_path: b.poster,
                backdrop_path: b.poster,
                release_date: '2000-01-01',
                vote_average: 7.5,
                vote_count: 100,
                popularity: 1.0,
                genre_ids: [18],
                original_language: 'en',
                adult: false,
                video: false,
              },
              added_at: b.created_at,
            };
          });
          set({ items });
          await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
          return;
        } catch (backendError) {
          console.warn('Failed to load watchlist from backend, falling back to local storage:', backendError);
        }
      }

      const stored = await AsyncStorage.getItem(WATCHLIST_KEY);
      if (stored) {
        const items: WatchlistItem[] = JSON.parse(stored);
        set({ items });
      }
    } catch (error) {
      console.error('Load watchlist error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addToWatchlist: async (movie: Movie) => {
    const { isInWatchlist, items } = get();
    if (isInWatchlist(movie.id)) return;

    const newItem: WatchlistItem = {
      id: `wl_${Date.now()}_${movie.id}`,
      user_id: useAuthStore.getState().user?.id || 'local',
      movie_id: movie.id,
      movie_data: movie,
      added_at: new Date().toISOString(),
    };

    const updated = [newItem, ...items];
    set({ items: updated });
    try {
      await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Save watchlist error:', error);
    }

    const { user, isGuest } = useAuthStore.getState();
    const isLoggedIn = !!user && !isGuest;
    if (isLoggedIn) {
      try {
        const imdbId = numberToImdbId(movie.id);
        await movieService.toggleWatchlist(imdbId, movie.title, movie.poster_path);
      } catch (backendError) {
        console.error('Failed to sync watchlist addition with backend:', backendError);
      }
    }
  },

  removeFromWatchlist: async (movieId: number) => {
    const { items } = get();
    const targetItem = items.find(item => item.movie_id === movieId);
    const updated = items.filter(item => item.movie_id !== movieId);
    set({ items: updated });
    try {
      await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Remove watchlist error:', error);
    }

    const { user, isGuest } = useAuthStore.getState();
    const isLoggedIn = !!user && !isGuest;
    if (isLoggedIn) {
      try {
        const imdbId = numberToImdbId(movieId);
        await movieService.toggleWatchlist(imdbId, targetItem?.movie_data.title || 'Movie', targetItem?.movie_data.poster_path || null);
      } catch (backendError) {
        console.error('Failed to sync watchlist removal with backend:', backendError);
      }
    }
  },

  isInWatchlist: (movieId: number) => {
    return get().items.some(item => item.movie_id === movieId);
  },

  clearWatchlist: () => {
    set({ items: [] });
    AsyncStorage.removeItem(WATCHLIST_KEY).catch(console.error);
  },
}));
