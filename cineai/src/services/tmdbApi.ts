import { apiClient } from './api/apiClient';
import { Movie, MovieDetails, PaginatedResponse, TVShow, Genre, CastMember, CrewMember } from '../types';

// ─── Image Fallback Placeholders ───────────────────────────────────────────
const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=342&auto=format&fit=crop';
const FALLBACK_BACKDROP = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1280&auto=format&fit=crop';
const FALLBACK_PROFILE = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=185&auto=format&fit=crop';

// Cache map for API responses to improve search performance and save API hits
const apiCache = new Map<string, any>();

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
  if (path.startsWith('/')) return `https://image.tmdb.org/t/p/w500${path}`;
  return path;
};

export const getBackdropUrl = (path: string | null): string => {
  if (!path || path === 'N/A') return FALLBACK_BACKDROP;
  if (path.startsWith('/')) return `https://image.tmdb.org/t/p/w1280${path}`;
  return path;
};

export const getProfileUrl = (path: string | null): string => {
  if (!path || path === 'N/A') return FALLBACK_PROFILE;
  if (path.startsWith('/')) return `https://image.tmdb.org/t/p/w185${path}`;
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
export const parseTmdbDate = (releasedStr: string | undefined, yearStr: string | undefined): string => {
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
    Poster: 'https://image.tmdb.org/t/p/w500/8Gxv2Z7Hjsug4ZgCH5z25nuREQz.jpg',
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
    Poster: 'https://image.tmdb.org/t/p/w500/1pdfpwXt6tLY244TLHjRj24Zt6t.jpg',
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
    Poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
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
    Poster: 'https://image.tmdb.org/t/p/w500/ljsQgJm4w4R02oL3t78z770a2FG.jpg',
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
    Poster: 'https://image.tmdb.org/t/p/w500/qJ2tWw7512l29i1KjGo8qG71wCc.jpg',
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
    Poster: 'https://image.tmdb.org/t/p/w500/7omwqh3n7zVpt6N7nZ0BwQv8m2t.jpg',
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
    Poster: 'https://image.tmdb.org/t/p/w500/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
  },
  {
    imdbID: 'tt0111161',
    Title: 'The Shawshank Redemption',
    Year: '1994',
    Rated: 'R',
    Released: '14 Oct 1994',
    Runtime: '142 min',
    Genre: 'Drama',
    Director: 'Frank Darabont',
    Actors: 'Tim Robbins, Morgan Freeman',
    Plot: 'Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.',
    imdbRating: '9.3',
    imdbVotes: '2,740,000',
    BoxOffice: '$28,341,469',
    Poster: 'https://image.tmdb.org/t/p/w500/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
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
    Poster: 'https://image.tmdb.org/t/p/w500/fIE3TL7oEDK210O21gy5z25nu.jpg',
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
    Poster: 'https://image.tmdb.org/t/p/w500/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg',
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
    Poster: 'https://image.tmdb.org/t/p/w500/8Gxv2Z7Hjsug4ZgCH5z25nuREQz.jpg',
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
    Poster: 'https://image.tmdb.org/t/p/w500/iuFNMSmv2jzgj07HiZyDYBfOIeC.jpg',
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
    Poster: 'https://image.tmdb.org/t/p/w500/6v4g6yW01uTmbxqwg75iEkMkrNP.jpg',
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
    Plot: 'K, an officer with the Los Angeles Department\'s blade runner squad, uncovers a secret that could plunge what is left of society into chaos.',
    imdbRating: '8.0',
    imdbVotes: '640,000',
    BoxOffice: '$92,054,159',
    Poster: 'https://image.tmdb.org/t/p/w500/gIZ1QniE6E77NI6lCU6MxlNBvIx.jpg',
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
    Poster: 'https://image.tmdb.org/t/p/w500/4ryC88GMwAaGsj181z1Ty8K0j7q.jpg',
  },
  {
    imdbID: 'tt0137523',
    Title: 'Fight Club',
    Year: '1999',
    Rated: 'R',
    Released: '15 Oct 1999',
    Runtime: '139 min',
    Genre: 'Drama',
    Director: 'David Fincher',
    Actors: 'Brad Pitt, Edward Norton, Helena Bonham Carter',
    Plot: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.',
    imdbRating: '8.8',
    imdbVotes: '2,214,500',
    BoxOffice: '$37,030,102',
    Poster: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  },
  {
    imdbID: 'tt0245429',
    Title: 'Spirited Away',
    Year: '2001',
    Rated: 'PG',
    Released: '20 Jul 2001',
    Runtime: '125 min',
    Genre: 'Animation, Adventure, Fantasy',
    Director: 'Hayao Miyazaki',
    Actors: 'Rumi Hiiragi, Miyu Irino, Mari Natsuki',
    Plot: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
    imdbRating: '8.6',
    imdbVotes: '830,000',
    BoxOffice: '$395,800,000',
    Poster: 'https://image.tmdb.org/t/p/w500/393mh11afQ2pfScok5t6ehACj2Q.jpg',
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
    Actors: 'Miles Teller, J.K. Simmons, Paul Reiser',
    Plot: 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student\'s potential.',
    imdbRating: '8.5',
    imdbVotes: '950,000',
    BoxOffice: '$49,000,000',
    Poster: 'https://image.tmdb.org/t/p/w500/74hgoiY59IKNma3Xhrw4ui14Uth.jpg',
  },
  {
    imdbID: 'tt0068646',
    Title: 'The Godfather',
    Year: '1972',
    Rated: 'R',
    Released: '24 Mar 1972',
    Runtime: '175 min',
    Genre: 'Crime, Drama',
    Director: 'Francis Ford Coppola',
    Actors: 'Marlon Brando, Al Pacino, James Caan, Diane Keaton',
    Plot: 'The aging patriarch of an organized crime dynasty in postwar New York City transfers control of his clandestine empire to his reluctant youngest son.',
    imdbRating: '9.2',
    imdbVotes: '1,950,000',
    BoxOffice: '$250,000,000',
    Poster: 'https://image.tmdb.org/t/p/w500/3bhkrj6UGV2kL8tXyZnuGRyPmgq.jpg',
  },
  {
    imdbID: 'tt6710474',
    Title: 'Everything Everywhere All at Once',
    Year: '2022',
    Rated: 'R',
    Released: '25 Mar 2022',
    Runtime: '139 min',
    Genre: 'Action, Adventure, Sci-Fi',
    Director: 'Daniel Kwan, Daniel Scheinert',
    Actors: 'Michelle Yeoh, Stephanie Hsu, Ke Huy Quan, Jamie Lee Curtis',
    Plot: 'A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.',
    imdbRating: '8.1',
    imdbVotes: '490,000',
    BoxOffice: '$143,400,000',
    Poster: 'https://image.tmdb.org/t/p/w500/w34XT5oD5S2W54h624j8Cst8gup.jpg',
  },
  {
    imdbID: 'tt0338013',
    Title: 'Eternal Sunshine of the Spotless Mind',
    Year: '2004',
    Rated: 'R',
    Released: '19 Mar 2004',
    Runtime: '108 min',
    Genre: 'Drama, Romance, Sci-Fi',
    Director: 'Michel Gondry',
    Actors: 'Jim Carrey, Kate Winslet, Kirsten Dunst, Mark Ruffalo',
    Plot: 'When their relationship turns sour, a young couple undergoes a medical procedure to have each other erased from their memories.',
    imdbRating: '8.3',
    imdbVotes: '1,050,000',
    BoxOffice: '$74,000,000',
    Poster: 'https://image.tmdb.org/t/p/w500/51J1J9t9mQd6J4sN7Jj7fN9sS3Q.jpg',
  },
  {
    imdbID: 'tt0211915',
    Title: 'Amélie',
    Year: '2001',
    Rated: 'R',
    Released: '25 Apr 2001',
    Runtime: '122 min',
    Genre: 'Comedy, Romance',
    Director: 'Jean-Pierre Jeunet',
    Actors: 'Audrey Tautou, Mathieu Kassovitz, Rufus',
    Plot: 'Amélie is an innocent and naive girl in Paris with her own sense of justice. She decides to help those around her and, along the way, discovers love.',
    imdbRating: '8.3',
    imdbVotes: '790,000',
    BoxOffice: '$174,200,000',
    Poster: 'https://image.tmdb.org/t/p/w500/nuf4462J1F4020J0eW1zO1z5j6A.jpg',
  },
  {
    imdbID: 'tt0047478',
    Title: 'Seven Samurai',
    Year: '1954',
    Released: '26 Apr 1954',
    Runtime: '207 min',
    Genre: 'Action, Drama',
    Director: 'Akira Kurosawa',
    Actors: 'Toshiro Mifune, Takashi Shimura, Keiko Tsushima',
    Plot: 'Farmers in a Japanese village hire seven masterless samurai to combat bandits who steal their crops after harvest.',
    imdbRating: '8.6',
    imdbVotes: '360,000',
    BoxOffice: '$3,000,000',
    Poster: 'https://image.tmdb.org/t/p/w500/81RM4mG9xNSc5c0TfE9e6z76V6a.jpg',
  },
  {
    imdbID: 'tt0119217',
    Title: 'Good Will Hunting',
    Year: '1997',
    Rated: 'R',
    Released: '09 Jan 1998',
    Runtime: '126 min',
    Genre: 'Drama',
    Director: 'Gus Van Sant',
    Actors: 'Robin Williams, Matt Damon, Ben Affleck, Minnie Driver',
    Plot: 'Will Hunting, a janitor at M.I.T., has a gift for mathematics, but needs help from a psychologist in order to find direction in his life.',
    imdbRating: '8.3',
    imdbVotes: '1,010,000',
    BoxOffice: '$225,900,000',
    Poster: 'https://image.tmdb.org/t/p/w500/hah14B5nF6D3v624Fst0G7G3J.jpg',
  },
  {
    imdbID: 'tt0828107',
    Title: 'No Country for Old Men',
    Year: '2007',
    Rated: 'R',
    Released: '21 Nov 2007',
    Runtime: '122 min',
    Genre: 'Crime, Drama, Thriller',
    Director: 'Ethan Coen, Joel Coen',
    Actors: 'Tommy Lee Jones, Javier Bardem, Josh Brolin',
    Plot: 'Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash near the Rio Grande.',
    imdbRating: '8.2',
    imdbVotes: '1,050,000',
    BoxOffice: '$171,600,000',
    Poster: 'https://image.tmdb.org/t/p/w500/185N90Qe0gUj3Vst5C0F6O7Wb7t.jpg',
  },
  {
    imdbID: 'tt2278388',
    Title: 'The Grand Budapest Hotel',
    Year: '2014',
    Rated: 'R',
    Released: '28 Mar 2014',
    Runtime: '99 min',
    Genre: 'Comedy, Drama',
    Director: 'Wes Anderson',
    Actors: 'Ralph Fiennes, F. Murray Abraham, Mathieu Amalric',
    Plot: 'A writer relates his adventures at a renowned European resort hotel between the first and second World Wars with a concierge who was wrongly framed for murder.',
    imdbRating: '8.1',
    imdbVotes: '860,000',
    BoxOffice: '$172,900,000',
    Poster: 'https://image.tmdb.org/t/p/w500/74hgoiY59IKNma3Xhrw4ui14Uth.jpg',
  },
  {
    imdbID: 'tt0364569',
    Title: 'Oldboy',
    Year: '2003',
    Rated: 'R',
    Released: '21 Nov 2003',
    Runtime: '120 min',
    Genre: 'Action, Drama, Mystery',
    Director: 'Park Chan-wook',
    Actors: 'Choi Min-sik, Yoo Ji-tae, Kang Hye-jung',
    Plot: 'After being kidnapped and imprisoned for fifteen years, Oh Dae-Su is released, only to find that he must find his captor in five days.',
    imdbRating: '8.4',
    imdbVotes: '620,000',
    BoxOffice: '$15,000,000',
    Poster: 'https://image.tmdb.org/t/p/w500/6fc184m12Q0eW7511wH8h.jpg',
  },
  {
    imdbID: 'tt0317248',
    Title: 'City of God',
    Year: '2002',
    Rated: 'R',
    Released: '30 Aug 2002',
    Runtime: '130 min',
    Genre: 'Crime, Drama',
    Director: 'Fernando Meirelles, Kátia Lund',
    Actors: 'Alexandre Rodrigues, Leandro Firmino, Phellipe Haagensen',
    Plot: 'In the slums of Rio, two kids\' paths diverge as one struggles to become a photographer and the other a kingpin.',
    imdbRating: '8.6',
    imdbVotes: '790,000',
    BoxOffice: '$30,600,000',
    Poster: 'https://image.tmdb.org/t/p/w500/kxFqcdQKsToO0OUXHcrrNCHDBzO.jpg',
  },
  {
    imdbID: 'tt4633694',
    Title: 'Spider-Man: Into the Spider-Verse',
    Year: '2018',
    Rated: 'PG',
    Released: '14 Dec 2018',
    Runtime: '117 min',
    Genre: 'Animation, Action, Adventure',
    Director: 'Bob Persichetti, Peter Ramsey, Rodney Rothman',
    Actors: 'Shameik Moore, Jake Johnson, Hailee Steinfeld',
    Plot: 'Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.',
    imdbRating: '8.4',
    imdbVotes: '650,000',
    BoxOffice: '$384,300,000',
    Poster: 'https://image.tmdb.org/t/p/w500/iiIKM1h7xNma354h624j8Cst8gu.jpg',
  },
  {
    imdbID: 'tt5311514',
    Title: 'Your Name.',
    Year: '2016',
    Rated: 'PG',
    Released: '26 Aug 2016',
    Runtime: '106 min',
    Genre: 'Animation, Drama, Romance',
    Director: 'Makoto Shinkai',
    Actors: 'Ryunosuke Kamiki, Mone Kamishiraishi, Ryo Narita',
    Plot: 'Two strangers find themselves linked in a bizarre way. When a connection is formed, will distance be the only thing to keep them apart?',
    imdbRating: '8.4',
    imdbVotes: '310,000',
    BoxOffice: '$382,200,000',
    Poster: 'https://image.tmdb.org/t/p/w500/q71oJTxuGY57FOW0JvLjQnJ36J.jpg',
  },
  {
    imdbID: 'tt0081822',
    Title: 'Alien',
    Year: '1979',
    Rated: 'R',
    Released: '25 May 1979',
    Runtime: '117 min',
    Genre: 'Horror, Sci-Fi',
    Director: 'Ridley Scott',
    Actors: 'Sigourney Weaver, Tom Skerritt, John Hurt',
    Plot: 'The crew of a commercial spacecraft encounter a deadly lifeform after investigating an unknown transmission.',
    imdbRating: '8.5',
    imdbVotes: '930,000',
    BoxOffice: '$106,200,000',
    Poster: 'https://image.tmdb.org/t/p/w500/vfrQk535haFX4v5j0YmQnJ36Je.jpg',
  },
  {
    imdbID: 'tt0825683',
    Title: 'The Prestige',
    Year: '2006',
    Rated: 'PG-13',
    Released: '20 Oct 2006',
    Runtime: '130 min',
    Genre: 'Drama, Mystery, Sci-Fi',
    Director: 'Christopher Nolan',
    Actors: 'Christian Bale, Hugh Jackman, Scarlett Johansson',
    Plot: 'After a tragic accident, two stage magicians in 1890s London engage in a battle to create the ultimate illusion while sacrificing everything they have to outwit each other.',
    imdbRating: '8.5',
    imdbVotes: '1,410,000',
    BoxOffice: '$109,700,000',
    Poster: 'https://image.tmdb.org/t/p/w500/bdNm4mG9xNSc5c0TfE9e6z76V6a.jpg',
  },
  {
    imdbID: 'tt0112864',
    Title: 'The Truman Show',
    Year: '1998',
    Rated: 'PG',
    Released: '05 Jun 1998',
    Runtime: '103 min',
    Genre: 'Comedy, Drama',
    Director: 'Peter Weir',
    Actors: 'Jim Carrey, Laura Linney, Ed Harris',
    Plot: 'An insurance salesman discovers his whole life is actually a reality TV show.',
    imdbRating: '8.2',
    imdbVotes: '1,150,000',
    BoxOffice: '$264,100,000',
    Poster: 'https://image.tmdb.org/t/p/w500/74hgoiY59IKNma3Xhrw4ui14Uth.jpg',
  },
  {
    imdbID: 'tt2015381',
    Title: 'Arrival',
    Year: '2016',
    Rated: 'PG-13',
    Released: '11 Nov 2016',
    Runtime: '116 min',
    Genre: 'Drama, Mystery, Sci-Fi',
    Director: 'Denis Villeneuve',
    Actors: 'Amy Adams, Jeremy Renner, Forest Whitaker',
    Plot: 'A linguist works with the military to communicate with alien-like lifeforms after twelve mysterious spacecraft appear around the world.',
    imdbRating: '7.9',
    imdbVotes: '740,000',
    BoxOffice: '$203,400,000',
    Poster: 'https://image.tmdb.org/t/p/w500/uIb9Tvae5haF0XcQBaPyufmxbb0.jpg',
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

  return scored.slice(0, count).map(item => mapTmdbToMovie(item.movie));
};

// ─── Direct Mapping Functions ──────────────────────────────────────────────
export const mapTmdbToMovie = (movieData: any): Movie => {
  const imdbId = movieData.imdbID || movieData.imdb_id || '';
  const tmdbId = movieData.id ? Number(movieData.id) : undefined;
  let id = imdbIdToNumber(imdbId);
  if (!id && movieData.id) {
    id = Number(movieData.id);
  }
  if (!id) {
    const title = movieData.Title || movieData.title || '';
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = (hash << 5) - hash + title.charCodeAt(i);
      hash |= 0;
    }
    id = Math.abs(hash) || Math.floor(Math.random() * 1000000) + 1;
  }
  
  const poster = getPosterUrl(movieData.poster_path || movieData.Poster);
  const backdrop = getBackdropUrl(movieData.backdrop_path || movieData.Poster);
  const lang = movieData.original_language || 'en';
  const rating = movieData.vote_average !== undefined ? movieData.vote_average : parseFloat(movieData.imdbRating || '7.5');
  const votes = movieData.vote_count !== undefined ? movieData.vote_count : (parseInt((movieData.imdbVotes || '10,000').replace(/[^0-9]/g, ''), 10) || 10000);
  const genreIds = movieData.genre_ids && movieData.genre_ids.length > 0 ? movieData.genre_ids : getGenreIdsFromString(movieData.Genre || '');
  const releaseDate = movieData.release_date || parseTmdbDate(movieData.Released, movieData.Year);

  return {
    id,
    imdb_id: imdbId || undefined,
    imdbID: imdbId || undefined,
    tmdb_id: tmdbId,
    title: movieData.Title || movieData.title || movieData.original_title || '',
    original_title: movieData.original_title || movieData.Title || movieData.title || '',
    overview: movieData.Plot || movieData.overview || 'No plot overview available.',
    poster_path: poster,
    backdrop_path: backdrop,
    release_date: releaseDate,
    vote_average: rating,
    vote_count: votes,
    popularity: rating * (votes / 50000),
    genre_ids: genreIds,
    original_language: lang,
    adult: false,
    video: false,
  };
};

