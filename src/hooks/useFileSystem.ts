import { useState, useCallback } from 'react';
import type { MediaFile, ScannedFile } from '../types/media';
import { parseFilename } from '../lib/parser';

interface UseFileSystemState {
  selectedFolder: string | null;
  files: ScannedFile[];
  isLoading: boolean;
  error: string | null;
}

interface UseFileSystemActions {
  selectFolder: () => Promise<void>;
  scanFolder: () => Promise<void>;
  clearFiles: () => void;
  setFiles: React.Dispatch<React.SetStateAction<ScannedFile[]>>;
}

export function useFileSystem(): UseFileSystemState & UseFileSystemActions {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [files, setFiles] = useState<ScannedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFolder = useCallback(async () => {
    setError(null);
    try {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setSelectedFolder(folder);
        setFiles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select folder');
    }
  }, []);

  const scanFolder = useCallback(async () => {
    if (!selectedFolder) {
      setError('No folder selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mediaFiles: MediaFile[] =
        await window.electronAPI.scanFolder(selectedFolder);

      const scannedFiles: ScannedFile[] = mediaFiles.map((file) => ({
        file,
        parsed: parseFilename(file.filename),
        matchStatus: 'none',
      }));

      setFiles(scannedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan folder');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFolder]);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    selectedFolder,
    files,
    isLoading,
    error,
    selectFolder,
    scanFolder,
    clearFiles,
    setFiles,
  };
}
