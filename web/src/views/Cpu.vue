<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Activity, ChevronDown, CircleHelp, Clock3, Cpu, SlidersHorizontal } from 'lucide-vue-next'
import Panel from '../components/Panel.vue'
import Gantt from '../components/Gantt.vue'
import PlaybackBar from '../components/PlaybackBar.vue'
import WorkloadForm from '../components/WorkloadForm.vue'
import CpuFlow from '../components/CpuFlow.vue'
import CpuResults from '../components/CpuResults.vue'
import EventTimeline from '../components/EventTimeline.vue'
import GuidedTour, { type TourStep } from '../components/GuidedTour.vue'
import { descriptions } from '../copy'
import { policies, type Segment } from '../engine'
import { t } from '../preferences'
import { demo, useSimulation } from '../store'
import { usePlayback } from '../playback'

const sim = useSimulation()
const route = useRoute()
const router = useRouter()
const { applied, input, trace, pending, error, dirty } = storeToRefs(sim)
const { cursor, speed, playing, last, snapshot, visualTime, reduced, seek, toggle, pause } = usePlayback(trace)
const editor = ref(false)
const logCompact = ref(false)
const tour = ref<InstanceType<typeof GuidedTour>>()
const results = computed(() => route.query.view === 'results')
const configuration = ref<HTMLElement>()
const configurationToggle = ref<HTMLButtonElement>()
const tablist = ref<HTMLElement>()
const noProcesses: number[] = []
const colors = ['#38bdf8','#a78bfa','#34d399','#fbbf24','#f472b6','#fb923c']
const workload = computed(() => applied.value ?? input.value)
const time = computed(() => snapshot.value?.time ?? 0)
const completed = computed(() => snapshot.value?.processes.filter(p => p.status === 'finished').map(p => p.pid) ?? noProcesses)
const finished = computed(() => Boolean(trace.value && cursor.value === last.value))
const animationDuration = computed(() => reduced.value ? 0 : playing.value ? Math.min(400,380/speed.value) : 180)
const algorithm = computed(() => workload.value.policy === 4 ? t('Priority','Prioridad') : policies[workload.value.policy])
const draftAlgorithm = computed(() => input.value.policy === 4 ? t('Priority','Prioridad') : policies[input.value.policy])
const rows = computed(() => workload.value.jobs.map(job => ({
  job,
  state:snapshot.value?.processes.find(p => p.pid === job.pid),
})))
const color = (pid: number) => pid ? colors[Math.max(0,workload.value.jobs.findIndex(p => p.pid === pid)) % colors.length] : '#94a3b8'
const name = (pid: number) => workload.value.jobs.find(job => job.pid === pid)?.name ?? ('P' + pid)
const status = (code?: string) => ({
  new:t('New','Nuevo'), ready:t('Ready','Listo'), running:t('Running','Ejecutando'), finished:t('Finished','Terminado'),
})[code ?? ''] ?? '—'

