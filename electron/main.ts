import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron'
import path from 'path'
import fs from 'fs'
import { removeWatermarkByCrop, removeWatermarkByInpaint } from './services/watermark'
import { stripMetadata, reencodeImage } from './services/metadata'
import { t, setLocale } from './i18n'

app.setName(t('appName'))

let mainWindow: BrowserWindow | null = null

app.whenReady().then(() => {
  protocol.handle('local-img', async (request) => {
    try {
      const url = request.url.slice('local-img://'.length)
      const filePath = decodeURIComponent(url)
      const data = await fs.promises.readFile(filePath)
      const ext = path.extname(filePath).toLowerCase().slice(1)
      const mimeMap: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
        bmp: 'image/bmp',
        tiff: 'image/tiff'
      }
      return new Response(data, {
        headers: {
          'content-type': mimeMap[ext] || 'image/png',
          'cache-control': 'no-cache',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch {
      return new Response(null, { status: 404 })
    }
  })

  createWindow()
})

function createWindow() {
  const isMac = process.platform === 'darwin'

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    ...(isMac
      ? {
          titleBarStyle: 'hiddenInset' as const,
          trafficLightPosition: { x: 14, y: 14 },
          titleBarOverlay: {
            color: '#ffffff',
            symbolColor: '#303133',
            height: 48
          }
        }
      : {}),
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('select-images', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: t('imageFiles'), extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'] }
    ]
  })
  if (result.canceled) return []
  return result.filePaths.map(fp => ({
    path: fp,
    name: path.basename(fp),
    size: fs.statSync(fp).size
  }))
})

ipcMain.handle('save-file', async (_event, defaultName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName,
    filters: [
      { name: t('png'), extensions: ['png'] },
      { name: t('jpeg'), extensions: ['jpg', 'jpeg'] },
      { name: t('originalFormat'), extensions: ['*'] }
    ]
  })
  if (result.canceled) return null
  return result.filePath
})

ipcMain.handle('remove-watermark-crop', async (_event, inputPath: string, region: { x: number; y: number; width: number; height: number }) => {
  const tmpDir = path.join(app.getPath('temp'), 'watermark-remover')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  const outputPath = path.join(tmpDir, `processed_${Date.now()}.png`)
  await removeWatermarkByCrop(inputPath, outputPath, region)
  return outputPath
})

ipcMain.handle('remove-watermark-inpaint', async (_event, inputPath: string, region: { x: number; y: number; width: number; height: number }) => {
  const tmpDir = path.join(app.getPath('temp'), 'watermark-remover')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  const outputPath = path.join(tmpDir, `processed_${Date.now()}.png`)
  await removeWatermarkByInpaint(inputPath, outputPath, region)
  return outputPath
})

ipcMain.handle('strip-metadata', async (_event, inputPath: string) => {
  const tmpDir = path.join(app.getPath('temp'), 'watermark-remover')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  const outputPath = path.join(tmpDir, `stripped_${Date.now()}.png`)
  await stripMetadata(inputPath, outputPath)
  return outputPath
})

ipcMain.handle('reencode-image', async (_event, inputPath: string, format: 'png' | 'jpeg', quality: number) => {
  const tmpDir = path.join(app.getPath('temp'), 'watermark-remover')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  const ext = format === 'jpeg' ? 'jpg' : 'png'
  const outputPath = path.join(tmpDir, `reencoded_${Date.now()}.${ext}`)
  await reencodeImage(inputPath, outputPath, format, quality)
  return outputPath
})

ipcMain.handle('read-image-base64', async (_event, filePath: string) => {
  const data = await fs.promises.readFile(filePath)
  const base64 = data.toString('base64')
  const ext = path.extname(filePath).toLowerCase().slice(1)
  const mime = ext === 'jpg' ? 'jpeg' : ext
  return `data:image/${mime};base64,${base64}`
})

ipcMain.handle('save-buffer', async (_event, base64: string, fileName: string) => {
  const tmpDir = path.join(app.getPath('temp'), 'watermark-remover')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  const outputPath = path.join(tmpDir, fileName)
  const buffer = Buffer.from(base64, 'base64')
  await fs.promises.writeFile(outputPath, buffer)
  return outputPath
})

ipcMain.handle('export-file', async (_event, sourcePath: string, destPath: string) => {
  fs.copyFileSync(sourcePath, destPath)
  return true
})

ipcMain.handle('set-locale', async (_event, locale: string) => {
  setLocale(locale)
})
