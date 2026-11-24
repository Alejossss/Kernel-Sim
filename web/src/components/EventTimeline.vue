<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ArrowDownToLine, ListOrdered, PanelRightClose, PanelRightOpen } from 'lucide-vue-next'
import { reason } from '../copy'
import type { Input, Snapshot } from '../engine'
import { t } from '../preferences'

const props = defineProps<{ events?: Snapshot[]; cursor: number; jobs: Input['jobs']; name: (id:number) => string; duration: number }>()
const emit = defineEmits<{ seek:[number] }>()
const compact = defineModel<boolean>('compact', { required:true })
const list = ref<HTMLElement>()
const filter = ref('all')
const pid = ref(0)
const follow = ref(true)
const atEnd = ref(true)
const start = ref(0)
const pageSize = 100
const limit = ref(pageSize)
const groups = {
  arrival:() => t('Arrival','Llegada'),
  dispatch:() => t('CPU dispatch','Asignación de CPU'),
  preempt:() => t('Preemption','Expropiación'),
  quantum:() => t('Quantum expired','Quantum agotado'),
  finish:() => t('Completion','Finalización'),
  idle:() => t('Idle','Inactividad'),
  tick:() => t('Execution','Ejecución'),
  initial:() => t('Initial state','Estado inicial'),
}
type Group = keyof typeof groups
function group(event: Snapshot): Group {
  return event.type in groups ? event.type as Group : 'dispatch'
}
const filtered = computed(() => (props.events?.slice(0,props.cursor+1) ?? [])
  .filter(e => (filter.value === 'all' || group(e) === filter.value) && (!pid.value || e.pid === pid.value)))
const visible = computed(() => filtered.value.slice(start.value,start.value+limit.value))
const hasNewer = computed(() => start.value + limit.value < filtered.value.length)
function inspectScroll() {
  const el = list.value
  if (el) atEnd.value = el.scrollHeight - el.clientHeight - el.scrollTop < 28
}
async function jump() {
  start.value = Math.max(0,filtered.value.length - pageSize)
  limit.value = pageSize
  atEnd.value = true
  await nextTick()
  if (list.value) list.value.scrollTop = list.value.scrollHeight
}
async function earlier() {
  const el = list.value
  const height = el?.scrollHeight ?? 0
  const count = Math.min(pageSize,start.value)
  start.value -= count
  limit.value += count
  await nextTick()
  if (el) el.scrollTop += el.scrollHeight - height
  atEnd.value = false
}
watch(() => props.events, () => { pid.value = 0; void jump() })
watch([filter,pid], () => void jump())
watch(follow, value => { if (value) void jump() })
watch(compact, value => { if (!value && follow.value && atEnd.value) void jump() })
watch(filtered, (rows, previous) => {
  if (rows.length < previous.length) {
    if (start.value >= rows.length || (follow.value && atEnd.value)) void jump()
  } else if (follow.value && atEnd.value && rows.length > previous.length) {
    if (hasNewer.value) start.value = rows.length - limit.value
    void nextTick(() => { if (list.value) list.value.scrollTop = list.value.scrollHeight })
  }
})
</script>
<template>
  <aside class="event-timeline" :class="{ compact }" data-tour="events" :style="{ '--event-motion':duration+'ms' }">
    <header class="event-heading">
      <div v-if="!compact"><ListOrdered :size="17" /><h2>{{ t('Event log','Registro de eventos') }}</h2></div>
      <button class="icon-button" :aria-label="compact ? t('Expand event log','Expandir registro') : t('Compact event log','Compactar registro')" :title="compact ? t('Expand event log','Expandir registro') : t('Compact event log','Compactar registro')" :aria-expanded="!compact" aria-controls="event-log-body" @click="compact=!compact">
        <PanelRightOpen v-if="compact" :size="17" /><PanelRightClose v-else :size="17" />
      </button>
    </header>
    <div v-show="!compact" id="event-log-body">
      <div class="event-filters">
        <select v-model="filter" :aria-label="t('Event type','Tipo de evento')"><option value="all">{{ t('All event types','Todos los tipos') }}</option><option v-for="(label,key) in groups" :key="key" :value="key">{{ label() }}</option></select>
        <select v-model.number="pid" :aria-label="t('Filter by process','Filtrar por proceso')"><option :value="0">{{ t('All processes','Todos los procesos') }}</option><option v-for="job in jobs" :key="job.pid" :value="job.pid">{{ job.name }} · P{{ job.pid }}</option></select>
      </div>
      <div class="event-tools">
        <label><input type="checkbox" v-model="follow" />{{ t('Auto-scroll','Desplazamiento automático') }}</label>
        <button class="icon-button" :aria-label="t('Latest events','Últimos eventos')" :title="t('Latest events','Últimos eventos')" @click="jump"><ArrowDownToLine :size="15" /></button>
      </div>
      <div ref="list" class="event-scroll" tabindex="0" :aria-label="t('Event timeline','Línea temporal de eventos')" @scroll.passive="inspectScroll">
        <button v-if="start" class="button event-page" @click="earlier">{{ t('Show earlier events','Ver eventos anteriores') }}</button>
        <TransitionGroup name="event" tag="ol" class="event-list">
          <li v-for="event in visible" :key="event.id" :data-kind="group(event)">
            <button :aria-current="event.id === cursor ? 'step' : undefined" @click="emit('seek',event.id)">
              <span class="event-label"><time>t={{ event.time }}</time><strong>{{ groups[group(event)]() }}</strong></span>
              <span class="event-desc"><b v-if="event.pid">{{ name(event.pid) }} · </b>{{ event.type==='initial' ? t('The clock starts before the first arrival.','El reloj se inicia antes de la primera llegada.') : reason(event.reason) }}</span>
            </button>
          </li>
        </TransitionGroup>
        <p v-if="!visible.length" class="event-empty">{{ t('No matching events','Sin eventos coincidentes') }}</p>
        <button v-if="hasNewer" class="button event-page" @click="jump">{{ t('Jump to latest events','Ir a los últimos eventos') }}</button>
      </div>
      <footer class="event-count mono">{{ filtered.length }} {{ t('events','eventos') }}</footer>
    </div>
  </aside>
</template>
