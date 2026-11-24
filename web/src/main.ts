import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import './style.css'
import App from './App.vue'
import Overview from './views/Overview.vue'
import Cpu from './views/Cpu.vue'
import Pending from './views/Pending.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Overview },
    { path: '/cpu', component: Cpu },
    { path: '/module/:id', component: Pending },
    { path: '/:fallback(.*)', redirect: '/' },
  ],
})
createApp(App).use(createPinia()).use(router).mount('#app')
