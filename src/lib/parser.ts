import type { ParsedFilename, ScannedFile } from '../types/media';

/** Quality patterns to detect */
const QUALITY_PATTERNS = [
  /\b(2160p|4K)\b/i,
  /\b(1080p)\b/i,
  /\b(720p)\b/i,
  /\b(480p)\b/i,
  /\b(HDTV)\b/i,
  /\b(BluRay|Blu-Ray|BRRip)\b/i,
  /\b(WEB-DL|WEBDL|WEBRip)\b/i,
  /\b(DVDRip)\b/i,
];

/** Common release group and codec tokens to filter out */
const NOISE_TOKENS = new Set([
  'x264',
  'x265',
  'h264',
  'h265',
  'hevc',
  'avc',
  'aac',
  'ac3',
  'dts',
  'hdtv',
  'bluray',
  'blu-ray',
  'brrip',
  'web-dl',
  'webdl',
  'webrip',
  'dvdrip',
  'proper',
  'repack',
  'extended',
  'unrated',
  'directors',
  'cut',
  'edition',
]);

/**
 * Clean up separators and normalize a filename for parsing
 */
function normalizeFilename(filename: string): string {
  // Remove file extension
  const withoutExt = filename.replace(/\.[^.]+$/, '');
  // Replace common separators with spaces
  return withoutExt.replace(/[._-]/g, ' ');
}

/**
 * Extract quality information from a filename
 */
function extractQuality(filename: string): string | null {
  for (const pattern of QUALITY_PATTERNS) {
    const match = filename.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return null;
}

/**
 * Try to parse as a TV show
 * Patterns: S01E02, s01e02, 1x02, Season 1 Episode 2
 */
function parseTVShow(
  normalized: string
): { title: string; season: number; episode: number } | null {
  // Pattern: S01E02 or s01e02
  const sePattern = /^(.+?)\s*S(\d{1,2})E(\d{1,2})\b/i;
  let match = normalized.match(sePattern);
  if (match) {
    return {
      title: match[1].trim(),
      season: parseInt(match[2], 10),
      episode: parseInt(match[3], 10),
    };
  }

  // Pattern: 1x02
  const xPattern = /^(.+?)\s*(\d{1,2})x(\d{1,2})\b/i;
  match = normalized.match(xPattern);
  if (match) {
    return {
      title: match[1].trim(),
      season: parseInt(match[2], 10),
      episode: parseInt(match[3], 10),
    };
  }

  // Pattern: Season 1 Episode 2
  const longPattern = /^(.+?)\s*Season\s*(\d{1,2})\s*Episode\s*(\d{1,2})\b/i;
  match = normalized.match(longPattern);
  if (match) {
    return {
      title: match[1].trim(),
      season: parseInt(match[2], 10),
      episode: parseInt(match[3], 10),
    };
  }

  return null;
}

/**
 * Try to parse as a movie
 * Patterns: Title (2023), Title.2023.1080p, Title 2023
 */
function parseMovie(
  normalized: string
): { title: string; year: number } | null {
  // Pattern: Title (2023)
  const parenPattern = /^(.+?)\s*\((\d{4})\)/;
  let match = normalized.match(parenPattern);
  if (match) {
    const year = parseInt(match[2], 10);
    if (year >= 1900 && year <= 2100) {
      return {
        title: match[1].trim(),
        year,
      };
    }
  }

  // Pattern: Title 2023 followed by quality or end
  const yearPattern = /^(.+?)\s+(19\d{2}|20\d{2})(?:\s|$)/;
  match = normalized.match(yearPattern);
  if (match) {
    const year = parseInt(match[2], 10);
    if (year >= 1900 && year <= 2100) {
      return {
        title: match[1].trim(),
        year,
      };
    }
  }

  return null;
}

/**
 * Get unparsed tokens from the filename after extracting known info
 */
function getUnparsedTokens(
  normalized: string,
  title: string | null,
  quality: string | null
): string[] {
  let remaining = normalized.toLowerCase();

  // Remove the title
  if (title) {
    remaining = remaining.replace(title.toLowerCase(), '');
  }

  // Remove quality
  if (quality) {
    remaining = remaining.replace(quality.toLowerCase(), '');
  }

  // Remove season/episode patterns
  remaining = remaining.replace(/s\d{1,2}e\d{1,2}/gi, '');
  remaining = remaining.replace(/\d{1,2}x\d{1,2}/gi, '');
  remaining = remaining.replace(/season\s*\d{1,2}\s*episode\s*\d{1,2}/gi, '');

  // Remove year patterns
  remaining = remaining.replace(/\(?\d{4}\)?/g, '');

  // Split into tokens and filter noise
  const tokens = remaining
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .filter((t) => !NOISE_TOKENS.has(t.toLowerCase()));

  return tokens;
}

/**
 * Parse a media filename to extract metadata
 */
export function parseFilename(filename: string): ParsedFilename {
  const normalized = normalizeFilename(filename);
  const quality = extractQuality(normalized);

  // Try TV show first
  const tvResult = parseTVShow(normalized);
  if (tvResult) {
    return {
      type: 'tv',
      title: tvResult.title,
      season: tvResult.season,
      episode: tvResult.episode,
      year: null,
      quality,
      unparsedTokens: getUnparsedTokens(normalized, tvResult.title, quality),
    };
  }

  // Try movie
  const movieResult = parseMovie(normalized);
  if (movieResult) {
    return {
      type: 'movie',
      title: movieResult.title,
      season: null,
      episode: null,
      year: movieResult.year,
      quality,
      unparsedTokens: getUnparsedTokens(normalized, movieResult.title, quality),
    };
  }

  // Unknown type - try to extract at least a title
  const tokens = normalized.split(/\s+/);
  const titleTokens: string[] = [];

  for (const token of tokens) {
    // Stop at quality markers or years
    if (/^(19|20)\d{2}$/.test(token)) break;
    if (/^\d{3,4}p$/i.test(token)) break;
    if (NOISE_TOKENS.has(token.toLowerCase())) break;

    titleTokens.push(token);
  }

  const title = titleTokens.length > 0 ? titleTokens.join(' ') : null;

  return {
    type: 'unknown',
    title,
    season: null,
    episode: null,
    year: null,
    quality,
    unparsedTokens: getUnparsedTokens(normalized, title, quality),
  };
}

/**
 * Generate a proposed filename based on matched metadata
 */
export function generateProposedFilename(
  scannedFile: ScannedFile
): string | null {
  const { match, file, parsed } = scannedFile;
  if (!match) return null;

  const extension = file.extension;

  if (match.type === 'movie') {
    return `${match.title} (${match.year}).${extension}`;
  }

  if (match.type === 'tv') {
    const s = String(match.seasonNumber ?? parsed.season ?? 1).padStart(2, '0');
    const e = String(match.episodeNumber ?? parsed.episode ?? 1).padStart(2, '0');
    const episodeTitle = match.episodeTitle ? ` - ${match.episodeTitle}` : '';
    
    return `${match.title} - S${s}E${e}${episodeTitle}.${extension}`;
  }

  return null;
}
