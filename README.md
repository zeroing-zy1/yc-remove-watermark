# YC Remove Watermark

A cross-platform desktop app for removing watermarks and hidden metadata from images. Built with Electron + Vue 3 + Element Plus.

## Features

- **Watermark Removal** — Select and inpaint watermark regions using OpenCV's Telea algorithm
- **Metadata Stripping** — Remove EXIF and other hidden metadata via sharp re-encoding
- **Batch Processing** — Process multiple images in one go, with per-image status tracking
- **Region Selection** — Shift-drag on the image preview to mark watermark areas (normalized coordinates)
- **Format Conversion** — Export as PNG, JPEG, or keep original format
- **Cross Platform** — macOS (DMG) and Windows (NSIS) builds

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Electron |
| UI | Vue 3 (Composition API) + TypeScript |
| Component Library | Element Plus |
| Image Processing (renderer) | OpenCV.js (inpainting) |
| Image Processing (main) | sharp (metadata, re-encode) |
| i18n | vue-i18n (Chinese / English) |
| Build | Vite + electron-builder |

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts the Vite dev server with hot reload for both the renderer and main process.

### Build

```bash
npm run build
```

Runs `vue-tsc --noEmit` for type checking, then `vite build` to produce the production bundle in `dist/` and `dist-electron/`.

### Package

```bash
npm run package
```

Builds the app and packages it into a DMG (macOS) or NSIS installer (Windows). Output goes to `release/`.

## Project Structure

```
electron/
  main.ts              Main process — window management, IPC handlers, file dialogs
  preload.ts           contextBridge → window.electronAPI
  services/
    watermark.ts       sharp-based blur/crop removal (server-side fallback)
    metadata.ts        EXIF stripping + re-encode via sharp
src/
  App.vue              Root component — owns image state and processing pipeline
  components/
    ImageUploader.vue  File selection + drag-and-drop zone
    ImagePreview.vue   Image viewer (pan/zoom) + Shift-drag region selection
    BatchList.vue      Sidebar thumbnails with per-image status
    ExportPanel.vue    Process options + action buttons
  utils/
    inpaint.ts         OpenCV.js loader + cv.inpaint watermark removal
  styles/
    global.css         App shell layout
```

## How It Works

1. **Select images** via the file dialog or drag-and-drop
2. **Mark watermarks** by Shift-dragging on the preview to draw one or more regions
3. **Choose options** — metadata stripping, re-encode format, JPEG quality
4. **Process** — the pipeline runs inpainting (OpenCV.js in the renderer), then metadata strip + re-encode (sharp in the main process via IPC)
5. **Export** — save the processed image to your chosen location

## Notes

- OpenCV.js is loaded from CDN (`docs.opencv.org/4.10.0/`) and requires an internet connection on first run
- The macOS build uses `hiddenInset` title bar style with a custom overlay for traffic lights
- Temp files accumulate in `os.tmpdir()/watermark-remover/` with no automatic cleanup
