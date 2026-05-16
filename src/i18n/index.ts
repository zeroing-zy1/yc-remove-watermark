import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import en from './locales/en'

const saved = localStorage.getItem('app-locale')
const defaultLocale = saved && (saved === 'zh-CN' || saved === 'en') ? saved : 'zh-CN'

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    en,
  },
})

export function setAppLocale(locale: 'zh-CN' | 'en') {
  i18n.global.locale.value = locale
  localStorage.setItem('app-locale', locale)
}
