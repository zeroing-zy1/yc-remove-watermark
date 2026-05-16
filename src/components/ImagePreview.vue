<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { ImageFile, WatermarkRegion } from '../App.vue'

const props = defineProps<{
  image: ImageFile
}>()

const emit = defineEmits<{
  updateRegions: [regions: Omit<WatermarkRegion, 'id'>[]]
}>()

const containerRef = ref<HTMLDivElement>()
const imgRef = ref<HTMLImageElement>()
const scale = ref(1)
const position = ref({ x: 0, y: 0 })
const imageNaturalSize = ref({ width: 0, height: 0 })

const isPanning = ref(false)
const isDrawing = ref(false)
const panStart = ref({ x: 0, y: 0 })
const posStart = ref({ x: 0, y: 0 })
const drawStart = ref({ x: 0, y: 0 })
const drawCurrent = ref({ x: 0, y: 0 })
const viewMode = ref<'before' | 'after'>('after')
const showOverlay = ref(true)

const ZOOM_MIN_PCT = 30
const ZOOM_MAX_PCT = 100
const zoomPercent = ref(100)

watch(scale, (s) => {
  zoomPercent.value = Math.round(s * 100)
})

const drawingRegion = computed(() => {
  if (!isDrawing.value) return null
  const x1 = Math.min(drawStart.value.x, drawCurrent.value.x)
  const y1 = Math.min(drawStart.value.y, drawCurrent.value.y)
  const x2 = Math.max(drawStart.value.x, drawCurrent.value.x)
  const y2 = Math.max(drawStart.value.y, drawCurrent.value.y)
  if (imageNaturalSize.value.width === 0) return null
  return {
    x: x1 / imageNaturalSize.value.width,
    y: y1 / imageNaturalSize.value.height,
    width: (x2 - x1) / imageNaturalSize.value.width,
    height: (y2 - y1) / imageNaturalSize.value.height
  }
})

const activeSrc = computed(() => {
  const filePath = viewMode.value === 'after' && props.image.processedPath
    ? props.image.processedPath
    : props.image.path
  return window.electronAPI.getImageUrl(filePath)
})

watch(() => props.image.path, () => {
  imageNaturalSize.value = { width: 0, height: 0 }
  resetView()
})

watch(activeSrc, () => {
  imageNaturalSize.value = { width: 0, height: 0 }
})

/** 按容器尺寸缩放并居中，使整图可见 */
function fitToWindow() {
  const container = containerRef.value
  const { width: iw, height: ih } = imageNaturalSize.value
  if (!container || iw === 0 || ih === 0) return

  const cw = container.clientWidth
  const ch = container.clientHeight
  const fitScale = Math.min(cw / iw, ch / ih)

  scale.value = fitScale
  position.value = {
    x: (cw - iw * fitScale) / 2,
    y: (ch - ih * fitScale) / 2
  }
}

function resetView() {
  fitToWindow()
}

/** 以容器中心为锚点设置缩放比例（percent 为 10~1000） */
function setScaleFromPercent(percent: number) {
  const container = containerRef.value
  const clamped = Math.max(ZOOM_MIN_PCT, Math.min(ZOOM_MAX_PCT, percent))
  const newScale = clamped / 100

  if (!container) {
    scale.value = newScale
    return
  }

  const ax = container.clientWidth / 2
  const ay = container.clientHeight / 2
  const cx = (ax - position.value.x) / scale.value
  const cy = (ay - position.value.y) / scale.value

  position.value = {
    x: ax - cx * newScale,
    y: ay - cy * newScale
  }
  scale.value = newScale
}

function applyZoomFromInput(val: number | undefined) {
  if (val == null || Number.isNaN(val)) {
    zoomPercent.value = Math.round(scale.value * 100)
    return
  }
  setScaleFromPercent(val)
}

function handleImageLoad(e: Event) {
  const img = e.target as HTMLImageElement
  imageNaturalSize.value = { width: img.naturalWidth, height: img.naturalHeight }
  fitToWindow()
}

function switchMode(mode: 'before' | 'after') {
  viewMode.value = mode
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(ZOOM_MIN_PCT / 100, Math.min(ZOOM_MAX_PCT / 100, scale.value + delta))

  const rect = containerRef.value!.getBoundingClientRect()
  const cx = (e.clientX - rect.left - position.value.x) / scale.value
  const cy = (e.clientY - rect.top - position.value.y) / scale.value

  position.value = {
    x: (e.clientX - rect.left) - cx * newScale,
    y: (e.clientY - rect.top) - cy * newScale
  }
  scale.value = newScale
}

function handleMouseDown(e: MouseEvent) {
  if (e.button !== 0) return

  if (e.shiftKey) {
    isDrawing.value = true
    const rect = containerRef.value!.getBoundingClientRect()
    drawStart.value = {
      x: (e.clientX - rect.left - position.value.x) / scale.value,
      y: (e.clientY - rect.top - position.value.y) / scale.value
    }
    drawCurrent.value = { ...drawStart.value }
  } else {
    isPanning.value = true
    panStart.value = { x: e.clientX, y: e.clientY }
    posStart.value = { ...position.value }
  }
}

