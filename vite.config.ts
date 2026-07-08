import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouterPlugin } from '@tanstack/router-plugin/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tanstackRouterPlugin(),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
})