import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'
import type { Trace } from './engine'

export function usePlayback(trace: Ref<Trace | undefined>) {
  const cursor = ref(0)
  const speed = ref(1)
  const playing = ref(false)
  const last = computed(() => Math.max(0, (trace.value?.events.length ?? 1) - 1))
  const snapshot = computed(() => trace.value?.events[cursor.value])
  let timer: ReturnType<typeof setInterval> | undefined
  function pause() {
    clearInterval(timer)
    playing.value = false
  }
  function seek(index: number) {
    pause()
    cursor.value = Math.max(0, Math.min(last.value, index))
  }
  function toggle() {
    if (playing.value) return pause()
    if (!last.value) return
    if (cursor.value === last.value) cursor.value = 0
    playing.value = true
    timer = setInterval(() => {
      cursor.value++
      if (cursor.value >= last.value) pause()
    }, 450 / speed.value)
  }
  watch(trace, () => seek(0))
  watch(speed, () => { if (playing.value) { pause(); toggle() } })
  onScopeDispose(pause)
  return { cursor, speed, playing, last, snapshot, seek, toggle }
}
