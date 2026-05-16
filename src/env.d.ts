/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: {
    platform: string
    selectImages: () => Promise<{ path: string; name: string; size: number }[]>
    saveFile: (defaultName: string) => Promise<string | null>
    removeWatermarkCrop: (inputPath: string, region: { x: number; y: number; width: number; height: number }) => Promise<string>
    removeWatermarkInpaint: (inputPath: string, region: { x: number; y: number; width: number; height: number }) => Promise<string>
    stripMetadata: (inputPath: string) => Promise<string>
    reencodeImage: (inputPath: string, format: 'png' | 'jpeg', quality: number) => Promise<string>
    exportFile: (sourcePath: string, destPath: string) => Promise<boolean>
    getImageUrl: (filePath: string) => string
    readImageBase64: (filePath: string) => Promise<string>
    saveBuffer: (base64: string, fileName: string) => Promise<string>
    setLocale: (locale: string) => Promise<void>
  }
}
