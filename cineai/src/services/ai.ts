import { chatService } from './api/chatService';
import { ChatMessage, Movie } from '../types';
import tmdbApi from './tmdbApi';

export interface AIResponse {
  message: string;
  movies: Movie[];
  moodTags: string[];
}

const parseAIResponse = (raw: string): { message: string; movieSearchQueries: string[]; moodTags: string[] } => {
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('AI provider returned non-JSON content.');
  }
  const parsed = JSON.parse(match[0]);
  return {
    message: String(parsed.message || ''),
    movieSearchQueries: Array.isArray(parsed.movieSearchQueries) ? parsed.movieSearchQueries : [],
    moodTags: Array.isArray(parsed.moodTags) ? parsed.moodTags : [],
  };
};

export const aiService = {
  sendMessage: async (
    userMessage: string,
    conversationHistory: ChatMessage[],
    userContext?: { favoriteGenres?: string[]; recentlyWatched?: string[] },
    isAuthenticated = false,
    sessionToken?: string,
  ): Promise<AIResponse> => {
    let contextualMessage = userMessage;
    if (userContext?.favoriteGenres?.length) {
      contextualMessage += ` [User's favorite genres: ${userContext.favoriteGenres.join(', ')}]`;
    }

    const context = conversationHistory.slice(-12).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const rawContent = isAuthenticated && sessionToken
      ? (await chatService.postMessage(sessionToken, contextualMessage)).content
      : (await chatService.postGuestMessage(contextualMessage, context)).content;

    const parsed = parseAIResponse(rawContent);
    const movies: Movie[] = [];

    for (const title of parsed.movieSearchQueries.slice(0, 6)) {
      if (!title?.trim()) continue;
      const result = await tmdbApi.searchMovies(title.trim(), 1);
      const movie = result.results[0];
      if (movie && !movies.some(m => m.id === movie.id)) {
        movies.push(movie);
      }
    }

    return {
      message: parsed.message,
      movies,
      moodTags: parsed.moodTags,
    };
  },

  getMovieSummary: async (movieTitle: string, overview: string): Promise<string> => {
    const prompt = `Write a captivating 2-sentence AI insight about "${movieTitle}". Overview: "${overview.slice(0, 300)}". Focus on what makes it emotionally or cinematically special. Be concise, evocative, and compelling. No spoilers.`;
    const res = await chatService.postGuestMessage(prompt, []);
    return res.content;
  },
};

export default aiService;
