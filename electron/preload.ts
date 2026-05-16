import { contextBridge, ipcRenderer } from 'electron'

export interface WatermarkRegion {
  x: number
  y: number
  width: number
  height: number
}

export interface SelectedFile {
  path: string
  name: string
  size: number
}

const api = {
  platform: process.platform,
  selectImages: (): Promise<SelectedFile[]> => ipcRenderer.invoke('select-images'),
  saveFile: (defaultName: string): Promise<string | null> => ipcRenderer.invoke('save-file', defaultName),
  removeWatermarkCrop: (inputPath: string, region: WatermarkRegion): Promise<string> =>
    ipcRenderer.invoke('remove-watermark-crop', inputPath, region),
  removeWatermarkInpaint: (inputPath: string, region: WatermarkRegion): Promise<string> =>
    ipcRenderer.invoke('remove-watermark-inpaint', inputPath, region),
  stripMetadata: (inputPath: string): Promise<string> =>
    ipcRenderer.invoke('strip-metadata', inputPath),
  reencodeImage: (inputPath: string, format: 'png' | 'jpeg', quality: number): Promise<string> =>
    ipcRenderer.invoke('reencode-image', inputPath, format, quality),
  exportFile: (sourcePath: string, destPath: string): Promise<boolean> =>
    ipcRenderer.invoke('export-file', sourcePath, destPath),
  getImageUrl: (filePath: string): string =>
    `local-img://${encodeURI(filePath)}`,
  readImageBase64: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('read-image-base64', filePath),
  saveBuffer: (base64: string, fileName: string): Promise<string> =>
    ipcRenderer.invoke('save-buffer', base64, fileName),
  setLocale: (locale: string): Promise<void> =>
    ipcRenderer.invoke('set-locale', locale)
}

contextBridge.exposeInMainWorld('electronAPI', api)
