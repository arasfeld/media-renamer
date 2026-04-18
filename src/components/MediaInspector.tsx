import { Drawer, Stack, Text, Group, Badge, ScrollArea, Button, LoadingOverlay } from '@mantine/core';
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

interface MediaTrack {
  codec_name: string;
  codec_type: string;
  channels?: number;
  width?: number;
  height?: number;
  tags?: { language?: string; title?: string };
}

interface FFprobeOutput {
  streams: MediaTrack[];
}

interface MediaInspectorProps {
  opened: boolean;
  onClose: () => void;
  filePath: string | null;
  inspectorData: string | null;
}

export function MediaInspector({ opened, onClose, filePath, inspectorData }: MediaInspectorProps) {
  const [loading, setLoading] = useState(false);
  let streams: MediaTrack[] = [];
  try {
    if (inspectorData) {
      const data: FFprobeOutput = JSON.parse(inspectorData);
      streams = data.streams;
    }
  } catch (e) {
    console.error("Failed to parse inspector data", e);
  }

  const handleScrub = async () => {
    if (!filePath) return;
    setLoading(true);
    try {
      await invoke('scrub_metadata', { path: filePath });
      alert("Metadata scrubbed successfully!");
    } catch (e) {
      alert("Failed to scrub metadata");
    } finally {
      setLoading(false);
    }
  };

  const handleEmbedSubtitles = async () => {
    if (!filePath) return;
    const srtPath = await open({ filters: [{ name: 'Subtitles', extensions: ['srt'] }] });
    if (!srtPath || typeof srtPath !== 'string') return;
    
    setLoading(true);
    try {
      await invoke('embed_subtitles', { videoPath: filePath, srtPath });
      alert("Subtitles embedded successfully!");
    } catch (e) {
      alert("Failed to embed subtitles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer opened={opened} onClose={onClose} title="File Inspector" position="right" size="lg">
      <LoadingOverlay visible={loading} />
      <ScrollArea h="calc(100vh - 120px)">
        <Stack gap="md">
          <Text size="sm" c="dimmed" style={{ wordBreak: 'break-all' }}>{filePath}</Text>
          
          <Group>
            <Button variant="light" color="orange" onClick={handleScrub}>Scrub Metadata</Button>
            <Button variant="light" color="blue" onClick={handleEmbedSubtitles}>Embed SRT</Button>
          </Group>
          
          {streams.map((stream, idx) => (
            <Stack key={idx} p="md" style={{ border: '1px solid #eee', borderRadius: 8 }}>
              <Group justify="space-between">
                <Text fw={700}>{stream.codec_type.toUpperCase()}</Text>
                <Badge>{stream.codec_name}</Badge>
              </Group>
              {stream.codec_type === 'audio' && <Text size="sm">Channels: {stream.channels}</Text>}
              {stream.codec_type === 'video' && <Text size="sm">{stream.width}x{stream.height}</Text>}
              {stream.tags?.language && <Text size="sm">Language: {stream.tags.language}</Text>}
              {stream.tags?.title && <Text size="sm">Title: {stream.tags.title}</Text>}
            </Stack>
          ))}
        </Stack>
      </ScrollArea>
    </Drawer>
  );
}