if (!trace.value && !pending.value && !error.value) sim.run()
let applying = false
function applyWorkload() {
  if (pending.value) return
  applying = true
  sim.run()
}
watch(trace, () => {
  if (applying && editor.value && !dirty.value) {
    closeEditor()
    window.scrollTo({ top:0 })
    tour.value?.advanceFrom('[data-tour="processes"]')
  }
  applying = false
})
watch(error, value => { if (value) applying = false })
watch(results, (enabled) => {
  if (enabled) pause()
})
function selectSegment(segment: Segment) {
  const selected = trace.value?.events.find(e => e.time === segment.start && e.running === segment.pid && (segment.pid || e.type === 'idle'))
  if (selected) seek(selected.id)
}
async function setView(view: 'simulation' | 'results') {
  const changed = results.value !== (view === 'results')
  await router.replace({ query:view === 'results' ? { view:'results' } : {} })
  if (changed) window.scrollTo({ top:0 })
}
async function onTabKey(event: KeyboardEvent) {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return
  event.preventDefault()
  const view = event.key === 'Home' ? 'simulation' : event.key === 'End' ? 'results' : results.value ? 'simulation' : 'results'
  await setView(view)
  tablist.value?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus()
}
function closeEditor() {
  if (configuration.value?.contains(document.activeElement)) {
    configurationToggle.value?.focus({ preventScroll:true })
  }
  editor.value = false
}
function toggleEditor() {
  if (editor.value) closeEditor()
  else editor.value = true
}
async function viewCompletedTrace() {
  await setView('results')
  await nextTick()
  tablist.value?.querySelector<HTMLElement>('#results-tab')?.focus()
}
const steps: TourStep[] = [
  {
    target:'[data-tour="title"]', title:() => t('Follow a scheduling decision','Sigue una decisión de planificación'),
    body:() => t('Watch four example processes compete for CPU time. Start with the reference workload or continue with the one already loaded.','Observa cómo cuatro procesos de ejemplo compiten por tiempo de CPU. Carga el ejemplo o continúa con la carga actual.'),
    action:{ label:() => t('Run reference example','Ejecutar ejemplo de referencia'), run:() => { if (!pending.value) { input.value = demo(); sim.run() } } },
  },
  {
    target:'[data-tour="algorithm"]', title:() => t('Choose a policy','Elige una política'),
    body:() => t('Try Round Robin to allocate execution in fixed quanta. Changing the policy creates a draft for the next run.','Prueba Round Robin para repartir la ejecución en quanta fijos. Cambiar la política crea un borrador para la próxima ejecución.'),
    enter:async () => { if (results.value) await setView('simulation'); editor.value = true },
  },
  {
    target:'[data-tour="processes"]', title:() => t('Build a workload','Prepara una carga'),
    body:() => t('Arrival is when a process becomes ready. Burst is the CPU time it needs. Apply the workload to generate a new trace.','La llegada indica cuándo se habilita un proceso. La ráfaga es el tiempo de CPU que necesita. Aplica la carga para generar una traza.'),
    enter:async () => { if (results.value) await setView('simulation'); editor.value = true },
    action:{ label:() => t('Apply this workload','Aplicar esta carga'), run:() => document.querySelector<HTMLFormElement>('#workload-form')?.requestSubmit() },
  },
  {
    target:'[data-tour="playback"]', title:() => t('Play, pause or step','Reproduce, pausa o avanza por pasos'),
    body:() => t('Play or step forward to inspect an event before continuing. The slider can jump to any event in the trace.','Reproduce o avanza un paso para inspeccionar un evento antes de continuar. El deslizador permite saltar a cualquier evento.'),
    enter:async () => { if (results.value) await setView('simulation') },
    canAdvance:() => !trace.value || cursor.value > 0,
    action:{ label:() => playing.value ? t('Pause','Pausar') : t('Try playback','Probar reproducción'), run:toggle },
  },
  {
    target:'[data-tour="gantt"]', title:() => t('Read the Gantt chart','Lee el diagrama de Gantt'),
    body:() => t('Blocks show CPU intervals. The marker follows playback. Select a block to inspect its first event.','Los bloques muestran intervalos de CPU. El marcador sigue la reproducción. Selecciona un bloque para inspeccionar su primer evento.'),
    enter:pause,
  },
  {
    target:'[data-tour="flow"]', title:() => t('Track the processes','Sigue los procesos'),
    body:() => t('The ready lane shows queue order. The CPU lane shows the active process. Completed processes accumulate on the right.','La cola muestra el orden de espera. La CPU muestra el proceso activo. Los procesos terminados se acumulan a la derecha.'),
  },
  {
    target:'[data-tour="events"] .event-heading', title:() => t('Inspect an event','Inspecciona un evento'),
    body:() => t('The log records what happened and why. Filter by event or process, or select an entry to jump to that step.','El registro explica qué ocurrió y por qué. Filtra por tipo o proceso, o selecciona una entrada para ir a ese paso.'),
    enter:() => { logCompact.value = false },
  },
  {
    target:'[data-tour="results"]', title:() => t('Interpret results','Interpreta los resultados'),
    body:() => t('Open Results & Analysis to inspect waiting time and fairness. Compare all five policies on the same workload.','Abre Resultados y análisis para consultar espera y equidad. Compara las cinco políticas sobre la misma carga.'),
    action:{ label:() => t('Open results','Abrir resultados'), run:() => { void setView('results') } },
  },
]
async function startTour() {
  await setView('simulation')
  window.scrollTo({ top:0 })
  tour.value?.start()
}
</script>

