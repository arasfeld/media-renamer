import { Table, Badge, Text, Group, Tooltip, ActionIcon, Loader, Stack } from '@mantine/core';
import { Check, AlertCircle, Search, Info, ArrowRight, FileVideo } from 'lucide-react';
import type { ScannedFile } from '../types/media';
import { generateProposedFilename } from '../lib/parser';

interface FileTableProps {
  files: ScannedFile[];
  onManualSearch: (file: ScannedFile) => void;
  onInspect: (file: ScannedFile) => void;
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

function StatusIndicator({ status }: { status: ScannedFile['matchStatus'] }) {
  switch (status) {
    case 'searching':
      return <Loader size={16} />;
    case 'matched':
      return (
        <Tooltip label="Matched with TMDB">
          <Check size={16} color="green" />
        </Tooltip>
      );
    case 'error':
      return (
        <Tooltip label="Failed to match">
          <AlertCircle size={16} color="red" />
        </Tooltip>
      );
    default:
      return (
        <Tooltip label="Not matched">
          <Search size={16} color="gray" opacity={0.5} />
        </Tooltip>
      );
  }
}

export function FileTable({ files, onManualSearch, onInspect }: FileTableProps) {
  if (files.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No files scanned yet. Select a folder and click Scan.
      </Text>
    );
  }

  const rows = files.map((scannedFile) => {
    const { file, parsed, match, matchStatus } = scannedFile;
    const episodeInfo =
      parsed.season !== null && parsed.episode !== null
        ? `S${String(parsed.season).padStart(2, '0')}E${String(parsed.episode).padStart(2, '0')}`
        : null;

    const displayTitle = match ? match.title : (parsed.title || '-');
    const displayMeta = match 
      ? (match.type === 'tv' ? `S${match.seasonNumber}E${match.episodeNumber}` : match.year)
      : (episodeInfo || parsed.year || '-');

    const proposed = generateProposedFilename(scannedFile);

    return (
      <Table.Tr key={file.path}>
        <Table.Td>
          <Group gap="xs">
            <StatusIndicator status={matchStatus} />
            <Text size="sm" lineClamp={1} title={file.filename}>
              {file.filename}
            </Text>
          </Group>
        </Table.Td>
        <Table.Td>
          {proposed ? (
            <Group gap="xs" wrap="nowrap">
              <ArrowRight size={14} color="blue" />
              <Text size="sm" c="blue" fw={500} lineClamp={1} title={proposed}>
                {proposed}
              </Text>
            </Group>
          ) : (
            <Text size="sm" c="dimmed">No match</Text>
          )}
        </Table.Td>
        <Table.Td>
          <TypeBadge type={match?.type || parsed.type} />
        </Table.Td>
        <Table.Td>
          <Stack gap={0}>
            <Text size="sm" fw={match ? 500 : 400}>
              {displayTitle}
            </Text>
            {match?.episodeTitle && (
              <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                {match.episodeTitle}
              </Text>
            )}
          </Stack>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{displayMeta}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{parsed.quality || '-'}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{formatFileSize(file.size)}</Text>
        </Table.Td>
        <Table.Td>
          <Group gap="xs">
            <Tooltip label="Inspect Metadata">
              <ActionIcon 
                variant="subtle" 
                color="gray" 
                size="sm"
                onClick={() => onInspect(scannedFile)}
              >
                <FileVideo size={14} />
              </ActionIcon>
            </Tooltip>
            {match && (
              <Tooltip label={`TMDB ID: ${match.tmdbId}`}>
                <ActionIcon variant="subtle" color="gray" size="sm">
                  <Info size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label="Manual Search">
              <ActionIcon 
                variant="subtle" 
                color="blue" 
                size="sm"
                onClick={() => onManualSearch(scannedFile)}
              >
                <Search size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Original Filename</Table.Th>
          <Table.Th>Proposed Filename</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Match Title</Table.Th>
          <Table.Th>Meta</Table.Th>
          <Table.Th>Quality</Table.Th>
          <Table.Th>Size</Table.Th>
          <Table.Th style={{ width: 100 }}>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
