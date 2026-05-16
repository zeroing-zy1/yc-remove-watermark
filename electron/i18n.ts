type Locale = 'zh-CN' | 'en'

const messages: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    imageFiles: '图片文件',
    png: 'PNG',
    jpeg: 'JPEG',
    originalFormat: '原始格式',
    appName: '云宸AI图片水印与隐藏信息移除工具',
  },
  en: {
    imageFiles: 'Image Files',
    png: 'PNG',
    jpeg: 'JPEG',
    originalFormat: 'Original Format',
    appName: 'Yunchen AI Watermark & Hidden Info Removal Tool',
  },
}

let currentLocale: Locale = 'zh-CN'

export function t(key: string): string {
  return messages[currentLocale][key] ?? key
}

export function setLocale(locale: string) {
  if (locale === 'zh-CN' || locale === 'en') {
    currentLocale = locale
  }
}
