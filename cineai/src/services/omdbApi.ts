import axios from 'axios';
import { Movie, MovieDetails, PaginatedResponse, TVShow, Genre, CastMember, CrewMember } from '../types';

const OMDB_API_KEY = process.env.EXPO_PUBLIC_OMDB_API_KEY || process.env.VITE_OMDB_API_KEY || '3be0d3d0';
const BASE_URL = 'https://www.omdbapi.com/';

// ─── Image Fallback Placeholders ───────────────────────────────────────────
const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=342&auto=format&fit=crop';
const FALLBACK_BACKDROP = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';
const FALLBACK_PROFILE = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=185&auto=format&fit=crop';

// ─── Client Instance ────────────────────────────────────────────────────────
const omdbClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Cache map for API responses to improve search performance and save API hits
const apiCache = new Map<string, any>();

// Helper to run axios requests with simple cache wrapper
const cachedGet = async (params: Record<string, any>) => {
  const cacheKey = JSON.stringify(params);
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  const { data } = await omdbClient.get('', { params: { ...params, apikey: OMDB_API_KEY } });
  if (data && data.Response === 'True') {
    apiCache.set(cacheKey, data);
  }
  return data;
};

// ─── Helper Mappers ────────────────────────────────────────────────────────
export const imdbIdToNumber = (imdbId: string | undefined): number => {
  if (!imdbId) return 0;
  const digits = imdbId.replace(/[^0-9]/g, '');
  return parseInt(digits, 10) || 0;
};

export const numberToImdbId = (num: number): string => {
  if (!num) return '';
  const str = String(num);
  const padded = str.length < 7 ? str.padStart(7, '0') : str;
  return `tt${padded}`;
};

export const getPosterUrl = (path: string | null): string => {
  if (!path || path === 'N/A') return FALLBACK_POSTER;
  return path;
};

export const getBackdropUrl = (path: string | null): string => {
  if (!path || path === 'N/A') return FALLBACK_BACKDROP;
  return path;
};

export const getProfileUrl = (path: string | null): string => {
  if (!path || path === 'N/A') return FALLBACK_PROFILE;
  return path;
};

const GENRES_MAP: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  drama: 18,
  fantasy: 14,
  horror: 27,
  mystery: 9648,
  romance: 10749,
  'sci-fi': 878,
  thriller: 53,
  biography: 36,
  history: 36,
  music: 10402,
  musical: 10402,
  war: 10752,
  western: 37,
};

const GENRES_LIST: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10749, name: 'Romance' },
  { id: 9648, name: 'Mystery' },
  { id: 14, name: 'Fantasy' },
];

export const getGenreIdsFromString = (genreString: string): number[] => {
  if (!genreString || genreString === 'N/A') return [18];
  const ids = genreString
    .split(',')
    .map(g => g.trim().toLowerCase())
    .map(g => GENRES_MAP[g] || 18);
  return Array.from(new Set(ids));
};

export const getGenresListFromString = (genreString: string): Genre[] => {
  if (!genreString || genreString === 'N/A') return [{ id: 18, name: 'Drama' }];
  const list = genreString
    .split(',')
    .map(g => g.trim())
    .map(name => {
      const id = GENRES_MAP[name.toLowerCase()] || 18;
      return { id, name };
    });
  
  // Deduplicate by ID to prevent duplicate React keys
  return list.filter((item, index, self) =>
    self.findIndex(t => t.id === item.id) === index
  );
};

// Safe date parser to avoid Hermes engine 'RangeError: Date value out of bounds'
export const parseOmdbDate = (releasedStr: string | undefined, yearStr: string | undefined): string => {
  if (!releasedStr || releasedStr === 'N/A') {
    if (yearStr && yearStr !== 'N/A') {
      const year = yearStr.split('–')[0].trim();
      return `${year}-01-01`;
    }
    return '2000-01-01';
  }

  // Format of releasedStr: "21 Jul 2023"
  const parts = releasedStr.split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const monthStr = parts[1].toLowerCase();
    const year = parts[2];

    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };

    const month = months[monthStr.slice(0, 3)] || '01';
    return `${year}-${month}-${day}`;
  }

  // Fallback to year if standard parsing fails
  if (yearStr && yearStr !== 'N/A') {
    const year = yearStr.split('–')[0].trim();
    return `${year}-01-01`;
  }

  return '2000-01-01';
};

