import { useState } from 'react';
import {
  Button,
  Group,
  Stack,
  Text,
  Title,
  Alert,
  Loader,
  Code,
  Modal,
  TextInput,
  UnstyledButton,
  Image,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Folder, ScanSearch, AlertCircle, Database, Search, CheckCircle2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useFileSystem } from '../hooks/useFileSystem';
import { useTMDB } from '../hooks/useTMDB';
import { FileTable } from '../components/FileTable';
import { MediaInspector } from '../components/MediaInspector';
import { generateProposedFilename } from '../lib/parser';
import type { ScannedFile, MediaMatch } from '../types/media';

export function Home() {
  const { selectedFolder, files, isLoading, error, selectFolder, scanFolder, setFiles } =
    useFileSystem();
  const { isMatching, matchFiles, searchManual } = useTMDB();
  const [isRenaming, setIsRenaming] = useState(false);
  
  // Modal state for manual search
  const [opened, { open, close }] = useDisclosure(false);
  
  // Inspector state
  const [inspectorOpened, { open: openInspector, close: closeInspector }] = useDisclosure(false);
  const [inspectorData, setInspectorData] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<ScannedFile | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'movie' | 'tv'>('movie');
  const [searchResults, setSearchResults] = useState<MediaMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleManualSearchTrigger = (file: ScannedFile) => {
    setActiveFile(file);
    setSearchQuery(file.parsed.title || '');
    setSearchType(file.parsed.type === 'tv' ? 'tv' : 'movie');
    setSearchResults([]);
    open();
  };

  const handleInspectTrigger = async (file: ScannedFile) => {
    setActiveFile(file);
    try {
      const data: string = await invoke('inspect_file', { path: file.file.path });
      setInspectorData(data);
      openInspector();
    } catch (err) {
      console.error('Inspection failed:', err);
    }
  };

  const executeSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const results = await searchManual(searchQuery, searchType);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectMatch = async (match: MediaMatch) => {
    if (!activeFile) return;

    let finalMatch = match;
    
    if (
      match.type === 'tv' &&
      activeFile.parsed.season !== null &&
      activeFile.parsed.episode !== null
    ) {
      try {
        const details: any = await invoke('get_episode_details', {
          tvId: match.tmdbId,
          seasonNumber: activeFile.parsed.season,
          episodeNumber: activeFile.parsed.episode,
        });
        finalMatch = { 
          ...match, 
          episodeTitle: details.name,
          seasonNumber: details.season_number,
          episodeNumber: details.episode_number,
        };
      } catch (err) {
        console.error('Failed to get episode details:', err);
      }
    }

    setFiles((prev) =>
      prev.map((f) =>
        f.file.path === activeFile.file.path
          ? { ...f, matchStatus: 'matched', match: finalMatch }
          : f
      )
    );
    close();
  };

  const executeRenames = async () => {
    const renamesToExecute = files
      .map((f) => {
        const proposed = generateProposedFilename(f);
        if (proposed && f.matchStatus === 'matched') {
          const separator = f.file.path.includes('\\') ? '\\' : '/';
          const dir = f.file.path.substring(0, f.file.path.lastIndexOf(separator));
          return {
            from: f.file.path,
            to: `${dir}${separator}${proposed}`,
          };
        }
        return null;
      })
      .filter((r): r is { from: string; to: string } => r !== null);

    if (renamesToExecute.length === 0) return;

    setIsRenaming(true);
    try {
      const result: { success: boolean; error?: string } = await invoke('rename_files', {
        renames: renamesToExecute,
      });
      
      if (result.success) {
        await scanFolder();
      } else {
        alert(`Renaming failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Rename execution failed:', err);
      alert(`Rename execution failed: ${err}`);
    } finally {
      setIsRenaming(false);
    }
  };

  const matchedCount = files.filter(f => f.matchStatus === 'matched').length;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Renamer</Title>
        <Group>
          <Button
            leftSection={<Folder size={16} />}
            onClick={selectFolder}
            variant="default"
          >
            Select Folder
          </Button>
          <Button
            leftSection={isLoading ? <Loader size={16} /> : <ScanSearch size={16} />}
            onClick={scanFolder}
            disabled={!selectedFolder || isLoading || isMatching || isRenaming}
          >
            Scan
          </Button>
          {files.length > 0 && (
            <Button
              leftSection={isMatching ? <Loader size={16} /> : <Database size={16} />}
              onClick={() => matchFiles(files, setFiles)}
              disabled={isLoading || isMatching || isRenaming}
              variant="light"
              color="blue"
            >
              Match with TMDB
            </Button>
          )}
          {matchedCount > 0 && (
            <Button
              leftSection={isRenaming ? <Loader size={16} /> : <CheckCircle2 size={16} />}
              onClick={executeRenames}
              disabled={isLoading || isMatching || isRenaming}
              color="green"
            >
              Rename {matchedCount} File{matchedCount !== 1 ? 's' : ''}
            </Button>
          )}
        </Group>
      </Group>

      {selectedFolder && (
        <Text size="sm">
          Selected folder: <Code>{selectedFolder}</Code>
        </Text>
      )}

      {error && (
        <Alert icon={<AlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      )}

      {files.length > 0 && (
        <Text size="sm" c="dimmed">
          Found {files.length} video file{files.length !== 1 ? 's' : ''}
        </Text>
      )}

      <FileTable 
        files={files} 
        onManualSearch={handleManualSearchTrigger} 
        onInspect={handleInspectTrigger}
      />

      <MediaInspector 
        opened={inspectorOpened} 
        onClose={closeInspector} 
        filePath={activeFile?.file.path || null}
        inspectorData={inspectorData}
      />

      <Modal opened={opened} onClose={close} title="Manual TMDB Search" size="lg">
        <Stack gap="md">
          <Group align="flex-end">
            <TextInput
              label="Search Query"
              placeholder="Movie or Show Title"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
            />
            <SegmentedControl
              data={[
                { label: 'Movie', value: 'movie' },
                { label: 'TV Show', value: 'tv' },
              ]}
              value={searchType}
              onChange={(value) => setSearchType(value as 'movie' | 'tv')}
            />
            <Button onClick={executeSearch} loading={isSearching}>
              <Search size={16} />
            </Button>
          </Group>

          <Stack gap="xs" style={{ maxHeight: 400, overflowY: 'auto' }}>
            {searchResults.map((result) => (
              <UnstyledButton
                key={result.tmdbId}
                onClick={() => selectMatch(result)}
                p="xs"
                style={(theme) => ({
                  borderRadius: theme.radius.sm,
                  '&:hover': {
                    backgroundColor: theme.colors.gray[0],
                  },
                })}
              >
                <Group gap="md">
                  {result.posterPath ? (
                    <Image src={result.posterPath} width={40} height={60} radius="xs" />
                  ) : (
                    <div style={{ width: 40, height: 60, backgroundColor: '#eee' }} />
                  )}
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>
                      {result.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {result.year || 'Unknown Year'}
                    </Text>
                  </Stack>
                </Group>
              </UnstyledButton>
            ))}
            {searchResults.length === 0 && !isSearching && searchQuery && (
              <Text ta="center" size="sm" c="dimmed" py="xl">
                No results found. Try a different search term.
              </Text>
            )}
          </Stack>
        </Stack>
      </Modal>
    </Stack>
  );
}
