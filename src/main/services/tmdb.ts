import type { MediaMatch } from '../../types/media';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function getApiKey(): string {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured in .env');
  }
  return apiKey;
}

export interface TMDBSearchParams {
  query: string;
  year?: number;
  type: 'tv' | 'movie';
}

export async function searchMedia(params: TMDBSearchParams): Promise<MediaMatch[]> {
  const apiKey = getApiKey();
  const { query, year, type } = params;
  const endpoint = type === 'movie' ? '/search/movie' : '/search/tv';
  
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', apiKey);
  url.searchParams.append('query', query);
  url.searchParams.append('language', 'en-US');
  
  if (year) {
    const yearParam = type === 'movie' ? 'primary_release_year' : 'first_air_date_year';
    url.searchParams.append(yearParam, year.toString());
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return data.results.map((result: any) => ({
    tmdbId: result.id,
    title: type === 'movie' ? result.title : result.name,
    year: parseInt((type === 'movie' ? result.release_date : result.first_air_date) || '0', 10),
    type,
    posterPath: result.poster_path ? `https://image.tmdb.org/t/p/w92${result.poster_path}` : null,
  }));
}

export async function getEpisodeDetails(
  tvId: number,
  seasonNumber: number,
  episodeNumber: number
): Promise<Partial<MediaMatch>> {
  const apiKey = getApiKey();

  const url = new URL(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
  url.searchParams.append('api_key', apiKey);
  url.searchParams.append('language', 'en-US');

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    episodeTitle: data.name,
    seasonNumber: data.season_number,
    episodeNumber: data.episode_number,
  };
}
