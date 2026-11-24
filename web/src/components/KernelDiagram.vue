<script setup lang="ts">
import { t } from '../preferences'
</script>
<template>
  <svg class="kernel-diagram" viewBox="0 0 482 254" role="img" :aria-label="t('Processes connect to the CPU, memory and I/O','Los procesos se conectan a la CPU, la memoria y la E/S')">
    <defs>
      <pattern id="mesh" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="var(--line)" /></pattern>
    </defs>
    <rect width="482" height="254" rx="12" fill="url(#mesh)" />
    <path class="bus" d="M125 59 H175 V121 H186 M125 121 H186 M125 183 H175 V121 M306 121 H342 V68 H364 M306 121 H342 V174 H364" />
    <path class="signal" d="M125 59 H175 V121 H186 M306 121 H342 V68 H364 M306 121 H342 V174 H364" />
    <g class="diagram-nodes">
      <text x="31" y="22">{{ t('PROCESSES','PROCESOS') }}</text>
      <rect v-for="y in [39,101,163]" :key="y" x="31" :y="y" width="94" height="40" rx="6" />
      <text x="47" y="63">P01</text><text x="47" y="125">P02</text><text x="47" y="187">P03</text>
      <circle cx="104" cy="59" r="3" fill="#38bdf8" /><circle cx="104" cy="121" r="3" fill="#a78bfa" /><circle cx="104" cy="183" r="3" fill="#fbbf24" />
      <rect class="chip-shell" x="186" y="65" width="120" height="112" rx="12" />
      <rect class="chip-inner" x="198" y="77" width="96" height="88" rx="8" />
      <path class="chip-pins" d="M218 58v7m18-7v7m18-7v7m18-7v7m-54 112v7m18-7v7m18-7v7m18-7v7 M228 98h36v30h-36z m8 7h20v16h-20z" />
      <text class="diagram-cpu" x="246" y="150" text-anchor="middle">CPU</text>
      <rect x="364" y="47" width="100" height="42" rx="6" /><rect x="364" y="153" width="100" height="42" rx="6" />
      <text x="414" y="72" text-anchor="middle">{{ t('MEMORY','MEMORIA') }}</text><text x="414" y="178" text-anchor="middle">{{ t('DEVICES','DISPOSITIVOS') }}</text>
    </g>
    <circle class="bus-dot" cx="175" cy="121" r="3"/><circle class="bus-dot" cx="342" cy="121" r="3"/>
    <text class="bus-label" x="246" y="224" text-anchor="middle">{{ t('SYSTEM BUS','BUS DEL SISTEMA') }}</text>
  </svg>
</template>
