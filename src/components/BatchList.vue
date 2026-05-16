<script setup lang="ts">
import { computed } from 'vue'
import type { ImageFile } from '../App.vue'

const props = defineProps<{
  images: ImageFile[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
  remove: [id: string]
}>()

function getThumbSrc(img: ImageFile) {
  return window.electronAPI.getImageUrl(img.processedPath || img.path)
}

function statusIcon(status: string) {
  switch (status) {
    case 'done': return 'SuccessFilled'
    case 'processing': return 'Loading'
    case 'error': return 'WarningFilled'
    default: return 'Picture'
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'done': return '#67c23a'
    case 'processing': return '#409eff'
    case 'error': return '#f56c6c'
    default: return '#909399'
  }
}
</script>

<template>
  <div class="batch-list" v-if="images.length > 0">
    <div class="batch-header">
      <span>{{ $t('batch.title', { count: images.length }) }}</span>
    </div>
    <div class="batch-items">
      <div
        v-for="img in images"
        :key="img.id"
        class="batch-item"
        :class="{ active: selectedId === img.id }"
        @click="emit('select', img.id)"
      >
        <el-image
          :src="getThumbSrc(img)"
          fit="cover"
          class="thumb"
        />
        <div class="item-info">
          <span class="item-name">{{ img.name }}</span>
          <span class="item-status" :style="{ color: statusColor(img.status) }">
            <el-icon :size="14">
              <component :is="statusIcon(img.status)" />
            </el-icon>
          </span>
        </div>
        <el-button
          text
          size="small"
          type="danger"
          @click.stop="emit('remove', img.id)"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.batch-list {
  padding: 0 12px;
}

.batch-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  padding: 4px 4px 8px;
}

.batch-items {
  max-height: 220px;
  overflow-y: auto;
}

.batch-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.batch-item:hover {
  background: var(--el-fill-color-light);
}

.batch-item.active {
  background: var(--el-color-primary-light-9);
}

.thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-name {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.item-status {
  flex-shrink: 0;
}
</style>
