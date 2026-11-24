<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import type { modules } from '../catalog'
import { t } from '../preferences'
defineProps<{ module: (typeof modules)[number] }>()
</script>
<template>
  <RouterLink :to="module.path ?? '/module/' + module.id" class="module-card" :data-color="module.color">
    <div class="module-top">
      <span class="module-icon"><component :is="module.icon" :size="20" /></span>
      <span :class="['badge', { live: module.path }]">{{ module.path ? t('Available','Disponible') : t('Planned','Pendiente') }}</span>
    </div>
    <div><h3>{{ module.title() }}<ChevronRight v-if="module.path" :size="16" /></h3><p>{{ module.detail() }}</p></div>
    <div class="tags" :aria-label="module.path ? t('Available algorithms','Algoritmos disponibles') : t('Planned algorithms','Algoritmos previstos')">
      <span v-for="algorithm in module.algorithms" :key="algorithm">{{ algorithm }}</span>
    </div>
  </RouterLink>
</template>
