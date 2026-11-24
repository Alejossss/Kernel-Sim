import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { engineUrl, type Input, type Reply, type Trace } from './engine'

export const demo = (): Input => ({
  policy: 0, quantum: 2,
  jobs: [
    { pid:1, name:'P1', arrival:0, burst:5, priority:1 },
    { pid:2, name:'P2', arrival:1, burst:3, priority:2 },
    { pid:3, name:'P3', arrival:2, burst:4, priority:0 },
    { pid:4, name:'P4', arrival:4, burst:2, priority:3 },
  ],
})

export function createEngineWorker() {
  return new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' })
}

export const useSimulation = defineStore('simulation', () => {
  const input = ref(demo())
  const applied = shallowRef<Input>()
  const trace = shallowRef<Trace>()
  const engine = ref<'loading' | 'ready' | 'error'>('loading')
  const pending = ref(false)
  const error = ref('')
  const dirty = computed(() => Boolean(applied.value) && JSON.stringify(input.value) !== JSON.stringify(applied.value))
  const worker = createEngineWorker()
  let request = 0
  let requested: Input | undefined

  worker.onmessage = ({ data }: MessageEvent<{ id: number; value: Reply | null }>) => {
    if (data.value && 'error' in data.value && data.value.error === 'engine_failure') engine.value = 'error'
    else engine.value = 'ready'
    if (data.id !== request || !data.value || !requested) return
    if ('error' in data.value) error.value = data.value.error
    else {
      applied.value = requested
      trace.value = data.value
    }
    pending.value = false
  }
  worker.onerror = () => {
    engine.value = 'error'
    pending.value = false
    error.value = 'engine_failure'
  }
  worker.postMessage({ id: request, url: engineUrl })

  function run() {
    if (pending.value) return
    error.value = ''
    requested = JSON.parse(JSON.stringify(input.value)) as Input
    pending.value = true
    worker.postMessage({ id: ++request, url: engineUrl, input: requested })
  }
  return { input, applied, trace, engine, pending, error, dirty, run }
})
