<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Box, BookOpen, Github, Globe, LayoutGrid, Menu, Moon, Sun, X } from 'lucide-vue-next'
import { modules, tools } from './catalog'
import { t, usePreferences } from './preferences'
import { useSimulation } from './store'
const { locale, theme } = usePreferences()
const sim = useSimulation()
const route = useRoute()
const open = ref(false)
const docs = 'https://github.com/Alejossss/Kernel-Sim#readme'
const title = computed(() => {
  if (route.path === '/cpu') return modules[0].title()
  return [...modules, ...tools].find(item => item.id === route.params.id)?.title() ?? t('Overview','Inicio')
})
watch(() => route.path, () => { open.value = false })
</script>
<template>
  <a class="skip" href="#content" @click.prevent="($refs.content as HTMLElement).focus()">{{ t('Skip to content','Ir al contenido') }}</a>
  <div class="shell" @keydown.esc="open = false">
    <button v-if="open" class="overlay" type="button" :aria-label="t('Close navigation','Cerrar navegación')" @click="open = false" />
    <aside id="navigation" :class="['sidebar',{ open }]">
      <RouterLink to="/" class="brand"><span class="brand-icon"><Box :size="19" /></span><span>kernel<span class="brand-dot">.</span>sim<small>OS PLAYGROUND</small></span></RouterLink>
      <nav :aria-label="t('Workspace navigation','Navegación del espacio de trabajo')">
        <p class="nav-label">{{ t('Workspace','Espacio de trabajo') }}</p>
        <RouterLink to="/" class="nav-link"><LayoutGrid :size="16" />{{ t('Overview','Inicio') }}</RouterLink>
        <p class="nav-label">{{ t('Simulators','Simuladores') }}</p>
        <RouterLink v-for="module in modules" :key="module.id" :to="module.path ?? '/module/' + module.id" class="nav-link" :data-color="module.color">
          <component :is="module.icon" :size="16" /><span>{{ module.title() }}</span>
        </RouterLink>
        <p class="nav-label">{{ t('Tools','Herramientas') }}</p>
        <RouterLink v-for="tool in tools" :key="tool.id" :to="'/module/' + tool.id" class="nav-link"><component :is="tool.icon" :size="16" /><span>{{ tool.title() }}</span></RouterLink>
      </nav>
      <div class="sidebar-footer">
        <a :href="docs" target="_blank" rel="noopener" class="nav-link"><BookOpen :size="16" />{{ t('Documentation','Documentación') }}</a>
        <a href="https://github.com/Alejossss/Kernel-Sim" target="_blank" rel="noopener" class="nav-link"><Github :size="16" />@Alejossss</a>
        <span class="version">KERNEL-SIM <strong>v2.0</strong></span>
      </div>
    </aside>
    <div class="workspace">
      <header class="topbar">
        <button class="icon-button menu" type="button" :aria-label="t('Toggle navigation','Alternar navegación')" aria-controls="navigation" :aria-expanded="open" @click="open = !open"><X v-if="open" :size="19" /><Menu v-else :size="19" /></button>
        <div class="breadcrumb"><span>{{ t('Workspace','Espacio de trabajo') }}</span><span>/</span><strong>{{ title }}</strong></div>
        <div class="header-actions">
          <span :class="['engine-status',sim.engine]" role="status"><i />{{ sim.engine === 'ready' ? t('Engine online','Motor activo') : sim.engine === 'loading' ? t('Loading engine','Cargando motor') : t('Engine unavailable','Motor no disponible') }}</span>
          <button class="icon-button lang" type="button" :aria-label="t('Switch to Spanish','Cambiar a inglés')" @click="locale = locale === 'en' ? 'es' : 'en'"><Globe :size="16" />{{ locale.toUpperCase() }}</button>
          <button class="icon-button" type="button" :aria-label="t('Toggle color theme','Cambiar tema de color')" @click="theme = theme === 'dark' ? 'light' : 'dark'"><Sun v-if="theme === 'dark'" :size="17" /><Moon v-else :size="17" /></button>
        </div>
      </header>
      <main id="content" ref="content" tabindex="-1"><RouterView /></main>
    </div>
  </div>
</template>
