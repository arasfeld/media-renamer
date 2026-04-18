import { useState } from 'react';
import {
  AppShell,
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
  SegmentedControl,
  UnstyledButton,
  Image,
  ActionIcon,
  useMantineColorScheme,
  ColorSwatch,
  useMantineTheme,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Folder, ScanSearch, AlertCircle, Database, Search, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useFileSystem } from '../hooks/useFileSystem';
import { useTMDB } from '../hooks/useTMDB';
import { FileTable } from '../components/FileTable';
import { generateProposedFilename } from '../lib/parser';
import type { ScannedFile, MediaMatch } from '../types/media';

interface HomeProps {
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
}

const PRIMARY_COLORS = ['blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'pink', 'grape', 'violet', 'indigo'];

export function Home({ primaryColor, onPrimaryColorChange }: HomeProps) {
  const { selectedFolder, files, isLoading, error, selectFolder, scanFolder, setFiles } =
    useFileSystem();
  const { isMatching, matchFiles, searchManual } = useTMDB();
  const [isRenaming, setIsRenaming] = useState(false);
  
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  
  // Modal state for manual search
  const [opened, { open, close }] = useDisclosure(false);
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
        const details = await window.electronAPI.getEpisodeDetails(
          match.tmdbId,
          activeFile.parsed.season,
          activeFile.parsed.episode
        );
        finalMatch = { ...match, ...details };
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
          const dir = f.file.path.substring(0, f.file.path.lastIndexOf('/'));
          return {
            from: f.file.path,
            to: `${dir}/${proposed}`,
          };
        }
        return null;
      })
      .filter((r): r is { from: string; to: string } => r !== null);

    if (renamesToExecute.length === 0) return;

    setIsRenaming(true);
    try {
      const result = await window.electronAPI.renameFiles(renamesToExecute);
      if (result.success) {
        await scanFolder();
      } else {
        alert(`Renaming failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Rename execution failed:', err);
    } finally {
      setIsRenaming(false);
    }
  };

  const matchedCount = files.filter(f => f.matchStatus === 'matched').length;

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header p="md">
        <Group justify="space-between" h="100%">
          <Title order={3}>Media Renamer</Title>
          <Group gap="lg">
            <Group gap="xs">
              {PRIMARY_COLORS.map((color) => (
                <Tooltip label={color} key={color} openDelay={500}>
                  <ColorSwatch
                    component="button"
                    color={theme.colors[color][6]}
                    onClick={() => onPrimaryColorChange(color)}
                    size={18}
                    style={{ 
                      cursor: 'pointer',
                      border: primaryColor === color ? '2px solid white' : 'none',
                      boxShadow: primaryColor === color ? '0 0 0 1px rgba(0,0,0,0.2)' : 'none'
                    }}
                  />
                </Tooltip>
              ))}
            </Group>
            <ActionIcon
              variant="default"
              onClick={() => toggleColorScheme()}
              size="lg"
              aria-label="Toggle color scheme"
            >
              {colorScheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Stack gap="md">
          <Group justify="space-between">
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
            </Group>
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

          <FileTable files={files} onManualSearch={handleManualSearchTrigger} />
        </Stack>
      </AppShell.Main>

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
    </AppShell>
  );
}
