import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../types/ipc';
import { scanFolder, renameFiles } from '../services/scanner';

/**
 * Registers file system related IPC handlers
 */
export function registerFileSystemHandlers(): void {
  // Handle folder selection dialog
  ipcMain.handle(IPC_CHANNELS.SELECT_FOLDER, async () => {
    const window = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(window!, {
      properties: ['openDirectory'],
      title: 'Select folder to scan',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Handle folder scanning
  ipcMain.handle(IPC_CHANNELS.SCAN_FOLDER, async (_event, folderPath: string) => {
    return scanFolder(folderPath);
  });

  // Handle file renaming
  ipcMain.handle(
    IPC_CHANNELS.RENAME_FILES,
    async (_event, renames: { from: string; to: string }[]) => {
      return renameFiles(renames);
    }
  );
}
