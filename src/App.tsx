import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  MantineProvider, 
  createTheme, 
  localStorageColorSchemeManager 
} from '@mantine/core';
import { BrowserRouter, Routes, Route } from "react-router";
import { Home } from './pages/Home';

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mantine-color-scheme',
});

function App() {
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
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <Home 
                primaryColor={primaryColor} 
                onPrimaryColorChange={setPrimaryColor} 
              />
            } 
          />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
