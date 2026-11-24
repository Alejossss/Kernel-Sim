<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, Play, Plus, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-vue-next'
import Panel from './Panel.vue'
import { policies } from '../engine'
import { descriptions, scenarios, validationMessage } from '../copy'
import { t } from '../preferences'
import { demo, useSimulation } from '../store'
const sim = useSimulation()
const scenario = ref(-1)
defineProps<{ color: (pid: number) => string }>()
defineEmits<{ apply:[] }>()
const fields = [
  { key:'pid', label:() => 'PID', min:1,max:9999 },
  { key:'arrival', label:() => t('Arrival','Llegada'), min:0,max:200 },
  { key:'burst', label:() => t('Burst','Ráfaga'), min:1,max:100 },
  { key:'priority', label:() => t('Priority','Prioridad'), min:0,max:99 },
] as const
function setScenario(index: number) {
  scenario.value = index
  const selected = scenarios[index]
  const input = demo()
  if (selected.jobs) input.jobs = selected.jobs.map(([arrival, burst, priority], i) => ({ pid:i+1, name:'P'+(i+1), arrival, burst, priority }))
  input.policy = selected.policy
  sim.input = input
}
function addProcess() {
  const used = new Set(sim.input.jobs.map(p => p.pid))
  let pid = 1
  while (used.has(pid)) pid++
  sim.input.jobs.push({ pid, name:'P'+pid, arrival:0, burst:1, priority:0 })
}
</script>
<template>
  <Panel :title="t('Configuration','Configuración')" :caption="t('Edit the workload and scheduling policy','Edita la carga y la política de planificación')">
    <template #actions><SlidersHorizontal :size="18" class="muted" /></template>
    <form id="workload-form" class="config-form" @submit.prevent="$emit('apply')">
      <div class="workload-options">
        <div>
          <label>{{ t('Scenario','Escenario') }}
            <span class="select-shell">
              <select :value="scenario" @change="setScenario(Number(($event.target as HTMLSelectElement).value))">
                <option value="-1" disabled>{{ t('Load a scenario','Cargar un escenario') }}</option>
                <option v-for="(preset,i) in scenarios" :key="i" :value="i">{{ t(...preset.names) }}</option>
              </select>
              <ChevronDown :size="15" />
            </span>
          </label>
          <p v-if="scenario >= 0" class="field-help">{{ t(...scenarios[scenario].detail) }}</p>
        </div>
        <div>
          <label data-tour="algorithm">{{ t('Algorithm','Algoritmo') }}
            <span class="select-shell">
              <select v-model.number="sim.input.policy">
                <option v-for="(policy,i) in policies" :key="policy" :value="i">{{ i === 4 ? t('Priority','Prioridad') : policy }}</option>
              </select>
              <ChevronDown :size="15" />
            </span>
          </label>
          <p class="field-help">{{ t(...descriptions[sim.input.policy]) }}</p>
          <label v-if="sim.input.policy === 3">Quantum<input v-model.number="sim.input.quantum" type="number" required min="1" max="100" /></label>
        </div>
      </div>
      <div class="config-section"><h3>{{ t('Processes','Procesos') }}</h3><span class="mono muted">{{ sim.input.jobs.length }} / 24</span></div>
      <div class="jobs" data-tour="processes">
        <fieldset v-for="(job,i) in sim.input.jobs" :key="i" class="job">
          <legend class="sr-only">{{ t('Process','Proceso') }} {{ i+1 }}</legend>
          <div class="job-title"><span :style="{ '--process':color(Number(job.pid)) }" class="job-dot" /><input v-model="job.name" :aria-label="t('Name','Nombre') + ' ' + (i+1)" maxlength="30" required />
            <button type="button" class="icon-button" :aria-label="t('Remove process','Eliminar proceso') + ' ' + (i+1)" @click="sim.input.jobs.splice(i,1)"><Trash2 :size="15" /></button>
          </div>
          <div class="job-fields"><label v-for="field in fields" :key="field.key">{{ field.label() }}<input v-model.number="job[field.key]" type="number" required :min="field.min" :max="field.max" /></label></div>
        </fieldset>
      </div>
      <button type="button" class="button add-process" :disabled="sim.input.jobs.length >= 24" @click="addProcess"><Plus :size="16" />{{ t('Add process','Agregar proceso') }}</button>
      <p v-if="sim.error" class="error-text" role="alert">{{ validationMessage(sim.error) }}</p>
      <p v-if="sim.dirty" class="draft-notice">{{ t('Changes require a new run. The current trace uses the applied configuration.','Los cambios requieren una nueva ejecución. La traza actual usa la configuración aplicada.') }}</p>
      <div class="config-actions"><button class="button primary" type="submit" :disabled="sim.pending"><Play :size="16" />{{ sim.pending ? t('Running…','Ejecutando…') : t('Apply and run','Aplicar y ejecutar') }}</button>
        <button class="icon-button" type="button" :aria-label="t('Reset workload','Restablecer carga')" @click="setScenario(0)"><RotateCcw :size="17" /></button>
      </div>
    </form>
  </Panel>
</template>
