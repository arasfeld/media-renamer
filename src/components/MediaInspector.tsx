import { Drawer, Stack, Text, Group, Badge, ScrollArea } from '@mantine/core';

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
  let streams: MediaTrack[] = [];
  try {
    if (inspectorData) {
      const data: FFprobeOutput = JSON.parse(inspectorData);
      streams = data.streams;
    }
  } catch (e) {
    console.error("Failed to parse inspector data", e);
  }

  return (
    <Drawer opened={opened} onClose={onClose} title="File Inspector" position="right" size="lg">
      <ScrollArea h="calc(100vh - 80px)">
        <Stack gap="md">
          <Text size="sm" c="dimmed" style={{ wordBreak: 'break-all' }}>{filePath}</Text>
          
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
