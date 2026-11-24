<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { Cpu, ListOrdered, CircleCheck, ChevronRight } from 'lucide-vue-next'
import { t } from '../preferences'
const props = defineProps<{ ready: number[]; running: number; completed: number[]; name: (pid:number) => string; color: (pid:number) => string; duration: number }>()
const root = ref<HTMLElement>()
const motions = new Map<string, Animation>()
const pills = () => Array.from(root.value?.querySelectorAll<HTMLElement>('[data-pid]') ?? [])
let positions = new Map<string, DOMRect>()
const sources = [() => props.ready, () => props.running, () => props.completed] as const
watch(sources, () => {
  positions = new Map(pills().map(el => [el.dataset.pid!, el.getBoundingClientRect()]))
}, { flush:'pre' })
function stopMotions() {
  for (const animation of motions.values()) animation.cancel()
  motions.clear()
}
watch(() => props.duration,stopMotions)
onUnmounted(stopMotions)
watch(sources, () => {
  const before = positions
  stopMotions()
  if (!props.duration || !root.value?.getClientRects().length) return
  for (const el of pills()) {
    const id = el.dataset.pid!
    const old = before.get(id)
    const next = el.getBoundingClientRect()
    const x = old ? old.x - next.x : 0
    const y = old ? old.y - next.y : 0
    if (old && Math.abs(x) + Math.abs(y) < 1) continue
    const animation = el.animate([
      { transform:`translate(${x}px,${y}px)`, opacity:old ? 1 : 0.3 },
      { transform:'translate(0,0)', opacity:1 },
    ], { duration:props.duration, easing:'cubic-bezier(.2,.7,.3,1)' })
    motions.set(id, animation)
    animation.onfinish = () => { if (motions.get(id) === animation) motions.delete(id) }
  }
}, { flush:'post' })
</script>
<template>
  <section class="cpu-flow" ref="root" aria-label="CPU" data-tour="flow">
    <div v-for="(lane,i) in [
      { title:t('Ready queue','Cola de listos'), icon:ListOrdered, pids:ready },
      { title:t('Running · CPU','En ejecución · CPU'), icon:Cpu, pids:running ? [running] : [] },
      { title:t('Completed','Terminados'), icon:CircleCheck, pids:completed },
    ]" :key="i" class="flow-lane" :class="'lane-'+i">
      <header><component :is="lane.icon" :size="16" /><h2>{{ lane.title }}</h2><span class="mono muted">{{ lane.pids.length }}</span></header>
      <div class="flow-items">
        <span v-for="pid in lane.pids" :key="pid" :data-pid="pid" class="process-pill" :style="{ '--process':color(pid) }">{{ name(pid) }}</span>
        <span v-if="!lane.pids.length" class="muted">{{ i === 1 ? t('Idle','Inactiva') : '—' }}</span>
      </div>
      <ChevronRight v-if="i < 2" class="flow-arrow" :size="15" aria-hidden="true" />
    </div>
  </section>
</template>
