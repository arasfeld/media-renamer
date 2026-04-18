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
  Divider
} from '@mantine/core';
import { Sun, Moon } from 'lucide-react';

interface SettingsProps {
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
}

const PRIMARY_COLORS = ['blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'pink', 'grape', 'violet', 'indigo'];

export function Settings({ primaryColor, onPrimaryColorChange }: SettingsProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  return (
    <Stack gap="xl">
      <Title order={2}>Settings</Title>
      
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
