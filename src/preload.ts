import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, type ElectronAPI } from './types/ipc';

const electronAPI: ElectronAPI = {
  selectFolder: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_FOLDER),
  scanFolder: (folderPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SCAN_FOLDER, folderPath),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
