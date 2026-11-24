import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { engineUrl, type Input, type Reply, type Trace } from './engine'

export const demo = (): Input => ({
  policy: 0, quantum: 2,
  jobs: [[1,'P1',0,5,1],[2,'P2',1,3,2],[3,'P3',2,4,0],[4,'P4',4,2,3]].map(
    ([pid, name, arrival, burst, priority]) => ({ pid: Number(pid), name: String(name), arrival: Number(arrival), burst: Number(burst), priority: Number(priority) })),
})

export const useSimulation = defineStore('simulation', () => {
  const input = ref(demo())
  const trace = shallowRef<Trace>()
  const engine = ref<'loading' | 'ready' | 'error'>('loading')
  const pending = ref(false)
  const error = ref('')
  const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' })
  let request = 0
  worker.onmessage = ({ data }: MessageEvent<{ id: number; value: Reply | null }>) => {
    if (data.value && 'error' in data.value && data.value.error === 'engine_failure') engine.value = 'error'
    else engine.value = 'ready'
    if (data.id !== request) return
    pending.value = false
    if (!data.value) return
    if ('error' in data.value) error.value = data.value.error
    else trace.value = data.value
  }
  worker.onerror = () => {
    engine.value = 'error'
    pending.value = false
    error.value = 'engine_failure'
  }
  worker.postMessage({ id: request, url: engineUrl })

  function invalidate() {
    ++request
    trace.value = undefined
    pending.value = false
    error.value = ''
  }
  function run() {
    invalidate()
    pending.value = true
    worker.postMessage({ id: request, url: engineUrl, input: JSON.parse(JSON.stringify(input.value)) })
  }
  return { input, trace, engine, pending, error, invalidate, run }
})
