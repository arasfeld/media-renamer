# Media Renamer

An Electron desktop application for scanning and renaming media files (TV shows and movies) with metadata from TMDB.

## Features

- **Folder Scanning**: Recursively scan folders for video files (.mp4, .mkv, .avi, .mov, .wmv, .m4v)
- **Filename Parsing**: Automatically detect and parse TV show and movie filenames
  - TV patterns: `S01E02`, `1x02`, `Season 1 Episode 2`
  - Movie patterns: `Title (2023)`, `Title.2023.1080p`
  - Quality detection: 1080p, 720p, 4K, BluRay, WEB-DL, etc.
- **Modern UI**: Built with React and Mantine component library

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
```

### Running in Development

```bash
npm start
```

### Building for Production

```bash
npm run make
```

## Architecture

```
src/
├── main/                   # Electron main process
│   ├── index.ts            # Main process entry point
│   ├── ipc/                # IPC handlers
│   └── services/           # Main process services (scanner)
├── preload.ts              # Preload script with contextBridge
├── renderer.ts             # Renderer entry point
├── App.tsx                 # Root React component
├── types/                  # TypeScript type definitions
├── lib/                    # Pure utility functions (parser)
├── hooks/                  # React hooks
├── components/             # Reusable UI components
└── pages/                  # Page components
```

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **Mantine** - Component library
- **TypeScript** - Type safety
- **Vite** - Build tool

## Roadmap

- [ ] TMDB API integration for metadata lookup
- [ ] Rename preview and execution
- [ ] Custom naming templates
- [ ] Batch operations
