<script setup lang="ts">
import { Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-vue-next'
import { t } from '../preferences'
defineProps<{ cursor: number; last: number; playing: boolean; disabled: boolean }>()
const speed = defineModel<number>('speed', { required: true })
defineEmits<{ seek: [number]; toggle: [] }>()
</script>
<template>
  <div class="playback">
    <div class="transport">
      <button class="icon-button" :disabled="disabled" :aria-label="t('Restart','Reiniciar')" @click="$emit('seek',0)"><RotateCcw :size="16" /></button>
      <button class="icon-button" :disabled="disabled || cursor === 0" :aria-label="t('Previous step','Paso anterior')" @click="$emit('seek',cursor-1)"><StepBack :size="16" /></button>
      <button class="icon-button play" :disabled="disabled" :aria-label="playing ? t('Pause','Pausar') : t('Play','Reproducir')" @click="$emit('toggle')"><Pause v-if="playing" :size="17" /><Play v-else :size="17" /></button>
      <button class="icon-button" :disabled="disabled || cursor === last" :aria-label="t('Next step','Siguiente paso')" @click="$emit('seek',cursor+1)"><StepForward :size="16" /></button>
    </div>
    <input class="seek" type="range" min="0" :max="last" :value="cursor" :disabled="disabled" :aria-label="t('Seek event','Buscar evento')" @input="$emit('seek',Number(($event.target as HTMLInputElement).value))" />
    <span class="mono muted step-count">{{ cursor }} / {{ last }}</span>
    <select v-model.number="speed" :aria-label="t('Playback speed','Velocidad de reproducción')"><option v-for="v in [0.25,0.5,1,2,4]" :key="v" :value="v">{{ v }}×</option></select>
  </div>
</template>