// ─── Curated Cinematic Dataset ─────────────────────────────────────────────
// Highly optimized initial dataset for instantaneous boot speeds and robust fallbacks
const CURATED_DB = [
  {
    imdbID: 'tt15398776',
    Title: 'Oppenheimer',
    Year: '2023',
    Rated: 'R',
    Released: '21 Jul 2023',
    Runtime: '180 min',
    Genre: 'Biography, Drama, History',
    Director: 'Christopher Nolan',
    Actors: 'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.',
    Plot: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    imdbRating: '8.9',
    imdbVotes: '715,321',
    BoxOffice: '$329,862,540',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00ODYzLTk4ODgtOWMzODg0YjdlYmRmXkFtZTcwMTI5OTM0Mw@@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt15239678',
    Title: 'Dune: Part Two',
    Year: '2024',
    Rated: 'PG-13',
    Released: '01 Mar 2024',
    Runtime: '166 min',
    Genre: 'Action, Adventure, Sci-Fi',
    Director: 'Denis Villeneuve',
    Actors: 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem',
    Plot: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    imdbRating: '9.0',
    imdbVotes: '430,225',
    BoxOffice: '$282,144,358',
    Poster: 'https://m.media-amazon.com/images/M/MV5BODlhNmVkZGQtM2UxOC00ODYyLWIwOTYtZDY3YjQ3YmNmODdlXkFtZTcwMTI5OTM0Mw@@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt0816692',
    Title: 'Interstellar',
    Year: '2014',
    Rated: 'PG-13',
    Released: '07 Nov 2014',
    Runtime: '169 min',
    Genre: 'Adventure, Drama, Sci-Fi',
    Director: 'Christopher Nolan',
    Actors: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain, Ellen Burstyn',
    Plot: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    imdbRating: '8.7',
    imdbVotes: '2,014,562',
    BoxOffice: '$188,020,017',
    Poster: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5OTRlYWYyXkFtZTgwMDUwMDI0MjE@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt1375666',
    Title: 'Inception',
    Year: '2010',
    Rated: 'PG-13',
    Released: '16 Jul 2010',
    Runtime: '148 min',
    Genre: 'Action, Adventure, Sci-Fi',
    Director: 'Christopher Nolan',
    Actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page, Tom Hardy',
    Plot: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    imdbRating: '8.8',
    imdbVotes: '2,514,682',
    BoxOffice: '$292,576,195',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt0468569',
    Title: 'The Dark Knight',
    Year: '2008',
    Rated: 'PG-13',
    Released: '18 Jul 2008',
    Runtime: '152 min',
    Genre: 'Action, Crime, Drama',
    Director: 'Christopher Nolan',
    Actors: 'Christian Bale, Heath Ledger, Aaron Eckhart, Maggie Gyllenhaal',
    Plot: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    imdbRating: '9.0',
    imdbVotes: '2,891,421',
    BoxOffice: '$534,858,444',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt6751668',
    Title: 'Parasite',
    Year: '2019',
    Rated: 'R',
    Released: '30 May 2019',
    Runtime: '132 min',
    Genre: 'Drama, Thriller',
    Director: 'Bong Joon Ho',
    Actors: 'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong, Choi Woo-shik',
    Plot: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    imdbRating: '8.5',
    imdbVotes: '912,410',
    BoxOffice: '$53,369,749',
    Poster: 'https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkFtZTgwNTk5MDM5NTE@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt0110912',
    Title: 'Pulp Fiction',
    Year: '1994',
    Rated: 'R',
    Released: '14 Oct 1994',
    Runtime: '154 min',
    Genre: 'Crime, Drama',
    Director: 'Quentin Tarantino',
    Actors: 'John Travolta, Uma Thurman, Samuel L. Jackson, Bruce Willis',
    Plot: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    imdbRating: '8.9',
    imdbVotes: '2,185,212',
    BoxOffice: '$107,928,762',
    Poster: 'https://m.media-amazon.com/images/M/MV5BYTViYTE3ZGQtNDFkNC00ODYyLTkyM2ItOWFiNWM5YjdmMTA1XkFtZTcwNDc1ODYzOQ@@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt2582802',
    Title: 'Whiplash',
    Year: '2014',
    Rated: 'R',
    Released: '10 Oct 2014',
    Runtime: '106 min',
    Genre: 'Drama, Music',
    Director: 'Damien Chazelle',
    Actors: 'Miles Teller, J.K. Simmons, Paul Reiser, Melissa Benoist',
    Plot: 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student\'s potential.',
    imdbRating: '8.5',
    imdbVotes: '942,500',
    BoxOffice: '$13,092,000',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMTU4NjQyODgwN15BMl5BanBnXkFtZTgwMTE4NzU1MjE@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt0133093',
    Title: 'The Matrix',
    Year: '1999',
    Rated: 'R',
    Released: '31 Mar 1999',
    Runtime: '136 min',
    Genre: 'Action, Sci-Fi',
    Director: 'Lana Wachowski, Lilly Wachowski',
    Actors: 'Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss, Hugo Weaving',
    Plot: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.',
    imdbRating: '8.7',
    imdbVotes: '1,995,000',
    BoxOffice: '$171,479,930',
    Poster: 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDlkQzI0NzdkNWJkXkFtZTgwNTkyMDc5MjE@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt4154900',
    Title: 'Avengers: Endgame',
    Year: '2019',
    Rated: 'PG-13',
    Released: '26 Apr 2019',
    Runtime: '181 min',
    Genre: 'Action, Adventure, Sci-Fi',
    Director: 'Anthony Russo, Joe Russo',
    Actors: 'Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth',
    Plot: 'After the devastating events of Avengers: Infinity War (2018), the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos\' actions and restore balance to the universe.',
    imdbRating: '8.4',
    imdbVotes: '1,240,000',
    BoxOffice: '$858,373,000',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMTc5MDEyNzgyMV5BMl5BanBnXkFtZTgwMzg2ODg4NzM@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt9362722',
    Title: 'Spider-Man: Across the Spider-Verse',
    Year: '2023',
    Rated: 'PG',
    Released: '02 Jun 2023',
    Runtime: '140 min',
    Genre: 'Animation, Action, Adventure',
    Director: 'Joaquim Dos Santos, Kemp Powers, Justin K. Thompson',
    Actors: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac, Jake Johnson',
    Plot: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.',
    imdbRating: '8.6',
    imdbVotes: '360,000',
    BoxOffice: '$381,311,319',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMzI0NmFiZmItMTVhOS00NzJmLWI5NzgtMzUwMTQ4OTRhNDhhXkFtZTgwMTQ4OTRhNDhh@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt1517268',
    Title: 'Barbie',
    Year: '2023',
    Rated: 'PG-13',
    Released: '21 Jul 2023',
    Runtime: '114 min',
    Genre: 'Adventure, Comedy, Fantasy',
    Director: 'Greta Gerwig',
    Actors: 'Margot Robbie, Ryan Gosling, America Ferrera, Arianna Greenblatt',
    Plot: 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans.',
    imdbRating: '6.9',
    imdbVotes: '510,000',
    BoxOffice: '$636,225,983',
    Poster: 'https://m.media-amazon.com/images/M/MV5BNjU3N2QxNzYtMjk1NC00MTc4LTk1NTQtMmUxODY2NTA5ZTlkXkFtZTgwODg0NDkyOTE@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt3783958',
    Title: 'La La Land',
    Year: '2016',
    Rated: 'PG-13',
    Released: '09 Dec 2016',
    Runtime: '128 min',
    Genre: 'Comedy, Drama, Music',
    Director: 'Damien Chazelle',
    Actors: 'Ryan Gosling, Emma Stone, Rosemarie DeWitt, J.K. Simmons',
    Plot: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.',
    imdbRating: '8.0',
    imdbVotes: '650,000',
    BoxOffice: '$151,101,803',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMzUzNDM2NzM2MV5BMl5BanBnXkFtZTgwNTM3NTg4OTE@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt1856101',
    Title: 'Blade Runner 2049',
    Year: '2017',
    Rated: 'R',
    Released: '06 Oct 2017',
    Runtime: '164 min',
    Genre: 'Action, Drama, Sci-Fi',
    Director: 'Denis Villeneuve',
    Actors: 'Ryan Gosling, Harrison Ford, Ana de Armas, Sylvia Hoeks',
    Plot: 'K, an officer with the Los Angeles Police Department\'s blade runner squad, uncovers a secret that could plunge what is left of society into chaos.',
    imdbRating: '8.0',
    imdbVotes: '640,000',
    BoxOffice: '$92,054,159',
    Poster: 'https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt1130884',
    Title: 'Shutter Island',
    Year: '2010',
    Rated: 'R',
    Released: '19 Feb 2010',
    Runtime: '138 min',
    Genre: 'Mystery, Thriller',
    Director: 'Martin Scorsese',
    Actors: 'Leonardo DiCaprio, Mark Ruffalo, Ben Kingsley, Max von Sydow',
    Plot: 'Teddy Daniels and Chuck Aule, two US marshals, are sent to an asylum on a remote island in order to investigate the disappearance of a patient.',
    imdbRating: '8.2',
    imdbVotes: '1,450,000',
    BoxOffice: '$128,012,934',
    Poster: 'https://m.media-amazon.com/images/M/MV5BYzhiNDkyNzktNTFiYS00ZTFmLThiODUtZmI5ODlhN2UxMWE4XkFtZTcwMjc1OTExMw@@._V1_SX300.jpg',
  },
  {
    imdbID: 'tt2278383',
    Title: 'The Grand Budapest Hotel',
    Year: '2014',
    Rated: 'R',
    Released: '28 Mar 2014',
    Runtime: '99 min',
    Genre: 'Adventure, Comedy, Drama',
    Director: 'Wes Anderson',
    Actors: 'Ralph Fiennes, F. Murray Abraham, Mathieu Amalric, Adrien Brody',
    Plot: 'A writer relates his adventures at a renowned European resort between the first and second World Wars with a concierge who is wrongly framed for murder.',
    imdbRating: '8.1',
    imdbVotes: '860,000',
    BoxOffice: '$59,300,000',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMTk5ODczODA0N15BMl5BanBnXkFtZTgwNTc3NTk2MDE@._V1_SX300.jpg',
  },
];

