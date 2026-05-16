<script setup lang="ts">
import { computed } from 'vue'
import type { ProcessOptions } from '../App.vue'

const props = defineProps<{
  options: ProcessOptions
  canProcess: boolean
  canExport: boolean
  hasBatch: boolean
}>()

const emit = defineEmits<{
  'update:options': [value: ProcessOptions]
  process: []
  processAll: []
  export: []
  exportAll: []
}>()

function updateOption<K extends keyof ProcessOptions>(key: K, value: ProcessOptions[K]) {
  emit('update:options', { ...props.options, [key]: value })
}

const processedCount = computed(() => 0)
const totalCount = computed(() => 0)
</script>

<template>
  <div class="export-panel">
    <div class="panel-section">
      <div class="section-title">{{ $t('panel.metadataSection') }}</div>
      <div class="option-row">
        <el-checkbox
          :model-value="options.stripMetadata"
          @update:model-value="(v: boolean) => updateOption('stripMetadata', v)"
          size="small"
        >
          {{ $t('panel.stripExif') }}
        </el-checkbox>
      </div>
      <div class="option-row">
        <el-checkbox
          :model-value="options.reencode"
          @update:model-value="(v: boolean) => updateOption('reencode', v)"
          size="small"
        >
          {{ $t('panel.reencode') }}
        </el-checkbox>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-title">{{ $t('panel.exportFormat') }}</div>
      <el-radio-group
        :model-value="options.outputFormat"
        @update:model-value="(v: string) => updateOption('outputFormat', v as any)"
        size="small"
      >
        <el-radio-button value="original">{{ $t('panel.originalFormat') }}</el-radio-button>
        <el-radio-button value="png">PNG</el-radio-button>
        <el-radio-button value="jpeg">JPEG</el-radio-button>
      </el-radio-group>
      <div v-if="options.outputFormat === 'jpeg'" class="quality-slider">
        <span class="q-label">{{ $t('panel.quality', { quality: options.jpegQuality }) }}</span>
        <el-slider
          :model-value="options.jpegQuality"
          @update:model-value="(v: number) => updateOption('jpegQuality', v)"
          :min="10"
          :max="100"
          size="small"
        />
      </div>
    </div>

    <div class="panel-actions">
      <el-button
        type="primary"
        class="action-btn"
        :disabled="!canProcess"
        @click="emit('process')"
      >
        {{ $t('panel.processCurrent') }}
      </el-button>
      <el-button
        type="primary"
        class="action-btn"
        :disabled="!canExport"
        plain
        @click="emit('export')"
      >
        {{ $t('panel.exportCurrent') }}
      </el-button>
      <div v-if="hasBatch" class="batch-actions">
        <el-button
          type="success"
          class="action-btn"
          plain
          @click="emit('processAll')"
        >
          {{ $t('panel.processAll') }}
        </el-button>
        <el-button
          class="action-btn"
          plain
          @click="emit('exportAll')"
        >
          {{ $t('panel.exportAll') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-panel {
  padding: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: auto;
}

.panel-section {
  margin-bottom: 14px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.option-row {
  margin-bottom: 4px;
}

.quality-slider {
  margin-top: 10px;
  padding: 0 4px;
}

.q-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.panel-actions {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-actions :deep(.action-btn) {
  width: 100%;
  margin-left: 0;
}

.batch-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
