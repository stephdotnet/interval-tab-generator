import { alphaTab } from '@coderline/alphatab-vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves the app under /<repository>/, set by the deploy workflow
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), alphaTab()],
})
