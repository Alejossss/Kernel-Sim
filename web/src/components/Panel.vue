<script setup lang="ts">
defineProps<{ title: string; caption?: string }>()
</script>
<template>
  <section class="panel">
    <header class="panel-head"><div><h2>{{ title }}</h2><p v-if="caption">{{ caption }}</p></div><slot name="actions" /></header>
    <slot />
  </section>
</template>