<template>
  <div class="page cpu-page refined-cpu" :class="{ 'showing-results':results }">
    <header class="cpu-titlebar" data-tour="title">
      <span class="module-icon"><Cpu :size="21" /></span>
      <div class="cpu-title"><h1>{{ t('CPU Scheduling','Planificación de CPU') }}</h1>
        <span class="policy-chip mono" :title="t(...descriptions[workload.policy])">{{ algorithm }}<template v-if="workload.policy===3"> · q={{ workload.quantum }}</template></span>
      </div>
      <div class="cpu-title-actions">
        <button class="icon-button" :aria-label="t('CPU help and tutorial','Ayuda y tutorial de CPU')" :title="t('CPU help and tutorial','Ayuda y tutorial de CPU')" @click="startTour"><CircleHelp :size="19" /></button>
      </div>
    </header>
    <section v-show="!results" id="cpu-config" class="configuration-drawer" :class="{ 'configuration-open':editor }" ref="configuration">
      <button ref="configurationToggle" id="configuration-toggle" type="button" class="configuration-summary" :aria-expanded="editor" aria-controls="configuration-fields" @click="toggleEditor">
        <SlidersHorizontal :size="17" />
        <strong>{{ t('Configuration','Configuración') }}</strong>
        <span class="mono">{{ draftAlgorithm }}<template v-if="input.policy===3"> · q={{ input.quantum }}</template> · {{ input.jobs.length }} {{ t('processes','procesos') }}</span>
        <span v-if="dirty" class="draft-label">{{ t('Unapplied changes','Cambios sin aplicar') }}</span>
        <ChevronDown class="configuration-chevron" :size="17" aria-hidden="true" />
      </button>
      <div class="configuration-grid" id="configuration-fields" :inert="!editor">
        <div class="configuration-inner"><WorkloadForm :color="color" @apply="applyWorkload" /></div>
      </div>
    </section>
    <div class="cpu-sticky">
      <div class="view-tabs" ref="tablist" role="tablist" :aria-label="t('CPU views','Vistas de CPU')" @keydown="onTabKey">
        <button id="simulation-tab" role="tab" :aria-selected="!results" :tabindex="results ? -1 : 0" aria-controls="simulation-view" @click="setView('simulation')">{{ t('Simulation','Simulación') }}</button>
        <button id="results-tab" data-tour="results" role="tab" :aria-selected="results" :tabindex="results ? 0 : -1" aria-controls="results-view" @click="setView('results')">{{ t('Results & Analysis','Resultados y análisis') }}</button>
      </div>
      <div v-if="results" class="cpu-transport">
        <PlaybackBar v-model:speed="speed" :disabled="!trace" :last="last" :cursor="cursor" :playing="playing" @seek="seek" @toggle="toggle" />
        <span class="clock mono" :title="t('Logical time','Tiempo lógico')"><Clock3 :size="15" />t = {{ time }}<span class="muted"> / {{ trace?.duration ?? '—' }}</span></span>
      </div>
    </div>
    <Transition name="view">
      <div v-show="!results" id="simulation-view" role="tabpanel" aria-labelledby="simulation-tab" class="simulation-layout" :class="{ 'log-compact':logCompact }">
        <div class="simulation-main">
          <div data-tour="gantt">
            <Panel :title="t('Execution timeline','Línea de ejecución')" :caption="t('Gantt chart · logical time','Diagrama de Gantt · tiempo lógico')">
              <template #actions><div class="timeline-heading-controls"><span class="timeline-key"><i />{{ t('Elapsed','Transcurrido') }}<i />{{ t('Planned','Previsto') }}</span><span class="clock mono"><Clock3 :size="15" />t = {{ time }}<span class="muted"> / {{ trace?.duration ?? '—' }}</span></span></div></template>
              <Gantt v-if="trace" :segments="trace.segments" :duration="trace.duration" :time="time" :visual-time="visualTime" :active="snapshot?.running ?? 0" :name="name" :color="color" @select="selectSegment" />
              <div v-else class="timeline-empty"><Activity :size="22" />{{ pending ? t('Generating trace…','Generando traza…') : t('Apply a workload to generate a trace.','Aplica una carga para generar una traza.') }}</div>
              <div data-tour="playback">
                <PlaybackBar v-model:speed="speed" :disabled="!trace" :last="last" :cursor="cursor" :playing="playing" @seek="seek" @toggle="toggle" />
              </div>
            </Panel>
          </div>
          <CpuFlow :ready="snapshot?.ready ?? noProcesses" :running="snapshot?.running ?? 0" :completed="completed" :name="name" :color="color" :duration="animationDuration" />
          <Panel :title="t('Process states','Estado de procesos')">
            <div class="table-wrap"><table><thead><tr><th>PID</th><th>{{ t('Process','Proceso') }}</th><th>{{ t('State','Estado') }}</th><th>{{ t('Remaining','Restante') }}</th></tr></thead>
              <tbody><tr v-for="{job,state} in rows" :key="job.pid"><td class="mono">P{{ job.pid }}</td><td>{{ job.name }}</td><td><span class="state" :data-state="state?.status">{{ status(state?.status) }}</span></td><td class="mono">{{ state?.remaining ?? '—' }}</td></tr></tbody></table></div>
          </Panel>
        </div>
        <EventTimeline v-model:compact="logCompact" :events="trace?.events" :cursor="cursor" :jobs="workload.jobs" :name="name" :duration="animationDuration ? Math.min(animationDuration,200) : 0" @seek="seek" />
      </div>
    </Transition>
    <Transition name="view">
      <div v-show="results" id="results-view" role="tabpanel" aria-labelledby="results-tab">
        <CpuResults :trace="trace" :workload="applied" :finished="finished" :completed="completed" :compare="results && route.query.compare==='1'" :name="name" />
      </div>
    </Transition>
    <Teleport to="body">
      <Transition name="trace-toast">
        <div v-if="finished && !results" class="finish-banner">
          <strong role="status">{{ t('Trace complete','Traza completada') }}</strong>
          <button class="button primary" @click="viewCompletedTrace">{{ t('View results','Ver resultados') }}</button>
        </div>
      </Transition>
    </Teleport>
    <GuidedTour ref="tour" module="cpu" :steps="steps" />
  </div>
</template>
