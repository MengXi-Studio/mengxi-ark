import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// workspace 包直接消费 dist 产物，无需 alias
export default defineConfig({
  plugins: [vue()],
});
