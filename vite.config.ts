import dotenv from 'dotenv'
dotenv.config()
function assertEnv(key: string) {
  if (process.env[key] === undefined) {
    throw new Error(`process.env.${key} is undefined`)
  }
}
assertEnv('PORT')
assertEnv('VITE_BACKEND_PORT')

import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'


// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname),
  publicDir: 'public',
  server: {
    port: Number.parseInt(process.env.PORT!),
  },
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
