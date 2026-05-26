/**
 * ai.ts — Cine AI Frontend AI Service
 *
 * All AI calls route through the FastAPI backend.
 * NO API keys are stored or used in the frontend.
 * The backend holds Gemini & TMDB keys securely server-side.
 */

import { chatService } from './api/chatService';
import { Movie, ChatMessage, MovieRecommendation } from '../types';
import tmdbApi from './tmdbApi';

export interface AIResponse {
  message: string;
  movies: Movie[];
  moodTags: string[];
}

// ─── Parse AI JSON Response ──────────────────────────────────────────────────
const parseAIResponse = (raw: string): { message: string; movieSearchQueries: string[]; moodTags: string[] } => {
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) return { message: raw.slice(0, 300), movieSearchQueries: [], moodTags: [] };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { message: raw.slice(0, 300), movieSearchQueries: [], moodTags: [] };
  }
};

// ─── Curated Fallbacks by Category ──────────────────────────────────────────
const FALLBACK_QUERIES: Record<string, string[]> = {
  default:  ['Inception', 'The Dark Knight', 'Interstellar', 'Parasite', 'The Godfather'],
  scifi:    ['Inception', 'Interstellar', 'Arrival', 'Ex Machina', 'Blade Runner 2049'],
  thriller: ['Parasite', 'Gone Girl', 'Prisoners', 'Knives Out', 'Oldboy'],
  comedy:   ['The Grand Budapest Hotel', 'About Time', 'Paddington 2', 'Chef', 'Superbad'],
  drama:    ['Manchester by the Sea', 'Marriage Story', 'Moonlight', 'Roma', "Schindler's List"],
  horror:   ['Hereditary', 'Midsommar', 'Get Out', 'The Shining', 'A Quiet Place'],
  action:   ['Mad Max Fury Road', 'John Wick', 'The Dark Knight', 'Mission Impossible Fallout', 'Heat'],
  romance:  ['About Time', 'La La Land', 'Before Sunrise', 'Eternal Sunshine', 'The Notebook'],
  animated: ['Spider-Man Into the Spider-Verse', 'Spirited Away', 'Up', 'Coco', 'The Iron Giant'],
};

const getFallbackMovies = async (message: string): Promise<Movie[]> => {
  const lower = message.toLowerCase();
  let queries = FALLBACK_QUERIES.default;
  if (/sci.?fi|space|future|robot|alien/i.test(lower))        queries = FALLBACK_QUERIES.scifi;
  else if (/thriller|suspense|mystery|crime/i.test(lower))    queries = FALLBACK_QUERIES.thriller;
  else if (/comedy|funny|laugh|humor/i.test(lower))           queries = FALLBACK_QUERIES.comedy;
  else if (/drama|emotional|sad|cry|feel/i.test(lower))       queries = FALLBACK_QUERIES.drama;
  else if (/horror|scary|fear|dark/i.test(lower))             queries = FALLBACK_QUERIES.horror;
  else if (/action|fight|intense|explosive/i.test(lower))     queries = FALLBACK_QUERIES.action;
  else if (/romance|love|romantic|relationship/i.test(lower)) queries = FALLBACK_QUERIES.romance;
  else if (/anime|animated|cartoon/i.test(lower))             queries = FALLBACK_QUERIES.animated;

  const movies: Movie[] = [];
  for (const title of queries.slice(0, 5)) {
    try {
      const result = await tmdbApi.searchMovies(title.trim(), 1);
      if (result.results.length > 0) {
        const m = result.results[0];
        if (!movies.find(x => x.id === m.id)) movies.push(m);
      }
    } catch { /* silent */ }
    if (movies.length >= 4) break;
  }
  return movies;
};

// ─── Main AI Service ─────────────────────────────────────────────────────────
export const aiService = {
  /**
   * Sends a chat message through the secure backend proxy (Gemini key stays server-side).
   * Uses guest endpoint for unauthenticated users, authenticated endpoint for logged-in users.
   */
  sendMessage: async (
    userMessage: string,
    conversationHistory: ChatMessage[],
    userContext?: { favoriteGenres?: string[]; recentlyWatched?: string[] },
    isAuthenticated = false,
    sessionToken?: string,
  ): Promise<AIResponse> => {
    let contextualMessage = userMessage;
    if (userContext?.favoriteGenres?.length) {
      contextualMessage += ` [User's favourite genres: ${userContext.favoriteGenres.join(', ')}]`;
    }

    // Build context from history (last 12 messages)
    const context = conversationHistory.slice(-12).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      let rawContent: string;

      if (isAuthenticated && sessionToken) {
        // Authenticated path — chat is persisted to DB
        const res = await chatService.postMessage(sessionToken, contextualMessage);
        rawContent = res.content;
      } else {
        // Guest path — ephemeral, no DB storage
        const res = await chatService.postGuestMessage(contextualMessage, context);
        rawContent = res.content;
      }

      const parsed = parseAIResponse(rawContent);
      const movies: Movie[] = [];
      const queries = (parsed.movieSearchQueries || []).slice(0, 6);

      for (const title of queries) {
        if (!title?.trim()) continue;
        try {
          const result = await tmdbApi.searchMovies(title.trim(), 1);
          if (result.results.length > 0) {
            const movie = result.results[0];
            if (!movies.find(m => m.id === movie.id)) movies.push(movie);
          }
        } catch { /* silent */ }
      }

      return {
        message: parsed.message || 'Here are some exceptional films for you!',
        movies,
        moodTags: parsed.moodTags || [],
      };
    } catch (error: any) {
      console.error('Backend AI error:', error?.message);
      const fallbackMovies = await getFallbackMovies(userMessage);
      return {
        message: "My neural networks are taking a creative pause — but here are some exceptional films I know you'll love!",
        movies: fallbackMovies,
        moodTags: ['curated', 'premium'],
      };
    }
  },

  /**
   * Returns a short AI insight about a movie.
   * Routes through backend chat guest endpoint — no key exposed.
   */
  getMovieSummary: async (movieTitle: string, overview: string): Promise<string> => {
    try {
      const prompt = `Write a captivating 2-sentence AI insight about "${movieTitle}". Overview: "${overview.slice(0, 300)}". Focus on what makes it emotionally or cinematically special. Be concise, evocative, and compelling. No spoilers.`;
      const res = await chatService.postGuestMessage(prompt, []);
      return res.content || overview.slice(0, 200) + '...';
    } catch {
      return overview.slice(0, 200) + (overview.length > 200 ? '...' : '');
    }
  },
};

export default aiService;
