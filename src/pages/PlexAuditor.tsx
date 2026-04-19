import { useState } from 'react';
import { Stack, Title, Paper, TextInput, Button, LoadingOverlay, Text, Divider, Select, Table } from '@mantine/core';
import { invoke } from '@tauri-apps/api/core';

export function PlexAuditor() {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [libraries, setLibraries] = useState<any[]>([]);
  const [selectedLib, setSelectedLib] = useState<string | null>(null);

  const fetchLibraries = async () => {
    setLoading(true);
    try {
      const data: any = await invoke('list_plex_libraries', { serverUrl: url, token });
      setLibraries(data.MediaContainer.Directory);
    } catch (e) {
      alert("Failed to connect to Plex");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Title order={2}>Plex Auditor</Title>
      <Paper withBorder p="md">
        <Stack gap="md">
          <TextInput label="Plex Server URL" placeholder="http://192.168.1.5:32400" value={url} onChange={(e) => setUrl(e.currentTarget.value)} />
          <TextInput label="X-Plex-Token" value={token} onChange={(e) => setToken(e.currentTarget.value)} />
          <Button onClick={fetchLibraries} loading={loading}>Connect & Fetch Libraries</Button>
        </Stack>
      </Paper>

      {libraries.length > 0 && (
        <Paper withBorder p="md">
          <Stack gap="md">
            <Select 
              label="Select Library" 
              data={libraries.map(l => ({ value: l.key, label: l.title }))} 
              value={selectedLib}
              onChange={setSelectedLib}
            />
            <Text>Ready to audit: {libraries.find(l => l.key === selectedLib)?.title}</Text>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
