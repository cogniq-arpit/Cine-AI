// ─── Movie Types ───────────────────────────────────────────────────────────
export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  genres?: Genre[];
  runtime?: number;
  tagline?: string;
  status?: string;
  adult: boolean;
  original_language: string;
  video: boolean;
}

export interface MovieDetails extends Movie {
  runtime: number;
  genres: Genre[];
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  budget: number;
  revenue: number;
  imdb_id: string;
  homepage: string;
  credits?: Credits;
  videos?: VideoResponse;
  'watch/providers'?: WatchProvidersResponse;
  similar?: PaginatedResponse<Movie>;
  recommendations?: PaginatedResponse<Movie>;
  images?: ImagesResponse;
  reviews?: PaginatedResponse<Review>;
  release_dates?: ReleaseDatesResponse;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  iso_639_1: string;
  name: string;
  english_name: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department: string;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
  known_for_department: string;
}

export interface VideoResult {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
  size: number;
}

export interface VideoResponse {
  results: VideoResult[];
}

export interface ImagesResponse {
  backdrops: ImageResult[];
  posters: ImageResult[];
  logos: ImageResult[];
}

export interface ImageResult {
  file_path: string;
  width: number;
  height: number;
  vote_average: number;
  aspect_ratio: number;
}

export interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProviderCountry {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface WatchProvidersResponse {
  results: Record<string, WatchProviderCountry>;
}

export interface Review {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
}

export interface ReleaseDatesResponse {
  results: ReleaseDateCountry[];
}

export interface ReleaseDateCountry {
  iso_3166_1: string;
  release_dates: ReleaseDate[];
}

export interface ReleaseDate {
  certification: string;
  release_date: string;
  type: number;
}

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// ─── TV Types ──────────────────────────────────────────────────────────────
export interface TVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  genres?: Genre[];
}

// ─── User / Auth Types ─────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  favorite_genres: number[];
  preferred_languages: string[];
  streaming_platforms: string[];
  ai_taste_profile: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Chat Types ────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  movies?: MovieRecommendation[];
  timestamp: string;
}

export interface MovieRecommendation {
  movie: Movie;
  reason: string;
  mood_tags: string[];
  streaming_info?: WatchProviderCountry;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// ─── Watchlist Types ───────────────────────────────────────────────────────
export interface WatchlistItem {
  id: string;
  user_id: string;
  movie_id: number;
  movie_data: Movie;
  added_at: string;
  notes?: string;
}

// ─── Search Types ──────────────────────────────────────────────────────────
export interface SearchFilters {
  genre?: number;
  year?: number;
  rating?: number;
  language?: string;
  mood?: string;
}

// ─── Navigation Types ──────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  MovieDetails: { movieId: number };
  ChatSession: { sessionId?: string };
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: { query?: string } | undefined;
  AIChat: undefined;
  Watchlist: undefined;
  Profile: undefined;
};
