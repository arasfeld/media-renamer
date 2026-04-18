import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ScannedFile, MediaMatch } from '../types/media';

interface UseTMDBState {
  isMatching: boolean;
}

interface UseTMDBActions {
  matchFiles: (
    files: ScannedFile[],
    setFiles: React.Dispatch<React.SetStateAction<ScannedFile[]>>
  ) => Promise<void>;
  searchManual: (query: string, type: 'tv' | 'movie', year?: number) => Promise<MediaMatch[]>;
}

export function useTMDB(): UseTMDBState & UseTMDBActions {
  const [isMatching, setIsMatching] = useState(false);

  const matchFiles = useCallback(
    async (
      files: ScannedFile[],
      setFiles: React.Dispatch<React.SetStateAction<ScannedFile[]>>
    ) => {
      setIsMatching(true);

      for (const scannedFile of files) {
        if (scannedFile.matchStatus === 'matched' || !scannedFile.parsed.title) {
          continue;
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.file.path === scannedFile.file.path
              ? { ...f, matchStatus: 'searching' }
              : f
          )
        );

        try {
          const results: MediaMatch[] = await invoke('search_media', {
            params: {
              query: scannedFile.parsed.title,
              year: scannedFile.parsed.year || undefined,
              media_type: scannedFile.parsed.type === 'tv' ? 'tv' : 'movie',
            }
          });

          if (results.length > 0) {
            let match = results[0];

            if (
              scannedFile.parsed.type === 'tv' &&
              scannedFile.parsed.season !== null &&
              scannedFile.parsed.episode !== null
            ) {
              try {
                const details: Partial<MediaMatch> = await invoke('get_episode_details', {
                  tvId: match.tmdbId,
                  seasonNumber: scannedFile.parsed.season,
                  episodeNumber: scannedFile.parsed.episode,
                });
                match = { ...match, ...details };
              } catch (err) {
                console.error('Failed to get episode details:', err);
              }
            }

            setFiles((prev) =>
              prev.map((f) =>
                f.file.path === scannedFile.file.path
                  ? { ...f, matchStatus: 'matched', match }
                  : f
              )
            );
          } else {
            setFiles((prev) =>
              prev.map((f) =>
                f.file.path === scannedFile.file.path
                  ? { ...f, matchStatus: 'none' }
                  : f
              )
            );
          }
        } catch (err) {
          console.error(`Failed to match ${scannedFile.file.filename}:`, err);
          setFiles((prev) =>
            prev.map((f) =>
              f.file.path === scannedFile.file.path
                ? { ...f, matchStatus: 'error' }
                : f
            )
          );
        }
      }

      setIsMatching(false);
    },
    []
  );

  const searchManual = useCallback(
    async (query: string, type: 'tv' | 'movie', year?: number) => {
      return invoke('search_media', {
        params: { query, media_type: type, year }
      });
    },
    []
  );

  return {
    isMatching,
    matchFiles,
    searchManual,
  };
}
