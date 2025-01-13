import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    vue(),
    nodePolyfills()
  ],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      'crypto': 'crypto-browserify'
    }
  },
  optimizeDeps: {
    include: ['@noble/secp256k1']
  }
}) 