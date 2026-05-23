import axios from 'axios';
import { Movie, ChatMessage, MovieRecommendation } from '../types';
import omdbApi from './omdbApi';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// ─── System Prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Cine AI — an elite cinematic intelligence and personal movie companion. You feel like having a conversation with a brilliant, warm film critic who deeply understands emotions and moods.

Your personality:
- Conversational, warm, intelligent — like a trusted film critic friend
- You use rich, evocative language about cinema
- You understand emotional context: "I just went through a breakup", "I want to cry", "I need something uplifting"
- You remember the conversation context and reference earlier messages naturally
- You are specific and opinionated, not generic

Response format — ALWAYS return valid JSON exactly like this:
{
  "message": "Your warm, conversational response here (2-4 sentences max). Be natural and specific.",
  "movieSearchQueries": ["Exact Movie Title 1", "Exact Movie Title 2", "Exact Movie Title 3"],
  "moodTags": ["emotional", "cinematic", "tag3"]
}

Rules:
1. movieSearchQueries must be EXACT movie titles that exist in OMDb (real films only)
2. Recommend 3–6 movies that precisely match the request
3. Write engaging, emotionally intelligent messages — not generic lists
4. For conversational messages (greetings, thanks, etc.) use empty arrays for queries and tags
5. Always reference the specific genres, directors, moods or themes the user mentioned
6. moodTags should capture the emotional vibe (e.g. "mind-bending", "tear-jerker", "hopeful", "dark", "nostalgic")

