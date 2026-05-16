<script setup lang="ts">
const emit = defineEmits<{
  filesSelected: [files: { path: string; name: string; size: number }[]]
}>()

async function handleSelect() {
  const files = await window.electronAPI.selectImages()
  emit('filesSelected', files)
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (!files) return
  const result: { path: string; name: string; size: number }[] = []
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if ((f as any).path) {
      result.push({ path: (f as any).path, name: f.name, size: f.size })
    }
  }
  if (result.length > 0) {
    emit('filesSelected', result)
  }
}
</script>

<template>
  <div class="upload-section">
    <div
      class="drop-zone"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @click="handleSelect"
    >
      <el-icon :size="32" class="upload-icon"><UploadFilled /></el-icon>
      <p>{{ $t('upload.clickToSelect') }}</p>
      <p class="upload-hint">{{ $t('upload.formats') }}</p>
    </div>
  </div>
</template>

<style scoped>
.upload-section {
  padding: 0 12px 12px;
}

.drop-zone {
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: var(--el-fill-color-light);
}

.drop-zone:hover {
  border-color: var(--el-color-primary);
  background: var(--el-fill-color);
}

.upload-icon {
  color: var(--el-color-primary);
  margin-bottom: 8px;
}

.drop-zone p {
  margin: 4px 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.upload-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