// ─── Local Recommendation Engine ──────────────────────────────────────────
// Generates intelligent suggestions based on Genre, Director, and Actor matches
const calculateRecommendationScore = (target: MovieDetails, candidate: typeof CURATED_DB[0]): number => {
  if (target.imdb_id === candidate.imdbID) return -100; // exclude the movie itself

  let score = 0;

  // 1. Genre Overlaps (heavy weight)
  const targetGenreIds = target.genre_ids || [];
  const candidateGenreIds = getGenreIdsFromString(candidate.Genre);
  const commonGenres = targetGenreIds.filter(id => candidateGenreIds.includes(id));
  score += commonGenres.length * 4;

  // 2. Director Match (very heavy weight)
  if (target.credits?.crew?.some(c => c.job === 'Director' && c.name === candidate.Director)) {
    score += 8;
  }

  // 3. Actors Match
  const candidateActors = candidate.Actors.split(',').map(a => a.trim().toLowerCase());
  const targetActors = target.credits?.cast?.map(c => c.name.toLowerCase()) || [];
  const commonActors = targetActors.filter(name => candidateActors.some(a => a.includes(name) || name.includes(a)));
  score += commonActors.length * 3;

  // 4. Rating Boost
  score += parseFloat(candidate.imdbRating || '0') * 0.2;

  return score;
};

