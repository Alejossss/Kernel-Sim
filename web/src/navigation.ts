import { ref, watch } from 'vue'

const modes = ['expanded','compact','hidden'] as const
type Mode = typeof modes[number]
const saved = localStorage.getItem('kernel-navigation') as Mode
export const navigation = ref<Mode>(modes.includes(saved) ? saved : 'expanded')
watch(navigation, mode => localStorage.setItem('kernel-navigation', mode))
export function cycleNavigation() {
  navigation.value = modes[(modes.indexOf(navigation.value) + 1) % modes.length]
}
