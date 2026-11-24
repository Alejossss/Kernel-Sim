<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import type { Segment } from '../engine'
import { t } from '../preferences'
const props = defineProps<{ segments: Segment[]; duration: number; time: number; visualTime: number; active: number; name: (pid: number) => string; color: (pid: number) => string }>()
const clip = useId()
const scrollArea = ref<HTMLElement>()
const chart = ref<SVGSVGElement>()
const emit = defineEmits<{ select: [Segment] }>()
const x = (time: number) => 25 + time / props.duration * 670
function keepPlayheadVisible() {
  const area = scrollArea.value
  const svg = chart.value
  if (!area || !svg || area.scrollWidth <= area.clientWidth) return
  const offset = svg.getBoundingClientRect().left - area.getBoundingClientRect().left + x(props.visualTime) * svg.clientWidth / 720
  const margin = 22
  if (offset > area.clientWidth - margin) area.scrollLeft += offset - area.clientWidth + margin
  else if (offset < margin) area.scrollLeft += offset - margin
}
watch(() => props.visualTime,keepPlayheadVisible)
let resize: ResizeObserver | undefined
onMounted(() => {
  if (!scrollArea.value) return
  resize = new ResizeObserver(keepPlayheadVisible)
  resize.observe(scrollArea.value)
})
onUnmounted(() => resize?.disconnect())
const ticks = computed(() => {
  const step = Math.max(1, Math.ceil(props.duration / 14))
  return [...Array.from({ length: Math.ceil(props.duration / step) }, (_, i) => i * step), props.duration]
})
</script>
<template>
  <div ref="scrollArea" class="gantt-wrap">
    <svg ref="chart" class="gantt" viewBox="0 0 720 106" :aria-label="t('Interactive execution timeline','Línea de ejecución interactiva')">
      <defs><clipPath :id="clip"><rect x="25" y="20" :width="x(visualTime)-25" height="48" /></clipPath></defs>
      <g v-for="tick in ticks" :key="tick" class="axis">
        <line :x1="x(tick)" :x2="x(tick)" y1="9" y2="74" />
        <text :x="x(tick)" y="94" text-anchor="middle">{{ tick }}</text>
      </g>
      <g v-for="segment in segments" :key="segment.start" class="gantt-segment" role="button" tabindex="0"
        :aria-label="`${segment.pid ? name(segment.pid) : t('Idle','Inactiva')}, ${segment.start}–${segment.end}`"
        :style="{ '--process': color(segment.pid) }" @click="emit('select',segment)" @keydown.enter="emit('select',segment)" @keydown.space.prevent="emit('select',segment)">
        <title>{{ segment.pid ? name(segment.pid) : t('Idle','Inactiva') }} · {{ segment.start }}–{{ segment.end }}</title>
        <rect class="planned-segment" :x="x(segment.start)" y="24" :width="Math.max(0.2,x(segment.end)-x(segment.start)-1)" height="40" rx="3"
          :class="{ current: segment.pid === active && segment.start <= time && time < segment.end }" />
        <rect class="elapsed-segment" :clip-path="'url(#'+clip+')'" :x="x(segment.start)" y="24" :width="Math.max(0.2,x(segment.end)-x(segment.start)-1)" height="40" rx="3" />
        <text v-if="x(segment.end)-x(segment.start) > 27" :x="(x(segment.start)+x(segment.end))/2" y="49" text-anchor="middle">{{ segment.pid ? 'P'+segment.pid : t('Idle','Inactiva') }}</text>
      </g>
      <path class="playhead" d="M0 12 V70" :transform="`translate(${x(visualTime)} 0)`" />
      <circle class="playhead-dot" :cx="x(visualTime)" cy="12" r="3" />
    </svg>
  </div>
</template>
