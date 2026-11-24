<script setup lang="ts">
import { BookOpen, Cpu, FlaskConical } from 'lucide-vue-next'
import { modules } from '../catalog'
import ModuleCard from '../components/ModuleCard.vue'
import KernelDiagram from '../components/KernelDiagram.vue'
import { t } from '../preferences'
</script>
<template>
  <div class="page overview">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow"><Cpu :size="16" /> {{ t('Operating Systems Playground','Laboratorio de sistemas operativos') }}</p>
        <h1>kernel<span>.</span>sim</h1>
        <p class="hero-tagline">{{ t('Explore. Simulate. Understand.','Explora. Simula. Comprende.') }}</p>
        <p class="hero-description">{{ t('An interactive lab for operating system algorithms. Configure a workload, step through execution, and inspect every scheduling decision.','Un laboratorio interactivo de algoritmos de sistemas operativos. Configura una carga de trabajo, avanza por la ejecución e inspecciona cada decisión del planificador.') }}</p>
        <div class="button-group">
          <RouterLink class="button primary" to="/cpu"><Cpu :size="17" />{{ t('Open CPU simulator','Abrir simulador de CPU') }}</RouterLink>
          <a class="button" href="https://github.com/Alejossss/Kernel-Sim#readme" target="_blank" rel="noopener"><BookOpen :size="16" />{{ t('Documentation','Documentación') }}</a>
        </div>
      </div>
      <KernelDiagram />
    </section>
    <section class="module-section">
      <div class="section-heading"><div><h2>{{ t('Simulators','Simuladores') }}</h2><p>{{ t('Explore the subsystems of an operating system.','Explora los subsistemas de un sistema operativo.') }}</p></div><span class="mono muted">{{ t('1 / 6 AVAILABLE','1 / 6 DISPONIBLES') }}</span></div>
      <div class="module-grid"><ModuleCard v-for="module in modules" :key="module.id" :module="module" /></div>
    </section>
    <RouterLink class="lab-link" to="/module/lab"><span class="module-icon" data-color="green"><FlaskConical :size="20" /></span><div><strong>{{ t('Experiment Laboratory','Laboratorio de experimentos') }}</strong><p>{{ t('Guided experiments for testing operating system behavior.','Experimentos guiados para estudiar el comportamiento del sistema operativo.') }}</p></div><span class="badge">{{ t('Planned','Pendiente') }}</span></RouterLink>
  </div>
</template>
