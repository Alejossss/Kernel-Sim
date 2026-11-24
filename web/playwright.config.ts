import { defineConfig, devices } from '@playwright/test'
const port = 4174
export default defineConfig({
  testDir:'./e2e',
  use:{ ...devices['Desktop Chrome'], channel:process.env.PLAYWRIGHT_CHANNEL || undefined, baseURL:'http://localhost:'+port+'/Kernel-Sim/' },
  webServer:{ command:'npm exec vite -- preview --host localhost --port '+port+' --strictPort --base /Kernel-Sim/', url:'http://localhost:'+port+'/Kernel-Sim/', reuseExistingServer:!process.env.CI },
})
