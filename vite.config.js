import { defineConfig } from 'vite'
import tailwind from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwind()],
  base: '',
})
