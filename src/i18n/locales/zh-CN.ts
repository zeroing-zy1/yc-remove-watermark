export default {
  app: {
    title: '云宸AI图片水印与隐藏信息移除工具',
    emptyHint: '请导入图片开始处理',
  },
  opencv: {
    ready: 'OpenCV 就绪',
    loading: 'OpenCV 加载中...',
    loadFailed: 'OpenCV 加载失败，水印移除功能不可用',
    notReady: 'OpenCV 尚未加载完成，请稍后重试',
  },
  process: {
    success: '处理完成!',
    failed: '处理失败: ',
  },
  export: {
    success: '导出成功!',
  },
  panel: {
    metadataSection: '隐藏信息清除',
    stripExif: '移除 EXIF 元数据',
    reencode: '重新编码 (破坏隐写数据)',
    exportFormat: '导出格式',
    originalFormat: '原始格式',
    quality: '质量: {quality}%',
    processCurrent: '处理当前图片',
    exportCurrent: '导出当前图片',
    processAll: '批量处理全部',
    exportAll: '批量导出全部',
  },
  preview: {
    before: '原始',
    after: '处理后',
    overlay: '选区',
    fitWindow: '适应窗口',
    clearRegions: '清除选区',
    crop: '裁剪',
    inpaint: '填充',
    hint: '鼠标拖拽移动 | 滚轮缩放 | {shift} + 拖拽框选水印区域',
    regionCount: '已选 {count} 个水印区域',
  },
  batch: {
    title: '图片列表 ({count})',
  },
  upload: {
    clickToSelect: '点击选择图片到此处',
    formats: '支持 JPG / PNG / WebP / BMP',
  },
  error: {
    opencvLoad: 'OpenCV.js 加载失败',
    imageLoad: '图片加载失败',
  },
  dialog: {
    imageFiles: '图片文件',
    png: 'PNG',
    jpeg: 'JPEG',
    originalFormat: '原始格式',
  },
  lang: {
    switch: 'English',
  },
}
