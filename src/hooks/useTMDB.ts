import { useState, useCallback } from 'react';
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
      setFiles: (updater: (prev: ScannedFile[]) => ScannedFile[]) => void
    ) => {
      setIsMatching(true);

      // Simple sequential matching for now to avoid hitting rate limits too hard
      // and to provide incremental updates to the UI
      for (const scannedFile of files) {
        if (scannedFile.matchStatus === 'matched' || !scannedFile.parsed.title) {
          continue;
        }

        // Update status to searching
        setFiles((prev) =>
          prev.map((f) =>
            f.file.path === scannedFile.file.path
              ? { ...f, matchStatus: 'searching' }
              : f
          )
        );

        try {
          const results = await window.electronAPI.searchMedia({
            query: scannedFile.parsed.title,
            year: scannedFile.parsed.year || undefined,
            type: scannedFile.parsed.type === 'tv' ? 'tv' : 'movie',
          });

          if (results.length > 0) {
            let match = results[0];

            // If it's a TV show, we also want the episode title
            if (
              scannedFile.parsed.type === 'tv' &&
              scannedFile.parsed.season !== null &&
              scannedFile.parsed.episode !== null
            ) {
              try {
                const details = await window.electronAPI.getEpisodeDetails(
                  match.tmdbId,
                  scannedFile.parsed.season,
                  scannedFile.parsed.episode
                );
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
                  ? { ...f, matchStatus: 'none' } // Or maybe 'not_found'
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
      return window.electronAPI.searchMedia({ query, type, year });
    },
    []
  );

  return {
    isMatching,
    matchFiles,
    searchManual,
  };
}
