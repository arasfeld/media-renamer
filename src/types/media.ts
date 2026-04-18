/** Represents a video file discovered during scanning */
export interface MediaFile {
  /** Absolute path to the file */
  path: string;
  /** Original filename without path */
  filename: string;
  /** File extension (lowercase, e.g., 'mkv') */
  extension: string;
  /** File size in bytes */
  size: number;
}

/** Result of parsing a filename */
export interface ParsedFilename {
  /** Detected media type */
  type: 'tv' | 'movie' | 'unknown';
  /** Extracted title (show name or movie title) */
  title: string | null;
  /** Season number (TV only) */
  season: number | null;
  /** Episode number (TV only) */
  episode: number | null;
  /** Release year (movies primarily) */
  year: number | null;
  /** Video quality if detected (e.g., '1080p', '720p') */
  quality: string | null;
  /** Original tokens that couldn't be parsed */
  unparsedTokens: string[];
}

/** Combined file info with parsed metadata */
export interface ScannedFile {
  file: MediaFile;
  parsed: ParsedFilename;
  match?: MediaMatch | null;
  matchStatus: 'none' | 'searching' | 'matched' | 'error';
}

/** For future use: matched metadata from TMDB */
export interface MediaMatch {
  tmdbId: number;
  title: string;
  year: number;
  type: 'tv' | 'movie';
  posterPath: string | null;
  /** For TV: season/episode info */
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
}

/** For future use: rename operation plan */
export interface RenamePlan {
  originalPath: string;
  newPath: string;
  newFilename: string;
  match: MediaMatch | null;
  status: 'pending' | 'ready' | 'error';
  error?: string;
}
