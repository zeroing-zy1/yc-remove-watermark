export default {
  app: {
    title: 'Yunchen AI Watermark & Hidden Info Removal Tool',
    emptyHint: 'Import images to start',
  },
  opencv: {
    ready: 'OpenCV Ready',
    loading: 'Loading OpenCV...',
    loadFailed: 'OpenCV failed to load, watermark removal unavailable',
    notReady: 'OpenCV not ready yet, please try again later',
  },
  process: {
    success: 'Processing complete!',
    failed: 'Processing failed: ',
  },
  export: {
    success: 'Export complete!',
  },
  panel: {
    metadataSection: 'Hidden Info Removal',
    stripExif: 'Remove EXIF metadata',
    reencode: 'Re-encode (destroy steganographic data)',
    exportFormat: 'Export Format',
    originalFormat: 'Original Format',
    quality: 'Quality: {quality}%',
    processCurrent: 'Process Current',
    exportCurrent: 'Export Current',
    processAll: 'Process All',
    exportAll: 'Export All',
  },
  preview: {
    before: 'Original',
    after: 'Processed',
    overlay: 'Regions',
    fitWindow: 'Fit Window',
    clearRegions: 'Clear Regions',
    crop: 'Crop',
    inpaint: 'Inpaint',
    hint: 'Drag to pan | Scroll to zoom | {shift} + drag to select watermark',
    regionCount: '{count} watermark region(s) selected',
  },
  batch: {
    title: 'Image List ({count})',
  },
  upload: {
    clickToSelect: 'Click to select images',
    formats: 'Supports JPG / PNG / WebP / BMP',
  },
  error: {
    opencvLoad: 'OpenCV.js failed to load',
    imageLoad: 'Image failed to load',
  },
  dialog: {
    imageFiles: 'Image Files',
    png: 'PNG',
    jpeg: 'JPEG',
    originalFormat: 'Original Format',
  },
  lang: {
    switch: '中文',
  },
}
