import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
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
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select folder to scan',
      });

      if (selected && typeof selected === 'string') {
        setSelectedFolder(selected);
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
      // Call Rust command
      const mediaFiles: MediaFile[] = await invoke('scan_folder', {
        folderPath: selectedFolder,
      });

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
