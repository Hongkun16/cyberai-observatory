import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const dataVersion = createHash('sha256')
  .update(readFileSync(new URL('./web/public/data/audit.json', import.meta.url)))
  .digest('hex')
  .slice(0, 16);

export default defineConfig({
  plugins: [react()],
  define: { __DATA_VERSION__: JSON.stringify(dataVersion) },
  base: process.env.VITE_BASE_PATH || './',
  build: { outDir: '../dist', emptyOutDir: true },
});
