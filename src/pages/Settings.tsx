import { useState, useEffect } from 'react';
import { 
  Stack, 
  Title, 
  Text, 
  Group, 
  ColorSwatch, 
  Tooltip, 
  useMantineTheme, 
  ActionIcon, 
  useMantineColorScheme,
  Paper,
  Divider,
  Badge,
  Loader,
  Button
} from '@mantine/core';
import { Sun, Moon, CheckCircle2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface SettingsProps {
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
}

const PRIMARY_COLORS = ['blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'pink', 'grape', 'violet', 'indigo'];

export function Settings({ primaryColor, onPrimaryColorChange }: SettingsProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const [deps, setDeps] = useState<{ ffmpeg: boolean; mkvpropedit: boolean } | null>(null);

  useEffect(() => {
    invoke<{ ffmpeg: boolean; mkvpropedit: boolean }>('check_dependencies').then(setDeps);
  }, []);

  return (
    <Stack gap="xl">
      <Title order={2}>Settings</Title>
      
      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Title order={4}>System Dependencies</Title>
          <Text size="sm" c="dimmed">Required for advanced media processing.</Text>
          <Divider />
          {!deps ? <Loader size="sm" /> : (
            <Stack gap="xs">
              <Group justify="space-between">
                <Text>FFmpeg</Text>
                {deps.ffmpeg ? <Badge color="green" leftSection={<CheckCircle2 size={12}/>}>Installed</Badge> : (
                  <Tooltip label="Download from ffmpeg.org">
                    <Button size="xs" variant="outline" color="red" component="a" href="https://ffmpeg.org/download.html" target="_blank">Install FFmpeg</Button>
                  </Tooltip>
                )}
              </Group>
              <Group justify="space-between">
                <Text>MKVPropEdit</Text>
                {deps.mkvpropedit ? <Badge color="green" leftSection={<CheckCircle2 size={12}/>}>Installed</Badge> : (
                  <Tooltip label="Download from mkvtoolnix.download">
                    <Button size="xs" variant="outline" color="red" component="a" href="https://mkvtoolnix.download/" target="_blank">Install MKVToolNix</Button>
                  </Tooltip>
                )}
              </Group>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Title order={4}>Appearance</Title>
          <Text size="sm" c="dimmed">Customize how the application looks.</Text>
          
          <Divider />

          <Group justify="space-between">
            <Text fw={500}>Color Scheme</Text>
            <ActionIcon
              variant="default"
              onClick={() => toggleColorScheme()}
              size="lg"
            >
              {colorScheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </ActionIcon>
          </Group>

          <Stack gap="xs">
            <Text fw={500}>Primary Color</Text>
            <Group gap="xs">
              {PRIMARY_COLORS.map((color) => (
                <Tooltip label={color} key={color} openDelay={500}>
                  <ColorSwatch
                    component="button"
                    color={theme.colors[color][6]}
                    onClick={() => onPrimaryColorChange(color)}
                    size={22}
                    style={{ 
                      cursor: 'pointer',
                      border: primaryColor === color ? '2px solid white' : 'none',
                      boxShadow: primaryColor === color ? '0 0 0 1px rgba(0,0,0,0.2)' : 'none'
                    }}
                  />
                </Tooltip>
              ))}
            </Group>
          </Stack>
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Title order={4}>About</Title>
          <Text size="sm">Media Renamer v1.0.0</Text>
          <Text size="xs" c="dimmed">A tool for organizing your Plex media library.</Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
