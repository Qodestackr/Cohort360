import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build'
    },
    server: {
      port: 3000
    },
    plugins: [react(), tsconfigPaths(), svgr(), topLevelAwait()],
    test: {
      globals: true,
      environment: 'jsdom', // tells Vitest to run our tests in a mock browser environment rather than the default Node environment
      setupFiles: './src/__tests__/setup.ts'
    }
  }
})
