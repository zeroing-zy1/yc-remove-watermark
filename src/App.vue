<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import ImageUploader from './components/ImageUploader.vue'
import ImagePreview from './components/ImagePreview.vue'
import BatchList from './components/BatchList.vue'
import ExportPanel from './components/ExportPanel.vue'
import { loadOpenCV, inpaintImage } from './utils/inpaint'
import { setAppLocale } from './i18n'

const { t, locale } = useI18n()

function toggleLang() {
  const next = locale.value === 'zh-CN' ? 'en' : 'zh-CN'
  setAppLocale(next)
  window.electronAPI?.setLocale(next)
}

watch(locale, (val) => {
  document.title = t('app.title')
  document.documentElement.lang = val
})

export interface WatermarkRegion {
  id: string
  x: number
  y: number
  width: number
  height: number
  mode: 'crop' | 'inpaint'
}

export interface ImageFile {
  id: string
  name: string
  path: string
  originalSize: number
  processedPath: string | null
  regions: WatermarkRegion[]
  status: 'pending' | 'processing' | 'done' | 'error'
}

export interface ProcessOptions {
  stripMetadata: boolean
  reencode: boolean
  outputFormat: 'original' | 'png' | 'jpeg'
  jpegQuality: number
}

const images = ref<ImageFile[]>([])
const selectedId = ref<string | null>(null)
const opencvReady = ref(false)

const selectedImage = computed(() => images.value.find(i => i.id === selectedId.value) || null)

const processOptions = ref<ProcessOptions>({
  stripMetadata: true,
  reencode: true,
  outputFormat: 'original',
  jpegQuality: 90
})

let idCounter = 0

onMounted(async () => {
  document.title = t('app.title')
  try {
    await loadOpenCV()
    opencvReady.value = true
  } catch (e: any) {
    ElMessage.warning(t('opencv.loadFailed'))
  }
})

function handleFilesSelected(files: { path: string; name: string; size: number }[]) {
  if (files.length === 0) return
  for (const f of files) {
    const id = String(++idCounter)
    images.value.push({
      id,
      name: f.name,
      path: f.path,
      originalSize: f.size,
      processedPath: null,
      regions: [],
      status: 'pending'
    })
  }
  if (!selectedId.value) {
    selectedId.value = images.value[0]?.id || null
  }
}

function handleRemoveImage(id: string) {
  images.value = images.value.filter(i => i.id !== id)
  if (selectedId.value === id) {
    selectedId.value = images.value[0]?.id || null
  }
}

function handleUpdateRegions(regions: Omit<WatermarkRegion, 'id'>[]) {
  const img = selectedImage.value
  if (!img) return
  img.regions = regions.map(r => ({ ...r, id: String(Date.now()) + Math.random() }))
}

async function handleProcess() {
  const img = selectedImage.value
  if (!img) return

  if (img.regions.length > 0 && !opencvReady.value) {
    ElMessage.error(t('opencv.notReady'))
    return
  }

  img.status = 'processing'

  try {
    let currentPath = img.path

    if (img.regions.length > 0) {
      const regions = img.regions.map(r => ({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height
      }))
      currentPath = await inpaintImage(currentPath, regions)
    }

    if (processOptions.value.stripMetadata) {
      currentPath = await window.electronAPI.stripMetadata(currentPath)
    }

    if (processOptions.value.reencode) {
      const fmt = processOptions.value.outputFormat === 'original' ? 'png' : processOptions.value.outputFormat
      currentPath = await window.electronAPI.reencodeImage(currentPath, fmt, processOptions.value.jpegQuality)
    }

    img.processedPath = currentPath
    img.status = 'done'
    ElMessage.success(t('process.success'))
  } catch (e: any) {
    img.status = 'error'
    ElMessage.error(t('process.failed') + e.message)
  }
}

async function handleProcessAll() {
  for (const img of images.value) {
    if (img.status !== 'done') {
      selectedId.value = img.id
      await handleProcess()
    }
  }
}

async function handleExport() {
  const img = selectedImage.value
  if (!img || !img.processedPath) return

  const ext = processOptions.value.outputFormat === 'jpeg' ? '.jpg' : '.png'
  const defaultName = img.name.replace(/\.[^.]+$/, '') + '_clean' + ext
  const destPath = await window.electronAPI.saveFile(defaultName)
  if (destPath) {
    await window.electronAPI.exportFile(img.processedPath, destPath)
    ElMessage.success(t('export.success'))
  }
}

async function handleExportAll() {
  for (const img of images.value) {
    if (img.processedPath) {
      selectedId.value = img.id
      await handleExport()
    }
  }
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>{{ $t('app.title') }}</h1>
      <span class="cv-status" v-if="opencvReady">{{ $t('opencv.ready') }}</span>
      <span class="cv-status loading" v-else>{{ $t('opencv.loading') }}</span>
      <el-button text size="small" class="lang-switch" @click="toggleLang">
        {{ $t('lang.switch') }}
      </el-button>
    </header>

    <div class="app-body">
      <aside class="sidebar">
        <ImageUploader @files-selected="handleFilesSelected" />
        <BatchList
          :images="images"
          :selected-id="selectedId"
          @select="selectedId = $event"
          @remove="handleRemoveImage"
        />
        <ExportPanel
          v-model:options="processOptions"
          :can-process="!!selectedImage"
          :can-export="!!selectedImage?.processedPath"
          :has-batch="images.length > 1"
          @process="handleProcess"
          @process-all="handleProcessAll"
          @export="handleExport"
          @export-all="handleExportAll"
        />
      </aside>

      <main class="main-content">
        <ImagePreview
          v-if="selectedImage"
          :key="selectedImage.id"
          :image="selectedImage"
          @update-regions="handleUpdateRegions"
        />
        <div v-else class="empty-state">
          <el-empty :description="$t('app.emptyHint')" />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.cv-status {
  font-size: 11px;
  color: #67c23a;
  margin-left: 12px;
}

.cv-status.loading {
  color: #e6a23c;
}

.lang-switch {
  margin-left: auto;
  margin-right: 8px;
  font-size: 12px;
  -webkit-app-region: no-drag;
}
</style>
