<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { modules, tools } from '../catalog'
import { t } from '../preferences'
const route = useRoute()
const item = computed(() => [...modules, ...tools].find(module => module.id === route.params.id))
</script>
<template>
  <div class="page">
    <section class="panel pending-page">
      <span v-if="item" class="module-icon"><component :is="item.icon" :size="22" /></span>
      <h1>{{ item?.title() ?? t('Module','Módulo') }}</h1>
      <p>{{ t('This module is planned for a later release.','Este módulo está previsto para una etapa posterior.') }}</p>
      <RouterLink class="button primary" to="/cpu">{{ t('Open CPU simulator','Abrir simulador de CPU') }}</RouterLink>
    </section>
  </div>
</template>
