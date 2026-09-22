import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Deployed under https://alam689.github.io/National-Fisheries-and-Livestock-Management-System-IFLMS-/
  // so built assets are requested from that sub-path. Override for another host with
  // `npm run build -- --base=/`.
  base: '/National-Fisheries-and-Livestock-Management-System-IFLMS-/',
  plugins: [react()],
  server: { port: 5173 },
})
