import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5190,
    strictPort: false,
    watch: {
      ignored: ['**/.verify-shots/**', '**/node_modules/**'],
    },
  },
})