Examples of quality recommendations:
- For "mind-bending sci-fi": Inception, Interstellar, Arrival, Ex Machina, Annihilation
- For "feel-good comedy": The Grand Budapest Hotel, Paddington 2, About Time, Chef
- For "emotional drama": Manchester by the Sea, Marriage Story, Moonlight, Roma
- For "thriller": Parasite, Oldboy, Gone Girl, Prisoners, Knives Out
- For "Nolan films": The Dark Knight, Memento, Inception, Interstellar, Dunkirk, Tenet`;

export interface AIResponse {
  message: string;
  movies: Movie[];
  moodTags: string[];
}

// ─── Curated Fallbacks by Category ─────────────────────────────────────────
const FALLBACK_QUERIES: Record<string, string[]> = {
  default: ['Inception', 'The Dark Knight', 'Interstellar', 'Parasite', 'The Godfather'],
  scifi: ['Inception', 'Interstellar', 'Arrival', 'Ex Machina', 'Blade Runner 2049'],
  thriller: ['Parasite', 'Gone Girl', 'Prisoners', 'Knives Out', 'Oldboy'],
  comedy: ['The Grand Budapest Hotel', 'About Time', 'Paddington 2', 'Chef', 'Superbad'],
  drama: ['Manchester by the Sea', 'Marriage Story', 'Moonlight', 'Roma', 'Schindler\'s List'],
  horror: ['Hereditary', 'Midsommar', 'Get Out', 'The Shining', 'A Quiet Place'],
  action: ['Mad Max Fury Road', 'John Wick', 'The Dark Knight', 'Mission Impossible Fallout', 'Heat'],
  romance: ['About Time', 'La La Land', 'Before Sunrise', 'Eternal Sunshine', 'The Notebook'],
  animated: ['Spider-Man Into the Spider-Verse', 'Spirited Away', 'Up', 'Coco', 'The Iron Giant'],
};

const getFallbackMovies = async (message: string): Promise<Movie[]> => {
  const lower = message.toLowerCase();
  let queries = FALLBACK_QUERIES.default;
  if (/sci.?fi|space|future|robot|alien/i.test(lower)) queries = FALLBACK_QUERIES.scifi;
  else if (/thriller|suspense|mystery|crime/i.test(lower)) queries = FALLBACK_QUERIES.thriller;
  else if (/comedy|funny|laugh|humor/i.test(lower)) queries = FALLBACK_QUERIES.comedy;
  else if (/drama|emotional|sad|cry|feel/i.test(lower)) queries = FALLBACK_QUERIES.drama;
  else if (/horror|scary|fear|dark/i.test(lower)) queries = FALLBACK_QUERIES.horror;
  else if (/action|fight|intense|explosive/i.test(lower)) queries = FALLBACK_QUERIES.action;
  else if (/romance|love|romantic|relationship/i.test(lower)) queries = FALLBACK_QUERIES.romance;
  else if (/anime|animated|cartoon/i.test(lower)) queries = FALLBACK_QUERIES.animated;

  const movies: Movie[] = [];
  for (const title of queries.slice(0, 5)) {
    try {
      const result = await omdbApi.searchMovies(title, 1);
      if (result.results.length > 0) {
        const m = result.results[0];
        if (!movies.find(x => x.id === m.id)) movies.push(m);
      }
    } catch { /* silent */ }
    if (movies.length >= 4) break;
  }
  return movies;
};

// ─── Parse AI JSON Response ─────────────────────────────────────────────────
const parseAIResponse = (raw: string): { message: string; movieSearchQueries: string[]; moodTags: string[] } => {
  // Strip markdown code fences
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  // Extract first JSON object
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) return { message: raw.slice(0, 300), movieSearchQueries: [], moodTags: [] };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { message: raw.slice(0, 300), movieSearchQueries: [], moodTags: [] };
  }
};

// ─── Main AI Service ────────────────────────────────────────────────────────
export const aiService = {
  sendMessage: async (
    userMessage: string,
    conversationHistory: ChatMessage[],
    userContext?: { favoriteGenres?: string[]; recentlyWatched?: string[] }
  ): Promise<AIResponse> => {
    // Build context-aware message
    let contextualMessage = userMessage;
    if (userContext?.favoriteGenres?.length) {
      contextualMessage += ` [User's favourite genres: ${userContext.favoriteGenres.join(', ')}]`;
    }

    // Keep last 12 messages for context
    const history = conversationHistory.slice(-12).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const requestBody = {
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        {
          role: 'model',
          parts: [{ text: '{"message":"I\'m Cine AI, your personal movie companion. I\'m ready to recommend films that match exactly what you\'re looking for!","movieSearchQueries":[],"moodTags":[]}' }],
        },
        ...history,
        { role: 'user', parts: [{ text: contextualMessage }] },
      ],
      generationConfig: {
        temperature: 0.85,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    };

    try {
      const response = await axios.post(
        `${GEMINI_BASE_URL}/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        requestBody,
        { timeout: 30000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) throw new Error('Empty response from Gemini');

      const parsed = parseAIResponse(rawText);

      // Fetch real movie data for each search query
      const movies: Movie[] = [];
      const queries = (parsed.movieSearchQueries || []).slice(0, 6);

      for (const title of queries) {
        if (!title?.trim()) continue;
        try {
          const result = await omdbApi.searchMovies(title.trim(), 1);
          if (result.results.length > 0) {
            const movie = result.results[0];
            if (!movies.find(m => m.id === movie.id)) {
              movies.push(movie);
            }
          }
        } catch { /* silent */ }
      }

      return {
        message: parsed.message || 'Here are some exceptional films for you!',
        movies,
        moodTags: parsed.moodTags || [],
      };
    } catch (error: any) {
      console.error('Gemini AI error:', error?.response?.data || error?.message);

      // Smart fallback using OMDb directly
      const fallbackMovies = await getFallbackMovies(userMessage);
      return {
        message: "My neural networks are taking a creative pause — but here are some exceptional films I know you'll love based on your request!",
        movies: fallbackMovies,
        moodTags: ['curated', 'premium'],
      };
    }
  },

  getMovieSummary: async (movieTitle: string, overview: string): Promise<string> => {
    if (!GEMINI_API_KEY) return overview.slice(0, 200) + (overview.length > 200 ? '...' : '');
    try {
      const prompt = `Write a captivating 2-sentence AI insight about "${movieTitle}". Overview: "${overview.slice(0, 300)}". Focus on what makes it emotionally or cinematically special. Be concise, evocative, and compelling. No spoilers.`;
      const response = await axios.post(
        `${GEMINI_BASE_URL}/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.75, maxOutputTokens: 150 } },
        { timeout: 10000 }
      );
      return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || overview.slice(0, 200) + '...';
    } catch {
      return overview.slice(0, 200) + (overview.length > 200 ? '...' : '');
    }
  },
};

export default aiService;
