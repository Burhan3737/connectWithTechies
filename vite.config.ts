import { defineConfig } from 'vitest/config';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { fileURLToPath } from 'node:url';
import { eventsData } from './web/build/eventsData.ts';

/**
 * The web app lives in web/; the data pipeline (scripts/, agent/, data/)
 * stays where it was and keeps writing data/events.json.
 *
 * React Compiler 1.0 (via Babel) memoises components and hooks automatically,
 * so view code stays plain — no hand-written useMemo/useCallback.
 */
const root = fileURLToPath(new URL('./web', import.meta.url));
const dataFile = fileURLToPath(new URL('./data/events.json', import.meta.url));

export default defineConfig({
  root,
  // GitHub Pages serves the site under the repository name.
  // The site's path prefix. GitHub Pages serves it under the repository name;
  // Vercel (which sets VERCEL=1 while building) serves it at the root.
  // BASE_PATH overrides both, for any other host.
  base: process.env.BASE_PATH || (process.env.VERCEL ? '/' : '/connectWithTechies/'),
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), eventsData(dataFile)],
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    target: 'es2022',
  },
  preview: { port: 4173 },
  test: {
    root,
    environment: 'jsdom',
    globals: true,
    // Worker processes are slow to start on Windows and time out; threads are not.
    pool: 'threads',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    css: false,
  },
});
