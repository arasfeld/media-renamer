import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  MantineProvider, 
  createTheme, 
  localStorageColorSchemeManager,
  AppShell,
  NavLink,
  Stack,
  Title,
  Group
} from '@mantine/core';
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router";
import { LayoutGrid, Settings as SettingsIcon } from 'lucide-react';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mantine-color-scheme',
});

function AppContent() {
  const location = useLocation();
  const [primaryColor, setPrimaryColor] = useState<string>(
    localStorage.getItem('media-renamer-primary-color') || 'blue'
  );

  useEffect(() => {
    localStorage.setItem('media-renamer-primary-color', primaryColor);
  }, [primaryColor]);

  const theme = createTheme({
    primaryColor,
  });

  return (
    <MantineProvider theme={theme} colorSchemeManager={colorSchemeManager}>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 240, breakpoint: 'sm' }}
        padding="md"
      >
        <AppShell.Header p="md">
          <Group h="100%" px="md">
            <Title order={3}>Media Renamer</Title>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="xs">
          <Stack gap={4}>
            <NavLink
              component={Link}
              to="/"
              label="Renamer"
              leftSection={<LayoutGrid size={18} />}
              active={location.pathname === '/'}
            />
            <NavLink
              component={Link}
              to="/settings"
              label="Settings"
              leftSection={<SettingsIcon size={18} />}
              active={location.pathname === '/settings'}
            />
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main>
          <Routes>
            <Route 
              path="/" 
              element={
                <Home />
              } 
            />
            <Route 
              path="/settings" 
              element={
                <Settings 
                  primaryColor={primaryColor} 
                  onPrimaryColorChange={setPrimaryColor} 
                />
              } 
            />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
