import type { MediaFile, MediaMatch } from './media';
/** IPC channel names - single source of truth */
export const IPC_CHANNELS = {
  SELECT_FOLDER: 'dialog:selectFolder',
  SCAN_FOLDER: 'fs:scanFolder',
  RENAME_FILES: 'fs:renameFiles',
  SEARCH_MEDIA: 'tmdb:searchMedia',
  GET_EPISODE_DETAILS: 'tmdb:getEpisodeDetails',
} as const;

/** API exposed to renderer via contextBridge */
export interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  scanFolder: (folderPath: string) => Promise<MediaFile[]>;
  renameFiles: (renames: { from: string; to: string }[]) => Promise<{ success: boolean; error?: string }>;
  searchMedia: (params: {
    query: string;
    year?: number;
    type: 'tv' | 'movie';
  }) => Promise<MediaMatch[]>;
...

  getEpisodeDetails: (
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ) => Promise<Partial<MediaMatch>>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
