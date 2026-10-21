// Partage : Web Share API si disponible, sinon copie dans le presse-papiers.
// Le lien partagé ne contient AUCUNE donnée personnelle (ni prénom, ni historique) :
// seulement la fin obtenue, l'âge, le profil de départ et deux montants arrondis.

import { ENDING_BY_ID } from '../content/endings';
import { PROFILE_BY_ID } from '../content/profiles';

export interface SharedResult {
  e: string; // fin
  n: number; // patrimoine final arrondi
  k: number; // pic de patrimoine arrondi
  a: number; // âge final
  p: string; // profil de départ
}

const roundTo = (n: number) => Math.round(n / 100) * 100;

export function encodeResult(r: SharedResult): string {
  const json = JSON.stringify({ v: 1, e: r.e, n: roundTo(r.n), k: roundTo(r.k), a: r.a, p: r.p });
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeResult(code: string | null | undefined): SharedResult | null {
  if (!code || code.length > 300) return null;
  try {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64 + '==='.slice((b64.length + 3) % 4))));
    const o = JSON.parse(json);
    if (o?.v !== 1) return null;
    if (typeof o.e !== 'string' || !ENDING_BY_ID[o.e]) return null;
    if (typeof o.p !== 'string' || !PROFILE_BY_ID[o.p]) return null;
    for (const k of ['n', 'k', 'a']) if (typeof o[k] !== 'number' || !Number.isFinite(o[k])) return null;
    if (o.a < 18 || o.a > 120 || Math.abs(o.n) > 1e10 || Math.abs(o.k) > 1e10) return null;
    return { e: o.e, n: o.n, k: o.k, a: Math.round(o.a), p: o.p };
  } catch {
    return null;
  }
}

export function gameUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}`;
}

export function resultUrl(r: SharedResult): string {
  return `${gameUrl()}?r=${encodeResult(r)}`;
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

export async function shareStory(text: string, url: string): Promise<ShareOutcome> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share({ title: 'De zéro à millionnaire', text, url });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // sinon on tente la copie
    }
  }
  return (await copyText(`${text}\n${url}`)) ? 'copied' : 'failed';
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* repli ci-dessous */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
