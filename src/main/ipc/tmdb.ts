import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../types/ipc';
import { searchMedia, getEpisodeDetails, type TMDBSearchParams } from '../services/tmdb';

/**
 * Registers TMDB related IPC handlers
 */
export function registerTMDBHandlers(): void {
  // Handle searching for media
  ipcMain.handle(
    IPC_CHANNELS.SEARCH_MEDIA,
    async (_event, params: TMDBSearchParams) => {
      return searchMedia(params);
    }
  );

  // Handle fetching episode details
  ipcMain.handle(
    IPC_CHANNELS.GET_EPISODE_DETAILS,
    async (
      _event,
      tvId: number,
      seasonNumber: number,
      episodeNumber: number
    ) => {
      return getEpisodeDetails(tvId, seasonNumber, episodeNumber);
    }
  );
}
