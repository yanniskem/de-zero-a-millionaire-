import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' : le build fonctionne aussi bien à la racine d'un domaine (Vercel, Netlify)
// que dans un sous-dossier (GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 800 },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
