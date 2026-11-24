import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'
import type { Trace } from './engine'

export function usePlayback(trace: Ref<Trace | undefined>) {
  const cursor = ref(0)
  const speed = ref(1)
  const playing = ref(false)
  const phase = ref(0)
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const reduced = ref(motion.matches)
  const updateMotion = (event: MediaQueryListEvent) => { reduced.value = event.matches }
  motion.addEventListener('change', updateMotion)
  const last = computed(() => Math.max(0, (trace.value?.events.length ?? 1) - 1))
  const snapshot = computed(() => trace.value?.events[cursor.value])
  const visualTime = computed(() => {
    const time = snapshot.value?.time ?? 0
    const next = trace.value?.events[cursor.value + 1]?.time ?? time
    return playing.value && !reduced.value ? time + (next - time) * phase.value : time
  })
  let frame = 0
  let started = 0

  function pause() {
    cancelAnimationFrame(frame)
    playing.value = false
    phase.value = 0
  }

  function seek(index: number) {
    pause()
    cursor.value = Math.max(0, Math.min(last.value, index))
  }

  function animate(now: number) {
    const interval = 450 / speed.value
    const elapsed = now - started
    if (elapsed >= interval) {
      started = now
      phase.value = 0
      cursor.value++
      if (cursor.value >= last.value) return pause()
    } else if (!reduced.value) {
      phase.value = elapsed / interval
    }
    frame = requestAnimationFrame(animate)
  }

  function toggle() {
    if (playing.value) return pause()
    if (!last.value) return
    if (cursor.value === last.value) cursor.value = 0
    playing.value = true
    started = performance.now()
    frame = requestAnimationFrame(animate)
  }

  watch(trace, () => seek(0), { flush:'sync' })
  watch(speed, () => { started = performance.now(); phase.value = 0 })
  onScopeDispose(() => { pause(); motion.removeEventListener('change', updateMotion) })
  return { cursor, speed, playing, last, snapshot, visualTime, reduced, seek, toggle, pause }
}
