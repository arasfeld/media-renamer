import { registerFileSystemHandlers } from './fileSystem';

/**
 * Registers all IPC handlers for the main process
 */
export function registerAllHandlers(): void {
  registerFileSystemHandlers();
}
