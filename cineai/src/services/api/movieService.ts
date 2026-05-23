import { apiClient } from './apiClient';

export interface MovieResponse {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Genre?: string;
  Plot?: string;
  imdbRating?: string;
  Director?: string;
  Actors?: string;
}

export interface WatchlistToggleResponse {
  message: string;
}

export interface WatchlistItemResponse {
  imdb_id: string;
  title: string;
  poster: string | null;
  created_at: string;
}

export const movieService = {
  /**
   * Retrieves trending movies list from the backend.
   */
  getTrending: async (): Promise<MovieResponse[]> => {
    const response = await apiClient.get<MovieResponse[]>('/movies/trending');
    return response.data;
  },

  /**
   * Fetches detailed metadata from backend and updates Recently Viewed logs.
   */
  getDetails: async (imdbId: string): Promise<MovieResponse> => {
    const response = await apiClient.get<MovieResponse>(`/movies/details/${imdbId}`);
    return response.data;
  },

  /**
   * Toggles movie inclusion inside user's Watchlist database.
   */
  toggleWatchlist: async (imdbId: string, title: string, poster: string | null): Promise<WatchlistToggleResponse> => {
    const response = await apiClient.post<WatchlistToggleResponse>('/movies/watchlist/toggle', {
      imdb_id: imdbId,
      title,
      poster,
    });
    return response.data;
  },

  /**
   * Fetches the current user's persistent Watchlist.
   */
  getWatchlist: async (): Promise<WatchlistItemResponse[]> => {
    const response = await apiClient.get<WatchlistItemResponse[]>('/movies/watchlist');
    return response.data;
  },

  /**
   * Searches movies securely from the backend consolidator.
   */
  search: async (query: string): Promise<MovieResponse[]> => {
    const response = await apiClient.get<MovieResponse[]>('/movies/search', {
      params: { query },
    });
    return response.data;
  },

  /**
   * Logs a user interaction event (click, like, search) for global trending analytics.
   */
  logInteraction: async (imdbId: string, type: 'click' | 'like' | 'search'): Promise<void> => {
    await apiClient.post('/movies/interaction', {
      imdb_id: imdbId,
      interaction_type: type,
    });
  },
};
