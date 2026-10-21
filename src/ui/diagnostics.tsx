// Mode diagnostic : enregistre ce qui se passe réellement dans le navigateur du joueur
// (version chargée, clics reçus, changements d'écran, erreurs) et l'affiche à l'écran.
// Activation : ajouter #diagnostic à l'adresse, ou Paramètres → « Afficher le diagnostic ».

import { useEffect, useState } from 'react';

declare const __BUILD_ID__: string;
export const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';

interface DiagEntry { t: number; kind: string; text: string }
const entries: DiagEntry[] = [];
const listeners = new Set<() => void>();
const start = Date.now();

export function diag(kind: string, text: string) {
  entries.push({ t: Date.now() - start, kind, text: text.slice(0, 300) });
  if (entries.length > 60) entries.shift();
  listeners.forEach((l) => l());
}

let installed = false;
/** Écoute globale, en phase de capture : un clic est journalisé même si l'application ne le traite pas. */
export function installDiagnostics() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  diag('démarrage', `version ${BUILD_ID}`);
  window.addEventListener('pointerdown', (e) => diag('pointerdown', describe(e.target)), true);
  window.addEventListener('click', (e) => diag('clic', describe(e.target)), true);
  window.addEventListener('error', (e) => diag('ERREUR', `${e.message} (${e.filename ?? ''}:${e.lineno ?? ''})`));
  window.addEventListener('unhandledrejection', (e) => diag('ERREUR promesse', String((e.reason as Error)?.message ?? e.reason)));
}

function describe(target: EventTarget | null): string {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return String(target);
  const btn = el.closest?.('button, a, [role="radio"], [role="tab"]') as HTMLElement | null;
  const node = btn ?? el;
  const label = (node.getAttribute('aria-label') || node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  return `<${node.tagName.toLowerCase()}${node.className ? ` class="${String(node.className).slice(0, 40)}"` : ''}> ${label}`;
}

export function environmentReport(): string[] {
  const lines: string[] = [];
  const safe = (label: string, fn: () => string) => {
    try { lines.push(`${label} : ${fn()}`); } catch (e) { lines.push(`${label} : erreur (${(e as Error).message})`); }
  };
  safe('Version du jeu', () => BUILD_ID);
  safe('Navigateur', () => navigator.userAgent);
  safe('Dans un cadre (iframe)', () => (window.top !== window ? 'oui' : 'non'));
  safe('Origine', () => String(window.location.origin));
  safe('Stockage local', () => { localStorage.setItem('__d', '1'); localStorage.removeItem('__d'); return 'disponible'; });
  safe('crypto.getRandomValues', () => (typeof crypto?.getRandomValues === 'function' ? 'disponible' : 'absent'));
  safe('Taille de la fenêtre', () => `${window.innerWidth} × ${window.innerHeight}`);
  return lines;
}

export function useDiagnosticsEnabled(settingOn: boolean): boolean {
  const [hash, setHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash : ''));
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return settingOn || /diagnostic/i.test(hash);
}

export function DiagnosticsPanel({ screen }: { screen: string }) {
  const [, force] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  const [open, setOpen] = useState(true);
  const text = [...environmentReport(), `Écran affiché : ${screen}`, '— Journal —', ...entries.map((e) => `${(e.t / 1000).toFixed(1)} s · ${e.kind} · ${e.text}`)].join('\n');
  // En haut à droite et repliable : le panneau ne doit jamais recouvrir un bouton du jeu.
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} aria-label="Ouvrir le diagnostic"
        style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 64px)', right: 8, zIndex: 100, background: '#000', color: '#9f9', border: '1px solid #3a3', borderRadius: 8, font: '12px ui-monospace, monospace', padding: '4px 8px' }}>
        diag
      </button>
    );
  }
  return (
    <aside aria-label="Diagnostic" style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 64px)', right: 8, width: 'min(420px, calc(100vw - 16px))', zIndex: 100, maxHeight: '35vh', overflow: 'auto', background: 'rgba(0,0,0,0.92)', color: '#9f9', font: '11px/1.4 ui-monospace, monospace', border: '1px solid #3a3', borderRadius: 10, padding: 8 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
        <strong style={{ color: '#fff' }}>Diagnostic</strong>
        <button type="button" className="btn btn-sm" onClick={() => {
          try {
            void navigator.clipboard.writeText(text).then(() => setCopied(true), () => setCopied(false));
          } catch { setCopied(false); }
        }}>{copied ? 'Copié' : 'Copier'}</button>
        <button type="button" className="btn btn-sm" onClick={() => setOpen(false)}>Réduire</button>
      </div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', userSelect: 'text' }}>{text}</pre>
    </aside>
  );
}
