import * as fs from 'fs/promises';
import * as path from 'path';
import type { MediaFile } from '../../types/media';

/** Supported video file extensions */
const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mkv',
  '.avi',
  '.mov',
  '.wmv',
  '.m4v',
]);

/**
 * Recursively scans a directory for video files
 */
export async function scanFolder(folderPath: string): Promise<MediaFile[]> {
  const results: MediaFile[] = [];
  await scanDirectory(folderPath, results);
  return results;
}

async function scanDirectory(
  dirPath: string,
  results: MediaFile[]
): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Skip hidden directories
      if (!entry.name.startsWith('.')) {
        await scanDirectory(fullPath, results);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();

      if (VIDEO_EXTENSIONS.has(ext)) {
        const stats = await fs.stat(fullPath);
        results.push({
          path: fullPath,
          filename: entry.name,
          extension: ext.slice(1), // Remove the leading dot
          size: stats.size,
        });
      }
    }
  }
}

/**
 * Renames a list of files
 */
export async function renameFiles(
  renames: { from: string; to: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    for (const { from, to } of renames) {
      // Ensure the destination directory exists (though it should in most cases)
      const destDir = path.dirname(to);
      await fs.mkdir(destDir, { recursive: true });
      await fs.rename(from, to);
    }
    return { success: true };
  } catch (err) {
    console.error('Renaming failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error during renaming',
    };
  }
}
