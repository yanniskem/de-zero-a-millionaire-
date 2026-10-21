import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Le build produit un script classique (format IIFE) au lieu d'un module ES.
 * Un module ES est toujours chargé en mode CORS : dans un cadre isolé (iframe sandbox à origine « null »),
 * chez certains hébergeurs ou en ouvrant dist/index.html directement (file://), il est bloqué
 * et le jeu ne réagit plus. Un script classique avec `defer` se charge dans tous ces cas.
 */
function classicScript(): Plugin {
  return {
    name: 'classic-script',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, '<script defer src="$1"></script>')
        .replace(/<link rel="stylesheet" crossorigin href=/g, '<link rel="stylesheet" href=');
    },
  };
}

// base './' : le build fonctionne aussi bien à la racine d'un domaine (Vercel, Netlify)
// que dans un sous-dossier (GitHub Pages).
const BUILD_ID = new Date().toISOString().slice(0, 16).replace('T', ' ');

export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [react(), classicScript()],
  build: {
    chunkSizeWarningLimit: 800,
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
