import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie, WatchlistItem } from '../types';

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
      user_id: 'local',
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
  },

  removeFromWatchlist: async (movieId: number) => {
    const { items } = get();
    const updated = items.filter(item => item.movie_id !== movieId);
    set({ items: updated });
    try {
      await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Remove watchlist error:', error);
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
