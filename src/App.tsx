import { createTheme, MantineProvider } from '@mantine/core';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router";
import { Home } from './pages/Home';

const theme = createTheme({});

const root = createRoot(document.getElementById('root'));
root.render(
  <MantineProvider theme={theme}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </MantineProvider>
);
