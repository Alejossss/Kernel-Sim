<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Activity, Clock3, Cpu, ListOrdered, SlidersHorizontal } from 'lucide-vue-next'
import Panel from '../components/Panel.vue'
import Gantt from '../components/Gantt.vue'
import PlaybackBar from '../components/PlaybackBar.vue'
import WorkloadForm from '../components/WorkloadForm.vue'
import { reason } from '../copy'
import { type Segment, type Trace } from '../engine'
import { t } from '../preferences'
import { useSimulation } from '../store'
import { usePlayback } from '../playback'

const sim = useSimulation()
const { input, trace, pending, error } = storeToRefs(sim)
const { cursor, speed, playing, last, snapshot, seek, toggle } = usePlayback(trace)
const editor = ref(false)
watch(input, sim.invalidate, { deep:true, flush:'sync' })
if (!trace.value && !pending.value && !error.value) sim.run()

const metricLabels = computed(() => [
  ['waiting',t('Avg. waiting','Espera media'),'t'],
  ['turnaround',t('Avg. turnaround','Retorno medio'),'t'],
  ['response',t('Avg. response','Respuesta media'),'t'],
  ['utilization',t('CPU utilization','Uso de CPU'),'%'],
  ['switches',t('Context switches','Cambios de contexto'),''],
  ['throughput',t('Throughput','Rendimiento'),t('jobs/t','proc./t')],
  ['fairness',t('Jain fairness','Equidad de Jain'),''],
] as const)
const colors = ['#38bdf8','#a78bfa','#34d399','#fbbf24','#f472b6','#fb923c']
const color = (pid: number) => pid ? colors[Math.max(0,input.value.jobs.findIndex(p => p.pid === pid)) % colors.length] : '#94a3b8'
const name = (pid: number) => input.value.jobs.find(job => job.pid === pid)?.name ?? ('P' + pid)
const time = computed(() => snapshot.value?.time ?? 0)
const queues = computed(() => [
  { title:t('Running','En ejecución'), pids:snapshot.value?.running ? [snapshot.value.running] : [] },
  { title:t('Ready queue','Cola de listos'), pids:snapshot.value?.ready ?? [] },
  { title:t('Completed','Terminados'), pids:snapshot.value?.processes.filter(p => p.status === 'finished').map(p => p.pid) ?? [] },
])
const shownEvents = computed(() => trace.value?.events.slice(Math.max(0,cursor.value-7),cursor.value+1).reverse() ?? [])
const rows = computed(() => input.value.jobs.map(job => ({
  job,
  state:snapshot.value?.processes.find(p => p.pid === job.pid),
  result:trace.value?.results.find(p => p.pid === job.pid),
})))
const status = (code?: string) => ({
  new:t('New','Nuevo'), ready:t('Ready','Listo'), running:t('Running','Ejecutando'), finished:t('Finished','Terminado'),
})[code ?? ''] ?? '—'
function selectSegment(segment: Segment) {
  const selected = trace.value?.events.find(e => e.time === segment.start && e.running === segment.pid && (segment.pid || e.type === 'idle'))
  if (selected) seek(selected.id)
}
function metric(key: keyof Trace['metrics']) {
  const value = trace.value?.metrics[key]
  if (value === undefined) return '—'
  if (key === 'switches') return String(value)
  if (key === 'utilization') return (value * 100).toFixed(1)
  return value.toFixed(key === 'throughput' || key === 'fairness' ? 3 : 2)
}
</script>
<template>
  <div class="page cpu-page">
    <div class="page-title">
      <div>
        <p class="eyebrow"><Cpu :size="16" />{{ t('CPU Simulator','Simulador de CPU') }}</p>
        <h1>{{ t('CPU Scheduling','Planificación de CPU') }}</h1>
        <p>{{ t('Inspect how scheduling policies allocate CPU time to competing processes.','Inspecciona cómo las políticas de planificación distribuyen tiempo de CPU entre procesos.') }}</p>
      </div>
      <button class="button mobile-config" :aria-expanded="editor" aria-controls="cpu-config" @click="editor = !editor"><SlidersHorizontal :size="16" />{{ t('Configuration','Configuración') }}</button>
    </div>
    <div class="cpu-layout">
      <div class="cpu-workbench">
        <div class="metric-grid">
          <div v-for="[key,label,unit] in metricLabels" :key="key" class="metric" :title="key === 'switches' ? t('Direct changes between distinct PIDs, excluding idle.','Cambios directos entre PID distintos, excluida la inactividad.') : key === 'fairness' ? t('Jain index of burst / turnaround.','Índice de Jain de ráfaga / retorno.') : label">
            <span>{{ label }}</span><strong>{{ metric(key) }} <small>{{ unit }}</small></strong>
          </div>
        </div>
        <Panel :title="t('Execution timeline','Línea de ejecución')" :caption="t('Gantt chart · logical time','Diagrama de Gantt · tiempo lógico')">
          <template #actions><span class="clock mono"><Clock3 :size="15" />t = {{ time }}<span class="muted"> / {{ trace?.duration ?? '—' }}</span></span></template>
          <Gantt v-if="trace" :segments="trace.segments" :duration="trace.duration" :time="time" :active="snapshot?.running ?? 0" :name="name" :color="color" @select="selectSegment" />
          <div v-else class="timeline-empty"><Activity :size="22" />{{ pending ? t('Generating trace…','Generando traza…') : t('Run the workload to generate a trace.','Ejecuta la carga para generar una traza.') }}</div>
          <PlaybackBar v-model:speed="speed" :disabled="!trace" :last="last" :cursor="cursor" :playing="playing" @seek="seek" @toggle="toggle" />
        </Panel>
        <div class="queue-grid">
          <Panel v-for="queue in queues" :key="queue.title" :title="queue.title">
            <div class="queue-body"><span v-for="pid in queue.pids" :key="pid" class="process-pill" :style="{ '--process':color(pid) }">{{ name(pid) }}</span><span v-if="!queue.pids.length" class="muted">—</span></div>
          </Panel>
        </div>
        <Panel :title="t('Process states','Estado de procesos')">
          <div class="table-wrap"><table><thead><tr>
            <th>PID</th><th>{{ t('Process','Proceso') }}</th><th>{{ t('State','Estado') }}</th><th>{{ t('Remaining','Restante') }}</th><th>{{ t('Waiting','Espera') }}</th><th>{{ t('Turnaround','Retorno') }}</th><th>{{ t('Response','Respuesta') }}</th>
          </tr></thead><tbody><tr v-for="({job,state,result},i) in rows" :key="i">
            <td class="mono">P{{ job.pid }}</td><td>{{ job.name }}</td><td><span class="state" :data-state="state?.status">{{ status(state?.status) }}</span></td>
            <td>{{ state?.remaining ?? '—' }}</td><td>{{ result?.waiting ?? '—' }}</td><td>{{ result?.turnaround ?? '—' }}</td><td>{{ result?.response ?? '—' }}</td>
          </tr></tbody></table></div>
        </Panel>
        <Panel :title="t('Event log','Registro de eventos')" :caption="t('Most recent events at the playback position','Últimos eventos hasta el punto de reproducción')">
          <template #actions><ListOrdered :size="17" class="muted" /></template>
          <ol v-if="shownEvents.length" class="events" reversed><li v-for="event in shownEvents" :key="event.id"><button @click="seek(event.id)"><span class="mono event-time">t={{ event.time }}</span><strong v-if="event.pid">{{ name(event.pid) }}</strong><span>{{ reason(event.reason) }}</span></button></li></ol>
          <p v-else class="queue-body muted">—</p>
        </Panel>
      </div>
      <aside id="cpu-config" :class="['config',{ expanded:editor }]"><WorkloadForm :color="color" /></aside>
    </div>
  </div>
</template>
