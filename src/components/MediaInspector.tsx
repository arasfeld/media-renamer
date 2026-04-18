import { Drawer, Stack, Text, Group, Badge, ScrollArea, Button, LoadingOverlay, TextInput, Divider } from '@mantine/core';
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

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
  const [splitStart, setSplitStart] = useState('00:00:00');
  const [splitDuration, setSplitDuration] = useState('00:11:00');

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

  const handleSplit = async () => {
    if (!filePath) return;
    const outputPath = await save({
      defaultPath: `${filePath.split('.').slice(0, -1).join('.')}_part.mkv`,
      filters: [{ name: 'MKV', extensions: ['mkv'] }]
    });
    
    if (!outputPath) return;
    
    setLoading(true);
    try {
      await invoke('split_episode', { 
        path: filePath, 
        startTime: splitStart, 
        duration: splitDuration, 
        outputPath 
      });
      alert("Episode split successfully!");
    } catch (e) {
      alert("Failed to split episode");
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
          
          <Divider label="Processing Tools" />
          <Group>
            <Button variant="light" color="orange" onClick={handleScrub}>Scrub Metadata</Button>
            <Button variant="light" color="blue" onClick={handleEmbedSubtitles}>Embed SRT</Button>
          </Group>

          <Divider label="Split Episode" />
          <Stack gap="xs">
            <Group>
              <TextInput label="Start Time" value={splitStart} onChange={(e) => setSplitStart(e.currentTarget.value)} />
              <TextInput label="Duration" value={splitDuration} onChange={(e) => setSplitDuration(e.currentTarget.value)} />
            </Group>
            <Button variant="light" color="violet" onClick={handleSplit}>Split File</Button>
          </Stack>
          
          <Divider label="Media Tracks" />
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
