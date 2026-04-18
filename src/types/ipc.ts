import type { MediaFile } from './media';

/** IPC channel names - single source of truth */
export const IPC_CHANNELS = {
  SELECT_FOLDER: 'dialog:selectFolder',
  SCAN_FOLDER: 'fs:scanFolder',
} as const;

/** API exposed to renderer via contextBridge */
export interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  scanFolder: (folderPath: string) => Promise<MediaFile[]>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