function handleMouseMove(e: MouseEvent) {
  if (isPanning.value) {
    position.value = {
      x: posStart.value.x + (e.clientX - panStart.value.x),
      y: posStart.value.y + (e.clientY - panStart.value.y)
    }
  }
  if (isDrawing.value) {
    const rect = containerRef.value!.getBoundingClientRect()
    drawCurrent.value = {
      x: (e.clientX - rect.left - position.value.x) / scale.value,
      y: (e.clientY - rect.top - position.value.y) / scale.value
    }
  }
}

function handleMouseUp() {
  if (isDrawing.value && drawingRegion.value) {
    const r = drawingRegion.value
    if (r.width > 0.005 && r.height > 0.005) {
      emit('updateRegions', [{ ...r, mode: 'crop' }])
    }
  }
  isPanning.value = false
  isDrawing.value = false
}

function clearRegions() {
  emit('updateRegions', [])
}

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  document.addEventListener('mouseup', handleMouseUp)
  await nextTick()
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => fitToWindow())
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  document.removeEventListener('mouseup', handleMouseUp)
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="preview-wrapper">
    <div class="preview-toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button size="small" :type="viewMode === 'before' ? 'primary' : 'default'" @click="switchMode('before')">{{ $t('preview.before') }}</el-button>
          <el-button size="small" :type="viewMode === 'after' ? 'primary' : 'default'" @click="switchMode('after')">{{ $t('preview.after') }}</el-button>
        </el-button-group>
        <el-switch
          v-model="showOverlay"
          size="small"
          :active-text="$t('preview.overlay')"
          style="margin-left: 12px"
        />
      </div>
      <div class="toolbar-right">
        <el-button size="small" @click="resetView">{{ $t('preview.fitWindow') }}</el-button>
        <el-button size="small" :disabled="!image.regions.length" @click="clearRegions">{{ $t('preview.clearRegions') }}</el-button>
        <div class="zoom-control">
          <el-input-number
            v-model="zoomPercent"
            :min="ZOOM_MIN_PCT"
            :max="ZOOM_MAX_PCT"
            :step="10"
            :precision="0"
            size="small"
            controls-position="right"
            class="zoom-input"
            @change="applyZoomFromInput"
          />
          <span class="zoom-unit">%</span>
        </div>
      </div>
    </div>

    <div
      ref="containerRef"
      class="preview-canvas"
      :class="{ 'is-drawing': isDrawing }"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
    >
      <div
        class="image-layer"
        :style="{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0'
        }"
      >
        <img
          ref="imgRef"
          :src="activeSrc"
          class="preview-image"
          draggable="false"
          @load="handleImageLoad"
        />

        <!-- Existing regions -->
        <div
          v-if="showOverlay"
          v-for="(region, idx) in image.regions"
          :key="idx"
          class="region-box region-saved"
          :style="{
            left: (region.x * imageNaturalSize.width) + 'px',
            top: (region.y * imageNaturalSize.height) + 'px',
            width: (region.width * imageNaturalSize.width) + 'px',
            height: (region.height * imageNaturalSize.height) + 'px'
          }"
        >
          <div class="region-label">{{ region.mode === 'crop' ? $t('preview.crop') : $t('preview.inpaint') }}</div>
        </div>

        <!-- Drawing region -->
        <div
          v-if="isDrawing && showOverlay && drawingRegion"
          class="region-box region-drawing"
          :style="{
            left: (drawingRegion.x * imageNaturalSize.width) + 'px',
            top: (drawingRegion.y * imageNaturalSize.height) + 'px',
            width: (drawingRegion.width * imageNaturalSize.width) + 'px',
            height: (drawingRegion.height * imageNaturalSize.height) + 'px'
          }"
        />
      </div>
    </div>

    <div class="preview-footer">
      <div class="footer-hint">
        <i18n-t keypath="preview.hint" tag="span">
          <template #shift>
            <kbd>Shift</kbd>
          </template>
        </i18n-t>
      </div>
      <div v-if="image.regions.length" class="footer-regions">
        {{ $t('preview.regionCount', { count: image.regions.length }) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-input {
  width: 110px;
}

.zoom-unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.preview-canvas {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  background: repeating-conic-gradient(#eee 0% 25%, transparent 0% 50%) 50% / 20px 20px;
}

.preview-canvas.is-drawing {
  cursor: crosshair;
}

.image-layer {
  position: absolute;
  top: 0;
  left: 0;
}

.preview-image {
  display: block;
  max-width: none;
  user-select: none;
  -webkit-user-drag: none;
}

.region-box {
  position: absolute;
  border: 2px solid var(--el-color-primary);
  pointer-events: none;
  z-index: 10;
}

.region-box.region-saved {
  border-color: var(--el-color-success);
  background: rgba(103, 194, 58, 0.1);
}

.region-box.region-drawing {
  border-color: var(--el-color-primary);
  background: rgba(64, 158, 255, 0.15);
  border-style: dashed;
}

.region-label {
  position: absolute;
  top: -20px;
  left: 2px;
  font-size: 11px;
  background: var(--el-color-success);
  color: #fff;
  padding: 1px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.footer-hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.footer-hint kbd {
  padding: 1px 5px;
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
  font-family: inherit;
  font-size: 11px;
}

.footer-regions {
  font-size: 12px;
  color: var(--el-color-success);
}
</style>
