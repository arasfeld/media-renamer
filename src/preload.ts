import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, type ElectronAPI } from './types/ipc';

const electronAPI: ElectronAPI = {
  selectFolder: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_FOLDER),
  scanFolder: (folderPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SCAN_FOLDER, folderPath),
  searchMedia: (params) => ipcRenderer.invoke(IPC_CHANNELS.SEARCH_MEDIA, params),
  getEpisodeDetails: (tvId, season, episode) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_EPISODE_DETAILS, tvId, season, episode),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
