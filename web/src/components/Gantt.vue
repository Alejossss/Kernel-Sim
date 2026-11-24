<script setup lang="ts">
import { computed } from 'vue'
import type { Segment } from '../engine'
import { t } from '../preferences'
const props = defineProps<{ segments: Segment[]; duration: number; time: number; active: number; name: (pid: number) => string; color: (pid: number) => string }>()
const emit = defineEmits<{ select: [Segment] }>()
const x = (time: number) => 25 + time / props.duration * 670
const ticks = computed(() => {
  const step = Math.max(1, Math.ceil(props.duration / 14))
  return [...Array.from({ length: Math.ceil(props.duration / step) }, (_, i) => i * step), props.duration]
})
</script>
<template>
  <div class="gantt-wrap">
    <svg class="gantt" viewBox="0 0 720 106" :aria-label="t('Interactive execution timeline','Línea de ejecución interactiva')">
      <g v-for="tick in ticks" :key="tick" class="axis">
        <line :x1="x(tick)" :x2="x(tick)" y1="9" y2="74" />
        <text :x="x(tick)" y="94" text-anchor="middle">{{ tick }}</text>
      </g>
      <g v-for="segment in segments" :key="segment.start" class="gantt-segment" role="button" tabindex="0"
        :aria-label="`${segment.pid ? name(segment.pid) : t('Idle','Inactiva')}, ${segment.start}–${segment.end}`"
        :style="{ '--process': color(segment.pid) }" @click="emit('select',segment)" @keydown.enter="emit('select',segment)" @keydown.space.prevent="emit('select',segment)">
        <title>{{ segment.pid ? name(segment.pid) : t('Idle','Inactiva') }} · {{ segment.start }}–{{ segment.end }}</title>
        <rect :x="x(segment.start)" y="24" :width="Math.max(0.2,x(segment.end)-x(segment.start)-1)" height="40" rx="3"
          :class="{ current: segment.pid === active && segment.start <= time && time < segment.end }" />
        <text v-if="x(segment.end)-x(segment.start) > 27" :x="(x(segment.start)+x(segment.end))/2" y="49" text-anchor="middle">{{ segment.pid ? 'P'+segment.pid : t('Idle','Inactiva') }}</text>
      </g>
      <path class="playhead" :d="`M${x(time)} 12 V70`" />
      <circle class="playhead-dot" :cx="x(time)" cy="12" r="3" />
    </svg>
  </div>
</template>
