import { registerFileSystemHandlers } from './fileSystem';
import { registerTMDBHandlers } from './tmdb';

/**
 * Registers all IPC handlers for the main process
 */
export function registerAllHandlers(): void {
  registerFileSystemHandlers();
  registerTMDBHandlers();
}
