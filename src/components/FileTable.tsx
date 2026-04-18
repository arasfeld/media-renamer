import { Table, Badge, Text } from '@mantine/core';
import type { ScannedFile } from '../types/media';

interface FileTableProps {
  files: ScannedFile[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function TypeBadge({ type }: { type: 'tv' | 'movie' | 'unknown' }) {
  const colors: Record<string, string> = {
    tv: 'blue',
    movie: 'green',
    unknown: 'gray',
  };

  return (
    <Badge color={colors[type]} size="sm">
      {type.toUpperCase()}
    </Badge>
  );
}

export function FileTable({ files }: FileTableProps) {
  if (files.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No files scanned yet. Select a folder and click Scan.
      </Text>
    );
  }

  const rows = files.map((scannedFile) => {
    const { file, parsed } = scannedFile;
    const episodeInfo =
      parsed.season !== null && parsed.episode !== null
        ? `S${String(parsed.season).padStart(2, '0')}E${String(parsed.episode).padStart(2, '0')}`
        : null;

    return (
      <Table.Tr key={file.path}>
        <Table.Td>
          <Text size="sm" lineClamp={1} title={file.filename}>
            {file.filename}
          </Text>
        </Table.Td>
        <Table.Td>
          <TypeBadge type={parsed.type} />
        </Table.Td>
        <Table.Td>
          <Text size="sm">{parsed.title || '-'}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{episodeInfo || parsed.year || '-'}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{parsed.quality || '-'}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{formatFileSize(file.size)}</Text>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Filename</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Title</Table.Th>
          <Table.Th>Episode/Year</Table.Th>
          <Table.Th>Quality</Table.Th>
          <Table.Th>Size</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
