<script lang="ts">
export interface TourStep {
  target: string
  title: () => string
  body: () => string
  enter?: () => void | Promise<void>
  canAdvance?: () => boolean
  action?: { label: () => string; run: () => void }
}
</script>
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { t } from '../preferences'

const props = defineProps<{ module: string; steps: TourStep[] }>()
const storage = 'kernel-tour-' + props.module
const saved = localStorage.getItem(storage)
const current = ref(-1)
const step = computed(() => props.steps[current.value])
const spotlight = ref<DOMRect>()
const bubble = ref<HTMLElement>()
let returnFocus: HTMLElement | null = null
let observer: ResizeObserver | undefined
let target: Element | null
let frame = 0
let drawer: Element | null = null
const position = computed(() => {
  const rect = spotlight.value
  if (!rect) return {}
  const width = Math.min(320,window.innerWidth - 24)
  const height = bubble.value?.offsetHeight ?? 208
  const below = rect.bottom + 12
  const top = below + height < window.innerHeight - 8 ? below : Math.max(10,rect.top - height - 12)
  return { left:Math.max(12,Math.min(rect.left,window.innerWidth-width-12))+'px', top:Math.max(10,Math.min(top,window.innerHeight-height-10))+'px' }
})
function measure() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    const rect = target?.getBoundingClientRect()
    if (rect?.width && rect.height) spotlight.value = rect
    else spotlight.value = undefined
  })
}
function scrollToTarget() {
  target?.scrollIntoView({ block:'center', behavior:'instant' })
  measure()
}
function start() {
  if (current.value === -1) returnFocus = document.activeElement as HTMLElement
  if (current.value === 0) return
  current.value = 0
}
function stop() {
  current.value = -1
  localStorage.setItem(storage,'done')
  void nextTick(() => returnFocus?.focus({ preventScroll:true }))
}
function next() {
  if (step.value?.canAdvance && !step.value.canAdvance()) return
  if (current.value === props.steps.length - 1) stop()
  else current.value++
}
function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && current.value >= 0) stop()
}
watch(current, async (index) => {
  drawer?.removeEventListener('transitionend',scrollToTarget)
  observer?.disconnect()
  target = null
  spotlight.value = undefined
  if (index < 0) return
  localStorage.setItem(storage,String(index))
  const item = props.steps[index]
  await item.enter?.()
  await nextTick()
  if (index !== current.value) return
  target = document.querySelector(item.target)
  drawer = target?.closest('.configuration-grid') ?? null
  drawer?.addEventListener('transitionend',scrollToTarget,{ once:true })
  scrollToTarget()
  observer = new ResizeObserver(measure)
  if (target) observer.observe(target)
  if (bubble.value) observer.observe(bubble.value)
  measure()
  bubble.value?.focus({ preventScroll:true })
})
onMounted(() => {
  addEventListener('scroll',measure,true)
  addEventListener('resize',measure)
  addEventListener('keydown',onEscape)
  if (saved !== 'done') {
    returnFocus = document.activeElement as HTMLElement
    const index = Number(saved)
    current.value = Number.isInteger(index) && index >= 0 && index < props.steps.length ? index : 0
  }
})
onUnmounted(() => {
  drawer?.removeEventListener('transitionend',scrollToTarget)
  observer?.disconnect()
  cancelAnimationFrame(frame)
  removeEventListener('scroll',measure,true)
  removeEventListener('resize',measure)
  removeEventListener('keydown',onEscape)
})
function advanceFrom(selector: string) {
  if (step.value?.target === selector) next()
}
defineExpose({ start, advanceFrom })
</script>
<template>
  <Teleport to="body">
    <div v-if="step" class="tour-layer">
      <div v-if="spotlight" class="tour-spotlight" :style="{ left:spotlight.left-4+'px',top:spotlight.top-4+'px',width:spotlight.width+8+'px',height:spotlight.height+8+'px' }" />
      <section ref="bubble" tabindex="-1" class="tour-popover" :style="position" role="dialog" aria-labelledby="tour-title" aria-describedby="tour-description">
        <header><span class="mono">{{ t('Walkthrough','Guía') + ' · ' + module.toUpperCase() }} · {{ current+1 }}/{{ steps.length }}</span><button class="icon-button" :aria-label="t('Skip tutorial','Omitir tutorial')" @click="stop"><X :size="17" /></button></header>
        <h2 id="tour-title">{{ step.title() }}</h2>
        <p id="tour-description">{{ step.body() }}</p>
        <button v-if="step.action" class="button tour-action" @click="step.action.run()">{{ step.action.label() }}</button>
        <footer><button class="button" :disabled="current===0" @click="current--">{{ t('Back','Atrás') }}</button><button class="button primary" :disabled="step.canAdvance?.() === false" @click="next">{{ current+1===steps.length ? t('Finish','Finalizar') : t('Next','Siguiente') }}</button></footer>
      </section>
    </div>
  </Teleport>
</template>