export const mapTmdbToMovieDetails = (movieData: any): MovieDetails => {
  const movie = mapTmdbToMovie(movieData);
  const runtimeMin = movieData.runtime || parseInt((movieData.Runtime || '120 min').replace(/[^0-9]/g, ''), 10) || 120;
  const genresList = movieData.genres || getGenresListFromString(movieData.Genre || '');
  const revenueVal = movieData.revenue || parseInt((movieData.BoxOffice || '$0').replace(/[^0-9]/g, ''), 10) || 0;

  // Split actors
  const castList: CastMember[] = Array.isArray(movieData?.credits?.cast) && movieData.credits.cast.length > 0
    ? movieData.credits.cast.slice(0, 20).map((item: any, idx: number) => ({
      id: Number(item?.id || idx + 1000),
      name: String(item?.name || 'Unknown'),
      character: String(item?.character || 'Self'),
      profile_path: item?.profile_path || null,
      order: Number(item?.order ?? idx),
      known_for_department: String(item?.known_for_department || 'Acting'),
    }))
    : (movieData.Actors || 'N/A')
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
  const crewList: CrewMember[] = Array.isArray(movieData?.credits?.crew) && movieData.credits.crew.length > 0
    ? movieData.credits.crew.map((item: any, idx: number) => ({
      id: Number(item?.id || idx + 2000),
      name: String(item?.name || 'Unknown'),
      job: String(item?.job || 'Crew'),
      department: String(item?.department || 'Production'),
      profile_path: item?.profile_path || null,
      known_for_department: String(item?.known_for_department || item?.department || 'Production'),
    }))
    : (() => {
      const built: CrewMember[] = [];
      if (movieData.Director && movieData.Director !== 'N/A') {
        built.push({
          id: 2000,
          name: movieData.Director.trim(),
          job: 'Director',
          department: 'Directing',
          profile_path: null,
          known_for_department: 'Directing',
        });
      }
      if (movieData.Writer && movieData.Writer !== 'N/A') {
        movieData.Writer.split(',').forEach((w: string, idx: number) => {
          built.push({
            id: 3000 + idx,
            name: w.trim(),
            job: 'Writer',
            department: 'Writing',
            profile_path: null,
            known_for_department: 'Writing',
          });
        });
      }
      return built;
    })();

  const mapListPayloadToMovies = (payload: any): Movie[] => {
    const results = payload?.results;
    if (!Array.isArray(results)) return [];
    return results.map(mapTmdbToMovie);
  };

  const mappedSimilar = mapListPayloadToMovies(movieData?.similar);
  const mappedRecommendations = mapListPayloadToMovies(movieData?.recommendations);

  const details: MovieDetails = {
    ...movie,
    runtime: runtimeMin,
    genres: genresList,
    production_companies: [],
    production_countries: [],
    spoken_languages: (movieData.Language || 'English')
      .split(',')
      .map((l: string, idx: number) => ({
        iso_639_1: 'en',
        name: l.trim(),
        english_name: l.trim(),
      })),
    budget: 0,
    revenue: revenueVal,
    imdb_id: movieData.imdbID || '',
    homepage: '',
    credits: {
      cast: castList,
      crew: crewList,
    },
    // Use authentic videos list if available from backend, otherwise fall back to dummy/search query structure
    videos: movieData.videos && movieData.videos.results ? movieData.videos : {
      results: [
        {
          id: '1',
          key: `results?search_query=${encodeURIComponent((movieData.Title || '') + ' official trailer')}`,
          name: `${movieData.Title || 'Movie'} - Official Trailer`,
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
    similar: {
      page: 1,
      results: mappedSimilar,
      total_pages: 1,
      total_results: mappedSimilar.length,
    },
    recommendations: {
      page: 1,
      results: mappedRecommendations,
      total_pages: 1,
      total_results: mappedRecommendations.length,
    },
  };

  return details;
};

const RECOMMENDATION_LOOP_TOKENS = [
  'dune',
  'interstellar',
  'dark knight',
  'avengers',
  'oppenheimer',
  'inception',
];

const FRANCHISE_STOPWORDS = new Set([
  'the', 'and', 'of', 'a', 'an', 'part', 'chapter', 'volume', 'vol', 'episode',
  'movie', 'film', 'story', 'rise', 'return', 'returns', 'chronicles',
]);

const safeYearFromDate = (date?: string): number | null => {
  if (!date || date.length < 4) return null;
  const year = parseInt(date.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
};

const normalizeTitle = (title: string): string => {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getFranchiseKey = (title: string): string => {
  const normalized = normalizeTitle(title)
    .replace(/\b(part|chapter|volume|vol|episode)\b.*$/, '')
    .trim();
  if (!normalized) return '';
  const tokens = normalized
    .split(' ')
    .filter(token => token.length > 2 && !FRANCHISE_STOPWORDS.has(token));
  if (tokens.length === 0) return normalized;
  return tokens.slice(0, 2).join(' ');
};

const dedupeMovies = (movies: Movie[]): Movie[] => {
  const map = new Map<number, Movie>();
  for (const movie of movies) {
    if (!movie || !movie.id) continue;
    if (!map.has(movie.id)) map.set(movie.id, movie);
  }
  return Array.from(map.values());
};

const isHiddenGemCandidate = (movie: Movie): boolean => {
  return movie.vote_average >= 7.0 && movie.vote_count >= 40 && movie.vote_count <= 5500;
};

const scoreRecommendationCandidate = (target: MovieDetails, candidate: Movie): number => {
  const targetGenres = new Set(target.genre_ids || []);
  const targetLang = target.original_language || 'en';
  const targetYear = safeYearFromDate(target.release_date);
  const candidateYear = safeYearFromDate(candidate.release_date);

  let score =
    candidate.vote_average * 1.9 +
    Math.log10(Math.max(candidate.vote_count, 1)) * 1.25 +
    Math.min(candidate.popularity || 0, 1200) * 0.018;

  const genreOverlap = (candidate.genre_ids || []).filter(id => targetGenres.has(id)).length;
  score += genreOverlap * 2.4;

  if (candidate.original_language === targetLang) {
    score += 0.85;
  }

  if (targetYear && candidateYear) {
    const delta = Math.abs(candidateYear - targetYear);
    if (delta <= 3) score += 0.9;
    if (delta >= 18) score += 0.75;
  }

  if (candidate.vote_count > 90000) {
    score -= 1.7;
  }

  if (isHiddenGemCandidate(candidate)) {
    score += 1.45;
  }

  const normalizedTitle = normalizeTitle(candidate.title);
  if (RECOMMENDATION_LOOP_TOKENS.some(token => normalizedTitle.includes(token))) {
    score -= 2.6;
  }

  return score;
};

const buildDiverseRecommendationList = (
  target: MovieDetails,
  pool: Movie[],
  count = 12,
): Movie[] => {
  type Candidate = {
    movie: Movie;
    score: number;
    franchiseKey: string;
    hiddenGem: boolean;
    primaryGenre: number;
  };

  const scored: Candidate[] = dedupeMovies(pool)
    .filter(movie => movie.id !== target.id)
    .map(movie => ({
      movie,
      score: scoreRecommendationCandidate(target, movie),
      franchiseKey: getFranchiseKey(movie.title),
      hiddenGem: isHiddenGemCandidate(movie),
      primaryGenre: movie.genre_ids?.[0] ?? -1,
    }))
    .sort((a, b) => b.score - a.score);

  const picks: Movie[] = [];
  const pickedIds = new Set<number>();
  const usedFranchiseKeys = new Set<string>();
  const genreUsage = new Map<number, number>();

  const commit = (candidate: Candidate): void => {
    picks.push(candidate.movie);
    pickedIds.add(candidate.movie.id);
    if (candidate.franchiseKey) usedFranchiseKeys.add(candidate.franchiseKey);
    const currentGenreCount = genreUsage.get(candidate.primaryGenre) || 0;
    genreUsage.set(candidate.primaryGenre, currentGenreCount + 1);
  };

  const canUseFranchise = (candidate: Candidate): boolean => {
    return !candidate.franchiseKey || !usedFranchiseKeys.has(candidate.franchiseKey);
  };

  for (let slot = 0; slot < count; slot += 1) {
    let chosen: Candidate | undefined;

    if (slot % 4 === 3) {
      chosen = scored.find(candidate =>
        !pickedIds.has(candidate.movie.id) &&
        candidate.hiddenGem &&
        canUseFranchise(candidate),
      );
    }

    if (!chosen) {
      chosen = scored.find(candidate =>
        !pickedIds.has(candidate.movie.id) &&
        canUseFranchise(candidate) &&
        (genreUsage.get(candidate.primaryGenre) || 0) < 2,
      );
    }

    if (!chosen) {
      chosen = scored.find(candidate =>
        !pickedIds.has(candidate.movie.id) &&
        canUseFranchise(candidate),
      );
    }

    if (!chosen) {
      chosen = scored.find(candidate => !pickedIds.has(candidate.movie.id));
    }

    if (!chosen) break;
    commit(chosen);
  }

  return picks.slice(0, count);
};

const fetchRecommendationSourcePool = async (target: MovieDetails): Promise<Movie[]> => {
  const targetGenres = (target.genre_ids || []).slice(0, 3);
  const genreFilter = targetGenres.length > 0 ? targetGenres.join('|') : '18|53|80';
  const primaryLanguage = target.original_language || 'en';
  const targetYear = safeYearFromDate(target.release_date);

  const requests: Array<Promise<{ data: any[] }>> = [
    apiClient.get<any[]>('/movies/discover', {
      params: {
        with_genres: genreFilter,
        sort_by: 'popularity.desc',
        vote_average_gte: 6.2,
        vote_count_gte: 120,
        limit: 32,
      },
    }),
    apiClient.get<any[]>('/movies/discover', {
      params: {
        with_genres: genreFilter,
        sort_by: 'vote_average.desc',
        vote_average_gte: 7.0,
        vote_count_gte: 55,
        limit: 32,
      },
    }),
    apiClient.get<any[]>('/movies/discover', {
      params: {
        with_genres: genreFilter,
        with_original_language: primaryLanguage,
        sort_by: 'popularity.desc',
        vote_average_gte: 5.8,
        vote_count_gte: 30,
        limit: 24,
      },
    }),
    apiClient.get<any[]>('/movies/trending', {
      params: { limit: 24 },
    }),
  ];

  if (targetYear) {
    requests.push(
      apiClient.get<any[]>('/movies/discover', {
        params: {
          with_genres: genreFilter,
          primary_release_year: Math.max(targetYear - 1, 1970),
          sort_by: 'vote_average.desc',
          vote_average_gte: 6.7,
          vote_count_gte: 35,
          limit: 18,
        },
      }),
    );
  }

  const leadGenre = target.genres?.[0]?.name;
  if (leadGenre) {
    requests.push(
      apiClient.get<any[]>('/movies/search', {
        params: {
          query: `${leadGenre} cinema`,
          limit: 12,
        },
      }),
    );
  }

  const settled = await Promise.allSettled(requests);
  const pool: Movie[] = [];

  for (const response of settled) {
    if (response.status !== 'fulfilled') continue;
    const rows = response.value?.data;
    if (!Array.isArray(rows)) continue;
    rows.forEach(item => {
      try {
        pool.push(mapTmdbToMovie(item));
      } catch {
        // ignore malformed records
      }
    });
  }

  return dedupeMovies(pool).filter(movie => movie.id !== target.id);
};

const hydrateDiverseRecommendations = async (details: MovieDetails): Promise<MovieDetails> => {
  const seededPool = dedupeMovies([
    ...(details.similar?.results || []),
    ...(details.recommendations?.results || []),
  ]);

  let dynamicPool: Movie[] = [];
  try {
    dynamicPool = await fetchRecommendationSourcePool(details);
  } catch {
    dynamicPool = [];
  }

  const mergedPool = dedupeMovies([...seededPool, ...dynamicPool]).filter(movie => movie.id !== details.id);
  const fallbackPool = mergedPool.length > 0 ? mergedPool : getLocalRecommendations(details, 18);
  const curated = buildDiverseRecommendationList(details, fallbackPool, 12);

  return {
    ...details,
    similar: createPaginatedResponse(curated),
    recommendations: createPaginatedResponse(curated),
  };
};

const createPaginatedResponse = <T>(results: T[]): PaginatedResponse<T> => ({
  page: 1,
  results,
  total_pages: 1,
  total_results: results.length,
});

// ─── Pre-mapped Curated Movie Array (no network call needed) ───────────────
export const CURATED_MOVIES: Movie[] = CURATED_DB.map(mapTmdbToMovie);

// ─── Main TMDB API exports delegating to asynchronous backend ───────────────
export const tmdbApi = {
  // Trending Movies
  getTrending: async (timeWindow: 'day' | 'week' = 'week', limit = 35): Promise<PaginatedResponse<Movie>> => {
    try {
      const { data } = await apiClient.get<any[]>('/movies/trending', { params: { limit } });
      if (data && data.length > 0) {
        return createPaginatedResponse(data.map(mapTmdbToMovie));
      }
    } catch (e) {
      console.log('Backend trending fetch failed. Falling back to local curated cache.', e);
    }
    const trending = CURATED_DB.slice(0, 10).map(mapTmdbToMovie);
    return createPaginatedResponse(trending);
  },

  // Popular Movies
  getPopular: async (page = 1, limit = 35): Promise<PaginatedResponse<Movie>> => {
    try {
      const { data } = await apiClient.get<any[]>('/movies/popular', { params: { limit } });
      if (data && data.length > 0) {
        return createPaginatedResponse(data.map(mapTmdbToMovie));
      }
    } catch (e) {
      console.log('Backend popular fetch failed. Falling back to local curated cache.', e);
    }
    const popular = CURATED_DB.slice(2, 12).map(mapTmdbToMovie);
    return createPaginatedResponse(popular);
  },

  // Top Rated Movies
  getTopRated: async (page = 1, limit = 35): Promise<PaginatedResponse<Movie>> => {
    try {
      const { data } = await apiClient.get<any[]>('/movies/top_rated', { params: { limit } });
      if (data && data.length > 0) {
        return createPaginatedResponse(data.map(mapTmdbToMovie));
      }
    } catch (e) {
      console.log('Backend top_rated fetch failed. Falling back to local curated cache.', e);
    }
    const topRated = [...CURATED_DB]
      .sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating))
      .map(mapTmdbToMovie);
    return createPaginatedResponse(topRated);
  },

  // Now Playing Movies
  getNowPlaying: async (page = 1): Promise<PaginatedResponse<Movie>> => {
    const nowPlaying = CURATED_DB.slice(0, 6).map(mapTmdbToMovie);
    return createPaginatedResponse(nowPlaying);
  },

  // Upcoming Movies
  getUpcoming: async (page = 1, limit = 35): Promise<PaginatedResponse<Movie>> => {
    try {
      const { data } = await apiClient.get<any[]>('/movies/upcoming', { params: { limit } });
      if (data && data.length > 0) {
        return createPaginatedResponse(data.map(mapTmdbToMovie));
      }
    } catch (e) {
      console.log('Backend upcoming fetch failed. Falling back to local curated cache.', e);
    }
    const upcoming = CURATED_DB.slice(6, 12).map(mapTmdbToMovie);
    return createPaginatedResponse(upcoming);
  },

  // Movie Details Lookup by Number ID
  getMovieDetails: async (id: number): Promise<MovieDetails> => {
    const imdbId = numberToImdbId(id);
    let details: MovieDetails;

    try {
      const { data } = await apiClient.get<any>(`/movies/details/${imdbId}`);
      details = mapTmdbToMovieDetails(data);
    } catch (error) {
      console.log(`Backend details lookup failed for ${imdbId}. Serving custom fallback.`, error);
      const fallbackCurated = CURATED_DB.find(m => m.imdbID === imdbId) || CURATED_DB[0];
      details = mapTmdbToMovieDetails({
        ...fallbackCurated,
        imdbID: fallbackCurated.imdbID || imdbId,
        Title: fallbackCurated.Title || `Movie Ref #${id}`,
      });
    }

    return hydrateDiverseRecommendations(details);
  },

  // Movie Details Lookup by IMDb ID String directly
  getMovieDetailsByImdbId: async (imdbId: string): Promise<MovieDetails> => {
    try {
      const { data } = await apiClient.get<any>(`/movies/details/${imdbId}`);
      const details = mapTmdbToMovieDetails(data);
      return hydrateDiverseRecommendations(details);
    } catch (error) {
      const id = imdbIdToNumber(imdbId);
      return tmdbApi.getMovieDetails(id);
    }
  },

  // Movie Search by query
  searchMovies: async (query: string, page = 1, limit = 35): Promise<PaginatedResponse<Movie>> => {
    try {
      const { data } = await apiClient.get<any[]>('/movies/search', { params: { query, limit } });
      if (data && data.length > 0) {
        return createPaginatedResponse(data.map(mapTmdbToMovie));
      }
    } catch (error) {
      console.log('Backend search query failed. Serving filtered offline database.', error);
    }
    const filtered = CURATED_DB.filter(m => 
      m.Title.toLowerCase().includes(query.toLowerCase()) || 
      m.Genre.toLowerCase().includes(query.toLowerCase())
    ).map(mapTmdbToMovie);
    return createPaginatedResponse(filtered);
  },

  // Multi Search fallback
  searchMulti: async (query: string, page = 1) => {
    return tmdbApi.searchMovies(query, page);
  },

  // Genres List
  getGenres: async (): Promise<{ genres: Genre[] }> => {
    return { genres: GENRES_LIST };
  },

  // Discover fallbacks
  discover: async (params: {
    with_genres?: string;
    sort_by?: string;
    'vote_average.gte'?: number;
    'vote_count.gte'?: number;
    with_original_language?: string;
    year?: number;
    page?: number;
    primary_release_year?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Movie>> => {
    try {
      const queryParams: any = {
        with_genres: params.with_genres,
        sort_by: params.sort_by,
        vote_average_gte: params['vote_average.gte'],
        vote_count_gte: params['vote_count.gte'],
        with_original_language: params.with_original_language,
        primary_release_year: params.year || params.primary_release_year,
        page: params.page || 1,
        limit: params.limit || 35,
      };
      
      const { data } = await apiClient.get<any[]>('/movies/discover', { params: queryParams });
      if (data && data.length > 0) {
        return createPaginatedResponse(data.map(mapTmdbToMovie));
      }
    } catch (e) {
      console.log('Backend discover query failed. Falling back to local filters.', e);
    }

    let list = CURATED_DB;

    if (params.with_genres) {
      const genreIds = params.with_genres
        .split(/[|,]/)
        .map(value => parseInt(value.trim(), 10))
        .filter(value => Number.isFinite(value));
      if (genreIds.length > 0) {
        list = list.filter(m => {
          const ids = getGenreIdsFromString(m.Genre);
          return genreIds.some(id => ids.includes(id));
        });
      }
    }

    if (params.year) {
      list = list.filter(m => m.Year.includes(String(params.year)));
    }

    return createPaginatedResponse(list.map(mapTmdbToMovie));
  },

  // TV Shows mappings
  getTrendingTV: async (): Promise<PaginatedResponse<TVShow>> => {
    const list: TVShow[] = CURATED_DB.slice(3, 7).map(m => {
      const movie = mapTmdbToMovie(m);
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
    return tmdbApi.getTrendingTV();
  },

  // Watch Providers (mocked cleanly)
  getWatchProviders: async (movieId: number, country = 'US') => {
    return {
      link: 'https://www.themoviedb.org',
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
      const { data } = await apiClient.get<any>(`/movies/details/${imdbId}`);
      return data.Rated && data.Rated !== 'N/A' ? data.Rated : 'PG-13';
    } catch {
      return 'PG-13';
    }
  },

  // Get by Genre Filter
  getByGenre: async (genreId: number, page = 1): Promise<PaginatedResponse<Movie>> => {
    const filtered = CURATED_DB.filter(m => getGenreIdsFromString(m.Genre).includes(genreId)).map(mapTmdbToMovie);
    
    if (filtered.length < 5) {
      const genreName = GENRES_LIST.find(g => g.id === genreId)?.name || 'drama';
      try {
        const data = await tmdbApi.searchMovies(genreName, page);
        if (data && data.results) {
          const merged = [...filtered, ...data.results];
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
    ).map(mapTmdbToMovie);

    if (filtered.length > 0) {
      return createPaginatedResponse(filtered);
    }
    return createPaginatedResponse(CURATED_DB.slice(0, 6).map(mapTmdbToMovie));
  },
};

export default tmdbApi;
