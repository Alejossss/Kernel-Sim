<script setup lang="ts">
import { computed, nextTick, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { BarChart3, GitCompareArrows } from 'lucide-vue-next'
import Panel from './Panel.vue'
import { validationMessage } from '../copy'
import { engineUrl, policies, type Input, type Reply, type Trace } from '../engine'
import { t } from '../preferences'
import { createEngineWorker } from '../store'

const props = defineProps<{ trace?: Trace; workload?: Input; finished: boolean; completed: number[]; compare: boolean; name: (pid:number) => string }>()
type Metric = keyof Trace['metrics']
const labels = computed(() => [
  ['waiting',t('Average waiting time','Espera media'),'t',t('Time spent in the ready queue.','Tiempo en la cola de listos.')],
  ['turnaround',t('Average turnaround time','Retorno medio'),'t',t('Elapsed time from arrival to completion.','Tiempo desde la llegada hasta la finalización.')],
  ['response',t('Average response time','Respuesta media'),'t',t('Elapsed time from arrival to the first dispatch.','Tiempo desde la llegada hasta el primer despacho.')],
  ['utilization',t('CPU utilization','Uso de CPU'), '%',t('Share of logical time spent running a process.','Proporción del tiempo lógico con un proceso activo.')],
  ['throughput',t('Throughput','Rendimiento'),t('jobs/t','proc./t'),t('Processes completed per tick.','Procesos terminados por tick.')],
  ['switches',t('Context switches','Cambios de contexto'),'',t('Direct changes between distinct PIDs, excluding idle.','Cambios directos entre PID distintos, excluida la inactividad.')],
  ['fairness',t('Jain fairness','Equidad de Jain'),'',t('Jain index of burst divided by turnaround. Values closer to 1 indicate more equal inverse slowdown.','Índice de Jain de ráfaga dividida por retorno. Valores cercanos a 1 indican menor desigualdad de desaceleración inversa.')],
] as const)
const completed = computed(() => props.trace?.results.filter(row => props.finished || props.completed.includes(row.pid)) ?? [])
const longestWait = computed(() => completed.value.reduce<Trace['results'][number] | undefined>((longest,row) => !longest || row.waiting > longest.waiting ? row : longest,undefined))
const means = ['waiting','turnaround','response'] as const
const partial = computed(() => Object.fromEntries(means.map(key => [key,completed.value.length ? completed.value.reduce((sum,item) => sum+item[key],0) / completed.value.length : undefined])))
function format(key: Metric, value?: number) {
  if (value === undefined) return '—'
  if (key === 'switches') return String(value)
  if (key === 'utilization') return (value * 100).toFixed(1)
  return value.toFixed(key === 'throughput' || key === 'fairness' ? 3 : 2)
}
function policyName(policy: number) {
  return policy === 4 ? t('Priority','Prioridad') : policies[policy]
}
const section = ref<HTMLElement>()
const chartMetric = ref<Metric>('waiting')
const comparisons = shallowRef<{ policy:number; metrics:Trace['metrics'] }[]>([])
const comparing = ref(false)
const rrQuantum = ref(2)
const error = ref('')
let worker: Worker | undefined
function clearComparison() {
  worker?.terminate()
  worker = undefined
  comparing.value = false
  comparisons.value = []
  error.value = ''
}
function compareWorkload() {
  if (!props.workload) return
  clearComparison()
  comparing.value = true
  const input = JSON.parse(JSON.stringify(props.workload)) as Input
  // A non-RR scenario has no active quantum. Preserve a valid saved value or use the reference quantum.
  if (!Number.isInteger(input.quantum) || Number(input.quantum) < 1 || Number(input.quantum) > 100) input.quantum = 2
  rrQuantum.value = Number(input.quantum)
  const results: typeof comparisons.value = []
  const instance = createEngineWorker()
  worker = instance
  function fail(code:string) {
    clearComparison()
    error.value = code
  }
  instance.onerror = () => fail('engine_failure')
  instance.onmessage = ({ data }: MessageEvent<{ id:number; value:Reply }>) => {
    if ('error' in data.value) return fail(data.value.error)
    results.push({ policy:data.id, metrics:data.value.metrics })
    if (results.length === policies.length) {
      comparisons.value = results.sort((a,b) => a.policy-b.policy)
      comparing.value = false
      instance.terminate()
      worker = undefined
    }
  }
  policies.forEach((_,policy) => instance.postMessage({ id:policy, url:engineUrl, input:{ ...input,policy } }))
}
const scale = computed(() => Math.max(0,...comparisons.value.map(item => item.metrics[chartMetric.value])) || 1)
const best = computed(() => {
  const min = Math.min(...comparisons.value.map(item => item.metrics.waiting))
  return comparisons.value.filter(item => item.metrics.waiting === min).map(item => policyName(item.policy)).join(', ')
})
function jump() { void nextTick(() => section.value?.scrollIntoView({ block:'start' })) }
watch(() => props.workload,clearComparison)
watch(() => props.compare, value => { if (value) jump() }, { immediate:true })
onScopeDispose(clearComparison)
</script>

<template>
  <div class="results-content">
    <div v-if="trace" class="analysis-status" :class="{ complete:finished }">
      <BarChart3 :size="18" />
      <div><strong>{{ finished ? t('Final results','Resultados finales') : t('Partial results','Resultados parciales') }}</strong>
        <p v-if="!finished">{{ t('Averages include completed processes only. The remaining metrics appear at the end of the trace.','Los promedios incluyen solo los procesos terminados. Las demás métricas aparecen al final de la traza.') }}</p>
        <p v-else-if="longestWait"><strong>{{ name(longestWait.pid) }}</strong> {{ t('waited longest in the ready queue','tuvo la mayor espera en la cola de listos') }} · {{ longestWait.waiting }} {{ t('ticks','ticks') }}.</p>
      </div>
      <span class="mono">{{ completed.length }} / {{ trace.results.length }}</span>
    </div>
    <p v-else class="analysis-status">{{ t('Apply a workload to generate results.','Aplica una carga para generar resultados.') }}</p>
    <div class="metric-grid results-metrics">
      <div v-for="[key,label,unit,description] in labels" :key="key" class="metric" :title="description">
        <span>{{ label }}</span><strong>{{ format(key,finished ? trace?.metrics[key] : partial[key]) }} <small>{{ unit }}</small></strong>
      </div>
    </div>
    <Panel :title="t('Per-process metrics','Métricas por proceso')" :caption="t('All times in logical ticks','Todos los tiempos en ticks lógicos')">
      <div class="table-wrap"><table><thead><tr><th>PID</th><th>{{ t('Process','Proceso') }}</th><th>{{ t('Waiting','Espera') }}</th><th>{{ t('Turnaround','Retorno') }}</th><th>{{ t('Response','Respuesta') }}</th><th>{{ t('Completion','Finalización') }}</th></tr></thead>
        <tbody><tr v-for="job in workload?.jobs" :key="job.pid"><td class="mono">P{{ job.pid }}</td><td>{{ name(Number(job.pid)) }}</td><template v-for="key in (['waiting','turnaround','response','finish'] as const)" :key="key"><td class="mono">{{ completed.find(row => row.pid===job.pid)?.[key] ?? '—' }}</td></template></tr></tbody>
      </table></div>
    </Panel>
    <div ref="section" class="comparison-anchor">
      <Panel :title="t('Algorithm comparison','Comparación de algoritmos')" :caption="t('Run all five policies on the same applied workload.','Ejecuta las cinco políticas sobre la misma carga aplicada.')">
        <template #actions><GitCompareArrows :size="18" class="muted" /></template>
        <div class="comparison-body">
          <div class="comparison-controls">
            <button class="button primary" :disabled="!workload || comparing" @click="compareWorkload">{{ comparing ? t('Comparing…','Comparando…') : t('Compare algorithms','Comparar algoritmos') }}</button>
            <select v-if="comparisons.length" v-model="chartMetric" :aria-label="t('Chart metric','Métrica de la gráfica')"><option v-for="[key,label] in labels" :key="key" :value="key">{{ label }}</option></select>
          </div>
          <p v-if="error" class="error-text" role="alert">{{ validationMessage(error) }}</p>
          <template v-if="comparisons.length">
            <div class="comparison-chart" :aria-label="t('Comparison chart','Gráfica comparativa')">
              <div v-for="item in comparisons" :key="item.policy" class="comparison-row">
                <span>{{ policyName(item.policy) }}<small v-if="item.policy===3" class="mono muted"> · q={{ rrQuantum }}</small></span><div class="comparison-track" aria-hidden="true"><i :style="{width:item.metrics[chartMetric]/scale*100+'%'}" :class="{ selected:item.policy===workload?.policy }" /></div><output class="mono">{{ format(chartMetric,item.metrics[chartMetric]) }}</output>
              </div>
            </div>
            <p class="analysis-note">{{ t('The lowest average waiting time for this workload belongs to','La menor espera media en esta carga corresponde a') }} <strong>{{ best }}</strong>. {{ t('Check response time and fairness for trade-offs across policies.','Consulta la respuesta y la equidad para ver los compromisos entre políticas.') }}</p>
          </template>
          <p v-else-if="finished && trace" class="analysis-note">{{ t('Waiting measures time in the ready queue. Response measures the first dispatch, so a process can respond quickly and still spend time waiting later.','La espera mide el tiempo en la cola de listos. La respuesta mide el primer despacho, por lo que un proceso puede responder pronto y esperar más tarde.') }}</p>
        </div>
      </Panel>
    </div>
  </div>
</template>
