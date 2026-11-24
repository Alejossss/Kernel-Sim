import { ref, watchEffect } from 'vue'

const locale = ref(localStorage.getItem('kernel-locale') === 'es' ? 'es' : 'en')
const theme = ref(localStorage.getItem('kernel-theme') === 'light' ? 'light' : 'dark')
watchEffect(() => {
  document.documentElement.lang = locale.value
  document.documentElement.dataset.theme = theme.value
  localStorage.setItem('kernel-locale', locale.value)
  localStorage.setItem('kernel-theme', theme.value)
})
export const t = (en: string, es: string) => locale.value === 'es' ? es : en
export function usePreferences() { return { locale, theme } }