const getLocalRecommendations = (target: MovieDetails, count = 10): Movie[] => {
  const scored = CURATED_DB.map(movie => ({
    movie,
    score: calculateRecommendationScore(target, movie),
  }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map(item => mapOmdbToMovie(item.movie));
};

// ─── Direct Mapping Functions ──────────────────────────────────────────────
export const mapOmdbToMovie = (omdb: any): Movie => {
  const id = imdbIdToNumber(omdb.imdbID);
  const rating = parseFloat(omdb.imdbRating || '7.5');
  const votes = parseInt((omdb.imdbVotes || '10,000').replace(/[^0-9]/g, ''), 10) || 10000;
  const genreIds = getGenreIdsFromString(omdb.Genre || '');

  return {
    id,
    title: omdb.Title || '',
    original_title: omdb.Title || '',
    overview: omdb.Plot || 'No plot overview available.',
    poster_path: getPosterUrl(omdb.Poster),
    backdrop_path: getBackdropUrl(omdb.Poster),
    release_date: parseOmdbDate(omdb.Released, omdb.Year),
    vote_average: rating,
    vote_count: votes,
    popularity: rating * (votes / 50000),
    genre_ids: genreIds,
    original_language: 'en',
    adult: false,
    video: false,
  };
};

export const mapOmdbToMovieDetails = (omdb: any): MovieDetails => {
  const movie = mapOmdbToMovie(omdb);
  const runtimeMin = parseInt((omdb.Runtime || '120 min').replace(/[^0-9]/g, ''), 10) || 120;
  const genresList = getGenresListFromString(omdb.Genre || '');
  const revenueVal = parseInt((omdb.BoxOffice || '$0').replace(/[^0-9]/g, ''), 10) || 0;

  // Split actors
  const castList: CastMember[] = (omdb.Actors || 'N/A')
    .split(',')
    .map((nameStr: string, idx: number) => {
      const name = nameStr.trim();
      return {
        id: idx + 1000,
        name,
        character: 'Self',
        profile_path: null,
        order: idx,
        known_for_department: 'Acting',
      };
    });

  // Split director & writers
  const crewList: CrewMember[] = [];
  if (omdb.Director && omdb.Director !== 'N/A') {
    crewList.push({
      id: 2000,
      name: omdb.Director.trim(),
      job: 'Director',
      department: 'Directing',
      profile_path: null,
      known_for_department: 'Directing',
    });
  }
  if (omdb.Writer && omdb.Writer !== 'N/A') {
    omdb.Writer.split(',').forEach((w: string, idx: number) => {
      crewList.push({
        id: 3000 + idx,
        name: w.trim(),
        job: 'Writer',
        department: 'Writing',
        profile_path: null,
        known_for_department: 'Writing',
      });
    });
  }

  const details: MovieDetails = {
    ...movie,
    runtime: runtimeMin,
    genres: genresList,
    production_companies: [],
    production_countries: [],
    spoken_languages: (omdb.Language || 'English')
      .split(',')
      .map((l: string, idx: number) => ({
        iso_639_1: 'en',
        name: l.trim(),
        english_name: l.trim(),
      })),
    budget: 0,
    revenue: revenueVal,
    imdb_id: omdb.imdbID || '',
    homepage: '',
    credits: {
      cast: castList,
      crew: crewList,
    },
    // Safe placeholder for trailer video - using a generic search parameter so clicking YouTube works flawlessly
    videos: {
      results: [
        {
          id: '1',
          key: `results?search_query=${encodeURIComponent((omdb.Title || '') + ' official trailer')}`,
          name: `${omdb.Title || 'Movie'} - Official Trailer`,
          site: 'YouTube',
          type: 'Trailer',
          official: true,
          published_at: '',
          size: 720,
        },
      ],
    },
    'watch/providers': {
      results: {},
    },
  };

  // Attach local recommendation lists utilizing our scoring algorithm
  details.similar = {
    page: 1,
    results: getLocalRecommendations(details, 8),
    total_pages: 1,
    total_results: 8,
  };

  details.recommendations = {
    page: 1,
    results: getLocalRecommendations(details, 8),
    total_pages: 1,
    total_results: 8,
  };

  return details;
};

const createPaginatedResponse = <T>(results: T[]): PaginatedResponse<T> => ({
  page: 1,
  results,
  total_pages: 1,
  total_results: results.length,
});

// ─── Main OMDB API exports ──────────────────────────────────────────────────
export const omdbApi = {
  // Trending Movies
  getTrending: async (timeWindow: 'day' | 'week' = 'week'): Promise<PaginatedResponse<Movie>> => {
    // Curated movies are trending
    const trending = CURATED_DB.slice(0, 10).map(mapOmdbToMovie);
    return createPaginatedResponse(trending);
  },

  // Popular Movies
  getPopular: async (page = 1): Promise<PaginatedResponse<Movie>> => {
    const popular = CURATED_DB.slice(2, 12).map(mapOmdbToMovie);
    return createPaginatedResponse(popular);
  },

  // Top Rated Movies
  getTopRated: async (page = 1): Promise<PaginatedResponse<Movie>> => {
    const topRated = [...CURATED_DB]
      .sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating))
      .map(mapOmdbToMovie);
    return createPaginatedResponse(topRated);
  },

  // Now Playing Movies
  getNowPlaying: async (page = 1): Promise<PaginatedResponse<Movie>> => {
    const nowPlaying = CURATED_DB.slice(0, 6).map(mapOmdbToMovie);
    return createPaginatedResponse(nowPlaying);
  },

  // Upcoming Movies
  getUpcoming: async (page = 1): Promise<PaginatedResponse<Movie>> => {
    const upcoming = CURATED_DB.slice(6, 12).map(mapOmdbToMovie);
    return createPaginatedResponse(upcoming);
  },

  // Movie Details Lookup by Number ID (used by screens/components)
  getMovieDetails: async (id: number): Promise<MovieDetails> => {
    const imdbId = numberToImdbId(id);
    
    // First check curated database to avoid extra network requests
    const curated = CURATED_DB.find(m => m.imdbID === imdbId);
    if (curated) {
      return mapOmdbToMovieDetails(curated);
    }

    try {
      const data = await cachedGet({ i: imdbId, plot: 'full' });
      return mapOmdbToMovieDetails(data);
    } catch (error) {
      console.warn(`OMDb details lookup failed for ${imdbId}. Serving custom fallback.`, error);
      // Serve a fallback details screen
      const fallbackCurated = CURATED_DB[0];
      return mapOmdbToMovieDetails({
        ...fallbackCurated,
        imdbID: imdbId,
        Title: `Movie Ref #${id}`,
      });
    }
  },

  // Movie Details Lookup by IMDb ID String directly
  getMovieDetailsByImdbId: async (imdbId: string): Promise<MovieDetails> => {
    try {
      const data = await cachedGet({ i: imdbId, plot: 'full' });
      return mapOmdbToMovieDetails(data);
    } catch (error) {
      const id = imdbIdToNumber(imdbId);
      return omdbApi.getMovieDetails(id);
    }
  },

  // Movie Search by name
  searchMovies: async (query: string, page = 1): Promise<PaginatedResponse<Movie>> => {
    try {
      const data = await cachedGet({ s: query, page, type: 'movie' });
      
      if (!data || data.Response === 'False' || !data.Search) {
        return createPaginatedResponse([]);
      }

      // Parallel detailing to get complete records (overview, votes, IMDb rating)
      const results = await Promise.all(
        data.Search.slice(0, 10).map(async (item: any) => {
          try {
            // First check cache/curated
            const cachedDetails = apiCache.get(JSON.stringify({ i: item.imdbID, plot: 'full' }));
            if (cachedDetails) return mapOmdbToMovie(cachedDetails);

            const curatedItem = CURATED_DB.find(c => c.imdbID === item.imdbID);
            if (curatedItem) return mapOmdbToMovie(curatedItem);

            const details = await cachedGet({ i: item.imdbID, plot: 'full' });
            return mapOmdbToMovie(details);
          } catch {
            return mapOmdbToMovie(item);
          }
        })
      );

      return createPaginatedResponse(results);
    } catch (error) {
      console.error('OMDb search error:', error);
      // Filter curated local list as fallback
      const filtered = CURATED_DB.filter(m => m.Title.toLowerCase().includes(query.toLowerCase())).map(mapOmdbToMovie);
      return createPaginatedResponse(filtered);
    }
  },

  // Multi Search fallback
  searchMulti: async (query: string, page = 1) => {
    return omdbApi.searchMovies(query, page);
  },

  // Genres List
  getGenres: async (): Promise<{ genres: Genre[] }> => {
    return { genres: GENRES_LIST };
  },

  // Discover fallbacks using curated DB or queries
  discover: async (params: {
    with_genres?: string;
    sort_by?: string;
    'vote_average.gte'?: number;
    'vote_count.gte'?: number;
    with_original_language?: string;
    year?: number;
    page?: number;
    primary_release_year?: number;
  }): Promise<PaginatedResponse<Movie>> => {
    let list = CURATED_DB;

    if (params.with_genres) {
      const genreId = parseInt(params.with_genres, 10);
      list = list.filter(m => getGenreIdsFromString(m.Genre).includes(genreId));
    }

    if (params.year) {
      list = list.filter(m => m.Year.includes(String(params.year)));
    }

    return createPaginatedResponse(list.map(mapOmdbToMovie));
  },

  // TV Shows mappings (using curated database items mapped to TVShow)
  getTrendingTV: async (): Promise<PaginatedResponse<TVShow>> => {
    const list: TVShow[] = CURATED_DB.slice(3, 7).map(m => {
      const movie = mapOmdbToMovie(m);
      return {
        id: movie.id,
        name: movie.title,
        original_name: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        first_air_date: movie.release_date,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity,
        genre_ids: movie.genre_ids,
      };
    });
    return createPaginatedResponse(list);
  },

  getPopularTV: async (): Promise<PaginatedResponse<TVShow>> => {
    return omdbApi.getTrendingTV();
  },

  // Watch Providers (mocked cleanly as watch providers are not available in OMDb)
  getWatchProviders: async (movieId: number, country = 'US') => {
    return {
      link: 'https://www.imdb.com',
      flatrate: [
        { provider_id: 8, provider_name: 'Netflix', logo_path: '' },
        { provider_id: 9, provider_name: 'Prime Video', logo_path: '' },
      ],
    };
  },

  // Certifications Lookup
  getCertification: async (movieId: number): Promise<string> => {
    const imdbId = numberToImdbId(movieId);
    const curated = CURATED_DB.find(m => m.imdbID === imdbId);
    if (curated) return curated.Rated || 'PG-13';

    try {
      const data = await cachedGet({ i: imdbId });
      return data.Rated && data.Rated !== 'N/A' ? data.Rated : 'PG-13';
    } catch {
      return 'PG-13';
    }
  },

  // Get by Genre Filter
  getByGenre: async (genreId: number, page = 1): Promise<PaginatedResponse<Movie>> => {
    const filtered = CURATED_DB.filter(m => getGenreIdsFromString(m.Genre).includes(genreId)).map(mapOmdbToMovie);
    
    // If we have few items, let's load more related by doing a generic genre keyword search!
    if (filtered.length < 5) {
      const genreName = GENRES_LIST.find(g => g.id === genreId)?.name || 'drama';
      try {
        const data = await cachedGet({ s: genreName, page, type: 'movie' });
        if (data && data.Search) {
          const fetched = data.Search.slice(0, 10).map(mapOmdbToMovie);
          const merged = [...filtered, ...fetched];
          const unique = merged.filter((item, index, self) =>
            self.findIndex(t => t.id === item.id) === index
          );
          return createPaginatedResponse(unique);
        }
      } catch {
        // ignore error and return filtered
      }
    }

    return createPaginatedResponse(filtered);
  },

  // Get by Mood recommendations mapping
  getByMood: async (mood: string): Promise<PaginatedResponse<Movie>> => {
    const moodGenreMap: Record<string, string> = {
      happy: 'comedy,adventure',
      sad: 'drama',
      excited: 'action,sci-fi',
      scared: 'horror,mystery',
      romantic: 'romance,drama',
      thoughtful: 'mystery,biography',
      thrilled: 'thriller,crime',
      nostalgic: 'animation,fantasy',
      inspired: 'biography,drama',
      relaxed: 'comedy,music',
    };

    const genreKeywords = moodGenreMap[mood.toLowerCase()] || 'action,adventure';
    const keywordList = genreKeywords.split(',');

    const filtered = CURATED_DB.filter(m =>
      keywordList.some(k => m.Genre.toLowerCase().includes(k))
    ).map(mapOmdbToMovie);

    if (filtered.length > 0) {
      return createPaginatedResponse(filtered);
    }
    return createPaginatedResponse(CURATED_DB.slice(0, 6).map(mapOmdbToMovie));
  },
};

export default omdbApi;
