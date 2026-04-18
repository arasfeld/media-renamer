# Media Renamer Roadmap - Plex Optimization

Future plans to turn this tool into a full-featured Plex Media Management suite.

## Phase 1: MKV & Metadata Optimization
- [ ] **Metadata Scrubbing**: Strip internal titles and comments that mess up Plex display.
- [ ] **Remuxing Engine**: Integrate `ffmpeg` to repackage files into clean MKV containers.
- [ ] **Subtitle Management**: 
  - [ ] Add/Remove subtitle tracks.
  - [ ] Set "Default" and "Forced" flags on tracks.
  - [ ] Reorder tracks (e.g., ensure English is always #1).

## Phase 2: Plex Library Integration
- [ ] **Library Scan**: Automatically trigger Plex library scan via API after renaming.
- [ ] **Asset Downloader**: Download high-res posters, backgrounds, and theme music as local assets.
- [ ] **Edition Support**: Support Plex edition tags like `{edition-Director's Cut}`.

## Phase 3: Advanced Organization
- [ ] **Strict Hierarchy**: Automatically move files into `Show Name/Season XX/` structures.
- [ ] **Duplicate Detection**: Identify and highlight lower-quality duplicates of the same media.
- [ ] **NFO Export**: Generate `.nfo` files for local metadata backup.
