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
} from '@mantine/core';
import { Folder, ScanSearch, AlertCircle } from 'lucide-react';
import { useFileSystem } from '../hooks/useFileSystem';
import { FileTable } from '../components/FileTable';

export function Home() {
  const { selectedFolder, files, isLoading, error, selectFolder, scanFolder } =
    useFileSystem();

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header p="md">
        <Group justify="space-between" h="100%">
          <Title order={3}>Media Renamer</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Stack gap="md">
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
              disabled={!selectedFolder || isLoading}
            >
              Scan
            </Button>
          </Group>

          {selectedFolder && (
            <Text size="sm">
              Selected folder: <Code>{selectedFolder}</Code>
            </Text>
          )}

          {error && (
            <Alert
              icon={<AlertCircle size={16} />}
              title="Error"
              color="red"
            >
              {error}
            </Alert>
          )}

          {files.length > 0 && (
            <Text size="sm" c="dimmed">
              Found {files.length} video file{files.length !== 1 ? 's' : ''}
            </Text>
          )}

          <FileTable files={files} />
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}
